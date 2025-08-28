class IUserRepository {
  async save(user) {
    throw new Error("Method must be implemented");
  }

  async findByPhoneNumber(phoneNumber) {
    throw new Error("Method must be implemented");
  }

  async findById(id) {
    throw new Error("Method must be implemented");
  }

  async findByWalletAddress(walletAddress) {
    throw new Error("Method must be implemented");
  }
}

module.exports = IUserRepository;
