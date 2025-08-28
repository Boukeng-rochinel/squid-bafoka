// core/entities/product.js
class Product {
  constructor(
    id,
    sellerId,
    name,
    description,
    price,
    imageUrl,
    category,
    createdAt = new Date()
  ) {
    this.id = id;
    this.sellerId = sellerId;
    this.name = name;
    this.description = description;
    this.price = price; // En wei ou token
    this.imageUrl = imageUrl;
    this.category = category;
    this.createdAt = createdAt;
    this.isAvailable = true;
  }

  static create(sellerId, name, description, price, imageUrl, category) {
    const id = require("crypto").randomUUID();
    return new Product(
      id,
      sellerId,
      name,
      description,
      price,
      imageUrl,
      category
    );
  }
}
