class ITransactionRepository {
  async save(transaction) {
    throw new Error("Method must be implemented");
  }

  async findById(id) {
    throw new Error("Method must be implemented");
  }

  async findByUserId(userId) {
    throw new Error("Method must be implemented");
  }

  async updateStatus(id, status, txHash = null) {
    throw new Error("Method must be implemented");
  }
}

module.exports = ITransactionRepository;