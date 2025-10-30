// src/app/api/verify-otp/route.js
import { NextResponse } from "next/server";
import dbConnect from "../../libs/mongodb";
import User from "../../models/User";

export async function POST(request) {
  try {
    await dbConnect();
    const { email, nomor, otp } = await request.json();

    console.log("=== VERIFY OTP START ===");
    console.log("Email:", email);
    console.log("Nomor:", nomor);
    console.log("OTP diterima:", otp);

    // ✅ Validasi input - harus ada email ATAU nomor
    if ((!email && !nomor) || !otp) {
      return NextResponse.json(
        { message: "Email/Nomor dan OTP harus diisi." },
        { status: 400 }
      );
    }

    // ✅ Cari user berdasarkan email ATAU nomor WhatsApp
    // NOTE: `loginOtp` and `otpExpires` are defined with select: false in the schema,
    // so we must explicitly include them when querying.
    let user;
    if (email) {
      user = await User.findOne({ email }).select("+loginOtp +otpExpires");
      console.log("Mencari user dengan email:", email);
    } else if (nomor) {
      user = await User.findOne({ whatsapp: nomor }).select(
        "+loginOtp +otpExpires"
      );
      console.log("Mencari user dengan nomor:", nomor);
    }

    if (!user) {
      console.log("❌ User tidak ditemukan");
      return NextResponse.json(
        { message: "User tidak ditemukan." },
        { status: 404 }
      );
    }

    console.log("✅ User ditemukan:", user.name);
    console.log("OTP tersimpan di DB:", user.loginOtp);
    console.log("OTP expires:", user.otpExpires);
    console.log("Waktu sekarang:", new Date());

    // ✅ Cek apakah OTP ada di database
    if (!user.loginOtp || !user.otpExpires) {
      console.log("❌ OTP tidak ditemukan atau sudah expired di database");
      return NextResponse.json(
        { message: "OTP tidak ditemukan. Silakan login ulang." },
        { status: 400 }
      );
    }

    // ✅ Cek apakah OTP sudah expired
    if (new Date() > new Date(user.otpExpires)) {
      console.log("❌ OTP sudah expired");
      // Hapus OTP yang expired
      user.loginOtp = undefined;
      user.otpExpires = undefined;
      await user.save();

      return NextResponse.json(
        { message: "OTP sudah kadaluarsa. Silakan login ulang." },
        { status: 400 }
      );
    }

    // ✅ Bandingkan OTP (konversi ke string untuk keamanan)
    const storedOtp = String(user.loginOtp).trim();
    const receivedOtp = String(otp).trim();

    console.log("Membandingkan OTP:");
    console.log("  Tersimpan:", storedOtp);
    console.log("  Diterima :", receivedOtp);
    console.log("  Match?   :", storedOtp === receivedOtp);

    if (storedOtp !== receivedOtp) {
      console.log("❌ OTP tidak cocok");
      return NextResponse.json(
        { message: "Kode OTP salah. Silakan coba lagi." },
        { status: 400 }
      );
    }

    // ✅ OTP benar! Hapus OTP dari database
    console.log("✅ OTP cocok! Verifikasi berhasil");
    user.loginOtp = undefined;
    user.otpExpires = undefined;

    // ✅ Update mfaVerified jika MFA enabled
    if (user.mfaEnabled) {
      user.mfaVerified = true;
    }

    await user.save();

    console.log("=== VERIFY OTP SUCCESS ===");

    // ✅ Return data user untuk session
    return NextResponse.json(
      {
        success: true,
        message: "Login berhasil!",
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          whatsapp: user.whatsapp,
          role: user.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Verify OTP error:", error);
    return NextResponse.json(
      { message: "Server error: " + error.message },
      { status: 500 }
    );
  }
}
