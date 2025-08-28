const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    buyerId: { type: String, required: true },
    sellerId: { type: String, required: true },
    productId: { type: String, required: true },
    amount: { type: Number, required: true },
    txHash: { type: String },
    status: { type: String, default: "confirmed" },
  },
  { timestamps: true }
);

const Transaction = mongoose.model("Transaction", transactionSchema);
module.exports = Transaction;
