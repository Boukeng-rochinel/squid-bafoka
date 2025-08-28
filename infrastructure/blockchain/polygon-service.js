const { ethers } = require("ethers");
const crypto = require("crypto"); // Import Node's crypto library
const IBlockchainService = require("../../core/repositories/i-blockchain-service");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const KEY_LENGTH = 32;
const AUTH_TAG_LENGTH = 16;

class PolygonService extends IBlockchainService {
  /**
   * @param {ethers.Provider} provider - A pre-connected ethers provider instance.
   */
  constructor(provider) {
    super();
    this.provider = provider;
  }

  // ... (createWallet, getBalance, sendTransaction, etc. remain the same) ...

  // =====================================================================
  // NEW SECURITY METHODS
  // =====================================================================

  /**
   * Encrypts a private key using a user's password.
   * @param {string} privateKey - The private key to encrypt.
   * @param {string} password - The user's password.
   * @returns {string} The encrypted data, formatted for storage.
   */
  async encryptPrivateKey(privateKey, password) {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);

    // Derive a secure key from the password
    const key = crypto.scryptSync(password, salt, KEY_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(privateKey, "utf8"),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    // Combine all parts into a single string for easy storage
    return Buffer.concat([salt, iv, authTag, encrypted]).toString("hex");
  }

  /**
   * Decrypts a private key using the user's password.
   * @param {string} encryptedKey - The encrypted data from the database.
   * @param {string} password - The user's password.
   * @returns {string|null} The decrypted private key, or null if decryption fails.
   */
  async decryptPrivateKey(encryptedKey, password) {
    try {
      const data = Buffer.from(encryptedKey, "hex");

      // Extract the parts from the combined buffer
      const salt = data.slice(0, SALT_LENGTH);
      const iv = data.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
      const authTag = data.slice(
        SALT_LENGTH + IV_LENGTH,
        SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
      );
      const encrypted = data.slice(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

      // Derive the same key from the password
      const key = crypto.scryptSync(password, salt, KEY_LENGTH);

      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(encrypted, "hex", "utf8"),
        decipher.final("utf8"),
      ]);

      return decrypted.toString();
    } catch (error) {
      // If the password is wrong, decryption will fail.
      console.error("Decryption failed:", error.message);
      return null;
    }
  }
}

module.exports = PolygonService;
