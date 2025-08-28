// class PurchaseProduct {
//   constructor(
//     transactionRepository,
//     productRepository,
//     userRepository,
//     blockchainService
//   ) {
//     this.transactionRepository = transactionRepository;
//     this.productRepository = productRepository;
//     this.userRepository = userRepository;
//     this.blockchainService = blockchainService;
//   }

//   async execute(buyerId, productId, buyerPrivateKey) {
//     try {
//       // Récupérer les données
//       const buyer = await this.userRepository.findById(buyerId);
//       const product = await this.productRepository.findById(productId);
//       const seller = await this.userRepository.findById(product.sellerId);

//       if (!buyer || !product || !seller) {
//         throw new Error("Données manquantes pour la transaction");
//       }

//       if (!product.isAvailable) {
//         throw new Error("Produit non disponible");
//       }

//       // Vérifier le solde
//       const balance = await this.blockchainService.getBalance(
//         buyer.walletAddress
//       );
//       if (balance < product.price) {
//         throw new Error("Solde insuffisant");
//       }

//       // Effectuer la transaction blockchain
//       const txResult = await this.blockchainService.sendTransaction(
//         buyer.walletAddress,
//         seller.walletAddress,
//         product.price,
//         buyerPrivateKey
//       );

//       // Créer l'enregistrement de transaction
//       const transaction = Transaction.create(
//         buyerId,
//         product.sellerId,
//         productId,
//         product.price,
//         txResult.txHash
//       );

//       await this.transactionRepository.save(transaction);

//       // Marquer le produit comme vendu
//       product.isAvailable = false;
//       await this.productRepository.save(product);

//       return {
//         success: true,
//         transaction: {
//           id: transaction.id,
//           txHash: transaction.txHash,
//           amount: transaction.amount,
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
// module.exports = PurchaseProduct;

// Import des entités et interfaces nécessaires
const Transaction = require("../entities/transaction.model");
const IUserRepository = require("../repositories/i-user-repositories");
const IProductRepository = require("../repositories/i-product-repository");
const ITransactionRepository = require("../repositories/i-transaction-repository");
const IBlockchainService = require("../repositories/i-blockchain-service");

class PurchaseProduct {
  /**
   * @param {ITransactionRepository} transactionRepository
   * @param {IProductRepository} productRepository
   * @param {IUserRepository} userRepository
   * @param {IBlockchainService} blockchainService
   */
  constructor(
    transactionRepository,
    productRepository,
    userRepository,
    blockchainService
  ) {
    this.transactionRepository = transactionRepository;
    this.productRepository = productRepository;
    this.userRepository = userRepository;
    this.blockchainService = blockchainService;
  }

  /**
   * Exécute l'achat direct d'un produit.
   * @param {string} buyerId - L'ID de l'utilisateur qui achète.
   * @param {string} productId - L'ID du produit acheté.
   * @param {string} password - Le mot de passe de l'acheteur pour autoriser la transaction.
   */
  async execute(buyerId, productId, password) {
    let decryptedPrivateKey = null;
    try {
      // 1. Récupérer les données
      const buyer = await this.userRepository.findById(buyerId);
      const product = await this.productRepository.findById(productId);
      if (!buyer || !product)
        throw new Error("Acheteur ou produit introuvable.");

      const seller = await this.userRepository.findById(product.ownerId); // ownerId au lieu de sellerId
      if (!seller) throw new Error("Vendeur introuvable.");
      if (!product.isAvailable) throw new Error("Produit non disponible.");

      // 2. Vérifier le solde
      const balance = await this.blockchainService.getBalance(
        buyer.walletAddress
      );
      if (balance < product.value) throw new Error("Solde insuffisant.");

      // 3. Décrypter la clé de l'acheteur
      decryptedPrivateKey = await this.blockchainService.decryptPrivateKey(
        buyer.encryptedPrivateKey,
        password
      );
      if (!decryptedPrivateKey) throw new Error("Mot de passe incorrect.");

      // 4. Effectuer la transaction blockchain (transfert direct)
      const txResult = await this.blockchainService.sendTransaction(
        buyer.walletAddress,
        seller.walletAddress,
        product.value, // 'value' au lieu de 'price'
        decryptedPrivateKey
      );

      // 5. Enregistrer la transaction
      const transaction = Transaction.create(
        buyerId,
        seller._id,
        productId,
        product.value,
        txResult.txHash
      );
      await this.transactionRepository.save(transaction);

      // 6. Mettre à jour le produit
      product.isAvailable = false;
      await this.productRepository.save(product);

      return {
        success: true,
        txHash: transaction.txHash,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    } finally {
      decryptedPrivateKey = null; // Nettoyer la clé de la mémoire
    }
  }
}

module.exports = PurchaseProduct;
