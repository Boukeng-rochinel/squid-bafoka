const { MongoClient, ObjectId } = require("mongodb");
const ITradeRepository = require("../../core/repositories/i-trade-repository");
const { Trade } = require("../../core/entities/trade"); // Ensure this path is correct

class MongoTradeRepository extends ITradeRepository {
  constructor(connectionString, dbName) {
    super();
    this.connectionString = connectionString;
    this.dbName = dbName;
    this.collectionName = "trades";
  }

  /**
   * Establishes a connection to the database and returns the collection and client.
   * @returns {Promise<{collection: import('mongodb').Collection, client: MongoClient}>}
   */
  async getCollection() {
    const client = new MongoClient(this.connectionString);
    await client.connect();
    const db = client.db(this.dbName);
    return { collection: db.collection(this.collectionName), client };
  }

  /**
   * Saves a new trade or updates an existing one based on its ID.
   * @param {Trade} trade - The trade entity to save.
   * @returns {Promise<boolean>} A promise that resolves to true if the operation was acknowledged.
   */
  async save(trade) {
    const { collection, client } = await this.getCollection();
    try {
      // Convert ObjectId strings back to ObjectId instances for proper querying
      trade.initiatorId = new ObjectId(trade.initiatorId);
      trade.recipientId = new ObjectId(trade.recipientId);
      trade.initiatorItemId = new ObjectId(trade.initiatorItemId);
      trade.recipientItemId = new ObjectId(trade.recipientItemId);
      if (trade.payerId) {
        trade.payerId = new ObjectId(trade.payerId);
      }

      const result = await collection.replaceOne({ id: trade.id }, trade, {
        upsert: true,
      });
      return result.acknowledged;
    } finally {
      await client.close();
    }
  }

  /**
   * Finds a trade by its unique custom ID.
   * @param {string} id - The ID of the trade.
   * @returns {Promise<Trade|null>} The trade entity or null if not found.
   */
  async findById(id) {
    const { collection, client } = await this.getCollection();
    try {
      const tradeData = await collection.findOne({ id });
      return tradeData
        ? new Trade(
            tradeData.id,
            tradeData.initiatorId,
            tradeData.recipientId,
            tradeData.initiatorItemId,
            tradeData.recipientItemId,
            tradeData.balanceAmount,
            tradeData.payerId,
            tradeData.status,
            tradeData.transactionHash,
            tradeData.createdAt
          )
        : null;
    } finally {
      await client.close();
    }
  }

  /**
   * Finds all trades (initiated or received) for a specific user.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<Trade[]>} An array of trade entities.
   */
  async findByUserId(userId) {
    const { collection, client } = await this.getCollection();
    try {
      const objectId = new ObjectId(userId);
      const trades = await collection
        .find({
          $or: [{ initiatorId: objectId }, { recipientId: objectId }],
        })
        .sort({ createdAt: -1 })
        .toArray();

      return trades.map(
        (t) =>
          new Trade(
            t.id,
            t.initiatorId,
            t.recipientId,
            t.initiatorItemId,
            t.recipientItemId,
            t.balanceAmount,
            t.payerId,
            t.status,
            t.transactionHash,
            t.createdAt
          )
      );
    } finally {
      await client.close();
    }
  }

  /**
   * Finds all pending trade offers sent to a specific user.
   * @param {string} recipientId - The ID of the user who received the offers.
   * @returns {Promise<Trade[]>} An array of pending trade entities.
   */
  async findPendingByRecipientId(recipientId) {
    const { collection, client } = await this.getCollection();
    try {
      const objectId = new ObjectId(recipientId);
      const trades = await collection
        .find({
          recipientId: objectId,
          status: "pending_acceptance",
        })
        .toArray();

      return trades.map(
        (t) =>
          new Trade(
            t.id,
            t.initiatorId,
            t.recipientId,
            t.initiatorItemId,
            t.recipientItemId,
            t.balanceAmount,
            t.payerId,
            t.status,
            t.transactionHash,
            t.createdAt
          )
      );
    } finally {
      await client.close();
    }
  }
}

module.exports = MongoTradeRepository;
