const User = require("../models/user.model.js");
const messageHandler = require("../services/messageHandler.js");
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

const verifyWebhook = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
};

const processMessage = async (req, res) => {
  try {
    const body = req.body;
    if (
      body.object !== "whatsapp_business_account" ||
      !body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
    ) {
      return res.sendStatus(404);
    }

    const value = body.entry[0].changes[0].value;
    const message = value.messages[0];
    const contact = value.contacts[0];
    const userText = message.text ? message.text.body : "";

    let user = await User.findOne({ whatsappId: message.from });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = new User({
        whatsappId: message.from,
        profileName: contact.profile.name,
        conversationState: "awaiting_name",
      });
      await user.save();
    }

    if (isNewUser) {
      await messageHandler.handleNewUser(user);
    } else {
      await messageHandler.handleMessage(user, userText);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Erreur racine dans processMessage:", error);
    res.sendStatus(500);
  }
};

module.exports = { verifyWebhook, processMessage };
