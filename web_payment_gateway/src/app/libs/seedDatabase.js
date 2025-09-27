

import dbConnect from "./mongodb";
import Product from "../models/Product";
import { sampleProducts } from "../utils/seedData"; // <-- Pastikan path ini benar

export async function seedProducts() {
  try {
    await dbConnect(); // Koneksi ke DB

    // Clear existing products
    await Product.deleteMany({});

    // Insert sample products
    const createdProducts = await Product.insertMany(sampleProducts);

    console.log(`✅ Seeded ${createdProducts.length} products successfully`);
    return createdProducts;
  } catch (error) {
    console.error("❌ Error seeding products:", error);
    throw error;
  }
}
