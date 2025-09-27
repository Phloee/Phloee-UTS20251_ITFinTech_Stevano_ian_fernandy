import { NextRequest, NextResponse } from "next/server";

export function verifyXenditWebhook(request: NextRequest): {
  isValid: boolean;
  error?: string;
} {
  const WEBHOOK_TOKEN = process.env.XENDIT_WEBHOOK_SECRET_KEY;
  const xCallbackToken = request.headers.get("x-callback-token");

  if (!WEBHOOK_TOKEN) {
    // Catatan: Ini adalah kesalahan konfigurasi server. Harusnya dicek saat startup.
    console.error("WEBHOOK_TOKEN not configured.");
    return { isValid: false, error: "Server Configuration Error" };
  }

  if (xCallbackToken !== WEBHOOK_TOKEN) {
    console.error(
      `Webhook Error: Invalid X-Callback-Token received: ${xCallbackToken}`
    );
    return { isValid: false, error: "Invalid Token" };
  }

  return { isValid: true };
}
