const User = require("../models/userModel");
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

// --- Fonctions d'Envoi de Messages (à remplacer par de vrais appels API Meta) ---

// Fonction générique pour envoyer un message texte
async function sendMessage(to, text) {
  // TODO: Remplacez cette partie par un véritable appel à l'API WhatsApp Cloud
  // Exemple avec axios:
  await axios.post('https://graph.facebook.com/v19.0/VOTRE_ID_TELEPHONE/messages', {
    messaging_product: 'whatsapp',
    to: to,
    text: { body: text }
  }, { headers: { 'Authorization': `Bearer VOTRE_TOKEN_PERMANENT` } });

  console.log(`-> Message envoyé à ${to}: "${text}"`);
}

// Fonction pour envoyer le menu principal
async function sendMainMenu(to) {
  const menuText = `
Que souhaitez-vous faire ? Répondez avec le numéro correspondant :

1. 📦 Proposer un article à troquer
2. 🔍 Voir les articles disponibles
3. 📊 Gérer mes trocs
4. ❓ Comment ça marche ?
  `;
  await sendMessage(to, menuText);
}

// --- Contrôleurs de Webhook ---

// Vérification du webhook (requête GET de Meta)
const verifyWebhook = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    if (mode === "subscribe") {
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(403);
  }
};

// Traitement des messages entrants (requête POST de Meta)
const processMessage = async (req, res) => {
  try {
    const body = req.body;

    if (body.object !== "whatsapp_business_account") {
      return res.sendStatus(404);
    }

    const message = body.entry[0].changes[0].value.messages[0];
    const contact = body.entry[0].changes[0].value.contacts[0];
    const userWhatsappId = message.from;
    const userText = message.text ? message.text.body : "";

    let user = await User.findOne({ whatsappId: userWhatsappId });

    if (!user) {
      user = new User({
        whatsappId: userWhatsappId,
        profileName: contact.profile.name,
        conversationState: "awaiting_name",
      });
      await user.save();

      const welcomeText = `Bienvenue sur TrocSwap ! 🤝\n\nPour commencer, quel est le nom ou le pseudo que vous souhaitez utiliser ?`;
      await sendMessage(user.whatsappId, welcomeText);
    } else {
      switch (user.conversationState) {
        case "awaiting_name":
          user.displayName = userText;
          user.conversationState = "awaiting_location";
          await user.save();
          await sendMessage(
            user.whatsappId,
            `Merci, ${user.displayName} ! Dans quelle ville ou quartier habitez-vous ?`
          );
          break;

        case "awaiting_location":
          user.location = userText;
          user.conversationState = "main_menu";
          await user.save();
          await sendMessage(
            user.whatsappId,
            `Parfait ! Votre profil est complet. Bienvenue à bord !`
          );
          await sendMainMenu(user.whatsappId);
          break;

        case "main_menu":
          // Gérer les options du menu
          if (userText === "1") {
            await sendMessage(
              user.whatsappId,
              "Vous avez choisi de proposer un article. Commençons..."
            );
            // TODO: Changer l'état pour `awaiting_item_title` et commencer le flux de création d'article.
          } else if (userText.toLowerCase() === "menu") {
            await sendMainMenu(user.whatsappId);
          } else {
            await sendMessage(
              user.whatsappId,
              "Commande non reconnue. Envoyez 'Menu' pour voir les options."
            );
          }
          break;
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Erreur lors du traitement du message:", error);
    res.sendStatus(500);
  }
};

module.exports = { verifyWebhook, processMessage };
