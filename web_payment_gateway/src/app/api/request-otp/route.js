// src/app/api/request-otp/route.js
import { NextResponse } from "next/server";
import dbConnect from "../../libs/mongodb";
import User from "../../models/User";
import { sendOtpViaFonnte } from "../../libs/fonnte";

export async function POST(request) {
  try {
    await dbConnect();
    const { nomor } = await request.json(); // format: "6281234567890"

    if (!nomor) {
      return NextResponse.json(
        { message: "Nomor diperlukan." },
        { status: 400 }
      );
    }

    // Cari user berdasarkan nomor WhatsApp
    const user = await User.findOne({ whatsapp: nomor });
    if (!user) {
      return NextResponse.json(
        { message: "Nomor tidak terdaftar." },
        { status: 404 }
      );
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 5 * 60000); // 5 menit

    // Simpan ke database
    user.loginOtp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Kirim OTP via helper Fonnte
    try {
      await sendOtpViaFonnte(nomor, otp);
    } catch (err) {
      console.error("Fonnte send error:", err);
      return NextResponse.json(
        { message: "Gagal kirim OTP." },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "OTP dikirim." }, { status: 200 });
  } catch (error) {
    console.error("Request OTP error:", error);
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}
