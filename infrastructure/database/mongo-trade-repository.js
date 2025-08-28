const Trade = require("../../core/entities/trade.model"); // Import the Mongoose model
const ITradeRepository = require("../../core/repositories/i-trade-repository");

class MongoTradeRepository extends ITradeRepository {
  constructor() {
    super();
    // The connection is managed globally by Mongoose, so the constructor is empty.
  }

  async save(tradeEntity) {
    // Use Mongoose's findOneAndUpdate method with upsert for a clean save/update
    await Trade.findOneAndUpdate({ id: tradeEntity.id }, tradeEntity, {
      new: true,
      upsert: true,
    });
    return true;
  }

  async findById(id) {
    return Trade.findOne({ id });
  }

  async findByUserId(userId) {
    return Trade.find({
      $or: [{ initiatorId: userId }, { recipientId: userId }],
    }).sort({ createdAt: -1 });
  }

  async findPendingByRecipientId(recipientId) {
    return Trade.find({
      recipientId: recipientId,
      status: "pending_acceptance",
    });
  }
}

module.exports = MongoTradeRepository;
