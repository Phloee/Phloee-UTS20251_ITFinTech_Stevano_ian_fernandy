"use client";
import { useRouter } from "next/navigation";

export default function Header({
  title = "Payment Gateway Store",
  cartCount = 0,
}) {
  const router = useRouter();

  const goToCart = () => {
    if (cartCount === 0) {
      alert("Cart is empty!");
      return;
    }
    router.push("/checkout");
  };

  const goHome = () => {
    router.push("/select-items");
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center cursor-pointer" onClick={goHome}>
            <h1 className="text-2xl font-bold text-gray-900">🛒 {title}</h1>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            <button
              onClick={goHome}
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Products
            </button>
          </nav>

          <div className="flex items-center space-x-4">
            <button
              onClick={goToCart}
              className="relative bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <span>🛒</span>
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
