// src/app/api/register/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "../../libs/mongodb"; // Sesuaikan path
import User from "../../models/User"; // Sesuaikan path ke model

export async function POST(request) {
  try {
    await dbConnect();
    const { name, email, password, whatsapp } = await request.json();

    const userExists = await User.findOne({ email });
    if (userExists) {
      return NextResponse.json(
        { message: "Email sudah terdaftar." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      whatsapp: whatsapp || undefined,
      mfaEnabled: !!whatsapp, // Aktifkan MFA jika WhatsApp disediakan
    });

    return NextResponse.json(
      { message: "User berhasil dibuat." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}
