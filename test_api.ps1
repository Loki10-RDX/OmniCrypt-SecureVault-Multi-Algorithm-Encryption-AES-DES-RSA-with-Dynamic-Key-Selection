# OmniCrypt SecureVault - Comprehensive API Test Suite
# =====================================================

$BASE_URL = "http://localhost:8080/api"
$TEST_EMAIL = "testuser_$(Get-Random -Maximum 99999)@test.com"
$TEST_PASSWORD = "SecurePass123!"
$results = @()

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [string]$Body = $null,
        [hashtable]$Headers = @{},
        [int]$ExpectedStatus = 200,
        [string]$ContentType = "application/json"
    )
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            UseBasicParsing = $true
            ErrorAction = "Stop"
        }
        
        if ($Headers.Count -gt 0) {
            $params.Headers = $Headers
        }
        
        if ($Body -and $ContentType -eq "application/json") {
            $params.Body = $Body
            $params.ContentType = $ContentType
        }
        
        $response = Invoke-WebRequest @params
        $status = $response.StatusCode
        $content = $response.Content
        
        $pass = ($status -eq $ExpectedStatus)
        Write-Host "$( if($pass){'PASS'} else {'FAIL'} ) [$status] $Name" -ForegroundColor $(if($pass){'Green'}else{'Red'})
        if ($content.Length -lt 2000) { Write-Host "  Response: $content" }
        return @{ Name=$Name; Status=$status; Pass=$pass; Response=$content; Error=$null }
    }
    catch {
        $status = 0
        $errMsg = $_.Exception.Message
        if ($_.Exception.Response) {
            $status = [int]$_.Exception.Response.StatusCode
            try {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $errMsg = $reader.ReadToEnd()
            } catch {}
        }
        
        $pass = ($status -eq $ExpectedStatus)
        Write-Host "$( if($pass){'PASS'} else {'FAIL'} ) [$status] $Name" -ForegroundColor $(if($pass){'Green'}else{'Red'})
        Write-Host "  Detail: $errMsg"
        return @{ Name=$Name; Status=$status; Pass=$pass; Response=$null; Error=$errMsg }
    }
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host " OmniCrypt SecureVault - API Test Suite" -ForegroundColor Cyan
Write-Host " Test User: $TEST_EMAIL" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# 1. HEALTH CHECK
# ============================================
Write-Host "`n--- 1. SERVER HEALTH ---" -ForegroundColor Yellow
$r = Test-Endpoint -Name "Server is running (expect 403 on root)" -Method GET -Url "$BASE_URL/../" -ExpectedStatus 403
$results += $r

# ============================================
# 2. AUTHENTICATION TESTS
# ============================================
Write-Host "`n--- 2. AUTHENTICATION TESTS ---" -ForegroundColor Yellow

# 2a. Register without MFA
$r = Test-Endpoint -Name "Register user (no MFA)" `
    -Method POST -Url "$BASE_URL/auth/register" `
    -Body (@{email=$TEST_EMAIL; password=$TEST_PASSWORD; enableMfa=$false} | ConvertTo-Json) `
    -ExpectedStatus 200
$results += $r
$regResponse = $null
if ($r.Response) { $regResponse = $r.Response | ConvertFrom-Json }

# Check token was returned
if ($regResponse -and $regResponse.token) {
    Write-Host "  TOKEN received (non-MFA registration)" -ForegroundColor Green
    $TOKEN = $regResponse.token
} else {
    Write-Host "  WARNING: No token in registration response" -ForegroundColor Yellow
    $TOKEN = $null
}

# 2b. Register duplicate email
$r = Test-Endpoint -Name "Register duplicate email (expect 400)" `
    -Method POST -Url "$BASE_URL/auth/register" `
    -Body (@{email=$TEST_EMAIL; password=$TEST_PASSWORD; enableMfa=$false} | ConvertTo-Json) `
    -ExpectedStatus 400
$results += $r

