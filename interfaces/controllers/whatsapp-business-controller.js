class WhatsAppBusinessController {
  constructor(
    // Use Cases
    registerUser,
    createProduct,
    purchaseProduct,
    proposeTrade,
    executeTrade,
    listProducts,
    // Repositories
    userRepository,
    productRepository,
    tradeRepository,
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
    // 1. Handle Group Events First
    if (message.type === "participant_change") {
      await this.handleGroupParticipantChange(message);
      return; // Stop processing for group events
    }

    const phoneNumber = message.from;
    const text = message.body.trim();
    const lowerCaseText = text.toLowerCase();

    const user = await this.userRepository.findByPhoneNumber(phoneNumber);
    const userState = this.userStates.get(phoneNumber) || {
      step: "main",
      data: {},
    };

    try {
      // 2. Gatekeeper for New Users
      if (!user) {
        // If the user is new, force them into the registration flow.
        await this.handleRegistrationFlow(phoneNumber, userState, text);
        return;
      }

      // 3. Handle Ongoing Conversations for Existing Users
      if (userState.step !== "main") {
        const flow = this.routeByState(userState);
        if (flow) {
          await flow(phoneNumber, user, userState, text, message);
          return;
        }
      }

      // 4. Handle New Commands from the Main Menu for Existing Users
      if (lowerCaseText === "menu") {
        await this.sendMainMenu(phoneNumber);
        this.userStates.set(phoneNumber, { step: "main", data: {} });
      } else {
        await this.handleMainMenuCommands(
          phoneNumber,
          user,
          userState,
          lowerCaseText
        );
      }
    } catch (error) {
      console.error("Erreur dans handleMessage:", error);
      this.userStates.set(phoneNumber, { step: "main", data: {} });
      await this.whatsAppClient.sendTextMessage(
        phoneNumber,
        '❌ Une erreur s\'est produite. Tapez "menu".'
      );
    }
  }

  // ===== HELPER METHODS =====

  routeByState(userState) {
    if (userState.step.startsWith("registration_"))
      return this.handleRegistrationFlow.bind(this);
    if (userState.step.startsWith("product_creation_"))
      return this.handleProductCreationFlow.bind(this);
    if (userState.step.startsWith("trade_"))
      return this.handleTradeFlow.bind(this);
    if (userState.step.startsWith("purchase_"))
      return this.handlePurchaseFlow.bind(this);
    return null;
  }

  mapTextToCommand(text) {
    if (["s'inscrire", "🆕 s'inscrire"].includes(text)) return "register";
    if (["vendre un article", "➕ vendre un article"].includes(text))
      return "sell";
    if (["voir les articles", "🛍️ voir les articles"].includes(text))
      return "browse";
    if (["mes échanges", "📊 mes échanges"].includes(text)) return "my_trades";
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

  async handleGroupParticipantChange(event) {
    if (event.action === "add") {
      const groupId = event.from;
      for (const participantId of event.participants) {
        const name = event.contact?.name || "au nouveau membre";
        const welcomeMessage = `👋 Bienvenue à ${name} dans la communauté TrocSwap !`;
        await this.whatsAppClient.sendTextMessage(groupId, welcomeMessage);
      }
    }
  }

  async handleRegistrationFlow(phoneNumber, userState, text) {
    if (
      userState.step === "main" ||
      (userState.step === "registration_name" &&
        userState.data.name === undefined)
    ) {
      const existingUser = await this.userRepository.findByPhoneNumber(
        phoneNumber
      );
      if (existingUser) {
        await this.whatsAppClient.sendTextMessage(
          phoneNumber,
          `✅ Vous êtes déjà inscrit, ${existingUser.name} !`
        );
        this.userStates.set(phoneNumber, { step: "main", data: {} });
        return;
      }
      if (userState.step === "main") {
        this.userStates.set(phoneNumber, {
          step: "registration_name",
          data: {},
        });
        await this.whatsAppClient.sendTextMessage(
          phoneNumber,
          "📝 *Inscription*\n\nQuel est votre nom ?"
        );
        return;
      }
    }

    if (userState.step === "registration_name") {
      const name = text;
      this.userStates.set(phoneNumber, {
        step: "registration_password",
        data: { name },
      });
      await this.whatsAppClient.sendTextMessage(
        phoneNumber,
        `OK, ${name}. Créez un mot de passe (8 caractères min.).`
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

  async handleProductCreationFlow(phoneNumber, user, userState, messageData) {
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
      userState.data.name = messageData;
      userState.step = "product_creation_value";
      this.userStates.set(phoneNumber, userState);
      await this.whatsAppClient.sendTextMessage(
        phoneNumber,
        `✅ Nom: ${messageData}\n\n💰 Quelle est sa valeur en 'bamekap' ? (ex: 5000)`
      );
      return;
    }

    if (userState.step === "product_creation_value") {
      const value = parseFloat(messageData);
      if (isNaN(value) || value <= 0) {
        await this.whatsAppClient.sendTextMessage(
          phoneNumber,
          "❌ Valeur invalide. Entrez un nombre positif."
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

    if (userState.step === "product_creation_image") {
      const imageId = messageData;
      const imageUrl = `https://placeholder.url/for/${imageId}`;

      const result = await this.createProduct.execute({
        ownerId: user.id,
        name: userState.data.name,
        description: "",
        value: userState.data.value,
        imageUrl: imageUrl,
        category: "default",
      });

      this.userStates.set(phoneNumber, { step: "main" });

      if (result.success) {
        await this.whatsAppClient.sendTextMessage(
          phoneNumber,
          `🎉 Article créé avec succès !`
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
    // Placeholder for direct purchase flow
    await this.whatsAppClient.sendTextMessage(
      phoneNumber,
      "La fonction d'achat direct est en cours de développement."
    );
  }

  async handleTradeFlow(phoneNumber, user, userState, text) {
    // Placeholder for the complex escrow trade flow
    await this.whatsAppClient.sendTextMessage(
      phoneNumber,
      "La fonction d'échange/troc est en cours de développement."
    );
  }
}

module.exports = WhatsAppBusinessController;
