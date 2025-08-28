const mongoose = require("mongoose");

const authChallengeSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    challenge: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, index: { expires: "5m" } }, // Auto-expire after 5 mins
  },
  { timestamps: true }
);

const AuthChallenge = mongoose.model("AuthChallenge", authChallengeSchema);
module.exports = AuthChallenge;
