// const config = require("./config/database");
// const whatsappConfig = require("./config/whatsapp-business");
// const express = require("express");

// // Imports...
// const {
//   WhatsAppBusinessClient,
// } = require("./infrastructure/messaging/whatsapp-business-client");
// const {
//   WhatsAppBusinessController,
// } = require("./interfaces/controllers/whatsapp-business-controller");
// const { WebhookRoutes } = require("./infrastructure/web/webhook-routes");

// class BusinessApplication {
//   async initialize() {
//     console.log("🚀 Initialisation de l'application WhatsApp Business...");

//     // ... (initialisation des repositories et use cases comme avant)

//     // Initialisation du client WhatsApp Business
//     this.WhatsAppBusinessClient = new WhatsAppBusinessClient(
//       whatsappConfig.whatsappBusiness
//     );

//     // Initialisation du contrôleur WhatsApp Business
//     this.whatsAppController = new WhatsAppBusinessController(
//       this.registerUser,
//       this.createProduct,
//       this.purchaseProduct,
//       this.listProducts,
//       this.userRepository,
//       this.productRepository,
//       this.WhatsAppBusinessClient
//     );

//     // Connecter le handler de messages
//     this.WhatsAppBusinessClient.addMessageHandler(async (message) => {
//       try {
//         await this.whatsAppController.handleMessage(message);
//       } catch (error) {
//         console.error("Erreur traitement message:", error);
//         await this.WhatsAppBusinessClient.sendTextMessage(
//           message.from,
//           '❌ Une erreur s\'est produite. Tapez "menu" pour recommencer.'
//         );
//       }
//     });

//     // Initialisation du serveur Express avec webhook
//     this.app = express();
//     this.app.use(express.json());

//     // Routes webhook
//     const webhookRoutes = new WebhookRoutes(
//       this.WhatsAppBusinessClient,
//       this.whatsAppController
//     );
//     this.app.use("/", webhookRoutes.getRouter());

//     // Routes API existantes
//     this.setupApiRoutes();

//     console.log("✅ Application WhatsApp Business initialisée!");
//   }

//   setupApiRoutes() {
//     // Route de santé
//     this.app.get("/health", (req, res) => {
//       res.json({
//         status: "OK",
//         timestamp: new Date().toISOString(),
//         service: "WhatsApp Business Marketplace",
//       });
//     });

//     // API pour envoyer des messages (pour tests ou intégrations)
//     this.app.post("/api/send-message", async (req, res) => {
//       try {
//         const { phoneNumber, message, type = "text" } = req.body;

//         let result;
//         if (type === "text") {
//           result = await this.WhatsAppBusinessClient.sendTextMessage(
//             phoneNumber,
//             message
//           );
//         } else if (type === "interactive") {
//           const { buttons } = req.body;
//           result = await this.WhatsAppBusinessClient.sendInteractiveMessage(
//             phoneNumber,
//             message,
//             buttons
//           );
//         }

//         res.json({ success: true, messageId: result.messages[0].id });
//       } catch (error) {
//         res.status(500).json({ error: error.message });
//       }
//     });

//     // API pour lister les produits
//     this.app.get("/api/products", async (req, res) => {
//       try {
//         const result = await this.listProducts.execute(req.query.category);
//         res.json(result);
//       } catch (error) {
//         res.status(500).json({ error: error.message });
//       }
//     });

//     // API pour créer un produit
//     this.app.post("/api/products", async (req, res) => {
//       try {
//         const { sellerId, name, description, price, imageUrl, category } =
//           req.body;
//         const result = await this.createProduct.execute(
//           sellerId,
//           name,
//           description,
//           price,
//           imageUrl,
//           category
//         );
//         res.json(result);
//       } catch (error) {
//         res.status(500).json({ error: error.message });
//       }
//     });

