const crypto = require("crypto");

class User {
  constructor(
    id,
    phoneNumber,
    walletAddress,
    name,
    hashedPassword,
    encryptedPrivateKey, // Add new parameter
    createdAt = new Date()
  ) {
    this.id = id;
    this.phoneNumber = phoneNumber;
    this.walletAddress = walletAddress;
    this.name = name;
    this.createdAt = createdAt;
    this.isActive = true;

    // The securely hashed password for authentication
    this.hashedPassword = hashedPassword;

    // The user's private key, encrypted with their password
    this.encryptedPrivateKey = encryptedPrivateKey;
  }

  static create(
    phoneNumber,
    walletAddress,
    name,
    hashedPassword,
    encryptedPrivateKey // Add new parameter
  ) {
    const id = crypto.randomUUID();
    return new User(
      id,
      phoneNumber,
      walletAddress,
      name,
      hashedPassword,
      encryptedPrivateKey
    );
  }
}

module.exports = User;
