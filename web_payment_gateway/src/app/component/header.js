"use client";
import { useRouter } from "next/navigation";
import { useAuthContext } from "../context/AuthContext";

export default function Header({
  title = "Payment Gateway Store",
  cartCount = 0,
}) {
  const router = useRouter();
  const { authState } = useAuthContext();

  const goToCart = () => {
    // Read local cart length to decide
    let localCart = [];
    if (typeof window !== "undefined") {
      try {
        localCart = JSON.parse(localStorage.getItem("shopping_cart") || "[]");
      } catch (e) {
        localCart = [];
      }
    }
    const localCount = localCart.reduce((s, it) => s + (it.quantity || 0), 0);
    if (localCount === 0) {
      alert("Cart is empty!");
      return;
    }

    const isLoggedIn =
      typeof window !== "undefined" &&
      (localStorage.getItem("isLoggedIn") === "true" ||
        !!localStorage.getItem("user"));
    if (!isLoggedIn) {
      // Save redirect so after login we return and auto-submit
      localStorage.setItem("checkoutRedirect", "/checkout?auto=1");
      router.push("/login");
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

            {/* Profile Icon - Minimal Design */}
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              {authState?.isAuthenticated ? (
                <span className="text-gray-600 font-medium">
                  {authState.user?.username?.charAt(0).toUpperCase() || "U"}
                </span>
              ) : (
                <span className="text-gray-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
