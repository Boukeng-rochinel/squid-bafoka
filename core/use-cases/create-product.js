class CreateProduct {
  constructor(productRepository, userRepository) {
    this.productRepository = productRepository;
    this.userRepository = userRepository;
  }

  async execute(sellerId, name, description, price, imageUrl, category) {
    try {
      // Vérifier que le vendeur existe
      const seller = await this.userRepository.findById(sellerId);
      if (!seller) {
        throw new Error("Vendeur non trouvé");
      }

      // Créer le produit
      const product = Product.create(
        sellerId,
        name,
        description,
        price,
        imageUrl,
        category
      );

      // Sauvegarder
      await this.productRepository.save(product);

      return {
        success: true,
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}


module.exports = CreateProduct;