package com.omnicrypt.securevault.controller;

import com.omnicrypt.securevault.dto.FileResponse;
import com.omnicrypt.securevault.service.AuditService;
import com.omnicrypt.securevault.service.CryptoService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final CryptoService cryptoService;
    private final AuditService auditService;

    @PostMapping("/upload-encrypt")
    public ResponseEntity<FileResponse> uploadAndEncrypt(
            @RequestParam("file") MultipartFile file,
            @RequestParam("algorithm") String algorithm,
            Authentication authentication,
            HttpServletRequest httpRequest) throws Exception {

        String email = authentication.getName();
        FileResponse response = cryptoService.encryptAndStore(file, algorithm, email);

        auditService.logAction(email, "ENCRYPT",
                String.format("Encrypted %s using %s", file.getOriginalFilename(), algorithm),
                httpRequest.getRemoteAddr());

        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<FileResponse>> getUserFiles(Authentication authentication) {
        String email = authentication.getName();
        List<FileResponse> files = cryptoService.getUserFiles(email);
        return ResponseEntity.ok(files);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FileResponse> getFileInfo(
            @PathVariable Long id, Authentication authentication) {
        String email = authentication.getName();
        FileResponse response = cryptoService.getFileInfo(id, email);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadDecrypted(
            @PathVariable Long id,
            Authentication authentication,
            HttpServletRequest httpRequest) throws Exception {

        String email = authentication.getName();
        String filename = cryptoService.getOriginalFilename(id, email);
        byte[] decryptedData = cryptoService.decryptFile(id, email);

        auditService.logAction(email, "DECRYPT_DOWNLOAD",
                String.format("Decrypted and downloaded file ID: %d", id),
                httpRequest.getRemoteAddr());

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + filename + "\"")
                .body(decryptedData);
    }

    @PostMapping("/{id}/decrypt")
    public ResponseEntity<FileResponse> decryptFile(
            @PathVariable Long id,
            Authentication authentication,
            HttpServletRequest httpRequest) throws Exception {

        String email = authentication.getName();
        cryptoService.decryptFile(id, email);
        FileResponse response = cryptoService.getFileInfo(id, email);

        auditService.logAction(email, "DECRYPT",
                String.format("Decrypted file ID: %d", id),
                httpRequest.getRemoteAddr());

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFile(
            @PathVariable Long id,
            Authentication authentication,
            HttpServletRequest httpRequest) throws Exception {

        String email = authentication.getName();
        auditService.logAction(email, "DELETE",
                String.format("Deleted file ID: %d", id),
                httpRequest.getRemoteAddr());

        cryptoService.deleteFile(id, email);
        return ResponseEntity.noContent().build();
    }
}
