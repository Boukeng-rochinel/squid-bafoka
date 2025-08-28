require("dotenv").config();
const { connectDB, connectPolygon } = require("./config/database"); // Assurez-vous que le nom du fichier est correct
const config = require("./config/database");
const whatsappConfig = require("./config/whatsapp-business");

// Repositories
const MongoUserRepository = require("./infrastructure/database/mongo-user-repository");
const MongoProductRepository = require("./infrastructure/database/mongo-product-repository");
const MongoTradeRepository = require("./infrastructure/database/mongo-trade-repository");

// Infrastructure
const WhatsAppBusinessClient = require("./infrastructure/messaging/whatsapp-business-client");
const PolygonService = require("./infrastructure/blockchain/polygon-service"); // Nom de classe corrigé
const ExpressServer = require("./infrastructure/web/express-server");
const WebhookRoutes = require("./infrastructure/web/webhook-routes");

// Use Cases
const RegisterUser = require("./core/use-cases/register-user");
const CreateProduct = require("./core/use-cases/create-product");
const PurchaseProduct = require("./core/use-cases/purchase-product");
const ListProducts = require("./core/use-cases/list-products");
const ProposeTrade = require("./core/use-cases/propose-trade");
const ExecuteTrade = require("./core/use-cases/execute-trade");

// Controller
const WhatsAppBusinessController = require("./interfaces/controllers/whatsapp-business-controller");

class Application {
  async initialize() {
    console.log("🚀 Initialisation de l'application...");

    // 1. Établir les connexions externes
    await connectDB();
    const polygonProvider = await connectPolygon();

    // 2. Initialiser les repositories (en utilisant le pattern Mongoose)
    // CORRECTION: Assigner à 'this.' pour les rendre accessibles dans la classe
    this.userRepository = new MongoUserRepository();
    this.productRepository = new MongoProductRepository();
    this.tradeRepository = new MongoTradeRepository();

    // 3. Initialiser le service blockchain
    // CORRECTION: Assigner à 'this.'
    this.blockchainService = new PolygonService(polygonProvider);

    // 4. Initialiser les cas d'utilisation en utilisant les propriétés de la classe
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

    // 5. Initialiser le client WhatsApp
    this.whatsAppClient = new WhatsAppBusinessClient(
      whatsappConfig.whatsappBusiness
    );

    // 6. Initialiser le contrôleur avec TOUTES ses dépendances
    this.whatsAppController = new WhatsAppBusinessController(
      this.registerUser,
      this.createProduct,
      this.purchaseProduct,
      this.proposeTrade,
      this.executeTrade,
      this.listProducts,
      this.userRepository,
      this.productRepository,
      this.tradeRepository,
      this.whatsAppClient
    );

    // 7. Lier les messages entrants du client au contrôleur
    this.whatsAppClient.addMessageHandler(
      this.whatsAppController.handleMessage.bind(this.whatsAppController)
    );

    // 8. Initialiser le serveur web et les routes

    this.expressServer = new ExpressServer(5000);
    const webhookRoutes = new WebhookRoutes(
      this.whatsAppClient,
      this.whatsAppController
    );
    this.expressServer.setupRoutes(webhookRoutes.getRouter());

    // Ajout des routes API optionnelles
    const apiRoutes = [
      {
        method: "get",
        path: "/api/health",
        handler: (req, res) => res.json({ status: "OK" }),
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
