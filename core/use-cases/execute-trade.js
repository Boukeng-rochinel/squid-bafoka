// Import des entités et interfaces nécessaires
const IUserRepository = require("../repositories/i-user-repositories");
const IProductRepository = require("../repositories/i-product-repository");
const ITradeRepository = require("../repositories/i-trade-repository"); // Un repository pour les objets Trade
const IBlockchainService = require("../repositories/i-blockchain-service");

class ExecuteTrade {
  /**
   * @param {ITradeRepository} tradeRepository
   * @param {IProductRepository} productRepository
   * @param {IUserRepository} userRepository
   * @param {IBlockchainService} blockchainService
   */
  constructor(
    tradeRepository,
    productRepository,
    userRepository,
    blockchainService
  ) {
    this.tradeRepository = tradeRepository;
    this.productRepository = productRepository;
    this.userRepository = userRepository;
    this.blockchainService = blockchainService;
  }

  /**
   * Exécute les étapes d'un échange (dépôt ou libération de l'escrow).
   * @param {string} tradeId - L'ID de l'échange en cours.
   * @param {string} executingUserId - L'ID de l'utilisateur qui effectue l'action.
   * @param {string} password - Le mot de passe de l'utilisateur pour autoriser l'action.
   */
  async execute(tradeId, executingUserId, password) {
    try {
      const trade = await this.tradeRepository.findById(tradeId);
      if (!trade) throw new Error("Échange introuvable.");

      // --- Logique pour le dépôt dans l'escrow ---
      if (trade.status === "awaiting_deposit") {
        if (trade.payerId.toString() !== executingUserId) {
          throw new Error(
            "Vous n'êtes pas autorisé à déposer des fonds pour cet échange."
          );
        }

        const payer = await this.userRepository.findById(executingUserId);
        const payee = await this.userRepository.findById(
          trade.initiatorId.equals(payer._id)
            ? trade.recipientId
            : trade.initiatorId
        );

        // Exécuter le dépôt sur la blockchain
        const txResult = await this.blockchainService.depositToEscrow(
          payer,
          trade.balanceAmount,
          password
        );

        // Mettre à jour le statut de l'échange
        trade.status = "in_escrow";
        trade.transactionHash = txResult.txHash; // Hash du dépôt
        await this.tradeRepository.save(trade);

        return {
          success: true,
          status: "in_escrow",
          message: "Dépôt effectué avec succès.",
        };
      }

      // --- Logique pour la libération de l'escrow ---
      else if (trade.status === "awaiting_confirmation") {
        const payeeId = trade.payerId.equals(trade.initiatorId)
          ? trade.recipientId
          : trade.initiatorId;
        if (payeeId.toString() !== executingUserId) {
          throw new Error(
            "Seul le destinataire des fonds peut confirmer la réception."
          );
        }

        const payee = await this.userRepository.findById(executingUserId);

        // Libérer les fonds de l'escrow
        const txResult = await this.blockchainService.releaseFromEscrow(
          tradeId, // L'ID de l'échange pour le smart contract
          payee.walletAddress
        );

        // Mettre à jour le statut et les produits
        trade.status = "completed";
        trade.transactionHash = txResult.txHash; // Hash de la libération
        await this.tradeRepository.save(trade);

        const item1 = await this.productRepository.findById(
          trade.initiatorItemId
        );
        const item2 = await this.productRepository.findById(
          trade.recipientItemId
        );
        item1.isAvailable = false;
        item2.isAvailable = false;
        await this.productRepository.save(item1);
        await this.productRepository.save(item2);

        return {
          success: true,
          status: "completed",
          message: "Échange terminé avec succès !",
        };
      } else {
        throw new Error(
          `L'échange n'est pas dans un état valide pour cette action (état actuel: ${trade.status}).`
        );
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = ExecuteTrade;
