const express = require("express");
const crypto = require("crypto");
const whatsappBusiness = require("../../config/whatsapp-business");

class WebhookRoutes {
  constructor(WhatsAppBusinessClient, WhatsAppBusinessController) {
    this.router = express.Router();
    this.whatsAppClient = WhatsAppBusinessClient;
    this.whatsAppController = WhatsAppBusinessController;
    this.setupRoutes();
  }

  setupRoutes() {
    // Vérification du webhook (GET)
    this.router.get("/webhook/whatsapp", (req, res) => {
      const mode = req.query["hub.mode"];
      const token = req.query["hub.verify_token"];
      const challenge = req.query["hub.challenge"];
      console.log(`${whatsappBusiness.WEBHOOK_VERIFY_TOKEN}`);
      if (
        mode === "subscribe" &&
        token === whatsappBusiness.WEBHOOK_VERIFY_TOKEN
      ) {
        console.log("✅ Webhook vérifié avec succès");
        res.status(200).send(challenge);
      } else {
        console.log("❌ Échec de la vérification du webhook");
        res.status(403).send("Forbidden");
      }
    });

    // Réception des webhooks (POST)
    this.router.post(
      "/webhook/whatsapp",
      express.raw({ type: "application/json" }),
      async (req, res) => {
        try {
          const signature = req.get("X-Hub-Signature-256");
          const payload = req.body;

          // Vérifier la signature
          if (!this.whatsAppClient.verifyWebhookSignature(payload, signature)) {
            console.log("❌ Signature webhook invalide");
            return res.status(403).send("Forbidden");
          }

          // Parser le JSON
          const body = JSON.parse(payload.toString());

          // Traiter le webhook
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

        // Simuler un message reçu
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
