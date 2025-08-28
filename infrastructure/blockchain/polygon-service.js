const { ethers } = require("ethers");
const crypto = require("crypto");
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

  // =====================================================================
  // CORE BLOCKCHAIN METHODS
  // =====================================================================

  async createWallet() {
    const wallet = ethers.Wallet.createRandom();
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic?.phrase,
    };
  }

  async getBalance(walletAddress) {
    const balance = await this.provider.getBalance(walletAddress);
    return ethers.formatEther(balance);
  }

  async sendTransaction(fromAddress, toAddress, amount, privateKey) {
    const wallet = new ethers.Wallet(privateKey, this.provider);
    const feeData = await this.provider.getFeeData();
    const tx = {
      to: toAddress,
      value: ethers.parseEther(amount.toString()),
      gasPrice: feeData.gasPrice,
    };
    const transaction = await wallet.sendTransaction(tx);
    await transaction.wait();
    return { txHash: transaction.hash };
  }

  // =====================================================================
  // SECURITY METHODS
  // =====================================================================

  async encryptPrivateKey(privateKey, password) {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = crypto.scryptSync(password, salt, KEY_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(privateKey, "utf8"),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([salt, iv, authTag, encrypted]).toString("hex");
  }

  async decryptPrivateKey(encryptedKey, password) {
    try {
      const data = Buffer.from(encryptedKey, "hex");
      const salt = data.slice(0, SALT_LENGTH);
      const iv = data.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
      const authTag = data.slice(
        SALT_LENGTH + IV_LENGTH,
        SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
      );
      const encrypted = data.slice(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
      const key = crypto.scryptSync(password, salt, KEY_LENGTH);
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);
      return decrypted.toString("utf8");
    } catch (error) {
      console.error("Decryption failed:", error.message);
      return null;
    }
  }
}

module.exports = PolygonService;
