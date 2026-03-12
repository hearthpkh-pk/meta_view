// src/lib/encryption.ts
import crypto from 'crypto';

// ----------------------------------------------------------------------------
// ⚠️ SECURITY WARNING: 
// 1. MUST BE STORED IN VERCEL ENVIRONMENT VARIABLES (process.env.MASTER_KEY)
// 2. MUST BE EXACTLY 32 BYTES (64 HEX CHARACTERS OR A 32-CHAR STRING)
// 3. NEVER HARDCODE THIS IN SOURCE CONTROL
// ----------------------------------------------------------------------------
const ENCRYPTION_KEY = process.env.MASTER_KEY; // e.g. '0123456789abcdef0123456789abcdef'
const ALGORITHM = 'aes-256-gcm';

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  console.warn("⚠️ CRITICAL: MASTER_KEY is not set correctly in Environment Variables. It must be exactly 32 characters.");
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a string in the format: iv:authTag:encryptedData (base64 encoded)
 */
export function encryptData(text: string): string {
  if (!text) return text;
  if (!ENCRYPTION_KEY) throw new Error("Encryption key is missing");

  try {
    const iv = crypto.randomBytes(12); // 96-bit IV is recommended for GCM
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();
    
    // Format: iv(base64):authTag(base64):encrypted(base64)
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
  } catch (error) {
    console.error("Encryption failed:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypts a ciphertext string back to plaintext.
 * Expects format: iv:authTag:encryptedData (base64 encoded)
 */
export function decryptData(encryptedText: string): string {
  if (!encryptedText) return encryptedText;
  if (!ENCRYPTION_KEY) throw new Error("Encryption key is missing");

  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) throw new Error('Invalid encrypted text format');

    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error("Decryption failed:", error);
    // Do not throw actual decryption errors to avoid leaking info to client
    return "ENCRYPTION_ERROR_KEY_MISMATCH"; 
  }
}
