"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PaymentSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const external_id = searchParams.get("external_id");
  const [paymentDetails, setPaymentDetails] = useState(null);

  useEffect(() => {
    if (external_id) {
      // Clear cart from localStorage
      localStorage.removeItem("shopping_cart");

      // Set payment details
      setPaymentDetails({
        external_id,
        status: "PAID",
        timestamp: new Date().toISOString(),
      });
    }
  }, [external_id]);

  const goBackToStore = () => {
    router.push("/select-items");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h2>
          <p className="text-gray-600 mb-8">
            Thank you for your purchase. Your order has been confirmed and will
            be processed shortly.
          </p>

          {paymentDetails && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8 text-left">
              <h3 className="font-semibold text-lg mb-4">Payment Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="font-mono text-xs">
                    {paymentDetails.external_id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="text-green-600 font-semibold">
                    {paymentDetails.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Paid At:</span>
                  <span>
                    {new Date(paymentDetails.timestamp).toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={goBackToStore}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Continue Shopping
            </button>

            <p className="text-sm text-gray-500">
              You will receive an email confirmation shortly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
