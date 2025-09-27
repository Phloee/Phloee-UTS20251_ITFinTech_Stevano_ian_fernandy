// src/app/api/webhook/route.ts (Ganti nama file .js Anda)

import { NextRequest, NextResponse } from "next/server";
// Import dari modul baru: webhookAuth & webhookService
import { verifyXenditWebhook } from "../../modules/webhook/webhookAuth";
import { updatePaymentAndCheckout } from "../../modules/webhook/webhookService";
import mongoose from "mongoose";

export async function POST(request: NextRequest) {
  // 1. Service/Typescript 1: Otentikasi (Auth Handler)
  const authResult = verifyXenditWebhook(request);
  if (!authResult.isValid) {
    return new NextResponse(authResult.error, { status: 401 });
  }

  try {
    const body = await request.json();
    const { status } = body;

    // Cek status yang tidak perlu diproses
    if (status !== "PAID" && status !== "SETTLED") {
      return new NextResponse("Status is not successful; no action needed.", {
        status: 200,
      });
    }

    // 2. Service/Typescript 2: Logika Bisnis/DB (Hit Xendit logic)
    await updatePaymentAndCheckout(body);

    // Respon 200 ke Xendit
    return new NextResponse("Webhook received and processed", { status: 200 });
  } catch (error) {
    console.error("Webhook Processing Error:", error);

    if (error instanceof mongoose.Error.DocumentNotFoundError) {
      return new NextResponse("Transaction ID not found in database.", {
        status: 404,
      });
    }

    // Respon 500: Memicu Xendit untuk Retry (coba lagi)
    return new NextResponse(
      "Internal Server Error: Failed to process DB update.",
      { status: 500 }
    );
  }
}
