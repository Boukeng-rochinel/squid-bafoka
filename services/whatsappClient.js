const axios = require("axios");

const { WHATSAPP_API_TOKEN, WHATSAPP_PHONE_NUMBER_ID } = process.env;

if (!WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
  throw new Error(
    "Les variables d'environnement WhatsApp (token ou ID) ne sont pas définies !"
  );
}

/**
 * Envoie un message texte via l'API WhatsApp Cloud.
 * @param {string} to - Le numéro du destinataire.
 * @param {string} text - Le message à envoyer.
 */
async function sendMessage(to, text) {
  try {
    await axios.post(
      `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: to,
        text: { body: text },
      },
      {
        headers: { Authorization: `Bearer ${WHATSAPP_API_TOKEN}` },
      }
    );
    console.log(`-> Message envoyé avec succès à ${to}`);
  } catch (error) {
    console.error(
      "Erreur Client API:",
      error.response ? error.response.data : error.message
    );
  }
}

module.exports = { sendMessage };
