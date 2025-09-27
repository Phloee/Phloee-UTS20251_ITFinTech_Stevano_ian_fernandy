import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    checkoutId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Checkout",
      required: true,
    },
    xenditInvoiceId: {
      type: String,
      required: true,
      unique: true,
    },
    externalId: {
      type: String,
      required: true,
      unique: true,
    },
    paymentUrl: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "IDR",
    },
    status: {
      type: String,
      enum: ["PENDING", "PAID", "SETTLED", "EXPIRED", "FAILED"],
      default: "PENDING",
    },
    paymentMethod: {
      type: String,
      default: "",
    },
    paidAt: {
      type: Date,
    },
    expiredAt: {
      type: Date,
      required: true,
    },
    webhookData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Payment ||
  mongoose.model("Payment", paymentSchema);