# 2c. Register with invalid email
$r = Test-Endpoint -Name "Register invalid email (expect 400)" `
    -Method POST -Url "$BASE_URL/auth/register" `
    -Body (@{email="notanemail"; password=$TEST_PASSWORD; enableMfa=$false} | ConvertTo-Json) `
    -ExpectedStatus 400
$results += $r

# 2d. Register with short password
$r = Test-Endpoint -Name "Register short password (expect 400)" `
    -Method POST -Url "$BASE_URL/auth/register" `
    -Body (@{email="short_$(Get-Random)@test.com"; password="ab"; enableMfa=$false} | ConvertTo-Json) `
    -ExpectedStatus 400
$results += $r

# 2e. Login
$r = Test-Endpoint -Name "Login with valid credentials" `
    -Method POST -Url "$BASE_URL/auth/login" `
    -Body (@{email=$TEST_EMAIL; password=$TEST_PASSWORD} | ConvertTo-Json) `
    -ExpectedStatus 200
$results += $r
if ($r.Response) {
    $loginResp = $r.Response | ConvertFrom-Json
    if ($loginResp.token) { $TOKEN = $loginResp.token; Write-Host "  JWT Token obtained" -ForegroundColor Green }
}

# 2f. Login with wrong password
$r = Test-Endpoint -Name "Login with wrong password (expect 401)" `
    -Method POST -Url "$BASE_URL/auth/login" `
    -Body (@{email=$TEST_EMAIL; password="WrongPassword"} | ConvertTo-Json) `
    -ExpectedStatus 401
$results += $r

# 2g. Login with non-existent user
$r = Test-Endpoint -Name "Login non-existent user (expect 401)" `
    -Method POST -Url "$BASE_URL/auth/login" `
    -Body (@{email="noexist@test.com"; password="whatever"} | ConvertTo-Json) `
    -ExpectedStatus 401
$results += $r

# ============================================
# 3. JWT & SECURITY TESTS
# ============================================
Write-Host "`n--- 3. JWT & SECURITY TESTS ---" -ForegroundColor Yellow

# 3a. Access protected route without token
$r = Test-Endpoint -Name "GET /files without token (expect 403)" `
    -Method GET -Url "$BASE_URL/files" `
    -ExpectedStatus 403
$results += $r

# 3b. Access with invalid token
$r = Test-Endpoint -Name "GET /files with invalid token (expect 403)" `
    -Method GET -Url "$BASE_URL/files" `
    -Headers @{Authorization="Bearer invalidtoken123"} `
    -ExpectedStatus 403
$results += $r

# 3c. Access with valid token
$r = Test-Endpoint -Name "GET /auth/me with valid JWT" `
    -Method GET -Url "$BASE_URL/auth/me" `
    -Headers @{Authorization="Bearer $TOKEN"} `
    -ExpectedStatus 200
$results += $r
if ($r.Response) {
    $meResp = $r.Response | ConvertFrom-Json
    Write-Host "  User: $($meResp.email) | Role: $($meResp.role)" -ForegroundColor Green
}

# 3d. Access admin route as USER role
$r = Test-Endpoint -Name "GET /audit/logs as USER (expect 403)" `
    -Method GET -Url "$BASE_URL/audit/logs" `
    -Headers @{Authorization="Bearer $TOKEN"} `
    -ExpectedStatus 403
$results += $r

# ============================================
# 4. MFA TESTS  
# ============================================
Write-Host "`n--- 4. MFA TESTS ---" -ForegroundColor Yellow

