class ListProducts {
  constructor(productRepository) {
    this.productRepository = productRepository;
  }

  async execute(category = null) {
    try {
      let products;

      if (category) {
        products = await this.productRepository.findByCategory(category);
      } else {
        products = await this.productRepository.findAll();
      }

      // Filtrer seulement les produits disponibles
      const availableProducts = products.filter((p) => p.isAvailable);

      return {
        success: true,
        products: availableProducts.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          category: p.category,
          imageUrl: p.imageUrl,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = ListProducts;