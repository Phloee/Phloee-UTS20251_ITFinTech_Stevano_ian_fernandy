import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "../../libs/mongodb";
import User from "../../models/User";
import { sendOtpViaFonnte } from "../../libs/fonnte";

// POST /api/login
export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { email, password } = body || {};

    if (!email) {
      return NextResponse.json(
        { message: "Email harus diisi." },
        { status: 400 }
      );
    }

    // password field is stored with select: false in the schema, so include it explicitly
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return NextResponse.json(
        { message: "User tidak ditemukan." },
        { status: 404 }
      );
    }

    // Jika password diberikan (login awal / cek ulang), periksa password
    if (password) {
      const match = await bcrypt.compare(password, user.password || "");
      if (!match) {
        return NextResponse.json(
          { message: "Email atau password salah." },
          { status: 401 }
        );
      }
    }

    // Jika user memiliki MFA (mis. WhatsApp), buat OTP dan simpan ke DB
    if (user.mfaEnabled) {
      const otp = Math.floor(100000 + Math.random() * 900000); // 6 digit
      const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 menit

      user.loginOtp = String(otp);
      user.otpExpires = expires;
      user.mfaVerified = false;
      await user.save();

      // Kirim OTP via Fonnte (WhatsApp/SMS)
      try {
        const phone = user.whatsapp || user.phone || null;
        if (!phone) {
          console.warn("User has MFA enabled but no phone number stored.");
        } else {
          await sendOtpViaFonnte(phone, String(otp));
        }
      } catch (err) {
        console.error("Gagal mengirim OTP via Fonnte:", err);
        // tetap return requiresMfa agar client bisa tampilkan step OTP,
        // tapi informasikan kalau pengiriman gagal
        return NextResponse.json(
          { requiresMfa: true, message: "OTP dibuat, tetapi gagal dikirim." },
          { status: 200 }
        );
      }

      console.log(`OTP for ${user.email}: ${otp} (expires ${expires})`);

      return NextResponse.json(
        { requiresMfa: true, message: "OTP telah dikirim." },
        { status: 200 }
      );
    }

    // Jika tidak ada MFA, kembalikan data user untuk session
    return NextResponse.json(
      {
        success: true,
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
    console.error("Login error:", error);
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}
