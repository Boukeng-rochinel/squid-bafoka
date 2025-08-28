require("dotenv").config();
const config = require("./config/database");
const whatsappConfig = require("./config/whatsapp-business");

// Repositories
const MongoUserRepository = require("./infrastructure/database/mongo-user-repository");
const MongoProductRepository = require("./infrastructure/database/mongo-product-repository");
const MongoTradeRepository = require("./infrastructure/database/mongo-trade-repository"); // Assurez-vous d'importer celui-ci

// Infrastructure
const WhatsAppBusinessClient = require("./infrastructure/messaging/whatsapp-business-client");
const EthereumService = require("./infrastructure/blockchain/ethereum-service");
const ExpressServer = require("./infrastructure/web/express-server");
const WebhookRoutes = require("./infrastructure/web/webhook-routes");

// Use Cases
const RegisterUser = require("./core/use-cases/register-user");
const CreateProduct = require("./core/use-cases/create-product");
const PurchaseProduct = require("./core/use-cases/purchase-product");
const ListProducts = require("./core/use-cases/list-products");
const ProposeTrade = require("./core/use-cases/propose-trade"); // Assurez-vous d'importer
const ExecuteTrade = require("./core/use-cases/execute-trade"); // Assurez-vous d'importer

// Controller
const WhatsAppBusinessController = require("./interfaces/controllers/whatsapp-business-controller");

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
    this.tradeRepository = new MongoTradeRepository(
      config.mongodb.connectionString,
      config.mongodb.dbName
    ); // Initialiser le trade repo

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
      this.tradeRepository,
      this.productRepository,
      this.userRepository,
      this.blockchainService
    );
    this.listProducts = new ListProducts(this.productRepository);
    this.proposeTrade = new ProposeTrade(
      this.tradeRepository,
      this.productRepository,
      this.userRepository
    );
    this.executeTrade = new ExecuteTrade(
      this.tradeRepository,
      this.productRepository,
      this.userRepository,
      this.blockchainService
    );

    // Initialisation du client WhatsApp
    this.whatsAppClient = new WhatsAppBusinessClient(
      whatsappConfig.whatsappBusiness
    );

    // CORRECTION : Initialisation du contrôleur WhatsApp avec TOUTES ses dépendances
    this.whatsAppController = new WhatsAppBusinessController(
      this.registerUser,
      this.createProduct,
      this.purchaseProduct,
      this.proposeTrade, // Ajouté
      this.executeTrade, // Ajouté
      this.listProducts,
      this.userRepository,
      this.productRepository,
      this.tradeRepository, // Ajouté
      this.whatsAppClient // Ajouté
    );

    // Lier les messages entrants du client au contrôleur
    this.whatsAppClient.addMessageHandler(
      this.whatsAppController.handleMessage.bind(this.whatsAppController)
    );

    // Initialisation du serveur web
    this.expressServer = new ExpressServer(config.server.port);

    // Création et montage des routes du webhook
    const webhookRoutes = new WebhookRoutes(
      this.whatsAppClient,
      this.whatsAppController
    );
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
      // CORRECTION : La route du webhook a été supprimée d'ici car elle est gérée par WebhookRoutes
    ];

    this.expressServer.addRoutes(apiRoutes);

    console.log("✅ Application initialisée avec succès!");
  }

  async start() {
    try {
      console.log("🌟 Démarrage de l'application...");
      await this.expressServer.start();
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
process.on("SIGINT", () => app.stop());
process.on("SIGTERM", () => app.stop());

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

if (require.main === module) {
  main();
}
