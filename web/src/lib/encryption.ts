import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 16;

/**
 * Get encryption key from environment
 * Falls back to NEXTAUTH_SECRET if ENCRYPTION_KEY not set
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("ENCRYPTION_KEY or NEXTAUTH_SECRET must be set");
  }
  // Derive a key from the secret using scrypt
  const salt = Buffer.from("serviceia-token-encryption", "utf8");
  return scryptSync(secret, salt, KEY_LENGTH);
}

/**
 * Encrypt a string value
 * Returns: base64(iv + authTag + ciphertext)
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Combine: IV (16) + AuthTag (16) + Ciphertext
  const combined = Buffer.concat([
    iv,
    authTag,
    Buffer.from(encrypted, "hex"),
  ]);

  return combined.toString("base64");
}

/**
 * Decrypt a string value
 * Input: base64(iv + authTag + ciphertext)
 */
export function decrypt(encryptedBase64: string): string {
  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedBase64, "base64");

  // Extract components
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString("utf8");
}

/**
 * Safely decrypt - returns null on error instead of throwing
 */
export function safeDecrypt(encryptedBase64: string | null | undefined): string | null {
  if (!encryptedBase64) return null;
  try {
    return decrypt(encryptedBase64);
  } catch {
    console.error("[Encryption] Failed to decrypt value");
    return null;
  }
}

/**
 * Check if a value appears to be encrypted
 * (Base64 encoded and of expected minimum length)
 */
export function isEncrypted(value: string | null | undefined): boolean {
  if (!value) return false;
  // Minimum length: IV (16) + AuthTag (16) + at least 1 byte ciphertext
  // Base64 encoding increases size by ~33%
  const minBase64Length = Math.ceil((IV_LENGTH + AUTH_TAG_LENGTH + 1) * 4 / 3);
  if (value.length < minBase64Length) return false;

  // Check if valid base64
  const base64Regex = /^[A-Za-z0-9+/]+=*$/;
  return base64Regex.test(value);
}
