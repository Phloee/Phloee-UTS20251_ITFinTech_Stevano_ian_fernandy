// src/app/models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    password: { type: String, required: true, select: false },
    whatsapp: { type: String, required: false },
    mfaEnabled: { type: Boolean, default: false },
    mfaVerified: { type: Boolean, default: false },
    loginOtp: { type: String, select: false },
    otpExpires: { type: Date, select: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);

// Gunakan model yang sudah ada atau buat baru
const User = mongoose.models.User || mongoose.model("User", UserSchema);
export default User;
