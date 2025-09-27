export const CATEGORIES = [
  { value: "All", label: "All Items" },
  { value: "Drinks", label: "Drinks" },
  { value: "Snacks", label: "Snacks" },
  { value: "Bundle", label: "Bundle" },
];

export const PAYMENT_STATUS = {
  PENDING: "PENDING",
  PAID: "PAID",
  SETTLED: "SETTLED",
  EXPIRED: "EXPIRED",
  FAILED: "FAILED",
};

export const CHECKOUT_STATUS = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  CANCELLED: "CANCELLED",
};

export const PAYMENT_METHODS = [
  { id: "credit_card", name: "Credit/Debit Card", icon: "💳" },
  { id: "ewallet", name: "E-Wallet (OVO, GoPay, DANA)", icon: "📱" },
  { id: "bank_transfer", name: "Bank Transfer", icon: "🏦" },
  { id: "virtual_account", name: "Virtual Account", icon: "🏧" },
];
