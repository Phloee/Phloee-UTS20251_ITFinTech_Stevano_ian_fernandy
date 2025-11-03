// scripts/seed.js
const mongoose = require("mongoose");
// Load environment variables. Prefer project-level .env, fall back to .env.local if present.
// Using config() without path lets dotenv load .env or .env.local depending on environment.
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ Please define MONGO_URI environment variable");
  process.exit(1);
}

// Product Schema (duplicate for seeding script)
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["All", "Drinks", "Snacks", "Bundle"],
    },
    imageUrl: {
      type: String,
      default: "",
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);

// Sample data untuk seeding
const sampleProducts = [
  {
    name: "Coca Cola",
    price: 5000,
    description: "Refreshing cola drink 330ml",
    category: "Drinks",
    stock: 100,
    imageUrl: "/images/coca-cola.jpg",
  },
  {
    name: "Orange Juice",
    price: 7000,
    description: "Fresh orange juice 500ml",
    category: "Drinks",
    stock: 50,
    imageUrl: "/images/orange-juice.jpg",
  },
  {
    name: "Water Bottle",
    price: 3000,
    description: "Pure mineral water 600ml",
    category: "Drinks",
    stock: 200,
    imageUrl: "/images/water-bottle.jpg",
  },
  {
    name: "Green Tea",
    price: 6000,
    description: "Japanese green tea 350ml",
    category: "Drinks",
    stock: 75,
    imageUrl: "/images/green-tea.jpg",
  },
  {
    name: "Energy Drink",
    price: 8000,
    description: "Energy boost drink 250ml",
    category: "Drinks",
    stock: 60,
    imageUrl: "/images/energy-drink.jpg",
  },
  {
    name: "Potato Chips",
    price: 8000,
    description: "Crispy potato chips 150g",
    category: "Snacks",
    stock: 75,
    imageUrl: "/images/potato-chips.jpg",
  },
  {
    name: "Chocolate Bar",
    price: 12000,
    description: "Milk chocolate bar 100g",
    category: "Snacks",
    stock: 60,
    imageUrl: "/images/chocolate-bar.jpg",
  },
  {
    name: "Cookies",
    price: 9000,
    description: "Chocolate chip cookies 200g",
    category: "Snacks",
    stock: 80,
    imageUrl: "/images/cookies.jpg",
  },
  {
    name: "Nuts Mix",
    price: 15000,
    description: "Mixed nuts variety pack 250g",
    category: "Snacks",
    stock: 40,
    imageUrl: "/images/nuts-mix.jpg",
  },
  {
    name: "Candy Pack",
    price: 6000,
    description: "Assorted candy pack 150g",
    category: "Snacks",
    stock: 90,
    imageUrl: "/images/candy-pack.jpg",
  },
  {
    name: "Crackers",
    price: 7000,
    description: "Cheese crackers 180g",
    category: "Snacks",
    stock: 65,
    imageUrl: "/images/crackers.jpg",
  },
  {
    name: "Snack Bundle",
    price: 25000,
    description: "Mix of popular snacks (3 items)",
    category: "Bundle",
    stock: 30,
    imageUrl: "/images/snack-bundle.jpg",
  },
  {
    name: "Drink Bundle",
    price: 18000,
    description: "Combo of 3 different drinks",
    category: "Bundle",
    stock: 25,
    imageUrl: "/images/drink-bundle.jpg",
  },
  {
    name: "Party Bundle",
    price: 45000,
    description: "Perfect for parties (5 snacks + 3 drinks)",
    category: "Bundle",
    stock: 15,
    imageUrl: "/public/images/party-bundle.jpg",
  },
  {
    name: "Student Bundle",
    price: 20000,
    description: "Budget-friendly combo (2 snacks + 2 drinks)",
    category: "Bundle",
    stock: 35,
    imageUrl: "/images/student-bundle.jpg",
  },
];

async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing products
    const deleteResult = await Product.deleteMany({});
    console.log(`🗑️  Cleared ${deleteResult.deletedCount} existing products`);

    // Insert new products
    const createdProducts = await Product.insertMany(sampleProducts);
    console.log(`✅ Successfully seeded ${createdProducts.length} products`);

    // Display seeded products by category
    const productsByCategory = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          totalStock: { $sum: "$stock" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    console.log("\n📊 Products by Category:");
    productsByCategory.forEach((cat) => {
      console.log(
        `  ${cat._id}: ${cat.count} products, ${cat.totalStock} total stock`
      );
    });

    console.log("\n🎉 Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
}

// Run seeding if script is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, sampleProducts };

// Additional utility functions for testing
async function clearDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const collections = ["products", "checkouts", "payments", "users"];

    for (const collection of collections) {
      try {
        await mongoose.connection.db.collection(collection).deleteMany({});
        console.log(`🗑️  Cleared ${collection} collection`);
      } catch (error) {
        console.log(`⚠️  Collection ${collection} might not exist yet`);
      }
    }

    console.log("🎉 Database cleared successfully!");
  } catch (error) {
    console.error("❌ Error clearing database:", error);
  } finally {
    await mongoose.connection.close();
  }
}

// Export for use in other scripts
module.exports = { seedDatabase, sampleProducts, clearDatabase };
