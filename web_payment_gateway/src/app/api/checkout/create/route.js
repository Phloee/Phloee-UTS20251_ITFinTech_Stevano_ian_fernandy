// /api/checkout/create/route.js
import { NextResponse } from "next/server";
import { sendWhatsAppMessage } from "../../libs/whatsapp";
import dbConnect from "../../../libs/mongodb";
import Checkout from "../../../models/Checkout";
import Product from "../../../models/Product";
import { v4 as uuidv4 } from "uuid";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export async function POST(req) {
  try {
    const { customerInfo, items, userId } = await req.json();

    if (!customerInfo || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid checkout data" },
        { status: 400 }
      );
    }

    // Calculate total
    const total = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Connect to DB and save checkout
    await dbConnect();

    // Validate items: each item should include a productId and quantity
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Items array is required" },
        { status: 400 }
      );
    }

    // Normalize productIds (support string, ObjectId-like objects, or nested $oid forms)
    const normalizeId = (pid) => {
      if (!pid) return null;
      if (typeof pid === "string") return pid;
      if (typeof pid === "object") {
        if (pid.$oid) return pid.$oid;
        if (pid.toString) return pid.toString();
      }
      return String(pid);
    };

    const productIds = items
      .map((it) => normalizeId(it.productId))
      .filter(Boolean);

    if (productIds.length !== items.length) {
      return NextResponse.json(
        { success: false, error: "One or more items missing productId" },
        { status: 400 }
      );
    }

    // Fetch all products referenced by the cart in a single query
    const productsFromDb = await Product.find({
      _id: { $in: productIds },
    }).lean();
    const productMap = new Map(productsFromDb.map((p) => [String(p._id), p]));

    // Build detailed items and validate
    const detailedItems = [];
    for (const it of items) {
      const pid = normalizeId(it.productId);
      const prod = productMap.get(pid);
      if (!prod) {
        return NextResponse.json(
          { success: false, error: `Product not found: ${pid}` },
          { status: 400 }
        );
      }

      const qty = Number(it.quantity) || 0;
      const price = Number(prod.price);
      if (isNaN(price) || isNaN(qty) || qty <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid quantity or price for product ${prod._id}`,
          },
          { status: 400 }
        );
      }

      detailedItems.push({
        productId: prod._id,
        name: prod.name,
        price: Math.round(price),
        quantity: qty,
        subtotal: Math.round(price) * qty,
      });
    }

    const subtotal = detailedItems.reduce((sum, it) => sum + it.subtotal, 0);
    const tax = Math.round(subtotal * 0.1);
    const shippingCost = subtotal > 50000 ? 0 : 10000;
    const grandTotal = subtotal + tax + shippingCost;

    const checkoutToSave = {
      sessionId: uuidv4(),
      userId: userId || null,
      customerInfo,
      items: detailedItems,
      subtotal,
      tax,
      shippingCost,
      total: grandTotal,
      status: "PENDING",
    };

    const createdCheckout = await Checkout.create(checkoutToSave);
    const checkout = createdCheckout.toObject();

    // Send WhatsApp notification if phone number is provided
    if (customerInfo.phone) {
      try {
        await sendWhatsAppMessage(
          customerInfo.phone,
          `🛒 Terima kasih! Pesanan Anda sedang diproses.\nTotal: ${formatCurrency(
            total
          )}`
        );
      } catch (whatsappError) {
        console.error("WhatsApp notification failed:", whatsappError);
        // Continue processing even if WhatsApp fails
      }
    }

    return NextResponse.json({ success: true, data: checkout });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process checkout" },
      { status: 500 }
    );
  }
}
