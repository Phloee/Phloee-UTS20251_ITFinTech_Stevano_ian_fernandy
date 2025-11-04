// src/app/api/webhooks/route.js
import { NextResponse } from "next/server";
import dbConnect from "../../libs/mongodb";
import Payment from "../../models/Payment";
import Checkout from "../../models/Checkout";
import { sendPaymentSuccess } from "../../libs/fonnte";

const XENDIT_WEBHOOK_TOKEN =
  process.env.XENDIT_WEBHOOK_TOKEN || process.env.XENDIT_WEBHOOK_SECRET_KEY;

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * Send WhatsApp notification untuk payment success
 */
async function sendPaymentSuccessNotification(checkout, payment) {
  if (!checkout.customerInfo?.phone) {
    console.log("⚠️ No phone number found, skipping WhatsApp");
    return;
  }

  try {
    console.log(
      "📱 Sending success notification to:",
      checkout.customerInfo.phone
    );

    // Use optimized success function (non-blocking)
    await sendPaymentSuccess(
      checkout.customerInfo.phone,
      checkout._id.toString(),
      formatCurrency(payment.paidAmount || payment.amount)
    );

    console.log("✅ Success notification sent via Fonnte");
  } catch (err) {
    console.error("❌ Failed to send success WhatsApp:", err.message);
    // Don't throw - allow webhook to continue
  }
}

/**
 * Helper function untuk update payment dan checkout
 */
async function updatePaymentAndCheckout(invoiceData) {
  await dbConnect();

  const { external_id, status } = invoiceData;
  const xenditInvoiceId = invoiceData.id;

  console.log(
    `🔍 Looking for payment with external_id: ${external_id} or invoice_id: ${xenditInvoiceId}`
  );

  const payment = await Payment.findOne({
    $or: [{ externalId: external_id }, { xenditInvoiceId: xenditInvoiceId }],
  });

  if (!payment) {
    throw new Error(
      `Payment not found for external_id: ${external_id} or invoice_id: ${xenditInvoiceId}`
    );
  }

  console.log(`✅ Payment found: ${payment._id}`);
  console.log(`📊 Current status: ${payment.status} → New status: ${status}`);

  // Skip if already processed
  if (
    payment.status === "PAID" ||
    payment.status === "SETTLED" ||
    payment.status === "CONFIRMED"
  ) {
    console.log(`ℹ️ Payment already processed (${payment.status})`);
    return { updated: false, alreadyProcessed: true };
  }

  // Update payment
  payment.status = status;
  payment.paidAt = invoiceData.paid_at
    ? new Date(invoiceData.paid_at)
    : new Date();
  payment.paidAmount = invoiceData.paid_amount || invoiceData.amount;
  payment.paymentMethod =
    invoiceData.payment_method || invoiceData.bank_code || "BANK_TRANSFER";
  payment.paymentChannel =
    invoiceData.payment_channel || invoiceData.bank_code || "UNKNOWN";
  payment.webhookData = invoiceData;

  await payment.save();
  console.log(`✅ Payment ${payment._id} updated`);

  // Update checkout to PAID
  const checkout = await Checkout.findByIdAndUpdate(
    payment.checkoutId,
    { status: "PAID", paidAt: new Date() },
    { new: true }
  );

  if (!checkout) {
    throw new Error(`Checkout not found: ${payment.checkoutId}`);
  }

  console.log(`✅ Checkout ${checkout._id} updated to PAID`);

  // Send WhatsApp notification (fire and forget)
  sendPaymentSuccessNotification(checkout, payment).catch((err) => {
    console.error(
      "⚠️ WhatsApp notification failed (non-critical):",
      err.message
    );
  });

  return { updated: true, checkout, payment };
}

/**
 * Main webhook handler
 */
export async function POST(request) {
  console.log("\n" + "=".repeat(60));
  console.log("🔔 XENDIT WEBHOOK RECEIVED");
  console.log("=".repeat(60));

  try {
    // 1. Verify webhook token
    const callbackToken = request.headers.get("x-callback-token");

    if (!XENDIT_WEBHOOK_TOKEN) {
      console.error("❌ XENDIT_WEBHOOK_TOKEN not configured in .env");
      return NextResponse.json(
        { success: false, error: "Webhook configuration error" },
        { status: 500 }
      );
    }

    if (callbackToken !== XENDIT_WEBHOOK_TOKEN) {
      console.warn("⚠️ Invalid webhook token received");
      console.warn("Expected:", XENDIT_WEBHOOK_TOKEN.substring(0, 10) + "...");
      console.warn("Received:", callbackToken?.substring(0, 10) + "...");
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    console.log("✅ Webhook token verified");

    // 2. Parse webhook body
    const body = await request.json();
    console.log("📥 Webhook payload:", JSON.stringify(body, null, 2));

    // Handle both old and new webhook formats
    let invoiceData;
    let eventType;

    if (body.event) {
      eventType = body.event;
      invoiceData = body.data || body;
      console.log(`📦 Event Type: ${eventType}`);
    } else {
      eventType = `invoice.${body.status?.toLowerCase()}`;
      invoiceData = body;
      console.log(`📦 Status: ${body.status}`);
    }

    // 3. Process based on event/status
    let result = { updated: false };

    if (
      eventType === "invoice.paid" ||
      eventType === "invoice.settled" ||
      invoiceData.status === "PAID" ||
      invoiceData.status === "SETTLED"
    ) {
      console.log("💰 Processing PAID payment...");
      result = await updatePaymentAndCheckout(invoiceData);
      console.log("✅ Payment processed successfully");
    } else if (
      eventType === "invoice.expired" ||
      invoiceData.status === "EXPIRED"
    ) {
      console.log("⏰ Processing EXPIRED payment...");
      await dbConnect();

      const payment = await Payment.findOne({
        $or: [
          { externalId: invoiceData.external_id },
          { xenditInvoiceId: invoiceData.id },
        ],
      });

      if (payment) {
        payment.status = "EXPIRED";
        payment.expiredAt = new Date();
        payment.webhookData = invoiceData;
        await payment.save();

        await Checkout.findByIdAndUpdate(payment.checkoutId, {
          status: "EXPIRED",
        });

        console.log("⏰ Payment marked as EXPIRED");
        result = { updated: true };
      }
    } else {
      console.log(`ℹ️ Event '${eventType}' received but ignored`);
    }

    console.log("=".repeat(60));
    console.log("✅ WEBHOOK PROCESSED");
    console.log("=".repeat(60) + "\n");

    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully",
      result,
    });
  } catch (error) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ WEBHOOK ERROR");
    console.error("=".repeat(60));
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    console.error("=".repeat(60) + "\n");

    return NextResponse.json({
      success: false,
      error: "Internal error acknowledged",
      message: error.message,
    });
  }
}

export async function GET() {
  const isConfigured = !!XENDIT_WEBHOOK_TOKEN;

  return NextResponse.json({
    status: "✅ Xendit Webhook endpoint is ready",
    endpoint: "/api/webhooks",
    configured: isConfigured,
    timestamp: new Date().toISOString(),
    instructions: isConfigured
      ? "Webhook is configured and ready to receive events"
      : "⚠️ Please add XENDIT_WEBHOOK_TOKEN to your .env file",
    xenditDashboard:
      "Configure this URL in Xendit Dashboard → Settings → Webhooks",
    webhookUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks`,
    supportedEvents: ["invoice.paid", "invoice.settled", "invoice.expired"],
  });
}
