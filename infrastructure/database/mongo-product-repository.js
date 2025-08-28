const { MongoClient } = require("mongodb");
const IProductRepository = require("../../core/repositories/i-product-repository");
const  Product  = require("../../core/entities/product");

class MongoProductRepository extends IProductRepository {
  constructor(connectionString, dbName) {
    super();
    this.connectionString = connectionString;
    this.dbName = dbName;
    this.collectionName = "products";
  }

  async getCollection() {
    const client = new MongoClient(this.connectionString);
    await client.connect();
    const db = client.db(this.dbName);
    return { collection: db.collection(this.collectionName), client };
  }

  async save(product) {
    const { collection, client } = await this.getCollection();
    try {
      const result = await collection.replaceOne({ id: product.id }, product, {
        upsert: true,
      });
      return result.acknowledged;
    } finally {
      await client.close();
    }
  }

  async findById(id) {
    const { collection, client } = await this.getCollection();
    try {
      const productData = await collection.findOne({ id });
      return productData
        ? new Product(
            productData.id,
            productData.sellerId,
            productData.name,
            productData.description,
            productData.price,
            productData.imageUrl,
            productData.category,
            productData.createdAt
          )
        : null;
    } finally {
      await client.close();
    }
  }

  async findBySellerId(sellerId) {
    const { collection, client } = await this.getCollection();
    try {
      const products = await collection.find({ sellerId }).toArray();
      return products.map(
        (p) =>
          new Product(
            p.id,
            p.sellerId,
            p.name,
            p.description,
            p.price,
            p.imageUrl,
            p.category,
            p.createdAt
          )
      );
    } finally {
      await client.close();
    }
  }

  async findByCategory(category) {
    const { collection, client } = await this.getCollection();
    try {
      const products = await collection.find({ category }).toArray();
      return products.map(
        (p) =>
          new Product(
            p.id,
            p.sellerId,
            p.name,
            p.description,
            p.price,
            p.imageUrl,
            p.category,
            p.createdAt
          )
      );
    } finally {
      await client.close();
    }
  }

  async findAll() {
    const { collection, client } = await this.getCollection();
    try {
      const products = await collection.find({}).toArray();
      return products.map(
        (p) =>
          new Product(
            p.id,
            p.sellerId,
            p.name,
            p.description,
            p.price,
            p.imageUrl,
            p.category,
            p.createdAt
          )
      );
    } finally {
      await client.close();
    }
  }
}


module.exports = MongoProductRepository;