$MFA_EMAIL = "mfa_$(Get-Random -Maximum 99999)@test.com"
$r = Test-Endpoint -Name "Register with MFA enabled" `
    -Method POST -Url "$BASE_URL/auth/register" `
    -Body (@{email=$MFA_EMAIL; password=$TEST_PASSWORD; enableMfa=$true} | ConvertTo-Json) `
    -ExpectedStatus 200
$results += $r
if ($r.Response) {
    $mfaResp = $r.Response | ConvertFrom-Json
    if ($mfaResp.mfaRequired -eq $true) { Write-Host "  MFA Required flag: TRUE" -ForegroundColor Green }
    if ($mfaResp.mfaQrCode) { Write-Host "  QR Code returned: YES (length=$($mfaResp.mfaQrCode.Length))" -ForegroundColor Green }
    else { Write-Host "  QR Code: NOT RETURNED" -ForegroundColor Red }
}

# Login with MFA user
$r = Test-Endpoint -Name "Login MFA user (expect mfaRequired)" `
    -Method POST -Url "$BASE_URL/auth/login" `
    -Body (@{email=$MFA_EMAIL; password=$TEST_PASSWORD} | ConvertTo-Json) `
    -ExpectedStatus 200
$results += $r
if ($r.Response) {
    $mfaLoginResp = $r.Response | ConvertFrom-Json
    if ($mfaLoginResp.mfaRequired) { Write-Host "  MFA required in response: TRUE" -ForegroundColor Green }
    if (-not $mfaLoginResp.token) { Write-Host "  No token before OTP: CORRECT" -ForegroundColor Green }
}

# OTP with wrong code
$r = Test-Endpoint -Name "Verify wrong OTP (expect 400)" `
    -Method POST -Url "$BASE_URL/auth/verify-otp" `
    -Body (@{email=$MFA_EMAIL; code="000000"} | ConvertTo-Json) `
    -ExpectedStatus 400
$results += $r

# ============================================
# 5. FILE ENCRYPTION TESTS
# ============================================
Write-Host "`n--- 5. FILE ENCRYPTION TESTS ---" -ForegroundColor Yellow

