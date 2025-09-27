import { formatCurrency } from "../../utils/formatCurrency";

export default function OrderSummary({
  subtotal,
  tax,
  shippingCost,
  total,
  itemCount,
  className = "",
}) {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

      <div className="space-y-3 border-t pt-4">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal ({itemCount} items)</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>

        <div className="flex justify-between text-gray-600">
          <span>Tax (10%)</span>
          <span>{formatCurrency(tax)}</span>
        </div>

        <div className="flex justify-between text-gray-600">
          <span>Shipping</span>
          <span>
            {shippingCost === 0 ? (
              <span className="text-green-600 font-medium">FREE</span>
            ) : (
              formatCurrency(shippingCost)
            )}
          </span>
        </div>

        {shippingCost === 0 && subtotal < 50000 && (
          <p className="text-xs text-green-600">
            Free shipping on orders over {formatCurrency(50000)}
          </p>
        )}

        <div className="border-t pt-3 mt-3">
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-blue-600">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
