// src/app/libs/fonnte.js
export async function sendOtpViaFonnte(phone, otp) {
  const token = process.env.FONNTE_API_KEY;
  if (!token) {
    throw new Error("FONNTE_API_KEY tidak ditemukan");
  }

  const cleanPhone = phone.replace(/\+/g, "").replace(/^0/, "62");
  const message = `Kode OTP Anda: ${otp}. Jangan berikan ke siapa pun.`;

  console.log("📞 Mencoba kirim OTP ke:", cleanPhone);
  console.log("🔑 Token (awal):", token.substring(0, 5) + "...");

  try {
    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: token,
      },
      body: new URLSearchParams({
        target: cleanPhone,
        message: message,
      }),
    });

    const result = await response.text(); // ← Baca sebagai teks dulu
    console.log("📡 Respons Fonnte (raw):", result);

    // Coba parse sebagai JSON
    let json;
    try {
      json = JSON.parse(result);
    } catch {
      json = { raw: result };
    }

    if (!response.ok) {
      console.error("❌ Fonnte gagal:", json);
      throw new Error("Fonnte: " + (json.message || "Unknown error"));
    }

    console.log("✅ OTP terkirim via Fonnte!");
    return json;
  } catch (error) {
    console.error("💥 Error kirim OTP:", error.message);
    throw error;
  }
}
