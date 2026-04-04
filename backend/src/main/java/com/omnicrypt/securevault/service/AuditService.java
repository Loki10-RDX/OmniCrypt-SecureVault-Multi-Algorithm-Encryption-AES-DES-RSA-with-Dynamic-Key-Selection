package com.omnicrypt.securevault.service;

import com.omnicrypt.securevault.entity.AuditLog;
import com.omnicrypt.securevault.entity.User;
import com.omnicrypt.securevault.repository.AuditLogRepository;
import com.omnicrypt.securevault.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @Transactional
    public void logAction(String email, String action, String details, String ipAddress) {
        User user = userRepository.findByEmail(email).orElse(null);

        AuditLog auditLog = AuditLog.builder()
                .user(user)
                .action(action)
                .details(details)
                .ipAddress(ipAddress)
                .build();

        auditLogRepository.save(auditLog);
        log.debug("Audit log: {} - {} - {}", email, action, details);
    }

    public List<AuditLog> getRecentLogs() {
        return auditLogRepository.findTop100ByOrderByTimestampDesc();
    }

    public List<AuditLog> getUserLogs(Long userId) {
        return auditLogRepository.findByUserIdOrderByTimestampDesc(userId);
    }
}
