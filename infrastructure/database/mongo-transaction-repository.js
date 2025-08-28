// Import the Mongoose models, not the entity classes
const Transaction = require("../../core/entities/transaction.model");
const AuthChallenge = require("../../core/entities/auth-challenge.model");
const ITransactionRepository = require("../../core/repositories/i-transaction-repository");

class MongoRepository extends ITransactionRepository {
  constructor() {
    super();
    // The connection is managed globally by Mongoose, so the constructor is empty.
  }

  // ======================================================
  // PASSKEY AUTHENTICATION METHODS
  // ======================================================

  async saveAuthChallenge(userId, challenge) {
    await AuthChallenge.create({
      userId,
      challenge,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });
  }

  async findAndClearAuthChallenge(challenge) {
    const challengeDoc = await AuthChallenge.findOneAndDelete({
      challenge: challenge,
      expiresAt: { $gt: new Date() },
    });
    return challengeDoc;
  }

  // ======================================================
  // TRANSACTION METHODS
  // ======================================================

  async save(transactionEntity) {
    await Transaction.findOneAndUpdate(
      { id: transactionEntity.id },
      transactionEntity,
      {
        new: true,
        upsert: true,
      }
    );
    return true;
  }

  async findById(id) {
    return Transaction.findOne({ id });
  }

  async findByUserId(userId) {
    return Transaction.find({
      $or: [{ buyerId: userId }, { sellerId: userId }],
    }).sort({ createdAt: -1 });
  }
}

module.exports = MongoRepository;