//     // API pour obtenir les statistiques
//     this.app.get("/api/stats", async (req, res) => {
//       try {
//         const products = await this.listProducts.execute();
//         const stats = {
//           totalProducts: products.products?.length || 0,
//           categories: [
//             ...new Set(products.products?.map((p) => p.category) || []),
//           ],
//           timestamp: new Date().toISOString(),
//         };
//         res.json(stats);
//       } catch (error) {
//         res.status(500).json({ error: error.message });
//       }
//     });
//   }

//   async start() {
//     try {
//       const port = whatsappConfig.webhook.port;

//       this.server = this.app.listen(port, () => {
//         console.log(`🌐 Serveur webhook démarré sur le port ${port}`);
//         console.log(
//           `📱 Webhook WhatsApp: http://localhost:${port}${whatsappConfig.webhook.path}`
//         );
//         console.log(
//           "🎯 Application prête à recevoir les messages WhatsApp Business!"
//         );
//       });
//     } catch (error) {
//       console.error("❌ Erreur lors du démarrage:", error);
//       process.exit(1);
//     }
//   }

//   async stop() {
//     console.log("⏹️  Arrêt de l'application...");

//     if (this.server) {
//       return new Promise((resolve) => {
//         this.server.close(() => {
//           console.log("✅ Application arrêtée");
//           resolve();
//         });
//       });
//     }
//   }
// }

// // Démarrage de l'application
// const app = new BusinessApplication();

// process.on("SIGINT", () => {
//   console.log("Signal SIGINT reçu");
//   app.stop().then(() => process.exit(0));
// });

// process.on("SIGTERM", () => {
//   console.log("Signal SIGTERM reçu");
//   app.stop().then(() => process.exit(0));
// });

// async function main() {
//   try {
//     await app.initialize();
//     await app.start();
//   } catch (error) {
//     console.error("Erreur fatale:", error);
//     process.exit(1);
//   }
// }

// if (require.main === module) {
//   main();
// }

// module.exports = { BusinessApplication };

const config = require("./config/database");
const whatsappConfig = require("./config/whatsapp-business");
// Repositories
const MongoUserRepository = require("./infrastructure/database/mongo-user-repository");
const MongoProductRepository = require("./infrastructure/database/mongo-product-repository");
const MongoTransactionRepository = require("./infrastructure/database/mongo-transaction-repository");
const WhatsAppBusinessClient = require("./infrastructure/messaging/whatsapp-business-client");
// Services
const WhatsAppBusinessController = require("./interfaces/controllers/whatsapp-business-controller")
const EthereumService = require("./infrastructure/blockchain/ethereum-service");
// const {
//   WhatsAppBusinessClient,
// } = require("./infrastructure/messaging/whatsapp-client");

// Use Cases
const RegisterUser = require("./core/use-cases/register-user");
const CreateProduct = require("./core/use-cases/create-product");
const PurchaseProduct = require("./core/use-cases/purchase-product");
const ListProducts = require("./core/use-cases/list-products");
const WebhookRoutes = require("./infrastructure/web/webhook-routes");
// Controllers
const WhatsAppController = require("./interfaces/controllers/whatsapp-business-controller");

// Infrastructure Web
const ExpressServer = require("./infrastructure/web/express-server");

