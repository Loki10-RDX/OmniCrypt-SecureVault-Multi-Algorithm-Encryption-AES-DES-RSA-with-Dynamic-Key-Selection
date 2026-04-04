package com.omnicrypt.securevault.service;

import com.omnicrypt.securevault.dto.FileResponse;
import com.omnicrypt.securevault.entity.EncryptedFile;
import com.omnicrypt.securevault.entity.User;
import com.omnicrypt.securevault.repository.FileRepository;
import com.omnicrypt.securevault.repository.UserRepository;
import com.omnicrypt.securevault.util.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.crypto.SecretKey;
import java.security.KeyPair;
import java.util.Base64;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CryptoService {

    private final FileRepository fileRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    @Transactional
    public FileResponse encryptAndStore(MultipartFile file, String algorithm, String email) throws Exception {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        byte[] fileData = file.getBytes();
        long originalSize = fileData.length;

        long startTime = System.currentTimeMillis();

        EncryptedFile encryptedFile = EncryptedFile.builder()
                .user(user)
                .originalFilename(file.getOriginalFilename())
                .algorithm(algorithm.toUpperCase())
                .originalSize(originalSize)
                .build();

        byte[] encryptedData;

        switch (algorithm.toUpperCase()) {
            case "AES" -> {
                SecretKey aesKey = AESUtil.generateKey();
                byte[] iv = AESUtil.generateIV();
                encryptedData = AESUtil.encrypt(fileData, aesKey, iv);
                encryptedFile.setSecretKey(AESUtil.keyToBase64(aesKey));
                encryptedFile.setIv(AESUtil.ivToBase64(iv));
            }
            case "DES" -> {
                SecretKey desKey = DESUtil.generateKey();
                byte[] iv = DESUtil.generateIV();
                encryptedData = DESUtil.encrypt(fileData, desKey, iv);
                encryptedFile.setSecretKey(DESUtil.keyToBase64(desKey));
                encryptedFile.setIv(DESUtil.ivToBase64(iv));
            }
            case "RSA" -> {
                if (fileData.length > RSAUtil.getMaxDataSize()) {
                    throw new RuntimeException(
                            "File too large for RSA encryption. Maximum size: "
                                    + RSAUtil.getMaxDataSize() + " bytes. Use AES or HYBRID for larger files.");
                }
                KeyPair keyPair = RSAUtil.generateKeyPair();
                encryptedData = RSAUtil.encrypt(fileData, keyPair.getPublic());
                encryptedFile.setRsaPublicKey(RSAUtil.publicKeyToBase64(keyPair.getPublic()));
                encryptedFile.setRsaPrivateKey(RSAUtil.privateKeyToBase64(keyPair.getPrivate()));
            }
            case "HYBRID" -> {
                HybridCryptoUtil.HybridEncryptionResult result =
                        HybridCryptoUtil.encrypt(fileData);
                encryptedData = result.encryptedData();
                encryptedFile.setEncryptedAesKey(result.encryptedAesKey());
                encryptedFile.setRsaPublicKey(result.rsaPublicKey());
                encryptedFile.setRsaPrivateKey(result.rsaPrivateKey());
                encryptedFile.setIv(result.iv());
            }
            default -> throw new RuntimeException("Unsupported algorithm: " + algorithm);
        }

        long encryptionTime = System.currentTimeMillis() - startTime;

        // Store encrypted file
        String storedFilename = fileStorageService.storeFile(
                encryptedData, file.getOriginalFilename());

        encryptedFile.setStoredFilename(storedFilename);
        encryptedFile.setEncryptedSize((long) encryptedData.length);
        encryptedFile.setEncryptionTimeMs(encryptionTime);
        encryptedFile.setFilePath(fileStorageService.getFilePath(storedFilename));

        fileRepository.save(encryptedFile);
        log.info("File encrypted: {} using {} in {}ms",
                file.getOriginalFilename(), algorithm, encryptionTime);

        return toFileResponse(encryptedFile);
    }

    public byte[] decryptFile(Long fileId, String email) throws Exception {
        EncryptedFile encryptedFile = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        if (!encryptedFile.getUser().getEmail().equals(email)) {
            throw new RuntimeException("Access denied");
        }

        byte[] encryptedData = fileStorageService.loadFile(encryptedFile.getStoredFilename());

        long startTime = System.currentTimeMillis();
        byte[] decryptedData;

        switch (encryptedFile.getAlgorithm()) {
            case "AES" -> {
                SecretKey key = AESUtil.base64ToKey(encryptedFile.getSecretKey());
                byte[] iv = AESUtil.base64ToIV(encryptedFile.getIv());
                decryptedData = AESUtil.decrypt(encryptedData, key, iv);
            }
            case "DES" -> {
                SecretKey key = DESUtil.base64ToKey(encryptedFile.getSecretKey());
                byte[] iv = DESUtil.base64ToIV(encryptedFile.getIv());
                decryptedData = DESUtil.decrypt(encryptedData, key, iv);
            }
            case "RSA" -> {
                java.security.PrivateKey privateKey =
                        RSAUtil.base64ToPrivateKey(encryptedFile.getRsaPrivateKey());
                decryptedData = RSAUtil.decrypt(encryptedData, privateKey);
            }
            case "HYBRID" -> {
                decryptedData = HybridCryptoUtil.decrypt(
                        encryptedData,
                        encryptedFile.getEncryptedAesKey(),
                        encryptedFile.getRsaPrivateKey(),
                        encryptedFile.getIv()
                );
            }
            default -> throw new RuntimeException(
                    "Unsupported algorithm: " + encryptedFile.getAlgorithm());
        }

        long decryptionTime = System.currentTimeMillis() - startTime;
        encryptedFile.setDecryptionTimeMs(decryptionTime);
        fileRepository.save(encryptedFile);

        log.info("File decrypted: {} using {} in {}ms",
                encryptedFile.getOriginalFilename(),
                encryptedFile.getAlgorithm(), decryptionTime);

        return decryptedData;
    }

    public List<FileResponse> getUserFiles(String email) {
        return fileRepository.findByUserEmailOrderByCreatedAtDesc(email)
                .stream()
                .map(this::toFileResponse)
                .collect(Collectors.toList());
    }

    public FileResponse getFileInfo(Long fileId, String email) {
        EncryptedFile file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));
        if (!file.getUser().getEmail().equals(email)) {
            throw new RuntimeException("Access denied");
        }
        return toFileResponse(file);
    }

    @Transactional
    public void deleteFile(Long fileId, String email) throws Exception {
        EncryptedFile file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));
        if (!file.getUser().getEmail().equals(email)) {
            throw new RuntimeException("Access denied");
        }
        fileStorageService.deleteFile(file.getStoredFilename());
        fileRepository.delete(file);
        log.info("File deleted: {}", file.getOriginalFilename());
    }

    public String getOriginalFilename(Long fileId, String email) {
        EncryptedFile file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));
        if (!file.getUser().getEmail().equals(email)) {
            throw new RuntimeException("Access denied");
        }
        return file.getOriginalFilename();
    }

    private FileResponse toFileResponse(EncryptedFile file) {
        return FileResponse.builder()
                .id(file.getId())
                .originalFilename(file.getOriginalFilename())
                .algorithm(file.getAlgorithm())
                .originalSize(file.getOriginalSize())
                .encryptedSize(file.getEncryptedSize())
                .encryptionTimeMs(file.getEncryptionTimeMs())
                .decryptionTimeMs(file.getDecryptionTimeMs())
                .createdAt(file.getCreatedAt())
                .status("ENCRYPTED")
                .build();
    }
}
