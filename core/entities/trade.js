const crypto = require("crypto");

/**
 * Represents a trade offer between two users for two items.
 */
class Trade {
  /**
   * @param {string} id Unique identifier for the trade.
   * @param {string} initiatorId ID of the user who started the trade.
   * @param {string} recipientId ID of the user who received the offer.
   * @param {string} initiatorItemId ID of the item offered by the initiator.
   * @param {string} recipientItemId ID of the item requested from the recipient.
   * @param {number} balanceAmount The amount of 'bamekap' to balance the trade.
   * @param {string|null} payerId ID of the user who must pay the balance.
   * @param {string} status The current status of the trade (e.g., 'pending_acceptance').
   * @param {string|null} transactionHash The blockchain transaction hash of the final settlement.
   * @param {Date} createdAt The date the trade was created.
   */
  constructor(
    id,
    initiatorId,
    recipientId,
    initiatorItemId,
    recipientItemId,
    balanceAmount,
    payerId,
    status = "pending_acceptance",
    transactionHash = null,
    createdAt = new Date()
  ) {
    this.id = id;
    this.initiatorId = initiatorId;
    this.recipientId = recipientId;
    this.initiatorItemId = initiatorItemId;
    this.recipientItemId = recipientItemId;
    this.balanceAmount = balanceAmount;
    this.payerId = payerId;
    this.status = status;
    this.transactionHash = transactionHash;
    this.createdAt = createdAt;
  }

  /**
   * Factory method to create a new Trade instance.
   * @returns {Trade} A new instance of the Trade class.
   */
  static create(
    initiatorId,
    recipientId,
    initiatorItemId,
    recipientItemId,
    balanceAmount,
    payerId
  ) {
    const id = crypto.randomUUID();
    return new Trade(
      id,
      initiatorId,
      recipientId,
      initiatorItemId,
      recipientItemId,
      balanceAmount,
      payerId
    );
  }
}

module.exports = { Trade };
