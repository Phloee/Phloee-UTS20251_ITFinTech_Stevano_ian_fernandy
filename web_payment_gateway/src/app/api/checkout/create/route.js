// /api/checkout/create/route.js
import { sendWhatsAppMessage } from "src/app/libs/whatsapp";

export async function POST(req) {
  const { customerInfo, items } = await req.json();

  // ... simpan ke database

  if (customerInfo.whatsapp) {
    await sendWhatsAppMessage(
      customerInfo.whatsapp,
      `🛒 Terima kasih! Pesanan Anda sedang diproses.\nTotal: ${formatCurrency(
        total
      )}`
    );
  }

  return NextResponse.json({ success: true, data: checkout });
}
