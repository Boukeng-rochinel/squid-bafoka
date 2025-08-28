const { MongoClient } = require("mongodb");
const ITransactionRepository = require("../../core/repositories/i-transaction-repository");
const { Transaction } = require("../../core/entities/transaction");

class MongoTransactionRepository extends ITransactionRepository {
  constructor(connectionString, dbName) {
    super();
    this.connectionString = connectionString;
    this.dbName = dbName;
    this.collectionName = "transactions";
  }

  async getCollection() {
    const client = new MongoClient(this.connectionString);
    await client.connect();
    const db = client.db(this.dbName);
    return { collection: db.collection(this.collectionName), client };
  }

  async save(transaction) {
    const { collection, client } = await this.getCollection();
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
    const { collection, client } = await this.getCollection();
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
    const { collection, client } = await this.getCollection();
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

  async updateStatus(id, status, txHash = null) {
    const { collection, client } = await this.getCollection();
    try {
      const updateData = { status };
      if (txHash) {
        updateData.txHash = txHash;
      }

      const result = await collection.updateOne({ id }, { $set: updateData });

      return result.modifiedCount > 0;
    } finally {
      await client.close();
    }
  }
}

module.exports = MongoTransactionRepository;