# Get initial file list
$r = Test-Endpoint -Name "GET /files (initial, expect empty)" `
    -Method GET -Url "$BASE_URL/files" `
    -Headers @{Authorization="Bearer $TOKEN"} `
    -ExpectedStatus 200
$results += $r

# Helper function for file upload with multipart
function Upload-File {
    param([string]$Algorithm, [string]$Content, [string]$Filename)
    
    $boundary = [System.Guid]::NewGuid().ToString()
    $LF = "`r`n"
    
    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes(
        "--$boundary${LF}" +
        "Content-Disposition: form-data; name=`"algorithm`"${LF}${LF}" +
        "$Algorithm${LF}" +
        "--$boundary${LF}" +
        "Content-Disposition: form-data; name=`"file`"; filename=`"$Filename`"${LF}" +
        "Content-Type: application/octet-stream${LF}${LF}" +
        "$Content${LF}" +
        "--$boundary--${LF}"
    )
    
    try {
        $response = Invoke-WebRequest -Uri "$BASE_URL/files/upload-encrypt" `
            -Method POST `
            -Headers @{Authorization="Bearer $TOKEN"} `
            -ContentType "multipart/form-data; boundary=$boundary" `
            -Body $bodyBytes `
            -UseBasicParsing -ErrorAction Stop
        
        return @{ Status=$response.StatusCode; Response=($response.Content | ConvertFrom-Json); Pass=$true }
    }
    catch {
        $status = 0
        $errMsg = $_.Exception.Message
        if ($_.Exception.Response) { $status = [int]$_.Exception.Response.StatusCode }
        return @{ Status=$status; Response=$null; Pass=$false; Error=$errMsg }
    }
}

# 5a. AES Encryption
Write-Host "  Testing AES encryption..." -ForegroundColor Cyan
$aesResult = Upload-File -Algorithm "AES" -Content "Hello AES encryption test content for OmniCrypt!" -Filename "test_aes.txt"
if ($aesResult.Pass) {
    Write-Host "PASS [200] AES file upload and encrypt" -ForegroundColor Green
    $AES_FILE_ID = $aesResult.Response.id
    Write-Host "  File ID: $AES_FILE_ID | Algorithm: $($aesResult.Response.algorithm) | EncTime: $($aesResult.Response.encryptionTimeMs)ms" -ForegroundColor Green
} else {
    Write-Host "FAIL AES file upload: $($aesResult.Error)" -ForegroundColor Red
}
$results += @{Name="AES encrypt upload"; Pass=$aesResult.Pass; Status=$aesResult.Status}

# 5b. DES Encryption
Write-Host "  Testing DES encryption..." -ForegroundColor Cyan
$desResult = Upload-File -Algorithm "DES" -Content "Hello DES legacy encryption test!" -Filename "test_des.txt"
if ($desResult.Pass) {
    Write-Host "PASS [200] DES file upload and encrypt" -ForegroundColor Green
    $DES_FILE_ID = $desResult.Response.id
    Write-Host "  File ID: $DES_FILE_ID | Algorithm: $($desResult.Response.algorithm)" -ForegroundColor Green
} else {
    Write-Host "FAIL DES file upload: $($desResult.Error)" -ForegroundColor Red
}
$results += @{Name="DES encrypt upload"; Pass=$desResult.Pass; Status=$desResult.Status}

# 5c. RSA Encryption (small text < 245 bytes)
Write-Host "  Testing RSA encryption (small text)..." -ForegroundColor Cyan
$rsaResult = Upload-File -Algorithm "RSA" -Content "RSA small text" -Filename "test_rsa.txt"
if ($rsaResult.Pass) {
    Write-Host "PASS [200] RSA file upload and encrypt" -ForegroundColor Green
    $RSA_FILE_ID = $rsaResult.Response.id
} else {
    Write-Host "FAIL RSA file upload: $($rsaResult.Error)" -ForegroundColor Red
}
$results += @{Name="RSA encrypt upload (small file)"; Pass=$rsaResult.Pass; Status=$rsaResult.Status}

# 5d. HYBRID Encryption
Write-Host "  Testing HYBRID encryption..." -ForegroundColor Cyan
$hybridContent = "This is a test of the hybrid AES+RSA encryption method. " * 10
$hybridResult = Upload-File -Algorithm "HYBRID" -Content $hybridContent -Filename "test_hybrid.txt"
if ($hybridResult.Pass) {
    Write-Host "PASS [200] HYBRID file upload and encrypt" -ForegroundColor Green
    $HYBRID_FILE_ID = $hybridResult.Response.id
} else {
    Write-Host "FAIL HYBRID file upload: $($hybridResult.Error)" -ForegroundColor Red
}
$results += @{Name="HYBRID encrypt upload"; Pass=$hybridResult.Pass; Status=$hybridResult.Status}

# 5e. RSA with too-large file (edge case)
Write-Host "  Testing RSA with large file (expect error)..." -ForegroundColor Cyan
$largeTxt = "A" * 300
$rsaLargeResult = Upload-File -Algorithm "RSA" -Content $largeTxt -Filename "too_large_for_rsa.txt"
if (-not $rsaLargeResult.Pass) {
    Write-Host "PASS RSA rejected large file correctly" -ForegroundColor Green
    $results += @{Name="RSA reject large file"; Pass=$true; Status=$rsaLargeResult.Status}
} else {
    Write-Host "FAIL RSA should reject files > 245 bytes" -ForegroundColor Red
    $results += @{Name="RSA reject large file"; Pass=$false; Status=$rsaLargeResult.Status}
}

# 5f. Invalid algorithm
Write-Host "  Testing invalid algorithm..." -ForegroundColor Cyan
$badAlgoResult = Upload-File -Algorithm "BLOWFISH" -Content "test" -Filename "test.txt"
if (-not $badAlgoResult.Pass) {
    Write-Host "PASS Invalid algorithm rejected" -ForegroundColor Green
    $results += @{Name="Invalid algorithm rejected"; Pass=$true; Status=$badAlgoResult.Status}
} else {
    Write-Host "FAIL Invalid algorithm should be rejected" -ForegroundColor Red
    $results += @{Name="Invalid algorithm rejected"; Pass=$false; Status=$badAlgoResult.Status}
}

# ============================================
# 6. FILE LIST & DOWNLOAD TESTS
# ============================================
Write-Host "`n--- 6. FILE LIST & DOWNLOAD TESTS ---" -ForegroundColor Yellow

# 6a. List files
$r = Test-Endpoint -Name "GET /files (expect 4 files)" `
    -Method GET -Url "$BASE_URL/files" `
    -Headers @{Authorization="Bearer $TOKEN"} `
    -ExpectedStatus 200
$results += $r
if ($r.Response) {
    $fileList = $r.Response | ConvertFrom-Json
    Write-Host "  Files count: $($fileList.Count)" -ForegroundColor Green
}

# 6b. Get file info
if ($AES_FILE_ID) {
    $r = Test-Endpoint -Name "GET /files/$AES_FILE_ID (file info)" `
        -Method GET -Url "$BASE_URL/files/$AES_FILE_ID" `
        -Headers @{Authorization="Bearer $TOKEN"} `
        -ExpectedStatus 200
    $results += $r
}

