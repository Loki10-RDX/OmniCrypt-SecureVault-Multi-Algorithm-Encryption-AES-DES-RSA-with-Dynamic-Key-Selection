package com.omnicrypt.securevault.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageService {

    @Value("${app.file.upload-dir}")
    private String uploadDir;

    private Path uploadPath;

    @PostConstruct
    public void init() {
        uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(uploadPath);
            log.info("Upload directory created: {}", uploadPath);
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory", e);
        }
    }

    public String storeFile(byte[] data, String originalFilename) throws IOException {
        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex > 0) {
            extension = originalFilename.substring(dotIndex);
        }

        String storedFilename = UUID.randomUUID().toString() + extension + ".enc";
        Path targetPath = uploadPath.resolve(storedFilename);
        Files.write(targetPath, data);

        log.info("File stored: {} -> {}", originalFilename, storedFilename);
        return storedFilename;
    }

    public byte[] loadFile(String storedFilename) throws IOException {
        Path filePath = uploadPath.resolve(storedFilename).normalize();
        if (!filePath.startsWith(uploadPath)) {
            throw new SecurityException("Cannot access file outside upload directory");
        }
        return Files.readAllBytes(filePath);
    }

    public void deleteFile(String storedFilename) throws IOException {
        Path filePath = uploadPath.resolve(storedFilename).normalize();
        if (!filePath.startsWith(uploadPath)) {
            throw new SecurityException("Cannot access file outside upload directory");
        }
        Files.deleteIfExists(filePath);
        log.info("File deleted: {}", storedFilename);
    }

    public String getFilePath(String storedFilename) {
        return uploadPath.resolve(storedFilename).toString();
    }
}
