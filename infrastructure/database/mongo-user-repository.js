const { MongoClient } = require("mongodb");
const IUserRepository = require("../../core/repositories/i-user-repositories");
const { User } = require("../../core/entities/user");

class MongoUserRepository extends IUserRepository {
  constructor(connectionString, dbName) {
    super();
    this.connectionString = connectionString;
    this.dbName = dbName;
    this.collectionName = "users";
  }

  async getCollection() {
    const client = new MongoClient(this.connectionString);
    await client.connect();
    const db = client.db(this.dbName);
    return { collection: db.collection(this.collectionName), client };
  }

  async save(user) {
    const { collection, client } = await this.getCollection();
    try {
      const result = await collection.replaceOne({ id: user.id }, user, {
        upsert: true,
      });
      return result.acknowledged;
    } finally {
      await client.close();
    }
  }

  async findByPhoneNumber(phoneNumber) {
    const { collection, client } = await this.getCollection();
    try {
      const userData = await collection.findOne({ phoneNumber });
      return userData
        ? new User(
            userData.id,
            userData.phoneNumber,
            userData.walletAddress,
            userData.name,
            userData.createdAt
          )
        : null;
    } finally {
      await client.close();
    }
  }

  async findById(id) {
    const { collection, client } = await this.getCollection();
    try {
      const userData = await collection.findOne({ id });
      return userData
        ? new User(
            userData.id,
            userData.phoneNumber,
            userData.walletAddress,
            userData.name,
            userData.createdAt
          )
        : null;
    } finally {
      await client.close();
    }
  }

  async findByWalletAddress(walletAddress) {
    const { collection, client } = await this.getCollection();
    try {
      const userData = await collection.findOne({ walletAddress });
      return userData
        ? new User(
            userData.id,
            userData.phoneNumber,
            userData.walletAddress,
            userData.name,
            userData.createdAt
          )
        : null;
    } finally {
      await client.close();
    }
  }
}


module.exports = MongoUserRepository;