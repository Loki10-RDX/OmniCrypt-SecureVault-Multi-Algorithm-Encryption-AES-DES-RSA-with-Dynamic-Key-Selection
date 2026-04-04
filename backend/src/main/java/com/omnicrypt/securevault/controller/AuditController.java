package com.omnicrypt.securevault.controller;

import com.omnicrypt.securevault.entity.AuditLog;
import com.omnicrypt.securevault.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
public class AuditController {

    private final AuditService auditService;

    @GetMapping("/logs")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getAuditLogs() {
        List<AuditLog> logs = auditService.getRecentLogs();
        List<Map<String, Object>> response = logs.stream()
                .map(log -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", log.getId());
                    map.put("action", log.getAction());
                    map.put("details", log.getDetails());
                    map.put("ipAddress", log.getIpAddress());
                    map.put("timestamp", log.getTimestamp());
                    if (log.getUser() != null) {
                        map.put("userEmail", log.getUser().getEmail());
                    }
                    return map;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }
}
