"use client";
import { useState, useEffect } from "react";
import { formatCurrency } from "../../utils/formatCurrency";

export default function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
  className = "",
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleQuantityChange = async (newQuantity) => {
    if (newQuantity < 0) return;

    setIsUpdating(true);
    try {
      if (newQuantity === 0) {
        await onRemove(item._id);
      } else {
        await onUpdateQuantity(item._id, newQuantity);
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Reset error state jika item berubah
  useEffect(() => {
    setImageError(false);
  }, [item._id, item.imageUrl]);

  return (
    <div
      className={`flex items-center space-x-4 p-4 bg-white rounded-lg border ${className} ${
        isUpdating ? "opacity-60" : ""
      }`}
    >
      {/* Product Image or Fallback */}
      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
        {item.imageUrl && !imageError ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className="text-2xl">image eror</span>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
        <p className="text-sm text-gray-600">{formatCurrency(item.price)}</p>
        {item.category && (
          <p className="text-xs text-gray-500">{item.category}</p>
        )}
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleQuantityChange(item.quantity - 1)}
          disabled={isUpdating || item.quantity <= 1}
          className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          −
        </button>
        <span className="w-12 text-center font-medium">{item.quantity}</span>
        <button
          onClick={() => handleQuantityChange(item.quantity + 1)}
          disabled={isUpdating}
          className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 disabled:opacity-50"
        >
          +
        </button>
      </div>

      {/* Subtotal */}
      <div className="text-right min-w-0">
        <p className="font-medium text-gray-900">
          {formatCurrency(item.price * item.quantity)}
        </p>
      </div>

      {/* Remove Button */}
      <button
        onClick={() => handleQuantityChange(0)}
        disabled={isUpdating}
        className="text-red-500 hover:text-red-700 p-2 disabled:opacity-50"
        title="Remove item"
      >
        🗑️
      </button>
    </div>
  );
}
