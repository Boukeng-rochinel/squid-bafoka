// Importer les dépendances
const express = require("express");
const bodyParser = require("body-parser");
const Home = require("./Routes/homeRoutes");
const whatsappRoutes = require("./Routes/whatsappRoutes");
const connectDB = require("./config/database");
require("dotenv").config(); // Charger les variables d'environnement

const app = express();

connectDB();
// Importer la logique de l'application depuis app.js (pour une meilleure structure)
app.use(express.json());

// Définir le port
const PORT = process.env.PORT || 3000;

app.use("/", Home);
app.use("/webhook", whatsappRoutes);

// Lancer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Le serveur est lancé sur le port ${PORT}`);
});
