// src/app/select-items/page.js
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { formatCurrency } from "../utils/formatCurrency";
import { CATEGORIES } from "../utils/constants";

export default function SelectItems() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState([]);

  // Load cart dari localStorage (tidak perlu login)
  useEffect(() => {
    const savedCart = localStorage.getItem("shopping_cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error("Error parsing cart:", error);
        setCart([]);
      }
    }
    loadProducts();
  }, []);

  // Load products saat kategori berubah
  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      alert("Keranjang kosong! Silakan tambahkan produk terlebih dahulu.");
      return;
    }

    // Langsung ke halaman checkout, biarkan halaman checkout yang handle authentication
    router.push("/checkout");
  };

  const handleLogout = async () => {
    const confirmLogout = confirm(
      "Yakin ingin logout? Keranjang akan dikosongkan."
    );
    if (!confirmLogout) return;

    // Clear cart saat logout
    localStorage.removeItem("shopping_cart");
    setCart([]);
    await signOut({ callbackUrl: "/select-items" });
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top Bar dengan Cart dan User Info */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-3xl font-bold text-gray-900">
            🐟 Katalog Produk
          </h2>

          <div className="flex items-center space-x-4">
            {/* Cart Button - Selalu tampil */}
            <button
              onClick={goToCheckout}
              className="relative bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-sm"
            >
              <span>🛒 Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold shadow-md">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>

            {/* User Profile & Auth */}
            {status === "loading" ? (
              <div className="bg-white px-4 py-2 rounded-lg shadow-sm">
                <div className="animate-pulse flex items-center space-x-2">
                  <div className="w-9 h-9 bg-gray-200 rounded-full"></div>
                  <div className="h-4 w-20 bg-gray-200 rounded"></div>
                </div>
              </div>
            ) : status === "authenticated" ? (
              <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-lg shadow-sm">
                <div
                  className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-200"
                  title={session.user?.email || "User"}
                >
                  <span className="text-blue-700 font-semibold">
                    {session.user?.name?.charAt(0).toUpperCase() ||
                      session.user?.email?.charAt(0).toUpperCase() ||
                      "U"}
                  </span>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900 leading-tight">
                    {session.user?.name || "User"}
                  </p>
                  <p className="text-xs text-gray-500">{session.user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-600 hover:text-red-700 hover:underline font-medium"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => router.push("/login")}
                className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg border border-gray-300 transition-colors shadow-sm font-medium"
              >
                Login
              </button>
            )}
          </div>
        </div>

        {/* Info Banner untuk user yang belum login */}
        {status === "unauthenticated" && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">ℹ️</span>
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Belum login? Anda tetap bisa belanja!
                </p>
                <p className="text-xs text-blue-700">
                  Login akan diminta saat checkout untuk keamanan transaksi
                  Anda.
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/login")}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
            >
              Login Sekarang
            </button>
          </div>
        )}

        {/* Search & Category Filter */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            <input
              type="text"
              placeholder="🔍 Cari produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                    selectedCategory === category.value
                      ? "bg-blue-600 text-white shadow-md scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Memuat produk...</p>
            </div>
          </div>
        ) : (
          <>
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <div
                    key={product._id}
                    className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="relative h-48 w-full bg-gray-100">
                      <Image
                        src={product.imageUrl || "/placeholder.jpg"}
                        alt={product.name || "Product Image"}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.jpg";
                        }}
                      />
                      {product.stock === 0 && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold">
                            HABIS
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2 h-10">
                        {product.description}
                      </p>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-2xl font-bold text-blue-600">
                          {formatCurrency(product.price)}
                        </span>
                        <span
                          className={`text-sm font-medium ${
                            product.stock > 10
                              ? "text-green-600"
                              : product.stock > 0
                              ? "text-orange-600"
                              : "text-red-600"
                          }`}
                        >
                          Stock: {product.stock}
                        </span>
                      </div>
                      <button
                        onClick={() => addToCart(product)}
                        disabled={product.stock === 0}
                        className={`w-full py-2.5 px-4 rounded-lg font-medium transition-all ${
                          product.stock === 0
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                        }`}
                      >
                        {product.stock === 0
                          ? "Stok Habis"
                          : "🛒 Tambah ke Keranjang"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-lg shadow-sm">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Produk tidak ditemukan
                </h3>
                <p className="text-gray-600 mb-4">
                  Coba sesuaikan kriteria pencarian atau filter kategori.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All");
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                >
                  Reset Filter
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
