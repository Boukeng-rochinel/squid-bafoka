// Importer les dépendances
const express = require("express");
const bodyParser = require("body-parser");
require("dotenv").config(); // Charger les variables d'environnement

// Importer la logique de l'application depuis app.js (pour une meilleure structure)
const app = require("./app");

// Définir le port
const PORT = process.env.PORT || 3000;

app.use("/", Home)

// Lancer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Le serveur est lancé sur le port ${PORT}`);
});
