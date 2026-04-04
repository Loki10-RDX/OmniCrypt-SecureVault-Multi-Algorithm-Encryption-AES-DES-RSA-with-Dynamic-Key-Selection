package com.omnicrypt.securevault.repository;

import com.omnicrypt.securevault.entity.EncryptedFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FileRepository extends JpaRepository<EncryptedFile, Long> {
    List<EncryptedFile> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<EncryptedFile> findByUserEmailOrderByCreatedAtDesc(String email);
    long countByUserId(Long userId);
}
