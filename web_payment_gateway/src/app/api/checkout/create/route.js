// src/app/api/checkout/create/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

// Import dari libs (naik 4 level: api -> app -> src, lalu masuk ke libs)
import dbConnect from "../../../libs/mongodb";

// Import models (sesuaikan dengan lokasi model Anda)
// Jika model ada di src/app/models:
import Checkout from "../../../models/Checkout";
import Product from "../../../models/Product";

// Jika model ada di src/models (bukan di dalam app):
// import Checkout from "../../../../../models/Checkout";
// import Product from "../../../../../models/Product";

// Import WhatsApp helper
import { sendWhatsAppMessage } from "../../../libs/whatsapp";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export async function POST(request) {
  console.log("\n" + "=".repeat(60));
  console.log("🛒 CHECKOUT API CALLED");
  console.log("=".repeat(60));

  try {
    // 1. Check session
    const session = await getServerSession(authOptions);

    if (!session) {
      console.error("❌ No session found");
      return NextResponse.json(
        { success: false, error: "Please login first" },
        { status: 401 }
      );
    }

    console.log("✅ User:", session.user.email);

    // 2. Connect DB
    await dbConnect();
    console.log("✅ DB connected");

    // 3. Parse body
    const body = await request.json();
    console.log("📦 Request body:", JSON.stringify(body, null, 2));

    const { customerInfo, items } = body;

    // 4. Validate
    if (!customerInfo || !items || items.length === 0) {
      console.error("❌ Invalid request data");
      return NextResponse.json(
        { success: false, error: "Invalid checkout data" },
        { status: 400 }
      );
    }

    // 5. Get products from DB
    const productIds = items.map((item) => item.productId);
    console.log("🔍 Searching products:", productIds);

    const products = await Product.find({ _id: { $in: productIds } });
    console.log(`✅ Found ${products.length}/${items.length} products`);

    // 6. Check all products exist
    if (products.length !== items.length) {
      const foundIds = products.map((p) => p._id.toString());
      const missingIds = productIds.filter(
        (id) => !foundIds.includes(id.toString())
      );

      console.error("❌ Missing products:", missingIds);

      return NextResponse.json(
        {
          success: false,
          error: "Some products not found in database",
          debug: {
            requested: productIds,
            found: foundIds,
            missing: missingIds,
          },
        },
        { status: 404 }
      );
    }

    // 7. Calculate totals
    let subtotal = 0;
    const enrichedItems = items.map((item) => {
      const product = products.find(
        (p) => p._id.toString() === item.productId.toString()
      );
      const itemSubtotal = product.price * item.quantity; // Hitung subtotal per item
      subtotal += itemSubtotal;

      console.log(
        `  ✓ ${product.name}: ${item.quantity}x ${formatCurrency(
          product.price
        )} = ${formatCurrency(itemSubtotal)}`
      );

      return {
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        subtotal: itemSubtotal, // PENTING: Tambahkan field subtotal
        imageUrl: product.imageUrl || null,
      };
    });

    const tax = Math.round(subtotal * 0.1);
    const shippingCost = subtotal > 50000 ? 0 : 10000;
    const total = subtotal + tax + shippingCost;

    console.log("\n💰 Pricing:");
    console.log("  Subtotal:", formatCurrency(subtotal));
    console.log("  Tax:", formatCurrency(tax));
    console.log(
      "  Shipping:",
      shippingCost === 0 ? "FREE" : formatCurrency(shippingCost)
    );
    console.log("  TOTAL:", formatCurrency(total));

    // 8. Create checkout
    // Generate unique sessionId untuk setiap checkout untuk mencegah duplicate key error
    const uniqueSessionId = `${
      session.user.id || "guest"
    }-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const checkout = await Checkout.create({
      userId: session.user.id || null,
      sessionId: uniqueSessionId,
      customerInfo: {
        name: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone,
        address: customerInfo.address,
      },
      items: enrichedItems,
      subtotal,
      tax,
      shippingCost,
      total,
      status: "PENDING",
    });

    console.log("✅ Checkout created:", checkout._id);

    // 9. Send WhatsApp (non-blocking)
    if (customerInfo.phone) {
      // Format pesan WhatsApp dengan detail lengkap
      const itemsList = enrichedItems
        .map(
          (item, index) =>
            `${index + 1}. ${item.name}\n   ${
              item.quantity
            }x @ ${formatCurrency(item.price)} = ${formatCurrency(
              item.subtotal
            )}`
        )
        .join("\n");

      const message = `🛒 *Terima kasih atas pesanan Anda!*

📦 *Order ID:* ${checkout._id}

*Detail Pesanan:*
${itemsList}

────────────────────
Subtotal: ${formatCurrency(subtotal)}
Pajak (10%): ${formatCurrency(tax)}
Ongkir: ${shippingCost === 0 ? "GRATIS" : formatCurrency(shippingCost)}
────────────────────
*TOTAL: ${formatCurrency(total)}*

📍 *Alamat Pengiriman:*
${customerInfo.name}
${customerInfo.address}
${customerInfo.phone}

📋 *Status:* Menunggu pembayaran
Link pembayaran akan dikirim segera.

Terima kasih telah berbelanja di SamShop! 🙏`;

      sendWhatsAppMessage(customerInfo.phone, message).catch((err) => {
        console.error("⚠️ WhatsApp failed (non-critical):", err.message);
      });

      console.log("📱 WhatsApp queued");
    }

    console.log("=".repeat(60));
    console.log("✅ CHECKOUT SUCCESS");
    console.log("=".repeat(60) + "\n");

    return NextResponse.json({
      success: true,
      data: checkout,
      message: "Checkout created successfully",
    });
  } catch (error) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ CHECKOUT ERROR");
    console.error("=".repeat(60));
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    console.error("=".repeat(60) + "\n");

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal Server Error",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// GET endpoint untuk testing
export async function GET() {
  return NextResponse.json({
    status: "✅ Checkout API is working",
    endpoint: "/api/checkout/create",
    methods: ["POST", "GET"],
    timestamp: new Date().toISOString(),
  });
}
