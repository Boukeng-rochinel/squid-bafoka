const axios = require("axios");
const crypto = require("crypto");

class WhatsAppBusinessClient {
  constructor(config) {
    this.accessToken = config.accessToken;
    this.phoneNumberId = config.phoneNumberId;
    this.webhookVerifyToken = config.webhookVerifyToken;
    this.webhookSecret = config.webhookSecret;
    this.apiVersion = config.apiVersion || "v17.0";
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;

    this.messageHandlers = [];

    // Configuration des templates de messages
    this.templates = {
      welcome: "welcome_template",
      productList: "product_list_template",
      purchaseConfirmation: "purchase_confirmation_template",
    };
  }

  // Vérification de la signature webhook
//   verifyWebhookSignature(payload, signature) {
//     if (!this.webhookSecret) return true; // Si pas de secret configuré

//     const expectedSignature = crypto
//       .createHmac("sha256", this.webhookSecret)
//       .update(payload)
//       .digest("hex");

//     const providedSignature = signature.replace("sha256=", "");

//     return crypto.timingSafeEqual(
//       Buffer.from(expectedSignature),
//       Buffer.from(providedSignature)
//     );
//   }

  // Envoi de message texte simple
  async sendTextMessage(to, text) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          to: to,
          type: "text",
          text: { body: text },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error(
        "Erreur envoi message:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  // Envoi de message avec boutons interactifs
  async sendInteractiveMessage(to, text, buttons) {
    try {
      const interactive = {
        type: "button",
        body: { text: text },
        action: {
          buttons: buttons.map((btn, index) => ({
            type: "reply",
            reply: {
              id: `btn_${index}`,
              title: btn.title,
            },
          })),
        },
      };

      const response = await axios.post(
        `${this.baseUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          to: to,
          type: "interactive",
          interactive: interactive,
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error(
        "Erreur envoi message interactif:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  // Envoi de message avec liste déroulante
  async sendListMessage(to, text, sections) {
    try {
      const interactive = {
        type: "list",
        body: { text: text },
        action: {
          button: "Voir options",
          sections: sections,
        },
      };

      const response = await axios.post(
        `${this.baseUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          to: to,
          type: "interactive",
          interactive: interactive,
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error(
        "Erreur envoi liste:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  // Envoi d'image avec légende
  async sendImageMessage(to, imageUrl, caption = "") {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          to: to,
          type: "image",
          image: {
            link: imageUrl,
            caption: caption,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error(
        "Erreur envoi image:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  // Envoi de template message
  async sendTemplate(to, templateName, languageCode = "fr", parameters = []) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          to: to,
          type: "template",
          template: {
            name: templateName,
            language: { code: languageCode },
            components:
              parameters.length > 0
                ? [
                    {
                      type: "body",
                      parameters: parameters.map((param) => ({
                        type: "text",
                        text: param,
                      })),
                    },
                  ]
                : [],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error(
        "Erreur envoi template:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  // Marquer un message comme lu
  async markAsRead(messageId) {
    try {
      await axios.post(
        `${this.baseUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          status: "read",
          message_id: messageId,
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      console.error(
        "Erreur marquage lu:",
        error.response?.data || error.message
      );
    }
  }

  // Ajouter un handler pour les messages reçus
  addMessageHandler(handler) {
    this.messageHandlers.push(handler);
  }

  // Traitement des webhooks entrants
  async processWebhook(body) {
    try {
      if (body.object !== "whatsapp_business_account") {
        return;
      }

      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field === "messages") {
            await this.handleMessagesChange(change.value);
          } else if (change.field === "message_status") {
            await this.handleStatusChange(change.value);
          }
        }
      }
    } catch (error) {
      console.error("Erreur traitement webhook:", error);
    }
  }

  // Gestion des nouveaux messages
  async handleMessagesChange(value) {
    const messages = value.messages || [];

    for (const message of messages) {
      // Marquer comme lu immédiatement
      await this.markAsRead(message.id);

      // Créer un objet message standardisé
      const standardMessage = {
        id: message.id,
        from: message.from,
        timestamp: message.timestamp,
        type: message.type,
        body: this.extractMessageContent(message),
        contact: value.contacts?.find((c) => c.wa_id === message.from),
      };

      // Appeler tous les handlers
      for (const handler of this.messageHandlers) {
        try {
          await handler(standardMessage);
        } catch (error) {
          console.error("Erreur dans handler de message:", error);
        }
      }
    }
  }

  // Gestion des changements de statut
  async handleStatusChange(value) {
    const statuses = value.statuses || [];

    for (const status of statuses) {
      console.log(`Message ${status.id} - Statut: ${status.status}`);
      // Ici on peut logger ou traiter les statuts de livraison
    }
  }

  // Extraction du contenu selon le type de message
  extractMessageContent(message) {
    switch (message.type) {
      case "text":
        return message.text?.body || "";

      case "button":
        return message.button?.text || "";

      case "interactive":
        if (message.interactive?.type === "button_reply") {
          return message.interactive.button_reply.title;
        } else if (message.interactive?.type === "list_reply") {
          return message.interactive.list_reply.title;
        }
        return "";

      case "image":
        return message.image?.caption || "[Image]";

      case "document":
        return message.document?.filename || "[Document]";

      case "audio":
        return "[Audio]";

      case "video":
        return message.video?.caption || "[Video]";

      default:
        return `[${message.type}]`;
    }
  }
}


module.exports = WhatsAppBusinessClient