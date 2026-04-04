# OmniCrypt SecureVault

A full-stack, production-ready hackathon project demonstrating real-world encryption and decryption workflows combined with multi-factor authentication (MFA).

## Features

- **Multi-Factor Authentication (MFA)**: Secure registration and login using TOTP (Google Authenticator / Authy) and JWT tokens.
- **Multi-Algorithm Encryption**: 
  - **AES (Advanced Encryption Standard)**: Fast symmetric encryption for files of any size.
  - **RSA**: Secure asymmetric encryption (limited to small text files <245 bytes).
  - **DES**: Legacy symmetric encryption for algorithm comparisons.
  - **Hybrid (AES + RSA)**: Enterprise standard combining AES speed with RSA security.
- **Performance Analytics**: Visualizations comparing encryption/decryption speeds of different algorithms using Recharts.
- **Modern UI**: Dark mode, glassmorphism design built with React, Vite, and Tailwind CSS.

## Tech Stack

- **Backend**: Java 17, Spring Boot 3.2, Spring Security, JWT, Hibernate
- **Frontend**: React 18, Vite, Tailwind CSS 4, Framer Motion, Recharts
- **Database**: MySQL 8.x

## Setup Instructions

### 1. Database Setup

1. Make sure MySQL is running on port 3306.
2. The application will auto-create the schema using Hibernate, but you can also run the provided `setup.sql`:

```bash
mysql -u root -p < setup.sql
```

By default, the backend expects the MySQL username to be `root` with no password. You can configure this by setting `MYSQL_USER` and `MYSQL_PASSWORD` environment variables.

### 2. Backend (Spring Boot)

1. Navigate to the `backend` directory:
```bash
cd backend
```

2. Run the application using Maven:
```bash
mvn spring-boot:run
```
The server will start on `http://localhost:8080`. File uploads are stored locally in the `uploads/` directory inside the backend folder.

### 3. Frontend (React)

1. Open a new terminal and navigate to the `frontend` directory:
```bash
cd frontend
```

2. Install dependencies (if not already done):
```bash
npm install
```

3. Start the Vite development server:
```bash
npm run dev
```
The frontend will start on `http://localhost:5173`.

## Demo Flow

1. Navigate to `http://localhost:5173`
2. **Register**: Click "Create one now". Enter your email/password and ensure "Enable Two-Factor Authentication" is checked.
3. **MFA Setup**: Scan the QR code with Google Authenticator on your phone. Then log in.
4. **MFA Verify**: Enter the 6-digit TOTP code to complete login.
5. **Encrypt File**: Drag and drop a file, select an algorithm (e.g., Hybrid or AES), and click "Encrypt".
6. **Dashboard**: Navigate across tabs to see your encrypted files or view the Encryption Metrics for performance comparisons.
7. **Decrypt**: Click the download icon next to a file to securely decrypt and download it back to its original state.

## Security Considerations
- Key generation utilizes Java's `SecureRandom` and standard `javax.crypto` libraries.
- Passwords are encrypted using BCrypt.
- Passwords, Secret Keys and Tokens are transmitted securely (assuming HTTPS in production).
- Storage directories check for path traversal vulnerabilities.
