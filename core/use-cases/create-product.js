// class CreateProduct {
//   constructor(productRepository, userRepository) {
//     this.productRepository = productRepository;
//     this.userRepository = userRepository;
//   }

//   async execute(sellerId, name, description, price, imageUrl, category) {
//     try {
//       // Vérifier que le vendeur existe
//       const seller = await this.userRepository.findById(sellerId);
//       if (!seller) {
//         throw new Error("Vendeur non trouvé");
//       }

//       // Créer le produit
//       const product = Product.create(
//         sellerId,
//         name,
//         description,
//         price,
//         imageUrl,
//         category
//       );

//       // Sauvegarder
//       await this.productRepository.save(product);

//       return {
//         success: true,
//         product: {
//           id: product.id,
//           name: product.name,
//           description: product.description,
//           price: product.price,
//           category: product.category,
//         },
//       };
//     } catch (error) {
//       return {
//         success: false,
//         error: error.message,
//       };
//     }
//   }
// }


// module.exports = CreateProduct;

// We import the Product entity to be able to instantiate it
const  Product  = require('../entities/product'); // Make sure the path is correct

class CreateProduct {
  constructor(productRepository, userRepository) {
    this.productRepository = productRepository;
    this.userRepository = userRepository;
  }

  /**
   * Creates a new product with a value for the barter system.
   * @param {string} ownerId - The ID of the user who owns the product.
   * @param {string} name - The name of the product.
   * @param {string} description - The description of the product.
   * @param {number} value - The value of the product in "bamekap".
   * @param {string} imageUrl - The URL of the product's image.
   * @param {string} category - The category of the product.
   */
  async execute(ownerId, name, description, value, imageUrl, category) {
    try {
      // Verify that the owner exists
      const owner = await this.userRepository.findById(ownerId);
      if (!owner) {
        throw new Error("Propriétaire non trouvé");
      }

      // Validate the value
      if (typeof value !== 'number' || value <= 0) {
        throw new Error("La valeur du produit doit être un nombre positif.");
      }

      // Create the Product entity
      const product = Product.create(
        ownerId,
        name,
        description,
        value, // We pass the 'value'
        imageUrl,
        category
      );

      // Save via the repository
      await this.productRepository.save(product);

      // Return a confirmation
      return {
        success: true,
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
          value: product.value, // We return the 'value'
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