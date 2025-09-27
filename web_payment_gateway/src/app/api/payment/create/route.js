// --- START OF FILE src/app/api/payment/create/route.js ---

// Path yang benar: naik 3 tingkat (ke src/app), lalu ke libs/mongodb
import dbConnect from "../../../libs/mongodb";
import Checkout from "../../../models/Checkout";
import Payment from "../../../models/Payment";
import { v4 as uuidv4 } from "uuid";

const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY;
const XENDIT_API_URL = "https://api.xendit.co/v2/invoices";

export async function POST(request) {
  await dbConnect();

  if (!XENDIT_SECRET_KEY) {
    return Response.json(
      { success: false, error: "XENDIT_SECRET_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { checkoutId } = body;

    const checkout = await Checkout.findById(checkoutId);

    if (!checkout) {
      return Response.json(
        { success: false, error: "Checkout not found" },
        { status: 404 }
      );
    }

    // --- PERBAIKAN FORMAT NOMOR TELEPON ---
    let rawPhone = checkout.customerInfo.phone;
    let digitsOnly = rawPhone.replace(/\D/g, "");

    let formattedPhone;

    if (digitsOnly.startsWith("62")) {
      formattedPhone = digitsOnly;
    } else if (digitsOnly.startsWith("0")) {
      formattedPhone = "62" + digitsOnly.substring(1);
    } else {
      formattedPhone = digitsOnly;
    }

    if (formattedPhone.length < 8) {
      throw new Error("Invalid phone number format for Xendit.");
    }
    // --- AKHIR PERBAIKAN FORMAT NOMOR TELEPON ---

    // 1. Buat data invoice Xendit
    const externalId = `invoice-${uuidv4()}`;

    const xenditPayload = {
      external_id: externalId,
      amount: Math.round(checkout.total),
      payer_email: checkout.customerInfo.email,
      description: `Payment for order ${checkout._id}`,
      invoice_duration: 86400, // 24 hours in seconds
      customer: {
        given_names: checkout.customerInfo.name,
        email: checkout.customerInfo.email,
        mobile_number: formattedPhone,
      },
      items: checkout.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: Math.round(item.price),
      })),
      // --- PERBAIKAN FINAL: TAMBAH FIELD 'type' ---
      fees: [
        { name: "Tax (10%)", value: Math.round(checkout.tax), type: "TAX" },
        {
          name: "Shipping Cost",
          value: Math.round(checkout.shippingCost),
          type: "SHIPPING",
        },
      ],
      // --- AKHIR PERBAIKAN FINAL ---
      success_redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?external_id=${externalId}`,
      failure_redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/failed?external_id=${externalId}`,
    };

    // 2. Panggil API Xendit
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

    if (xenditResponse.status !== 200 && xenditResponse.status !== 201) {
      console.error("Xendit API Error:", xenditResult);

      let errorMessage =
        xenditResult.error_code || "Xendit invoice creation failed";

      if (xenditResult.errors && xenditResult.errors.length > 0) {
        const firstError = xenditResult.errors[0];
        errorMessage += `: ${firstError.field.join(
          ", "
        )} - ${firstError.messages.join(", ")}`;
      } else {
        errorMessage +=
          ": " + (xenditResult.message || "Please check server console.");
      }

      throw new Error(errorMessage);
    }

    // 3. Simpan data Payment ke DB
    const newPayment = await Payment.create({
      checkoutId: checkout._id,
      xenditInvoiceId: xenditResult.id,
      externalId: externalId,
      paymentUrl: xenditResult.invoice_url,
      amount: checkout.total,
      expiredAt: xenditResult.expiry_date,
    });

    return Response.json({ success: true, data: newPayment });
  } catch (error) {
    console.error("Payment Create Error:", error);
    return Response.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
