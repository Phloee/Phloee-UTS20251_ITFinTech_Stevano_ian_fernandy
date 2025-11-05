// src/app/api/request-otp/route.js
import { NextResponse } from "next/server";
import dbConnect from "../../libs/mongodb";
import User from "../../models/User";
import { sendOtpViaFonnte } from "../../libs/fonnte";

export async function POST(request) {
  try {
    await dbConnect();
    const { nomor, email } = await request.json();

    console.log("=== REQUEST OTP START ===");
    console.log("📥 Input - Nomor:", nomor);
    console.log("📥 Input - Email:", email);

    if (!nomor && !email) {
      return NextResponse.json(
        { message: "Nomor WhatsApp atau Email diperlukan." },
        { status: 400 }
      );
    }

    // Cari user - PENTING: Jangan pakai .select() saat mencari
    let user;
    let searchBy = "";

    if (email) {
      // PRIORITAS: Cari pakai EMAIL dulu jika ada
      user = await User.findOne({ email });
      searchBy = "email";
      console.log("🔍 Mencari user dengan EMAIL:", email);
    } else if (nomor) {
      // Jika tidak ada email, baru cari pakai nomor
      user = await User.findOne({ whatsapp: nomor });
      searchBy = "nomor";
      console.log("🔍 Mencari user dengan NOMOR:", nomor);
    }

    if (!user) {
      console.log("❌ User tidak terdaftar (search by:", searchBy + ")");
      return NextResponse.json(
        { message: "User tidak terdaftar." },
        { status: 404 }
      );
    }

    console.log("✅ User ditemukan!");
    console.log("  🆔 User ID:", user._id.toString());
    console.log("  📧 Email:", user.email);
    console.log("  📱 WhatsApp:", user.whatsapp || "(tidak ada)");
    console.log("  🔍 Found by:", searchBy);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 5 * 60000); // 5 menit

    console.log("🔑 OTP yang dibuat:", otp);
    console.log("⏰ OTP expires:", otpExpires);

    // CRITICAL: Simpan OTP ke user yang SAMA
    try {
      console.log("💾 Menyimpan OTP ke user ID:", user._id.toString());

      const updatedUser = await User.findByIdAndUpdate(
        user._id, // ← PASTIKAN INI USER YANG BENAR!
        {
          $set: {
            loginOtp: otp,
            otpExpires: otpExpires,
          },
        },
        { new: true }
      );

      console.log("✅ OTP berhasil disimpan ke database");
      console.log("🔍 Updated User ID:", updatedUser._id.toString());

      // Verifikasi apakah OTP benar-benar tersimpan
      const verifyUser = await User.findById(user._id).select(
        "+loginOtp +otpExpires"
      );
      console.log("🔍 Verifikasi - User ID:", verifyUser._id.toString());
      console.log("🔍 Verifikasi - Email:", verifyUser.email);
      console.log("🔍 Verifikasi - OTP tersimpan:", verifyUser.loginOtp);
      console.log("🔍 Verifikasi - Expires:", verifyUser.otpExpires);

      if (!verifyUser.loginOtp) {
        throw new Error("OTP tidak tersimpan meskipun update berhasil!");
      }
    } catch (saveError) {
      console.error("❌ Error saat menyimpan OTP:", saveError);
      return NextResponse.json(
        { message: "Gagal menyimpan OTP: " + saveError.message },
        { status: 500 }
      );
    }

    // Mode Development: Skip Fonnte jika ada masalah
    const isDevelopment = process.env.NODE_ENV === "development";
    const skipFonnte = process.env.SKIP_FONNTE === "true";

    if (skipFonnte && isDevelopment) {
      console.log("⚠️ DEVELOPMENT MODE: OTP tidak dikirim via Fonnte");
      console.log("🔑 OTP untuk testing:", otp);
      console.log("=== REQUEST OTP SUCCESS (DEV MODE) ===");
      return NextResponse.json(
        {
          message: "OTP berhasil dibuat (dev mode).",
          devOtp: otp,
          expiresAt: otpExpires,
          userId: user._id.toString(), // Return user ID untuk debug
        },
        { status: 200 }
      );
    }

    // Kirim OTP via Fonnte
    const targetNumber = user.whatsapp; // GUNAKAN NOMOR DARI USER, BUKAN INPUT!
    if (targetNumber) {
      try {
        await sendOtpViaFonnte(targetNumber, otp);
        console.log("✅ OTP berhasil dikirim ke WhatsApp:", targetNumber);
        console.log("=== REQUEST OTP SUCCESS ===");
        return NextResponse.json(
          {
            message: "OTP dikirim ke WhatsApp.",
            userId: user._id.toString(), // Return user ID untuk debug
          },
          { status: 200 }
        );
      } catch (err) {
        console.error("❌ Fonnte send error:", err);

        if (isDevelopment) {
          console.log("⚠️ Fonnte gagal, tapi OTP tersimpan di DB");
          console.log("🔑 OTP untuk testing:", otp);
          return NextResponse.json(
            {
              message:
                "OTP gagal dikirim, tapi tersimpan di server (dev mode).",
              devOtp: otp,
              error: err.message,
              userId: user._id.toString(),
            },
            { status: 200 }
          );
        }

        return NextResponse.json(
          { message: "Gagal kirim OTP ke WhatsApp: " + err.message },
          { status: 500 }
        );
      }
    } else {
      console.log("⚠️ User tidak ada nomor WhatsApp!");
      console.log("🔑 OTP untuk testing:", otp);
      return NextResponse.json(
        {
          message: "OTP berhasil dibuat. Gunakan OTP untuk verifikasi.",
          devOtp: isDevelopment ? otp : undefined,
          userId: user._id.toString(),
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("❌ Request OTP error:", error);
    return NextResponse.json(
      { message: "Server error: " + error.message },
      { status: 500 }
    );
  }
}
