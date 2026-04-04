package com.omnicrypt.securevault.util;

import javax.crypto.SecretKey;
import java.security.KeyPair;
import java.util.Base64;

/**
 * Hybrid encryption: AES encrypts the file data, RSA encrypts the AES key.
 * This combines the speed of symmetric encryption with the security of asymmetric key exchange.
 */
public class HybridCryptoUtil {

    public record HybridEncryptionResult(
            byte[] encryptedData,
            String encryptedAesKey,
            String rsaPublicKey,
            String rsaPrivateKey,
            String iv
    ) {}

    public static HybridEncryptionResult encrypt(byte[] data) throws Exception {
        // 1. Generate random AES key
        SecretKey aesKey = AESUtil.generateKey();
        byte[] iv = AESUtil.generateIV();

        // 2. Encrypt data with AES
        byte[] encryptedData = AESUtil.encrypt(data, aesKey, iv);

        // 3. Generate RSA key pair
        KeyPair rsaKeyPair = RSAUtil.generateKeyPair();

        // 4. Encrypt AES key with RSA public key
        byte[] encryptedAesKeyBytes = RSAUtil.encrypt(
                aesKey.getEncoded(), rsaKeyPair.getPublic());

        return new HybridEncryptionResult(
                encryptedData,
                Base64.getEncoder().encodeToString(encryptedAesKeyBytes),
                RSAUtil.publicKeyToBase64(rsaKeyPair.getPublic()),
                RSAUtil.privateKeyToBase64(rsaKeyPair.getPrivate()),
                AESUtil.ivToBase64(iv)
        );
    }

    public static byte[] decrypt(byte[] encryptedData, String encryptedAesKey,
                                  String rsaPrivateKeyBase64, String ivBase64) throws Exception {
        // 1. Decrypt AES key using RSA private key
        java.security.PrivateKey rsaPrivateKey = RSAUtil.base64ToPrivateKey(rsaPrivateKeyBase64);
        byte[] aesKeyBytes = RSAUtil.decrypt(
                Base64.getDecoder().decode(encryptedAesKey), rsaPrivateKey);

        // 2. Rebuild AES key
        SecretKey aesKey = new javax.crypto.spec.SecretKeySpec(aesKeyBytes, "AES");

        // 3. Decrypt data with AES
        byte[] iv = AESUtil.base64ToIV(ivBase64);
        return AESUtil.decrypt(encryptedData, aesKey, iv);
    }
}
