module.exports = {
  whatsappBusiness: {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    webhookVerifyToken: process.env.WEBHOOK_VERIFY_TOKEN,
    webhookSecret: process.env.WEBHOOK_SECRET,
    apiVersion: process.env.WHATSAPP_API_VERSION || "v17.0",
  },
  webhook: {
    port: process.env.WEBHOOK_PORT || 3000,
    path: "/webhook/whatsapp",
  },
};
