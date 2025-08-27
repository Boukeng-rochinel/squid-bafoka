const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // Identifiant unique de WhatsApp (numéro de téléphone)
    whatsappId: {
      type: String,
      required: true,
      unique: true,
    },
    // Nom du profil récupéré depuis WhatsApp
    profileName: {
      type: String,
      required: true,
    },
    // Nom d'affichage choisi par l'utilisateur
    displayName: {
      type: String,
    },
    // Localisation pour les trocs de proximité
    location: {
      type: String,
    },
    // État actuel de la conversation pour guider le bot
    conversationState: {
      type: String,
      default: "awaiting_name",
    },
    // Mémorise la session de navigation des articles
    browsingState: {
      items: [String], // Liste des IDs des articles consultés
      currentIndex: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true, // Ajoute automatiquement createdAt et updatedAt
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
