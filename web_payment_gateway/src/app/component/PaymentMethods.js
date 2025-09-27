import { PAYMENT_METHODS } from "../utils/constants";

export default function PaymentMethods({
  selectedMethod,
  onMethodChange,
  className = "",
}) {
  return (
    <div className={className}>
      <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
      <div className="space-y-3">
        {PAYMENT_METHODS.map((method) => (
          <label
            key={method.id}
            className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
              selectedMethod === method.id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:bg-gray-50"
            }`}
          >
            <input
              type="radio"
              name="payment_method"
              value={method.id}
              checked={selectedMethod === method.id}
              onChange={(e) => onMethodChange(e.target.value)}
              className="mr-3 text-blue-600"
            />
            <span className="mr-3 text-xl">{method.icon}</span>
            <span className="font-medium">{method.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
