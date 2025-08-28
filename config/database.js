// const mongoose = require("mongoose");
// require("dotenv").config();

// const MONGODB_URI = process.env.MONGODB_URI;

// const connectDB = async () => {
//   try {
//     await mongoose.connect(MONGODB_URI);
//     console.log("✅ Connexion à MongoDB réussie !");
//   } catch (error) {
//     console.error("❌ Erreur de connexion à MongoDB :", error.message);
//     // Quitter le processus avec une erreur
//     process.exit(1);
//   }
// };

// module.exports = connectDB;

module.exports = {
  mongodb: {
    connectionString:
      process.env.MONGODB_CONNECTION || "mongodb://localhost:27017",
    dbName: process.env.DB_NAME || "marketplace_blockchain",
  },
  blockchain: {
    providerUrl:
      process.env.BLOCKCHAIN_PROVIDER_URL ||
      "https://mainnet.infura.io/v3/YOUR_PROJECT_ID",
    chainId: parseInt(process.env.CHAIN_ID) || 1,
  },
  server: {
    port: parseInt(process.env.PORT) || 3000,
  },
};