# 6c. Download/decrypt AES file
if ($AES_FILE_ID) {
    $r = Test-Endpoint -Name "GET /files/$AES_FILE_ID/download (AES decrypt)" `
        -Method GET -Url "$BASE_URL/files/$AES_FILE_ID/download" `
        -Headers @{Authorization="Bearer $TOKEN"} `
        -ExpectedStatus 200
    $results += $r
    if ($r.Response) {
        $decrypted = $r.Response
        if ($decrypted -match "Hello AES") {
            Write-Host "  AES DECRYPTION VERIFIED: Content matches original!" -ForegroundColor Green
        } else {
            Write-Host "  WARNING: Decrypted content may not match" -ForegroundColor Yellow
        }
    }
}

# 6d. Download/decrypt DES file
if ($DES_FILE_ID) {
    $r = Test-Endpoint -Name "GET /files/$DES_FILE_ID/download (DES decrypt)" `
        -Method GET -Url "$BASE_URL/files/$DES_FILE_ID/download" `
        -Headers @{Authorization="Bearer $TOKEN"} `
        -ExpectedStatus 200
    $results += $r
}

# 6e. Download/decrypt RSA file
if ($RSA_FILE_ID) {
    $r = Test-Endpoint -Name "GET /files/$RSA_FILE_ID/download (RSA decrypt)" `
        -Method GET -Url "$BASE_URL/files/$RSA_FILE_ID/download" `
        -Headers @{Authorization="Bearer $TOKEN"} `
        -ExpectedStatus 200
    $results += $r
}

# 6f. Download/decrypt HYBRID file
if ($HYBRID_FILE_ID) {
    $r = Test-Endpoint -Name "GET /files/$HYBRID_FILE_ID/download (HYBRID decrypt)" `
        -Method GET -Url "$BASE_URL/files/$HYBRID_FILE_ID/download" `
        -Headers @{Authorization="Bearer $TOKEN"} `
        -ExpectedStatus 200
    $results += $r
}

# 6g. POST decrypt endpoint
if ($AES_FILE_ID) {
    $r = Test-Endpoint -Name "POST /files/$AES_FILE_ID/decrypt" `
        -Method POST -Url "$BASE_URL/files/$AES_FILE_ID/decrypt" `
        -Headers @{Authorization="Bearer $TOKEN"} `
        -ExpectedStatus 200
    $results += $r
}

# ============================================
# 7. CROSS-USER ACCESS TEST
# ============================================
Write-Host "`n--- 7. CROSS-USER ACCESS TEST ---" -ForegroundColor Yellow

$USER2_EMAIL = "user2_$(Get-Random -Maximum 99999)@test.com"
$r = Test-Endpoint -Name "Register second user" `
    -Method POST -Url "$BASE_URL/auth/register" `
    -Body (@{email=$USER2_EMAIL; password=$TEST_PASSWORD; enableMfa=$false} | ConvertTo-Json) `
    -ExpectedStatus 200
$results += $r
$USER2_TOKEN = $null
if ($r.Response) { $USER2_TOKEN = ($r.Response | ConvertFrom-Json).token }

if ($USER2_TOKEN -and $AES_FILE_ID) {
    $r = Test-Endpoint -Name "User2 access User1 file (expect 400)" `
        -Method GET -Url "$BASE_URL/files/$AES_FILE_ID/download" `
        -Headers @{Authorization="Bearer $USER2_TOKEN"} `
        -ExpectedStatus 400
    $results += $r
}

