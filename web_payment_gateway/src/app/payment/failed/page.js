"use client";
import { useRouter, useSearchParams } from "next/navigation";

export default function PaymentFailed() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const external_id = searchParams.get("external_id");
  const error = searchParams.get("error");

  const retryPayment = () => {
    router.push("/checkout");
  };

  const goBackToStore = () => {
    router.push("/select-items");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Failed
          </h2>
          <p className="text-gray-600 mb-8">
            We couldn't process your payment. Please try again or contact
            support if the problem persists.
          </p>

          {external_id && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8 text-left">
              <h3 className="font-semibold text-lg mb-4">
                Transaction Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="text-red-600 font-semibold">FAILED</span>
                </div>
                {error && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Error:</span>
                    <span className="text-red-600">{error}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={retryPayment}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Try Again
            </button>

            <button
              onClick={goBackToStore}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Back to Store
            </button>

            <p className="text-sm text-gray-500">
              Need help? Contact our support team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
