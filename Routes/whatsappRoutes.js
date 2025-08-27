const express = require("express");
const router = express.Router();
const {
  verifyWebhook,
  processMessage,
} = require("../Controllers/whatsappController");

// Route pour la vérification du webhook par Meta
router.get("/webhook", verifyWebhook);

// Route pour recevoir les messages des utilisateurs
router.post("/webhook", processMessage);

module.exports = router;
