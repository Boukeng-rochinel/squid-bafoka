class WhatsAppBusinessController {
  constructor(
    registerUser,
    createProduct,
    purchaseProduct,
    listProducts,
    userRepository,
    productRepository,
    whatsAppClient
  ) {
    this.registerUser = registerUser;
    this.createProduct = createProduct;
    this.purchaseProduct = purchaseProduct;
    this.listProducts = listProducts;
    this.userRepository = userRepository;
    this.productRepository = productRepository;
    this.whatsAppClient = whatsAppClient;

    // États des conversations (utiliser Redis en production)
    this.userStates = new Map();
  }

  async handleMessage(message) {
    const phoneNumber = message.from;
    const text = message.body.toLowerCase().trim();
    const userState = this.userStates.get(phoneNumber) || { step: "main" };

    try {
      // Gestion des commandes avec boutons interactifs
      if (text === "/start" || text === "menu" || text === "commencer") {
        await this.sendMainMenu(phoneNumber);
        this.userStates.set(phoneNumber, { step: "main" });
        return;
      }

      // Gestion des réponses de boutons
      if (text === "inscription" || text === "1") {
        await this.handleRegistrationFlow(phoneNumber, userState, text);
      } else if (text === "produits" || text === "2") {
        await this.handleProductListingFlow(phoneNumber);
      } else if (text === "vendre" || text === "3") {
        await this.handleProductCreationFlow(phoneNumber, userState, text);
      } else if (text === "acheter" || text === "4") {
        await this.handlePurchaseFlow(phoneNumber, userState, text);
      } else if (text === "solde" || text === "5") {
        await this.handleBalanceFlow(phoneNumber);
      } else {
        // Gestion des flux de conversation
        await this.handleConversationFlow(phoneNumber, userState, text);
      }
    } catch (error) {
      console.error("Erreur dans handleMessage:", error);
      await this.whatsAppClient.sendTextMessage(
        phoneNumber,
        '❌ Une erreur s\'est produite. Tapez "menu" pour recommencer.'
      );
    }
  }

  async sendMainMenu(phoneNumber) {
    const buttons = [
      { title: "🆕 S'inscrire" },
      { title: "🛍️ Produits" },
      { title: "💰 Mon solde" },
    ];

    await this.whatsAppClient.sendInteractiveMessage(
      phoneNumber,
      "🏪 *MARKETPLACE BLOCKCHAIN*\n\nBienvenue dans notre marketplace décentralisée !\n\nChoisissez une option :",
      buttons
    );

    // Envoyer aussi le menu étendu sous forme de liste
    const sections = [
      {
        title: "Actions principales",
        rows: [
          {
            id: "register",
            title: "S'inscrire",
            description: "Créer votre compte et wallet",
          },
          {
            id: "products",
            title: "Voir produits",
            description: "Parcourir les produits disponibles",
          },
          {
            id: "sell",
            title: "Vendre",
            description: "Mettre un produit en vente",
          },
        ],
      },
      {
        title: "Mon compte",
        rows: [
          {
            id: "balance",
            title: "Mon solde",
            description: "Consulter mon wallet",
          },
          {
            id: "orders",
            title: "Mes commandes",
            description: "Historique des achats",
          },
        ],
      },
    ];

    setTimeout(async () => {
      await this.whatsAppClient.sendListMessage(
        phoneNumber,
        "Ou utilisez le menu détaillé ci-dessous :",
        sections
      );
    }, 1000);
  }

  async handleRegistrationFlow(phoneNumber, userState, text) {
    if (userState.step === "main") {
      // Vérifier si l'utilisateur existe
      const existingUser = await this.userRepository.findByPhoneNumber(
        phoneNumber
      );
      if (existingUser) {
        await this.whatsAppClient.sendTextMessage(
          phoneNumber,
          `✅ *Vous êtes déjà inscrit !*\n\n👤 Nom: ${existingUser.name}\n💳 Wallet: \`${existingUser.walletAddress}\`\n\nTapez "menu" pour les options.`
        );
        return;
      }

      this.userStates.set(phoneNumber, { step: "registration_name" });
      await this.whatsAppClient.sendTextMessage(
        phoneNumber,
        "📝 *INSCRIPTION*\n\nPour créer votre compte, veuillez entrer votre nom complet :"
      );
    } else if (userState.step === "registration_name") {
      const result = await this.registerUser.execute(phoneNumber, text);

      if (result.success) {
        this.userStates.set(phoneNumber, { step: "main" });

        // Message de confirmation avec template
        await this.whatsAppClient.sendTextMessage(
          phoneNumber,
          `🎉 *Inscription réussie !*\n\n👤 Nom: ${result.user.name}\n💳 Adresse Wallet:\n\`${result.user.walletAddress}\`\n\n🔐 *Clé privée (IMPORTANTE) :*\n\`${result.wallet.privateKey}\``
        );

        await this.whatsAppClient.sendTextMessage(
          phoneNumber,
          "⚠️ *IMPORTANT*\n\n• Sauvegardez votre clé privée dans un endroit sûr\n• Ne la partagez jamais\n• Elle est nécessaire pour les achats\n\nVotre wallet est maintenant prêt ! 🎊"
        );

        // Envoyer le menu principal
        setTimeout(async () => {
          await this.sendMainMenu(phoneNumber);
        }, 2000);
      } else {
        this.userStates.set(phoneNumber, { step: "main" });
        await this.whatsAppClient.sendTextMessage(
          phoneNumber,
          `❌ Erreur lors de l'inscription: ${result.error}\n\nTapez "menu" pour recommencer.`
        );
      }
    }
  }

  async handleProductListingFlow(phoneNumber) {
    const result = await this.listProducts.execute();

    if (result.success && result.products.length > 0) {
      // Créer une liste interactive des produits
      const sections = [];
      const categories = [...new Set(result.products.map((p) => p.category))];

      for (const category of categories) {
        const categoryProducts = result.products.filter(
          (p) => p.category === category
        );
        const rows = categoryProducts.slice(0, 10).map((product) => ({
          id: product.id,
          title: `${product.name} - ${product.price} ETH`,
          description: product.description.substring(0, 60) + "...",
        }));

        sections.push({
          title: category.charAt(0).toUpperCase() + category.slice(1),
          rows: rows,
        });
      }

      await this.whatsAppClient.sendListMessage(
        phoneNumber,
        `🛍️ *${result.products.length} PRODUITS DISPONIBLES*\n\nSélectionnez un produit pour plus de détails :`,
        sections
      );

      // Boutons d'action
      const buttons = [
        { title: "🏪 Vendre aussi" },
        { title: "🏠 Menu principal" },
      ];

      setTimeout(async () => {
        await this.whatsAppClient.sendInteractiveMessage(
          phoneNumber,
          "Que souhaitez-vous faire ?",
          buttons
        );
      }, 1000);
    } else if (result.success && result.products.length === 0) {
      await this.whatsAppClient.sendTextMessage(
        phoneNumber,
        '📭 *Aucun produit disponible*\n\nSoyez le premier à vendre sur notre marketplace !\n\nTapez "vendre" pour commencer.'
      );
    } else {
      await this.whatsAppClient.sendTextMessage(
        phoneNumber,
        `❌ Erreur: ${result.error}`
      );
    }
  }

  async handleProductCreationFlow(phoneNumber, userState, text) {
    const user = await this.userRepository.findByPhoneNumber(phoneNumber);
    if (!user) {
      const buttons = [{ title: "📝 S'inscrire maintenant" }];
      await this.whatsAppClient.sendInteractiveMessage(
        phoneNumber,
        "❌ Vous devez d'abord vous inscrire pour vendre.",
        buttons
      );
      return;
    }

    if (userState.step === "main") {
      this.userStates.set(phoneNumber, {
        step: "product_name",
        productData: {},
      });
      await this.whatsAppClient.sendTextMessage(
        phoneNumber,
        '📦 *VENDRE UN PRODUIT*\n\nCommençons par le nom de votre produit :\n\n💡 Exemple: "iPhone 14 Pro Max 256GB"'
      );
    } else if (userState.step === "product_name") {
      userState.productData.name = text;
      this.userStates.set(phoneNumber, {
        step: "product_description",
        productData: userState.productData,
      });
      await this.whatsAppClient.sendTextMessage(
        phoneNumber,
        `✅ Nom: ${text}\n\n📝 Maintenant, décrivez votre produit :\n\n💡 Exemple: "Excellent état, acheté il y a 6 mois, tous accessoires inclus"`
      );
    } else if (userState.step === "product_description") {
      userState.productData.description = text;
      this.userStates.set(phoneNumber, {
        step: "product_price",
        productData: userState.productData,
      });
      await this.whatsAppClient.sendTextMessage(
        phoneNumber,
        `✅ Description ajoutée\n\n💰 Quel est le prix en ETH ?\n\n💡 Exemple: 0.5 (pour 0.5 ETH)`
      );
    } else if (userState.step === "product_price") {
      const price = parseFloat(text);
      if (isNaN(price) || price <= 0) {
        await this.whatsAppClient.sendTextMessage(
          phoneNumber,
          "❌ Prix invalide. Entrez un nombre positif (exemple: 0.1) :"
        );
        return;
      }

      userState.productData.price = price;

      // Proposer des catégories via boutons
      const buttons = [
        { title: "📱 Électronique" },
        { title: "👕 Vêtements" },
        { title: "🏠 Maison" },
      ];

      this.userStates.set(phoneNumber, {
        step: "product_category",
        productData: userState.productData,
      });

      await this.whatsAppClient.sendInteractiveMessage(
        phoneNumber,
        `✅ Prix: ${price} ETH\n\n🏷️ Choisissez une catégorie ou tapez la vôtre :`,
        buttons
      );
    } else if (userState.step === "product_category") {
      let category = text;

      // Mapper les boutons aux catégories
      const categoryMap = {
        "📱 électronique": "électronique",
        "👕 vêtements": "vêtements",
        "🏠 maison": "maison",
      };

      category = categoryMap[text.toLowerCase()] || text;
      userState.productData.category = category;

      // Créer le produit
      const result = await this.createProduct.execute(
        user.id,
        userState.productData.name,
        userState.productData.description,
        userState.productData.price,
        "", // imageUrl à implémenter
        userState.productData.category
      );

      this.userStates.set(phoneNumber, { step: "main" });

      if (result.success) {
        await this.whatsAppClient.sendTextMessage(
          phoneNumber,
          `🎉 *Produit créé avec succès !*\n\n📦 ${result.product.name}\n💰 ${
            result.product.price
          } ETH\n🏷️ ${
            result.product.category
          }\n🆔 ID: \`${result.product.id.substring(
            0,
            12
          )}...\`\n\n✅ Votre produit est maintenant visible dans le marketplace !`
        );

        const buttons = [
          { title: "➕ Vendre un autre" },
          { title: "🛍️ Voir mes produits" },
          { title: "🏠 Menu principal" },
        ];

        setTimeout(async () => {
          await this.whatsAppClient.sendInteractiveMessage(
            phoneNumber,
            "Que souhaitez-vous faire maintenant ?",
            buttons
          );
        }, 1000);
      } else {
        await this.whatsAppClient.sendTextMessage(
          phoneNumber,
          `❌ Erreur: ${result.error}\n\nTapez "menu" pour recommencer.`
        );
      }
    }
  }

  async handleBalanceFlow(phoneNumber) {
    const user = await this.userRepository.findByPhoneNumber(phoneNumber);
    if (!user) {
      const buttons = [{ title: "📝 S'inscrire maintenant" }];
      await this.whatsAppClient.sendInteractiveMessage(
        phoneNumber,
        "❌ Vous devez d'abord vous inscrire.",
        buttons
      );
      return;
    }

    // Récupérer les transactions de l'utilisateur
    // const transactions = await this.transactionRepository.findByUserId(user.id);

    await this.whatsAppClient.sendTextMessage(
      phoneNumber,
      `💳 *VOTRE WALLET*\n\n👤 ${user.name}\n📍 Adresse:\n\`${user.walletAddress}\`\n\n💰 Solde: [Connexion blockchain...]\n\n💡 Pour recharger, envoyez des ETH à cette adresse depuis votre wallet externe.`
    );

    const buttons = [
      { title: "🔄 Actualiser" },
      { title: "📜 Historique" },
      { title: "🏠 Menu" },
    ];

    setTimeout(async () => {
      await this.whatsAppClient.sendInteractiveMessage(
        phoneNumber,
        "Options wallet :",
        buttons
      );
    }, 1000);
  }

  async handleConversationFlow(phoneNumber, userState, text) {
    // Gérer les flux de conversation en cours
    if (userState.step === "registration_name") {
      await this.handleRegistrationFlow(phoneNumber, userState, text);
    } else if (userState.step?.startsWith("product_")) {
      await this.handleProductCreationFlow(phoneNumber, userState, text);
    } else if (userState.step?.startsWith("purchase_")) {
      await this.handlePurchaseFlow(phoneNumber, userState, text);
    } else {
      // Message par défaut
      await this.whatsAppClient.sendTextMessage(
        phoneNumber,
        '🤔 Je n\'ai pas compris votre demande.\n\nTapez "menu" pour voir les options disponibles.'
      );
    }
  }

  async handlePurchaseFlow(phoneNumber, userState, text) {
    // Implémentation similaire à l'ancienne version mais avec l'API Business
    // ... (logique d'achat)
  }
}

module.exports = WhatsAppBusinessController;
