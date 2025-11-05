// src/app/models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    whatsapp: { type: String, required: false },
    mfaEnabled: { type: Boolean, default: false },
    mfaVerified: { type: Boolean, default: false },
    loginOtp: { type: String, select: false, default: null }, // ← Tambahkan default: null
    otpExpires: { type: Date, select: false, default: null }, // ← Tambahkan default: null
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  {
    timestamps: true,
    strict: true, // Pastikan hanya field yang ada di schema yang bisa disimpan
  }
);

// ✅ FORCE RELOAD: Hapus model lama dari cache
if (mongoose.models.User) {
  delete mongoose.models.User;
}

// ✅ Buat model baru dengan schema yang fresh
const User = mongoose.model("User", UserSchema);

export default User;
