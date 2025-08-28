const Product = require("../../core/entities/product.model"); // Import the Mongoose model
const IProductRepository = require("../../core/repositories/i-product-repository");

class MongoProductRepository extends IProductRepository {
  constructor() {
    super();
    // The connection is managed globally by Mongoose, so the constructor is empty.
  }

  async save(productEntity) {
    // Use Mongoose's findOneAndUpdate with upsert for a clean save/update
    await Product.findOneAndUpdate({ id: productEntity.id }, productEntity, {
      new: true,
      upsert: true,
    });
    return true;
  }

  async findById(id) {
    return Product.findOne({ id });
  }

  async findByOwnerId(ownerId) {
    return Product.find({ ownerId: ownerId });
  }

  async findByCategory(category) {
    return Product.find({ category: category });
  }

  async findAll() {
    return Product.find({ isAvailable: true });
  }
}

module.exports = MongoProductRepository;
