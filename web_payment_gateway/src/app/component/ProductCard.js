"use client";
import { useState } from "react";
import { formatCurrency } from "../../utils/formatCurrency";

export default function ProductCard({ product, onAddToCart }) {
  const [loading, setLoading] = useState(false);

  const handleAddToCart = async () => {
    if (product.stock === 0) {
      alert("Product out of stock");
      return;
    }

    setLoading(true);
    try {
      await onAddToCart(product);
    } catch (error) {
      alert("Failed to add to cart");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
      {/* Product Image */}
      <div className="h-48 bg-gray-200 flex items-center justify-center relative overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
        ) : null}
        <div
          className="text-6xl text-gray-400"
          style={{ display: product.imageUrl ? "none" : "flex" }}
        >
        </div>

        {/* Category Badge */}
        <div className="absolute top-2 left-2">
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
            {product.category}
          </span>
        </div>

        {/* Stock Badge */}
        {product.stock <= 10 && product.stock > 0 && (
          <div className="absolute top-2 right-2">
            <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
              Low Stock
            </span>
          </div>
        )}

        {product.stock === 0 && (
          <div className="absolute top-2 right-2">
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
          {product.name}
        </h3>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {product.description || "No description available"}
        </p>

        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-2xl font-bold text-blue-600">
              {formatCurrency(product.price)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-sm text-gray-500">
              Stock:{" "}
              <span
                className={
                  product.stock <= 10 ? "text-orange-600 font-medium" : ""
                }
              >
                {product.stock}
              </span>
            </span>
          </div>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0 || loading}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
            product.stock === 0
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : loading
              ? "bg-blue-400 text-white cursor-wait"
              : "bg-blue-600 text-white hover:bg-blue-700 active:transform active:scale-95"
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Adding...</span>
            </div>
          ) : product.stock === 0 ? (
            "Out of Stock"
          ) : (
            "Add to Cart"
          )}
        </button>
      </div>
    </div>
  );
}
