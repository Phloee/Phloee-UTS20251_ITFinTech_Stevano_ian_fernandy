import dbConnect from "../../../libs/mongodb";
import Checkout from "../../../models/Checkout";
import Payment from "../../../models/Payment";
import { v4 as uuidv4 } from "uuid";

const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY;
const XENDIT_API_URL = "https://api.xendit.co/v2/invoices";
const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

// Fungsi untuk memvalidasi environment variables
function validateEnv() {
  if (!XENDIT_SECRET_KEY) {
    throw new Error("❌ XENDIT_SECRET_KEY tidak dikonfigurasi di file .env");
  }
  if (!XENDIT_SECRET_KEY.startsWith("xnd_")) {
    throw new Error("❌ Format XENDIT_SECRET_KEY tidak valid.");
  }
  if (!NEXT_PUBLIC_BASE_URL) {
    throw new Error("❌ NEXT_PUBLIC_BASE_URL tidak dikonfigurasi di file .env");
  }
}

// Fungsi untuk memformat nomor telepon
function formatPhoneNumber(rawPhone) {
  const digitsOnly = String(rawPhone).replace(/\D/g, "");
  let formattedPhone;

  if (digitsOnly.startsWith("62")) {
    formattedPhone = digitsOnly;
  } else if (digitsOnly.startsWith("0")) {
    formattedPhone = "62" + digitsOnly.substring(1);
  } else {
    formattedPhone = "62" + digitsOnly;
  }

  if (formattedPhone.length < 10 || formattedPhone.length > 15) {
    throw new Error("Nomor telepon tidak valid untuk Xendit.");
  }

  return `+${formattedPhone}`;
}

export async function POST(request) {
  try {
    await dbConnect();
    validateEnv(); // Validasi kunci API dan base URL di awal

    const { checkoutId } = await request.json();
    if (!checkoutId) {
      return Response.json(
        { success: false, error: "checkoutId dibutuhkan" },
        { status: 400 }
      );
    }

    console.log("🔍 Mencari checkout:", checkoutId);
    const checkout = await Checkout.findById(checkoutId);

    if (!checkout) {
      console.error("❌ Checkout tidak ditemukan:", checkoutId);
      return Response.json(
        { success: false, error: "Checkout tidak ditemukan" },
        { status: 404 }
      );
    }
    console.log("✅ Checkout ditemukan:", checkout._id);

    const formattedPhone = formatPhoneNumber(checkout.customerInfo.phone);
    console.log("📱 Nomor telepon diformat:", formattedPhone);

    const externalId = `invoice-${uuidv4()}`;

    const xenditPayload = {
      external_id: externalId,
      amount: Math.round(Number(checkout.total)),
      payer_email: checkout.customerInfo.email,
      description: `Pembayaran untuk pesanan ${checkout._id}`,
      invoice_duration: 86400,
      customer: {
        given_names: checkout.customerInfo.name,
        email: checkout.customerInfo.email,
        mobile_number: formattedPhone,
      },
      items: checkout.items.map((item) => ({
        name: item.name || "Produk",
        quantity: Number(item.quantity),
        price: Math.round(Number(item.price)),
      })),
      fees: [
        {
          name: "Pajak (11%)",
          value: Math.round(Number(checkout.tax || 0)),
          type: "TAX",
        },
        {
          name: "Biaya Pengiriman",
          value: Math.round(Number(checkout.shippingCost || 0)),
          type: "SHIPPING",
        },
      ],
      success_redirect_url: `${NEXT_PUBLIC_BASE_URL}/payment/success?external_id=${externalId}`,
      failure_redirect_url: `${NEXT_PUBLIC_BASE_URL}/payment/failed?external_id=${externalId}`,
      should_send_email: true, // Sebaiknya aktifkan agar pelanggan juga dapat email
    };

    console.log("📤 Mengirim Payload ke Xendit...");
    const xenditResponse = await fetch(XENDIT_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Basic " + Buffer.from(XENDIT_SECRET_KEY + ":").toString("base64"),
      },
      body: JSON.stringify(xenditPayload),
    });

    const xenditResult = await xenditResponse.json();

    if (!xenditResponse.ok) {
      console.error("❌ Gagal membuat invoice Xendit:", xenditResult);
      throw new Error(xenditResult.message || "Gagal membuat invoice Xendit.");
    }

    console.log("✅ Invoice Xendit dibuat:", xenditResult.id);

    const newPayment = await Payment.create({
      checkoutId: checkout._id,
      xenditInvoiceId: xenditResult.id,
      externalId: externalId,
      paymentUrl: xenditResult.invoice_url,
      amount: checkout.total,
      status: xenditResult.status, // Ambil status langsung dari response Xendit
      expiredAt: xenditResult.expiry_date,
    });

    console.log("✅ Data pembayaran disimpan di DB:", newPayment._id);

    return Response.json({ success: true, data: newPayment }, { status: 201 });
  } catch (error) {
    console.error("❌ Terjadi Error di /api/payment/create:", error.message);
    return Response.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
