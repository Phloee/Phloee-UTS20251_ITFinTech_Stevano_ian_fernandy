import dbConnect from "../../../libs/mongodb";
import Checkout from "../../../models/Checkout";
import Product from "../../../models/Product";
import User from "../../../models/User";

export async function POST(request) {
  await dbConnect();

  try {
    const body = await request.json();
    const { customerInfo, items } = body;

    // 1. Ambil data produk dari DB untuk memastikan harga dan stok
    const productIds = items.map((item) => item.productId);
    const productsInDb = await Product.find({ _id: { $in: productIds } });

    if (productsInDb.length !== productIds.length) {
      return Response.json(
        { success: false, error: "One or more products not found" },
        { status: 404 }
      );
    }

    // 2. Hitung ulang total di server
    let subtotal = 0;
    const checkoutItems = items.map((item) => {
      const product = productsInDb.find(
        (p) => p._id.toString() === item.productId
      );

      if (!product) {
        throw new Error(`Product with ID ${item.productId} not found.`);
      }

      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;

      return {
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        subtotal: itemSubtotal,
      };
    });

    const tax = Math.round(subtotal * 0.1);
    const shippingCost = subtotal > 50000 ? 0 : 10000;
    const total = subtotal + tax + shippingCost;

    // 3. Simpan user/customer info (opsional, jika Anda ingin menyimpan user)
    let user = await User.findOneAndUpdate(
      { email: customerInfo.email },
      { $set: customerInfo },
      { upsert: true, new: true }
    );

    // 4. Buat Checkout baru
    const newCheckout = await Checkout.create({
      sessionId: user._id.toString() + Date.now(),
      customerInfo: customerInfo,
      items: checkoutItems,
      subtotal,
      tax,
      shippingCost,
      total,
      status: "PENDING",
    });

    // 5. Tambahkan checkout ke daftar order user
    user.orders.push(newCheckout._id);
    await user.save();

    return Response.json({ success: true, data: newCheckout });
  } catch (error) {
    console.error("Checkout Create Error:", error);
    return Response.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
