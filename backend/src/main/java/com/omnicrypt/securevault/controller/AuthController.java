package com.omnicrypt.securevault.controller;

import com.omnicrypt.securevault.dto.*;
import com.omnicrypt.securevault.service.AuditService;
import com.omnicrypt.securevault.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AuditService auditService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest) {
        AuthResponse response = authService.register(request);
        auditService.logAction(request.getEmail(), "REGISTER",
                "User registered", httpRequest.getRemoteAddr());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        AuthResponse response = authService.login(request);
        auditService.logAction(request.getEmail(), "LOGIN",
                response.isMfaRequired() ? "MFA required" : "Login successful",
                httpRequest.getRemoteAddr());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<AuthResponse> verifyOtp(
            @Valid @RequestBody OtpVerifyRequest request,
            HttpServletRequest httpRequest) {
        AuthResponse response = authService.verifyOtp(request);
        auditService.logAction(request.getEmail(), "MFA_VERIFY",
                "MFA verification successful", httpRequest.getRemoteAddr());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> getCurrentUser(Authentication authentication) {
        AuthResponse response = authService.getCurrentUser(authentication.getName());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/enable-mfa")
    public ResponseEntity<AuthResponse> enableMfa(Authentication authentication) {
        AuthResponse response = authService.enableMfa(authentication.getName());
        return ResponseEntity.ok(response);
    }
}
