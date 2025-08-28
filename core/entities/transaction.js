// core/entities/transaction.js
class Transaction {
  constructor(
    id,
    buyerId,
    sellerId,
    productId,
    amount,
    txHash,
    status = "pending",
    createdAt = new Date()
  ) {
    this.id = id;
    this.buyerId = buyerId;
    this.sellerId = sellerId;
    this.productId = productId;
    this.amount = amount;
    this.txHash = txHash;
    this.status = status; // pending, confirmed, failed
    this.createdAt = createdAt;
  }

  static create(buyerId, sellerId, productId, amount, txHash) {
    const id = require("crypto").randomUUID();
    return new Transaction(id, buyerId, sellerId, productId, amount, txHash);
  }
}


module.exports = Transaction;