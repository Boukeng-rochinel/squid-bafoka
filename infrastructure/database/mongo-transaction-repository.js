const { MongoClient, ObjectId } = require("mongodb");
const ITransactionRepository = require("../../core/repositories/i-transaction-repository");
const  Transaction  = require("../../core/entities/transaction");

// This class now handles both transactions and the challenges for passkey auth
class MongoRepository extends ITransactionRepository {
  constructor(connectionString, dbName) {
    super();
    this.connectionString = connectionString;
    this.dbName = dbName;
    this.transactionsCollectionName = "transactions";
    this.authCollectionName = "auth_challenges"; // New collection for passkeys
  }

  async getCollection(collectionName) {
    const client = new MongoClient(this.connectionString);
    await client.connect();
    const db = client.db(this.dbName);
    return { collection: db.collection(collectionName), client };
  }

  // ======================================================
  // PASSKEY AUTHENTICATION METHODS
  // ======================================================

  /**
   * Saves a unique challenge for a user to sign with their passkey.
   * This is the first step of the authentication flow.
   * @param {string} userId - The ID of the user trying to authenticate.
   * @param {string} challenge - A secure, random, one-time-use string.
   */
  async saveAuthChallenge(userId, challenge) {
    const { collection, client } = await this.getCollection(
      this.authCollectionName
    );
    try {
      // The challenge should expire to enhance security (e.g., after 5 minutes)
      const expiration = new Date(Date.now() + 5 * 60 * 1000);
      await collection.insertOne({
        userId: new ObjectId(userId),
        challenge,
        createdAt: new Date(),
        expiresAt: expiration,
      });
    } finally {
      await client.close();
    }
  }

  /**
   * Finds a challenge and deletes it to prevent reuse (replay attacks).
   * This is the verification step of the authentication flow.
   * @param {string} challenge - The challenge signed by the user's passkey.
   * @returns {object|null} The challenge document if found and valid.
   */
  async findAndClearAuthChallenge(challenge) {
    const { collection, client } = await this.getCollection(
      this.authCollectionName
    );
    try {
      const challengeDoc = await collection.findOneAndDelete({
        challenge: challenge,
        expiresAt: { $gt: new Date() }, // Ensure the challenge has not expired
      });
      return challengeDoc;
    } finally {
      await client.close();
    }
  }

  // ======================================================
  // TRANSACTION METHODS (UNCHANGED)
  // ======================================================

  async save(transaction) {
    const { collection, client } = await this.getCollection(
      this.transactionsCollectionName
    );
    try {
      const result = await collection.replaceOne(
        { id: transaction.id },
        transaction,
        { upsert: true }
      );
      return result.acknowledged;
    } finally {
      await client.close();
    }
  }

  async findById(id) {
    const { collection, client } = await this.getCollection(
      this.transactionsCollectionName
    );
    try {
      const txData = await collection.findOne({ id });
      return txData
        ? new Transaction(
            txData.id,
            txData.buyerId,
            txData.sellerId,
            txData.productId,
            txData.amount,
            txData.txHash,
            txData.status,
            txData.createdAt
          )
        : null;
    } finally {
      await client.close();
    }
  }

  async findByUserId(userId) {
    const { collection, client } = await this.getCollection(
      this.transactionsCollectionName
    );
    try {
      const transactions = await collection
        .find({
          $or: [{ buyerId: userId }, { sellerId: userId }],
        })
        .toArray();

      return transactions.map(
        (tx) =>
          new Transaction(
            tx.id,
            tx.buyerId,
            tx.sellerId,
            tx.productId,
            tx.amount,
            tx.txHash,
            tx.status,
            tx.createdAt
          )
      );
    } finally {
      await client.close();
    }
  }
}

module.exports = MongoRepository;
