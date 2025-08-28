const User = require("../entities/user");
const bcrypt = require("bcrypt");
const SALT_ROUNDS = 10; // Standard for bcrypt hashing

class RegisterUser {
  constructor(userRepository, blockchainService) {
    this.userRepository = userRepository;
    this.blockchainService = blockchainService;
  }

  async execute(phoneNumber, name, password) {
    try {
      // 1. Valider le mot de passe
      if (!password || password.length < 8) {
        throw new Error("Le mot de passe doit contenir au moins 8 caractères.");
      }

      // 2. Vérifier si l'utilisateur existe déjà
      const existingUser = await this.userRepository.findByPhoneNumber(
        phoneNumber
      );
      if (existingUser) {
        throw new Error(
          "Un utilisateur avec ce numéro de téléphone existe déjà."
        );
      }

      // 3. Créer un wallet blockchain
      const wallet = await this.blockchainService.createWallet();

      // 4. HASHER le mot de passe avant de le sauvegarder
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // 5. ENCRYPTER la clé privée avec le mot de passe
      // This function should be in your blockchainService
      const encryptedPrivateKey =
        await this.blockchainService.encryptPrivateKey(
          wallet.privateKey,
          password
        );

      // 6. Créer l'entité utilisateur avec les données sécurisées
      const user = User.create(
        phoneNumber,
        wallet.address,
        name,
        hashedPassword,
        encryptedPrivateKey
      );

      // 7. Sauvegarder l'utilisateur
      await this.userRepository.save(user);

      // NE JAMAIS RETOURNER LA CLÉ PRIVÉE EN CLAIR
      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          walletAddress: user.walletAddress,
        },
        // We return the encrypted key, which is safe to store and show
        wallet: {
          address: wallet.address,
          encryptedPrivateKey: encryptedPrivateKey,
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