class Application {
  async initialize() {
    console.log("🚀 Initialisation de l'application...");

    // Initialisation des repositories
    this.userRepository = new MongoUserRepository(
      config.mongodb.connectionString,
      config.mongodb.dbName
    );

    this.productRepository = new MongoProductRepository(
      config.mongodb.connectionString,
      config.mongodb.dbName
    );

    this.transactionRepository = new MongoTransactionRepository(
      config.mongodb.connectionString,
      config.mongodb.dbName
    );

    // Initialisation du service blockchain
    this.blockchainService = new EthereumService(
      config.blockchain.providerUrl,
      config.blockchain.chainId
    );

    // Initialisation des use cases
    this.registerUser = new RegisterUser(
      this.userRepository,
      this.blockchainService
    );
    this.createProduct = new CreateProduct(
      this.productRepository,
      this.userRepository
    );
    this.purchaseProduct = new PurchaseProduct(
      this.transactionRepository,
      this.productRepository,
      this.userRepository,
      this.blockchainService
    );
    this.listProducts = new ListProducts(this.productRepository);

    // Initialisation du contrôleur WhatsApp
    this.whatsAppController = new WhatsAppController(
      this.registerUser,
      this.createProduct,
      this.purchaseProduct,
      this.listProducts,
      this.userRepository,
      this.productRepository
    );

    // Initialisation du client WhatsApp
    this.WhatsAppBusinessClient = new WhatsAppBusinessClient(
      whatsappConfig.whatsappBusiness
    );
    this.WhatsAppBusinessClient.addMessageHandler(async (message) => {
      try {
        const response = await this.whatsAppController.handleMessage(message);
        if (response) {
          await this.WhatsAppBusinessClient.sendMessage(message.from, response);
        }
      } catch (error) {
        console.error("Erreur lors du traitement du message:", error);
        await this.WhatsAppBusinessClient.sendMessage(
          message.from,
          'Désolé, une erreur s\'est produite. Tapez "menu" pour recommencer.'
        );
      }
    });

    // Initialisation du serveur web (optionnel, pour APIs REST)
    this.expressServer = new ExpressServer(config.server.port);
    const webhookRoutes = new WebhookRoutes(
      WhatsAppBusinessClient,
      WhatsAppBusinessController
    );

    // Montage du routeur sur l'app Express
  this.expressServer.setupRoutes(webhookRoutes.getRouter());
    // Routes API (optionnelles)
    const apiRoutes = [
      {
        method: "get",
        path: "/api/health",
        handler: (req, res) => {
          res.json({ status: "OK", timestamp: new Date().toISOString() });
        },
      },
      {
        method: "get",
        path: "/",
        handler: (req, res) => {
          res.json({ status: "OK", timestamp: new Date().toISOString() });
        },
      },
      {
        method: "get",
        path: "/api/products",
        handler: async (req, res) => {
          try {
            const result = await this.listProducts.execute(req.query.category);
            res.json(result);
          } catch (error) {
            res.status(500).json({ error: error.message });
          }
        },
      },
      {
        method: "post",
        path: "/api/webhook/whatsapp",
        handler: async (req, res) => {
          // Webhook pour intégrations externes
          res.json({ received: true });
        },
      },
    ];

    this.expressServer.addRoutes(apiRoutes);

    console.log("✅ Application initialisée avec succès!");
  }

  async start() {
    try {
      console.log("🌟 Démarrage de l'application...");

      // Démarrer le serveur web
      await this.expressServer.start();

      // Démarrer le client WhatsApp
      console.log("📱 Initialisation du client WhatsApp...");
      //   await this.WhatsAppBusinessClient.initialize();

      console.log("🎉 Application démarrée avec succès!");
      console.log("📱 WhatsApp Bot prêt à recevoir des messages");
      console.log(
        `🌐 Serveur API disponible sur http://localhost:${config.server.port}`
      );
    } catch (error) {
      console.error("❌ Erreur lors du démarrage:", error);
      process.exit(1);
    }
  }

  async stop() {
    console.log("⏹️  Arrêt de l'application...");

    if (this.expressServer) {
      await this.expressServer.stop();
    }

    console.log("✅ Application arrêtée");
    process.exit(0);
  }
}

// Gestion des signaux pour un arrêt propre
const app = new Application();

process.on("SIGINT", () => {
  console.log("Signal SIGINT reçu");
  app.stop();
});

process.on("SIGTERM", () => {
  console.log("Signal SIGTERM reçu");
  app.stop();
});

// Démarrage de l'application
async function main() {
  try {
    await app.initialize();
    await app.start();
  } catch (error) {
    console.error("Erreur fatale:", error);
    process.exit(1);
  }
}

// Lancement si ce fichier est exécuté directement
if (require.main === module) {
  main();
}
