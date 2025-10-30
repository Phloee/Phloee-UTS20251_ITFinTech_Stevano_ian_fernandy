// src/app/api/payment/create/route.js

import dbConnect from "../../../libs/mongodb";
import Checkout from "../../../models/Checkout";
import Payment from "../../../models/Payment";
import { v4 as uuidv4 } from "uuid";

const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY;
const XENDIT_API_URL = "https://api.xendit.co/v2/invoices";

export async function POST(request) {
  await dbConnect();

  // ✅ Cek API key dengan lebih detail
  if (!XENDIT_SECRET_KEY) {
    console.error("❌ XENDIT_SECRET_KEY not found in environment variables");
    return Response.json(
      {
        success: false,
        error: "XENDIT_SECRET_KEY not configured. Please check .env file",
      },
      { status: 500 }
    );
  }

  // ✅ Validasi format API key (harus dimulai dengan xnd_)
  if (!XENDIT_SECRET_KEY.startsWith("xnd_")) {
    console.error("❌ Invalid XENDIT_SECRET_KEY format");
    return Response.json(
      { success: false, error: "Invalid Xendit API key format" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { checkoutId } = body;

    console.log("🔍 Finding checkout:", checkoutId);

    const checkout = await Checkout.findById(checkoutId);

    if (!checkout) {
      console.error("❌ Checkout not found:", checkoutId);
      return Response.json(
        { success: false, error: "Checkout not found" },
        { status: 404 }
      );
    }

    console.log("✅ Checkout found:", checkout._id);

    // Format nomor telepon
    let rawPhone = checkout.customerInfo.phone;
    let digitsOnly = rawPhone.replace(/\D/g, "");

    let formattedPhone;

    if (digitsOnly.startsWith("62")) {
      formattedPhone = digitsOnly;
    } else if (digitsOnly.startsWith("0")) {
      formattedPhone = "62" + digitsOnly.substring(1);
    } else {
      formattedPhone = "62" + digitsOnly;
    }

    if (formattedPhone.length < 10 || formattedPhone.length > 15) {
      throw new Error("Invalid phone number format for Xendit.");
    }

    console.log("📱 Formatted phone:", formattedPhone);

    // Buat external ID
    const externalId = `invoice-${uuidv4()}`;

    // ✅ Pastikan semua nilai numerik adalah integer
    const xenditPayload = {
      external_id: externalId,
      amount: Math.round(Number(checkout.total)),
      payer_email: checkout.customerInfo.email,
      description: `Payment for order ${checkout._id}`,
      invoice_duration: 86400,
      customer: {
        given_names: checkout.customerInfo.name,
        email: checkout.customerInfo.email,
        mobile_number: `+${formattedPhone}`, // ✅ Tambah prefix +
      },
      items: checkout.items.map((item) => ({
        name: item.name || "Product",
        quantity: Number(item.quantity),
        price: Math.round(Number(item.price)),
      })),
      fees: [
        {
          name: "Tax (10%)",
          value: Math.round(Number(checkout.tax || 0)),
          type: "TAX",
        },
        {
          name: "Shipping Cost",
          value: Math.round(Number(checkout.shippingCost || 0)),
          type: "SHIPPING",
        },
      ],
      success_redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?external_id=${externalId}`,
      failure_redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/failed?external_id=${externalId}`,
    };

    console.log("📤 Xendit Payload:", JSON.stringify(xenditPayload, null, 2));

    // ✅ Panggil API Xendit dengan error handling lebih baik
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

    console.log("📥 Xendit Response Status:", xenditResponse.status);
    console.log("📥 Xendit Response:", JSON.stringify(xenditResult, null, 2));

    if (xenditResponse.status !== 200 && xenditResponse.status !== 201) {
      console.error("❌ Xendit API Error:", xenditResult);

      let errorMessage =
        xenditResult.error_code || "Xendit invoice creation failed";

      // ✅ Handle error 401 (Authentication failed)
      if (xenditResponse.status === 401) {
        errorMessage =
          "Xendit API authentication failed. Please check your API key.";
        console.error("❌ API Key issue - Status 401");
      }

      if (xenditResult.errors && xenditResult.errors.length > 0) {
        const firstError = xenditResult.errors[0];
        errorMessage += `: ${firstError.field?.join(", ") || "unknown"} - ${
          firstError.messages?.join(", ") || "no message"
        }`;
      } else if (xenditResult.message) {
        errorMessage += ": " + xenditResult.message;
      }

      throw new Error(errorMessage);
    }

    console.log("✅ Xendit invoice created:", xenditResult.id);

    // Simpan data Payment ke DB
    const newPayment = await Payment.create({
      checkoutId: checkout._id,
      xenditInvoiceId: xenditResult.id,
      externalId: externalId,
      paymentUrl: xenditResult.invoice_url,
      amount: checkout.total,
      expiredAt: xenditResult.expiry_date,
    });

    console.log("✅ Payment saved to DB:", newPayment._id);

    return Response.json({ success: true, data: newPayment });
  } catch (error) {
    console.error("❌ Payment Create Error:", error);
    return Response.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
