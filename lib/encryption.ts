import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm' as const;
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;

// Get encryption key from environment or generate deterministic one from secret
function getEncryptionKey(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET || 'default-secret-key-change-in-production';
  const key = crypto.scryptSync(secret, 'salt', KEY_LENGTH);
  return new Uint8Array(key);
}

export function encrypt(text: string): string {
  if (!text) return '';
  
  try {
    const key = getEncryptionKey();
    const ivBuffer = crypto.randomBytes(IV_LENGTH);
    const iv = new Uint8Array(ivBuffer);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Format: iv:authTag:encryptedData
    return `${ivBuffer.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    return '';
  }
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';
  
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      // Return as-is if not in encrypted format (backward compatibility)
      return encryptedText;
    }
    
    const [ivHex, authTagHex, encrypted] = parts;
    const key = getEncryptionKey();
    const iv = new Uint8Array(Buffer.from(ivHex, 'hex'));
    const authTag = new Uint8Array(Buffer.from(authTagHex, 'hex'));
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
}

// Mask API key for display (show first 4 and last 4 chars)
export function maskApiKey(key: string): string {
  if (!key || key.length < 12) return '••••••••';
  return `${key.slice(0, 4)}${'•'.repeat(8)}${key.slice(-4)}`;
}
