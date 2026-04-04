package com.omnicrypt.securevault.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "encrypted_files")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class EncryptedFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "original_filename", nullable = false)
    private String originalFilename;

    @Column(name = "stored_filename", nullable = false)
    private String storedFilename;

    @Column(nullable = false, length = 20)
    private String algorithm;

    @Column(name = "encrypted_aes_key", columnDefinition = "TEXT")
    private String encryptedAesKey;

    @Column(name = "rsa_public_key", columnDefinition = "TEXT")
    private String rsaPublicKey;

    @Column(name = "rsa_private_key", columnDefinition = "TEXT")
    private String rsaPrivateKey;

    @Column(name = "original_size")
    private Long originalSize;

    @Column(name = "encrypted_size")
    private Long encryptedSize;

    @Column(name = "encryption_time_ms")
    private Long encryptionTimeMs;

    @Column(name = "decryption_time_ms")
    private Long decryptionTimeMs;

    @Column(name = "file_path", length = 500)
    private String filePath;

    @Column(name = "iv", columnDefinition = "TEXT")
    private String iv;

    @Column(name = "secret_key", columnDefinition = "TEXT")
    private String secretKey;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
