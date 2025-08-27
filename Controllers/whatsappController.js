// Le token de vérification que vous définirez dans votre interface Meta for Developers
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

// Contrôleur pour la vérification du Webhook
const verifyWebhook = (req, res) => {
  // Extraire les paramètres de la requête
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  // Vérifier si le mode et le token sont présents
  if (mode && token) {
    // Vérifier si le mode est 'subscribe' et si le token correspond
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      // Si ça ne correspond pas, refuser la requête
      res.sendStatus(403);
    }
  }
};

// Contrôleur pour traiter les messages entrants
const processMessage = (req, res) => {
  let body = req.body;

  console.log(JSON.stringify(body, null, 2)); // Affiche le message reçu

  // TODO: Implémenter la logique de traitement du message ici
  // (ex: extraire le numéro de l'expéditeur, le contenu du message, etc.)

  res.sendStatus(200); // Répondre à WhatsApp que le message a été reçu
};

module.exports = {
  verifyWebhook,
  processMessage,
};
