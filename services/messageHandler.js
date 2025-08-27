const { sendMessage } = require("../Controllers/whatsappController");
const Item = require("../models/itemModel");

async function sendMainMenu(to) {
  const menuText = `Que souhaitez-vous faire ?\n\n1. 📦 Proposer un article\n2. 🔍 Voir les articles\n3. 📊 Gérer mes trocs`;
  await sendMessage(to, menuText);
}

async function displayItem(to, item) {
  if (!item) {
    await sendMessage(to, "Il n'y a plus d'articles à afficher.");
    return;
  }

  const itemDetails = `*Article :* ${item.title}\n*Description :* ${item.description}\n*Recherche en échange :* ${item.seeking}\n\n---\n*Répondez avec :*\n*A.* Proposer un échange\n*B.* Article suivant`;
  await sendMessage(to, itemDetails);
}

async function handleMessage(user, messageText) {
  if (user.conversationState === "browsing_items") {
    if (messageText.toLowerCase() === "b") {
      user.browsingState.currentIndex += 1;
      const nextItemId =
        user.browsingState.items[user.browsingState.currentIndex];

      if (nextItemId) {
        const nextItem = await Item.findById(nextItemId);
        await displayItem(user.whatsappId, nextItem);
      } else {
        await sendMessage(
          user.whatsappId,
          "Vous avez vu tous les articles. Retour au menu principal."
        );
        user.conversationState = "main_menu";
      }
      await user.save();
      return;
    }
  }

  switch (user.conversationState) {
    case "awaiting_name":
      user.displayName = messageText;
      user.conversationState = "awaiting_location";
      await user.save();
      await sendMessage(
        user.whatsappId,
        `Merci, ${user.displayName} ! Dans quelle ville ou quartier habitez-vous ?`
      );
      break;

    case "awaiting_location":
      user.location = messageText;
      user.conversationState = "main_menu";
      await user.save();
      await sendMessage(
        user.whatsappId,
        `Parfait ! Votre profil est complet. Bienvenue à bord !`
      );
      await sendMainMenu(user.whatsappId);
      break;

    case "main_menu":
      if (messageText === "2") {
        const items = await Item.find({ ownerId: { $ne: user._id } })
          .sort({ createdAt: -1 })
          .limit(10);
        if (items.length === 0) {
          await sendMessage(
            user.whatsappId,
            "Désolé, il n'y a aucun article à troquer pour le moment."
          );
          return;
        }
        user.conversationState = "browsing_items";
        user.browsingState.items = items.map((item) => item._id);
        user.browsingState.currentIndex = 0;
        await user.save();
        await displayItem(user.whatsappId, items[0]);
      } else if (messageText.toLowerCase() === "menu") {
        await sendMainMenu(user.whatsappId);
      } else {
        await sendMessage(
          user.whatsappId,
          "Commande non reconnue. Envoyez 'Menu' pour voir les options."
        );
      }
      break;

    default:
      await sendMainMenu(user.whatsappId);
      break;
  }
}

async function handleNewUser(user) {
  const welcomeText = `Bienvenue sur TrocSwap ! 🤝\n\nPour commencer, quel est le nom ou le pseudo que vous souhaitez utiliser ?`;
  await sendMessage(user.whatsappId, welcomeText);
}

module.exports = { handleMessage, handleNewUser };
