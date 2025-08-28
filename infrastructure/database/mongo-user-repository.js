// Import the Mongoose model, not the entity class
const User = require("../../core/entities/user.model");
const IUserRepository = require("../../core/repositories/i-user-repositories");

class MongoUserRepository extends IUserRepository {
  constructor() {
    super();
    // The connection is now managed globally by Mongoose, no need for 'db'
  }

  async save(userEntity) {
    // Use Mongoose's powerful findOneAndUpdate method with upsert
    await User.findOneAndUpdate({ id: userEntity.id }, userEntity, {
      new: true,
      upsert: true,
    });
    return true;
  }

  async findByPhoneNumber(phoneNumber) {
    // Use the Mongoose model to find the user
    return User.findOne({ phoneNumber });
  }

  async findById(id) {
    return User.findOne({ id });
  }

  async findByWalletAddress(walletAddress) {
    return User.findOne({ walletAddress });
  }
}

module.exports = MongoUserRepository;
