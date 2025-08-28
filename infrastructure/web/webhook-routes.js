const express = require("express");
const crypto = require("crypto");
// Use destructuring to get the nested object directly
const { whatsappBusiness } = require("../../config/whatsapp-business");

class WebhookRoutes {
  constructor(whatsAppClient, whatsAppController) {
    // Corrected constructor parameter names
    this.router = express.Router();
    this.whatsAppClient = whatsAppClient;
    this.whatsAppController = whatsAppController;
    this.setupRoutes();
  }

  setupRoutes() {
    // Vérification du webhook (GET)
    this.router.get("/webhook/whatsapp", (req, res) => {
      const mode = req.query["hub.mode"];
      const token = req.query["hub.verify_token"];
      const challenge = req.query["hub.challenge"];

      // Now this path is correct and much cleaner
      if (
        mode === "subscribe" &&
        token === whatsappBusiness.webhookVerifyToken
      ) {
        console.log("✅ Webhook vérifié avec succès");
        res.status(200).send(challenge);
      } else {
        console.log("❌ Échec de la vérification du webhook");
        console.log("Token attendu:", whatsappBusiness.webhookVerifyToken);
        console.log("Token reçu:", token);
        res.status(403).send("Forbidden");
      }
    });

    // ... (le reste de votre fichier reste inchangé) ...
    // Réception des webhooks (POST)
    this.router.post(
      "/webhook/whatsapp",
      express.raw({ type: "application/json" }),
      async (req, res) => {
        try {
          const signature = req.get("X-Hub-Signature-256");
          const payload = req.body;

          if (!this.whatsAppClient.verifyWebhookSignature(payload, signature)) {
            console.log("❌ Signature webhook invalide");
            return res.status(403).send("Forbidden");
          }

          const body = JSON.parse(payload.toString());
          await this.whatsAppClient.processWebhook(body);
          res.status(200).send("OK");
        } catch (error) {
          console.error("Erreur traitement webhook:", error);
          res.status(500).send("Internal Server Error");
        }
      }
    );

    // Route de test (développement)
    this.router.post("/webhook/test", express.json(), async (req, res) => {
      try {
        const { phoneNumber, message } = req.body;
        const mockMessage = {
          id: "test_" + Date.now(),
          from: phoneNumber,
          timestamp: Date.now(),
          type: "text",
          body: message,
          contact: { name: "Test User" },
        };
        await this.whatsAppController.handleMessage(mockMessage);
        res.json({ success: true, message: "Message traité" });
      } catch (error) {
        console.error("Erreur test webhook:", error);
        res.status(500).json({ error: error.message });
      }
    });
  }

  getRouter() {
    return this.router;
  }
}

module.exports = WebhookRoutes;
