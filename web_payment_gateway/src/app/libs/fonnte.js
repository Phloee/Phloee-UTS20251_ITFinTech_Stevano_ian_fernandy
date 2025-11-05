// src/app/libs/fonnte.js

/**
 * Send OTP via Fonnte (Short message - always works)
 */
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
    // Tambahkan timeout untuk prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 detik timeout

    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: token,
      },
      body: new URLSearchParams({
        target: cleanPhone,
        message: message,
        countryCode: "62",
      }),
      signal: controller.signal, // Tambahkan abort signal
    });

    clearTimeout(timeoutId);

    const result = await response.text();
    console.log("📡 Respons Fonnte (raw):", result);

    // Check if response is HTML error (502, 504, etc)
    if (
      result.includes("<html>") ||
      result.includes("Bad Gateway") ||
      result.includes("Gateway Time-out")
    ) {
      console.error("❌ Fonnte server error (502/504)");
      throw new Error(
        "Fonnte server sedang bermasalah, coba lagi dalam beberapa menit"
      );
    }

    let json;
    try {
      json = JSON.parse(result);
    } catch (parseError) {
      console.error("❌ Response bukan JSON:", result.substring(0, 100));
      throw new Error("Fonnte response tidak valid");
    }

    // Check Fonnte API status
    if (json.status === false || json.status === "false") {
      console.error("❌ Fonnte API error:", json);
      throw new Error(json.reason || json.message || "Gagal kirim OTP");
    }

    if (!response.ok) {
      console.error("❌ HTTP error:", response.status);
      throw new Error("Fonnte HTTP error: " + response.status);
    }

    console.log("✅ OTP terkirim via Fonnte!");
    return json;
  } catch (error) {
    // Handle timeout error
    if (error.name === "AbortError") {
      console.error("⏰ Request timeout after 30s");
      throw new Error(
        "Timeout: Tidak dapat terhubung ke Fonnte. Periksa koneksi internet atau coba lagi."
      );
    }

    // Handle fetch failed error
    if (
      error.message === "fetch failed" ||
      error.cause?.code === "UND_ERR_CONNECT_TIMEOUT"
    ) {
      console.error("🌐 Network error:", error.message);
      throw new Error(
        "Tidak dapat terhubung ke Fonnte API. Periksa koneksi internet Anda atau coba lagi nanti."
      );
    }

    console.error("💥 Error kirim OTP:", error.message);
    throw error;
  }
}

/**
 * Send notification via Fonnte (Long message with retry & timeout handling)
 */
export async function sendNotificationViaFonnte(phone, message) {
  const token = process.env.FONNTE_API_KEY;
  if (!token) {
    throw new Error("FONNTE_API_KEY tidak ditemukan");
  }

  const cleanPhone = phone.replace(/\+/g, "").replace(/^0/, "62");

  console.log("📞 Sending notification to:", cleanPhone);
  console.log("🔑 Token:", token.substring(0, 5) + "...");
  console.log("💬 Message length:", message.length, "chars");

  try {
    // Set timeout untuk prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 detik timeout

    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: token,
      },
      body: new URLSearchParams({
        target: cleanPhone,
        message: message,
        countryCode: "62",
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const result = await response.text();
    console.log("📡 Fonnte Response Status:", response.status);
    console.log("📡 Fonnte Response:", result.substring(0, 200));

    // Check for HTML errors
    if (
      result.includes("<html>") ||
      result.includes("Bad Gateway") ||
      result.includes("Gateway Time-out")
    ) {
      throw new Error("Fonnte server error - coba lagi nanti");
    }

    // Parse JSON
    let json;
    try {
      json = JSON.parse(result);
    } catch (parseError) {
      console.error("❌ Failed to parse Fonnte response");
      throw new Error(
        "Fonnte response tidak valid: " + result.substring(0, 100)
      );
    }

    // Check for Fonnte API errors
    if (json.status === false || json.status === "false") {
      console.error("❌ Fonnte API Error:", json);
      throw new Error(json.reason || json.message || "Fonnte API failed");
    }

    console.log("✅ Notification sent via Fonnte!");
    return json;
  } catch (error) {
    if (error.name === "AbortError") {
      console.error("⏰ Request timeout after 20s");
      throw new Error("Fonnte timeout - please try shorter message");
    }

    // Handle network errors
    if (
      error.message === "fetch failed" ||
      error.cause?.code === "UND_ERR_CONNECT_TIMEOUT"
    ) {
      console.error("🌐 Network error:", error.message);
      throw new Error(
        "Tidak dapat terhubung ke Fonnte API. Periksa koneksi internet Anda."
      );
    }

    console.error("💥 Fonnte notification error:", error.message);
    throw error;
  }
}

/**
 * Send short notification (optimized for reliability)
 */
export async function sendShortNotification(phone, orderId, amount) {
  const message = `✅ Payment PENDING
Thank you sudah order le. AYO BURUAN SELESAIKAN PEMBAYRANMU LE! 🎉
ini yang kamu harus bayar le:
💰 Amount: ${amount}
🆔 Order: ${orderId}

— Dari lele tercinta `;

  return sendNotificationViaFonnte(phone, message);
}

/**
 * Send payment success notification
 */
export async function sendPaymentSuccess(phone, orderId, amount) {
  const message = `✅ Payment Successful!
Pesananmu sudah dibayar le! 🎉

💰 Paid: ${amount}
🆔 Order: ${orderId}

✅ Payment confirmed.
📦 Order processing.

Tunggu paket cinta kami le!

— Dari lele tercinta `;

  return sendNotificationViaFonnte(phone, message);
}
