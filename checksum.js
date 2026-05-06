import crypto from 'crypto';
import { CONFIG } from './config.js';

/**
 * Compute RSA checksum for any input string.
 * @param {string} inputString 
 * @param {string} [publicKey] 
 * @returns {string} 
 */
export function computeChecksum(inputString, publicKey = CONFIG.publicKey) {
  const sha512Hash = crypto
    .createHash('sha512')
    .update(inputString, 'utf8')
    .digest();

  const encrypted = crypto.publicEncrypt(
    { key: publicKey, padding: crypto.constants.RSA_PKCS1_PADDING },
    sha512Hash
  );

  return encrypted.toString('base64');
}

/**
 * Generate a random alphanumeric external reference ID.
 * @param {number} [length=25]
 * @returns {string}
 */
export function generateReferenceId(length = 25) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}
