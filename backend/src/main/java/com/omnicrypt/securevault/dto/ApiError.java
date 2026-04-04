package com.omnicrypt.securevault.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiError {
    private int status;
    private String message;
    private LocalDateTime timestamp;
    private Map<String, String> errors;
}
