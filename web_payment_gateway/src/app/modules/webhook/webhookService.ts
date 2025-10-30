import Checkout from "../../models/Checkout"; // Ganti path sesuai struktur final Anda
import Payment from "../../models/Payment";
import dbConnect from "../../libs/mongodb";
import mongoose from "mongoose";
import { sendOtpViaFonnte } from "../../libs/fonnte";

// Mendefinisikan type untuk Body Webhook Xendit yang diperlukan
type XenditWebhookUpdateBody = {
  external_id: string;
  status: "PAID" | "SETTLED";
  paid_at: string;
  // ... payload Xendit penuh, yang diteruskan
};

/**
 * Memproses pembaruan status pembayaran dan checkout ke database.
 * @param body Payload yang sudah terautentikasi dari Xendit.
 */
export async function updatePaymentAndCheckout(
  body: XenditWebhookUpdateBody
): Promise<void> {
  await dbConnect(); // Pastikan koneksi DB

  const { external_id, status } = body;

  const payment = await Payment.findOne({ externalId: external_id });

  if (!payment) {
    throw new Error(
      `Payment not found for external_id: ${external_id}. Cannot update status.`
    );
  }

  // Update status hanya jika belum PAID atau SETTLED (mencegah double-update)
  if (payment.status !== "PAID" && payment.status !== "SETTLED") {
    payment.status = status;
    payment.paidAt = new Date(body.paid_at);
    payment.webhookData = body;
    await payment.save();

    // Update status Checkout menjadi CONFIRMED (LUNAS)
    await Checkout.findByIdAndUpdate(payment.checkoutId, {
      status: "CONFIRMED",
    });

    console.log(
      `✅ Webhook Success: Payment ${external_id} and Checkout ${payment.checkoutId} updated to ${status}`
    );

    // --- WhatsApp Confirmation via Fonnte ---
    // Get checkout for customer info
    const checkout = await Checkout.findById(payment.checkoutId);
    if (checkout) {
      const phone = checkout.customerInfo.phone;
      const amount = payment.amount;
      const orderId = checkout._id;
      // Format currency (IDR)
      const formatRupiah = (num: number) => "Rp " + num.toLocaleString("id-ID");
      const message = `✅ Payment Successful!

Thank you for your purchase! 🎉

💰 Amount Paid: ${formatRupiah(amount)}
🆔 Order ID: ${orderId}

✅ Your payment has been confirmed.
📦 Your order is being processed.

We'll contact you soon for delivery details!

— SamShop Team

> Sent via fonnte.com`;
      try {
        await sendOtpViaFonnte(phone, message);
        console.log("✅ WhatsApp confirmation sent via Fonnte");
      } catch (err) {
        console.error("❌ Failed to send WhatsApp confirmation:", err);
      }
    }
  } else {
    console.log(`Webhook Ignored: Payment ${external_id} already updated.`);
  }
}
