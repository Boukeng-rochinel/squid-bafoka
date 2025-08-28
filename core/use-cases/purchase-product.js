class PurchaseProduct {
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

  async execute(buyerId, productId, buyerPrivateKey) {
    try {
      // Récupérer les données
      const buyer = await this.userRepository.findById(buyerId);
      const product = await this.productRepository.findById(productId);
      const seller = await this.userRepository.findById(product.sellerId);

      if (!buyer || !product || !seller) {
        throw new Error("Données manquantes pour la transaction");
      }

      if (!product.isAvailable) {
        throw new Error("Produit non disponible");
      }

      // Vérifier le solde
      const balance = await this.blockchainService.getBalance(
        buyer.walletAddress
      );
      if (balance < product.price) {
        throw new Error("Solde insuffisant");
      }

      // Effectuer la transaction blockchain
      const txResult = await this.blockchainService.sendTransaction(
        buyer.walletAddress,
        seller.walletAddress,
        product.price,
        buyerPrivateKey
      );

      // Créer l'enregistrement de transaction
      const transaction = Transaction.create(
        buyerId,
        product.sellerId,
        productId,
        product.price,
        txResult.txHash
      );

      await this.transactionRepository.save(transaction);

      // Marquer le produit comme vendu
      product.isAvailable = false;
      await this.productRepository.save(product);

      return {
        success: true,
        transaction: {
          id: transaction.id,
          txHash: transaction.txHash,
          amount: transaction.amount,
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
module.exports = PurchaseProduct;
