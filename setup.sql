-- ============================================
-- OmniCrypt SecureVault - Database Setup
-- ============================================

CREATE DATABASE IF NOT EXISTS omnicrypt_db;
USE omnicrypt_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'USER',
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Encrypted files table
CREATE TABLE IF NOT EXISTS encrypted_files (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    algorithm VARCHAR(20) NOT NULL,
    encrypted_aes_key TEXT,
    rsa_public_key TEXT,
    rsa_private_key TEXT,
    secret_key TEXT,
    iv TEXT,
    original_size BIGINT,
    encrypted_size BIGINT,
    encryption_time_ms BIGINT,
    decryption_time_ms BIGINT,
    file_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_files_user (user_id),
    INDEX idx_files_algorithm (algorithm)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    action VARCHAR(50) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