# ============================================
# 8. DELETE FILE TEST
# ============================================
Write-Host "`n--- 8. DELETE FILE TEST ---" -ForegroundColor Yellow

if ($DES_FILE_ID) {
    $r = Test-Endpoint -Name "DELETE /files/$DES_FILE_ID" `
        -Method DELETE -Url "$BASE_URL/files/$DES_FILE_ID" `
        -Headers @{Authorization="Bearer $TOKEN"} `
        -ExpectedStatus 204
    $results += $r
    
    # Verify deleted
    $r = Test-Endpoint -Name "GET deleted file (expect 400)" `
        -Method GET -Url "$BASE_URL/files/$DES_FILE_ID" `
        -Headers @{Authorization="Bearer $TOKEN"} `
        -ExpectedStatus 400
    $results += $r
}

# ============================================
# 9. SECURITY TESTS
# ============================================
Write-Host "`n--- 9. SECURITY TESTS ---" -ForegroundColor Yellow

# 9a. SQL Injection in login
$r = Test-Endpoint -Name "SQL Injection in email (expect rejection)" `
    -Method POST -Url "$BASE_URL/auth/login" `
    -Body (@{email="admin' OR '1'='1"; password="test"} | ConvertTo-Json) `
    -ExpectedStatus 400
$results += $r

# 9b. XSS in registration
$r = Test-Endpoint -Name "XSS in email field (expect rejection)" `
    -Method POST -Url "$BASE_URL/auth/register" `
    -Body (@{email="<script>alert('xss')</script>@test.com"; password="test123456"; enableMfa=$false} | ConvertTo-Json) `
    -ExpectedStatus 400
$results += $r

# 9c. Empty body
$r = Test-Endpoint -Name "Login with empty body (expect 400)" `
    -Method POST -Url "$BASE_URL/auth/login" `
    -Body "{}" `
    -ExpectedStatus 400
$results += $r

# ============================================
# 10. DATABASE VALIDATION
# ============================================
Write-Host "`n--- 10. DATABASE VALIDATION ---" -ForegroundColor Yellow
try {
    $dbOut = & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p"root" omnicrypt_db -e "SELECT COUNT(*) as user_count FROM users; SELECT COUNT(*) as file_count FROM encrypted_files; SELECT COUNT(*) as log_count FROM audit_logs; SELECT id, email, role, mfa_enabled, LEFT(password, 10) as pwd_prefix FROM users LIMIT 5; SELECT id, user_id, algorithm, original_filename, LEFT(secret_key, 10) as key_prefix, LEFT(iv, 10) as iv_prefix FROM encrypted_files LIMIT 5;" 2>&1
    Write-Host "Database query results:" -ForegroundColor Green
    $dbOut | ForEach-Object { Write-Host "  $_" }
} catch {
    Write-Host "DB query failed: $_" -ForegroundColor Red
}

# ============================================
# SUMMARY
# ============================================
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host " TEST SUMMARY" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

$passed = ($results | Where-Object { $_.Pass -eq $true }).Count
$failed = ($results | Where-Object { $_.Pass -eq $false }).Count
$total = $results.Count

Write-Host "Total tests: $total" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor $(if($failed -gt 0){'Red'}else{'Green'})
Write-Host "Pass rate: $([math]::Round(($passed/$total)*100, 1))%" -ForegroundColor White

if ($failed -gt 0) {
    Write-Host "`nFailed tests:" -ForegroundColor Red
    $results | Where-Object { $_.Pass -eq $false } | ForEach-Object { Write-Host "  FAIL: $($_.Name) [Status: $($_.Status)]" -ForegroundColor Red }
}

Write-Host "`nDone." -ForegroundColor Cyan
