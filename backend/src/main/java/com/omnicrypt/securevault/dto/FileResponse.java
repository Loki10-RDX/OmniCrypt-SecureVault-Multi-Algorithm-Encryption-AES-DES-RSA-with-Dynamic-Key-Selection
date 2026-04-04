package com.omnicrypt.securevault.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class FileResponse {
    private Long id;
    private String originalFilename;
    private String algorithm;
    private Long originalSize;
    private Long encryptedSize;
    private Long encryptionTimeMs;
    private Long decryptionTimeMs;
    private LocalDateTime createdAt;
    private String status;
}
