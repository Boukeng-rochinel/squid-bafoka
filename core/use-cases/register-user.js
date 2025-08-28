const { User } = require("../entities/user.model"); // Import your pure entity class
const bcrypt = require("bcrypt");
const SALT_ROUNDS = 10;

class RegisterUser {
  constructor(userRepository, blockchainService) {
    this.userRepository = userRepository;
    this.blockchainService = blockchainService;
  }

  async execute(phoneNumber, name, password) {
    try {
      if (!password || password.length < 8) {
        throw new Error("Le mot de passe doit contenir au moins 8 caractères.");
      }

      const existingUser = await this.userRepository.findByPhoneNumber(
        phoneNumber
      );
      if (existingUser) {
        throw new Error(
          "Un utilisateur avec ce numéro de téléphone existe déjà."
        );
      }

      // Create a blockchain wallet
      const wallet = await this.blockchainService.createWallet();

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // Encrypt the private key
      const encryptedPrivateKey =
        await this.blockchainService.encryptPrivateKey(
          wallet.privateKey,
          password
        );

      // CORRECTION IS HERE: We create the pure entity object first.
      const user = User.create(
        phoneNumber,
        wallet.address,
        name,
        hashedPassword,
        encryptedPrivateKey
      );

      // Then, we pass this complete object to the repository to be saved.
      await this.userRepository.save(user);

      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          walletAddress: user.walletAddress,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = RegisterUser;
