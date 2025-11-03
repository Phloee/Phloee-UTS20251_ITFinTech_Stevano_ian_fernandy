import { NextRequest } from "next/server";

/**
 * Memverifikasi X-Callback-Token dari Xendit.
 * @param request Objek NextRequest dari webhook.
 * @returns {isValid: boolean, error?: string}
 */
export function verifyXenditWebhook(request: NextRequest): {
  isValid: boolean;
  error?: string;
} {
  const WEBHOOK_TOKEN = process.env.XENDIT_WEBHOOK_SECRET_KEY;
  const xCallbackToken = request.headers.get("x-callback-token");

  if (!WEBHOOK_TOKEN) {
    console.error("WEBHOOK_TOKEN not configured in environment variables.");
    return { isValid: false, error: "Server Configuration Error" };
  }

  // Periksa otorisasi token
  if (xCallbackToken !== WEBHOOK_TOKEN) {
    console.error(`Webhook Error: Invalid X-Callback-Token received.`);
    return { isValid: false, error: "Invalid Token" };
  }

  return { isValid: true };
}
