class IProductRepository {
  async save(product) {
    throw new Error("Method must be implemented");
  }

  async findById(id) {
    throw new Error("Method must be implemented");
  }

  async findBySellerId(sellerId) {
    throw new Error("Method must be implemented");
  }

  async findByCategory(category) {
    throw new Error("Method must be implemented");
  }

  async findAll() {
    throw new Error("Method must be implemented");
  }
}


module.exports = IProductRepository;