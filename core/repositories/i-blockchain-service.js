class IBlockchainService {
  async createWallet() {
    throw new Error("Method must be implemented");
  }

  async getBalance(walletAddress) {
    throw new Error("Method must be implemented");
  }

  async sendTransaction(fromWallet, toWallet, amount, privateKey) {
    throw new Error("Method must be implemented");
  }

  async verifyTransaction(txHash) {
    throw new Error("Method must be implemented");
  }
}

module.exports = IBlockchainService;
