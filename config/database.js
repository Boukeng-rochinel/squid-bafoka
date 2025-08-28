const mongoose = require("mongoose");
const { ethers } = require("ethers");

const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error(
        "La variable d'environnement MONGODB_URI n'est pas définie."
      );
    }

    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connexion à MongoDB réussie !");
  } catch (error) {
    console.error("❌ Erreur de connexion à MongoDB :", error.message);
    process.exit(1);
  }
};

const connectPolygon = async () => {
  try {
    const POLYGON_PROVIDER_URL = process.env.BLOCKCHAIN_PROVIDER_URL;
    if (!POLYGON_PROVIDER_URL) {
      throw new Error(
        "La variable d'environnement BLOCKCHAIN_PROVIDER_URL n'est pas définie."
      );
    }

    const provider = new ethers.JsonRpcProvider(POLYGON_PROVIDER_URL);
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();

    console.log(
      `✅ Connexion à Polygon réussie ! (Réseau: ${network.name}, Dernier bloc: ${blockNumber})`
    );

    return provider;
  } catch (error) {
    console.error("❌ Erreur de connexion à Polygon :", error.message);
    process.exit(1);
  }
};

// Export only the connection functions
module.exports = { connectDB, connectPolygon };
