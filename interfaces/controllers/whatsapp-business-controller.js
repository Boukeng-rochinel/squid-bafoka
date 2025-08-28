class WhatsAppBusinessController {
  constructor(
    // Use Cases
    registerUser,
    createProduct,
    purchaseProduct,
    proposeTrade, // New
    executeTrade, // New
    listProducts,
    // Repositories
    userRepository,
    productRepository,
    tradeRepository, // New
    // External Clients
    whatsAppClient
  ) {
    this.registerUser = registerUser;
    this.createProduct = createProduct;
    this.purchaseProduct = purchaseProduct;
    this.proposeTrade = proposeTrade;
    this.executeTrade = executeTrade;
    this.listProducts = listProducts;
    this.userRepository = userRepository;
    this.productRepository = productRepository;
    this.tradeRepository = tradeRepository;
    this.whatsAppClient = whatsAppClient;

    // For production, this should be a persistent store like Redis
    this.userStates = new Map();
  }

  // ===== MAIN MESSAGE ROUTER =====

  async handleMessage(message) {
    const phoneNumber = message.from;
    const text = message.body.trim();
    const lowerCaseText = text.toLowerCase();

    const userState = this.userStates.get(phoneNumber) || {
      step: "main",
      data: {},
    };
    const user = await this.userRepository.findByPhoneNumber(phoneNumber);

    try {
      // Handle image uploads if user is in the correct state
      if (
        message.type === "image" &&
        userState.step === "product_creation_image"
      ) {
        await this.handleProductCreationFlow(
          phoneNumber,
          userState,
          text,
          message.image.id
        );
        return;
      }

      // Handle global commands
      if (lowerCaseText === "menu") {
        await this.sendMainMenu(phoneNumber);
        this.userStates.set(phoneNumber, { step: "main", data: {} });
        return;
      }

      // Route to the correct conversation flow based on state
      if (userState.step.startsWith("registration_")) {
        await this.handleRegistrationFlow(phoneNumber, userState, text);
      } else if (userState.step.startsWith("product_creation_")) {
        await this.handleProductCreationFlow(phoneNumber, userState, text);
      } else if (userState.step.startsWith("trade_")) {
        await this.handleTradeFlow(phoneNumber, user, userState, text);
      } else if (userState.step.startsWith("purchase_")) {
        await this.handlePurchaseFlow(phoneNumber, user, userState, text);
      } else if (userState.step === "main") {
        // Handle main menu commands from a neutral state
        const command = this.mapTextToCommand(lowerCaseText);
        switch (command) {
          case "register":
            await this.handleRegistrationFlow(phoneNumber, userState, text);
            break;
          case "sell":
            await this.handleProductCreationFlow(phoneNumber, userState, text);
            break;
          case "browse":
            await this.handleProductListingFlow(phoneNumber);
            break;
          case "my_trades":
            await this.handleMyTradesFlow(phoneNumber, user);
            break;
          default:
            await this.whatsAppClient.sendTextMessage(
              phoneNumber,
              '🤔 Commande non reconnue. Tapez "menu" pour voir les options.'
            );
            break;
        }
      } else {
        this.userStates.set(phoneNumber, { step: "main", data: {} });
        await this.whatsAppClient.sendTextMessage(
          phoneNumber,
          "Une erreur est survenue. Retour au menu principal."
        );
      }
    } catch (error) {
      console.error("Erreur dans handleMessage:", error);
      this.userStates.set(phoneNumber, { step: "main", data: {} });
      await this.whatsAppClient.sendTextMessage(
        phoneNumber,
        '❌ Une erreur s\'est produite. Tapez "menu" pour recommencer.'
      );
    }
  }

  mapTextToCommand(text) {
    if (["s'inscrire", "inscription", "register"].includes(text))
      return "register";
    if (["vendre", "sell"].includes(text)) return "sell";
    if (["produits", "articles", "voir les produits", "browse"].includes(text))
      return "browse";
    if (["mes échanges", "my trades"].includes(text)) return "my_trades";
    return "unknown";
  }

  // ===== CONVERSATIONAL FLOWS =====

  async sendMainMenu(phoneNumber) {
    const text = "🏪 *TrocSwap Marketplace*\n\nChoisissez une option :";
    const buttons = [
      { title: "🛍️ Voir les Articles" },
      { title: "➕ Vendre un Article" },
      { title: "📊 Mes Échanges" },
    ];
    await this.whatsAppClient.sendInteractiveMessage(
      phoneNumber,
      text,
      buttons
    );
  }

  async handleRegistrationFlow(phoneNumber, userState, text) {
    if (userState.step === "main") {
      const existingUser = await this.userRepository.findByPhoneNumber(
        phoneNumber
      );
      if (existingUser) {
        await this.whatsAppClient.sendTextMessage(
          phoneNumber,
          `✅ Vous êtes déjà inscrit, ${existingUser.name} !`
        );
        return;
      }
      this.userStates.set(phoneNumber, { step: "registration_name", data: {} });
      await this.whatsAppClient.sendTextMessage(
        phoneNumber,
        "📝 *Inscription*\n\nQuel est votre nom ?"
      );
      return;
    }

    if (userState.step === "registration_name") {
      const name = text;
      this.userStates.set(phoneNumber, {
        step: "registration_password",
        data: { name },
      });
      await this.whatsAppClient.sendTextMessage(
        phoneNumber,
        `OK, ${name}. Maintenant, créez un mot de passe (8 caractères min.) pour sécuriser votre compte.`
      );
      return;
    }

    if (userState.step === "registration_password") {
      const password = text;
      const { name } = userState.data;

      const result = await this.registerUser.execute(
        phoneNumber,
        name,
        password
      );

      if (result.success) {
        this.userStates.set(phoneNumber, { step: "main", data: {} });
        const successMessage = `🎉 *Inscription réussie !*\n\n👤 Nom: ${result.user.name}\n💳 Adresse Wallet:\n\`${result.user.walletAddress}\`\n\nVotre compte est protégé par votre mot de passe.`;
        await this.whatsAppClient.sendTextMessage(phoneNumber, successMessage);
        setTimeout(() => this.sendMainMenu(phoneNumber), 1000);
      } else {
        this.userStates.set(phoneNumber, { step: "main", data: {} });
        await this.whatsAppClient.sendTextMessage(
          phoneNumber,
          `❌ Erreur: ${result.error}`
        );
      }
    }
  }

  async handleProductCreationFlow(
    phoneNumber,
    userState,
    text,
    imageId = null
  ) {
    const user = await this.userRepository.findByPhoneNumber(phoneNumber);
    if (!user) {
      await this.whatsAppClient.sendTextMessage(
        phoneNumber,
        "❌ Vous devez d'abord vous inscrire."
      );
      return;
    }

    if (userState.step === "main") {
      this.userStates.set(phoneNumber, {
        step: "product_creation_name",
        data: {},
      });
      await this.whatsAppClient.sendTextMessage(
        phoneNumber,
        "📦 *Vendre un Article*\n\nQuel est le nom de votre article ?"
      );
      return;
    }

    if (userState.step === "product_creation_name") {
      userState.data.name = text;
      userState.step = "product_creation_value";
      this.userStates.set(phoneNumber, userState);
      await this.whatsAppClient.sendTextMessage(
        phoneNumber,
        `✅ Nom: ${text}\n\n💰 Quelle est sa valeur en 'bamekap' ? (ex: 5000)`
      );
      return;
    }

    if (userState.step === "product_creation_value") {
      const value = parseFloat(text);
      if (isNaN(value) || value <= 0) {
        await this.whatsAppClient.sendTextMessage(
          phoneNumber,
          "❌ Valeur invalide. Veuillez entrer un nombre positif."
        );
        return;
      }
      userState.data.value = value;
      userState.step = "product_creation_image";
      this.userStates.set(phoneNumber, userState);
      await this.whatsAppClient.sendTextMessage(
        phoneNumber,
        "🖼️ Presque fini ! Envoyez maintenant la photo de votre produit."
      );
      return;
    }

    if (userState.step === "product_creation_image" && imageId) {
      // Here you would have a media service to handle the download
      // const imageUrl = await this.mediaService.saveImageFromWhatsApp(imageId);
      const imageUrl = `https://placeholder.url/for/${imageId}`; // Placeholder

      const result = await this.createProduct.execute(
        user.id,
        userState.data.name,
        "", // Description
        userState.data.value,
        imageUrl,
        "default"
      );

      this.userStates.set(phoneNumber, { step: "main" });

      if (result.success) {
        await this.whatsAppClient.sendTextMessage(
          phoneNumber,
          `🎉 *Article créé avec succès !*\n\n📦 ${result.product.name}\n💰 ${result.product.value} bamekap`
        );
      } else {
        await this.whatsAppClient.sendTextMessage(
          phoneNumber,
          `❌ Erreur: ${result.error}`
        );
      }
    }
  }

  async handlePurchaseFlow(phoneNumber, user, userState, text) {
    if (!user) {
      /* ... handle not registered ... */ return;
    }

    if (userState.step.startsWith("purchase_")) {
      // Simplified placeholder
      const password = text;
      const { productId } = userState.data;

      await this.whatsAppClient.sendTextMessage(
        phoneNumber,
        "⏳ Traitement de votre achat en cours..."
      );
      const result = await this.purchaseProduct.execute(
        user.id,
        productId,
        password
      );

      this.userStates.set(phoneNumber, { step: "main" });

      if (result.success) {
        await this.whatsAppClient.sendTextMessage(
          phoneNumber,
          `🎉 *Achat réussi !*\n\n📄 Hash:\n\`${result.txHash}\``
        );
      } else {
        await this.whatsAppClient.sendTextMessage(
          phoneNumber,
          `❌ Erreur: ${result.error}`
        );
      }
    }
  }

  async handleTradeFlow(phoneNumber, user, userState, text) {
    if (!user) {
      /* ... handle not registered ... */ return;
    }

    // Placeholder for the very complex escrow flow
    if (userState.step.startsWith("trade_")) {
      const password = text;
      const { tradeId } = userState.data;

      await this.whatsAppClient.sendTextMessage(
        phoneNumber,
        "⏳ Exécution de l'action sur l'escrow en cours..."
      );
      const result = await this.executeTrade.execute(
        tradeId,
        user.id,
        password
      );

      this.userStates.set(phoneNumber, { step: "main" });

      if (result.success) {
        await this.whatsAppClient.sendTextMessage(
          phoneNumber,
          `✅ Action réussie ! ${result.message}`
        );
      } else {
        await this.whatsAppClient.sendTextMessage(
          phoneNumber,
          `❌ Erreur d'escrow: ${result.error}`
        );
      }
    }
  }
}

module.exports = WhatsAppBusinessController;
