class RegisterUser {
  constructor(userRepository, blockchainService) {
    this.userRepository = userRepository;
    this.blockchainService = blockchainService;
  }

  async execute(phoneNumber, name) {
    try {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await this.userRepository.findByPhoneNumber(
        phoneNumber
      );
      if (existingUser) {
        throw new Error("Utilisateur déjà enregistré");
      }

      // Créer un wallet blockchain
      const wallet = await this.blockchainService.createWallet();

      // Créer l'utilisateur
      const user = User.create(phoneNumber, wallet.address, name);

      // Sauvegarder
      await this.userRepository.save(user);

      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          phoneNumber: user.phoneNumber,
          walletAddress: user.walletAddress,
        },
        wallet: {
          address: wallet.address,
          privateKey: wallet.privateKey, // À chiffrer avant stockage
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