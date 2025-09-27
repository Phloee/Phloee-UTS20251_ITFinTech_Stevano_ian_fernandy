// src/app/select-items/page.js
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { formatCurrency } from "../utils/formatCurrency"; 
import { CATEGORIES } from "../utils/constants";

export default function SelectItems() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState([]);

  useEffect(() => {
    loadProducts();
    if (typeof window !== "undefined") {
      const savedCart = localStorage.getItem("shopping_cart");
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    }
  }, [selectedCategory]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const url =
        selectedCategory === "All"
          ? "/api/products"
          : `/api/products?category=${selectedCategory}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setProducts(data.data);
      } else {
        console.error("Failed to load products:", data.error);
      }
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    const existingItemIndex = cart.findIndex(
      (item) => item._id === product._id
    );
    let newCart;

    if (existingItemIndex > -1) {
      newCart = [...cart];
      newCart[existingItemIndex].quantity += 1;
    } else {
      newCart = [...cart, { ...product, quantity: 1 }];
    }

    setCart(newCart);
    localStorage.setItem("shopping_cart", JSON.stringify(newCart));
    alert(`${product.name} berhasil ditambahkan ke keranjang!`);
  };

  const goToCheckout = () => {
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount === 0) {
      alert("Mohon tambahkan item ke keranjang terlebih dahulu");
      return;
    }
    router.push("/checkout");
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">
              🛒🐟 IkanLele Shop
            </h1>
            <button
              onClick={goToCheckout}
              className="bg-lavender hover:bg-lavender/90 text-white px-4 py-2 rounded-lg flex items-center space-x-2 relative"
            >
              <span>🛒</span>
              <span>Cart ({cartCount})</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lavender"
            />
            <div className="flex space-x-2">
              {/* Periksa apakah CATEGORIES Anda didefinisikan dengan value: "All", "Drinks", "Snacks", "Bundle" */}
              {CATEGORIES.map((category) => (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedCategory === category.value
                      ? "bg-lavender text-white shadow-md"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lavender"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative h-48 w-full">
      
                    <Image
                      src={product.imageUrl}
                      alt={product.name || "Product Image"}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 25vw"
                    />
                  )
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {product.description}
                  </p>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-2xl font-bold text-lavender">
                      {formatCurrency(product.price)}
                    </span>
                    <span className="text-sm text-gray-500">
                      Stock: {product.stock}
                    </span>
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    disabled={product.stock === 0}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                      product.stock === 0
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-lavender text-white hover:bg-lavender/90"
                    }`}
                  >
                    {product.stock === 0 ? "Stok Habis" : "Tambah ke Keranjang"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredProducts.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Produk tidak ditemukan
            </h3>
            <p className="text-gray-600">
              Coba sesuaikan kriteria pencarian atau filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
