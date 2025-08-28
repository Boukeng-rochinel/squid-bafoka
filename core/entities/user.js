class User {
  constructor(id, phoneNumber, walletAddress, name, createdAt = new Date()) {
    this.id = id;
    this.phoneNumber = phoneNumber;
    this.walletAddress = walletAddress;
    this.name = name;
    this.createdAt = createdAt;
    this.isActive = true;
  }

  static create(phoneNumber, walletAddress, name) {
    const id = require("crypto").randomUUID();
    return new User(id, phoneNumber, walletAddress, name);
  }
}
