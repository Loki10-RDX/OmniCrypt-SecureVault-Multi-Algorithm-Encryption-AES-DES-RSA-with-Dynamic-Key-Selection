package com.omnicrypt.securevault.service;

import com.omnicrypt.securevault.dto.*;
import com.omnicrypt.securevault.entity.User;
import com.omnicrypt.securevault.repository.UserRepository;
import com.omnicrypt.securevault.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final TotpService totpService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        String mfaSecret = null;
        String qrCode = null;

        if (request.isEnableMfa()) {
            mfaSecret = totpService.generateSecret();
            qrCode = totpService.generateQrCodeImageBase64(request.getEmail(), mfaSecret);
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role("USER")
                .mfaEnabled(request.isEnableMfa())
                .mfaSecret(mfaSecret)
                .build();

        userRepository.save(user);
        log.info("User registered: {}", user.getEmail());

        if (request.isEnableMfa()) {
            return AuthResponse.builder()
                    .email(user.getEmail())
                    .mfaRequired(true)
                    .mfaQrCode(qrCode)
                    .message("Registration successful. Scan QR code with Google Authenticator.")
                    .build();
        }

        String token = jwtTokenProvider.generateTokenFromEmail(user.getEmail());
        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .role(user.getRole())
                .mfaRequired(false)
                .message("Registration successful")
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(), request.getPassword()));

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.isMfaEnabled()) {
            log.info("MFA required for user: {}", user.getEmail());
            return AuthResponse.builder()
                    .email(user.getEmail())
                    .mfaRequired(true)
                    .message("MFA verification required. Enter your authenticator code.")
                    .build();
        }

        String token = jwtTokenProvider.generateToken(authentication);
        log.info("User logged in: {}", user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .role(user.getRole())
                .mfaRequired(false)
                .message("Login successful")
                .build();
    }

    public AuthResponse verifyOtp(OtpVerifyRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.isMfaEnabled() || user.getMfaSecret() == null) {
            throw new RuntimeException("MFA is not enabled for this user");
        }

        boolean isValid = totpService.verifyCode(user.getMfaSecret(), request.getCode());
        if (!isValid) {
            throw new RuntimeException("Invalid OTP code");
        }

        String token = jwtTokenProvider.generateTokenFromEmail(user.getEmail());
        log.info("MFA verified for user: {}", user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .role(user.getRole())
                .mfaRequired(false)
                .message("MFA verification successful")
                .build();
    }

    public AuthResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return AuthResponse.builder()
                .email(user.getEmail())
                .role(user.getRole())
                .mfaRequired(false)
                .message("User info retrieved")
                .build();
    }

    @Transactional
    public AuthResponse enableMfa(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String secret = totpService.generateSecret();
        String qrCode = totpService.generateQrCodeImageBase64(email, secret);

        user.setMfaEnabled(true);
        user.setMfaSecret(secret);
        userRepository.save(user);

        return AuthResponse.builder()
                .email(user.getEmail())
                .mfaRequired(true)
                .mfaQrCode(qrCode)
                .message("MFA enabled. Scan QR code with Google Authenticator.")
                .build();
    }
}
