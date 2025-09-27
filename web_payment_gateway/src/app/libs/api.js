// src/lib/api.js
const API_BASE = "/api";

export const api = {
  // Products
  getProducts: async (category = "") => {
    try {
      const url = category
        ? `${API_BASE}/products?category=${category}`
        : `${API_BASE}/products`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching products:", error);
      return { success: false, error: error.message };
    }
  },

  // Checkout
  createCheckout: async (checkoutData) => {
    try {
      const response = await fetch(`${API_BASE}/checkout/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkoutData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating checkout:", error);
      return { success: false, error: error.message };
    }
  },

  // Payment
  createPayment: async (checkoutId) => {
    try {
      const response = await fetch(`${API_BASE}/payment/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ checkoutId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating payment:", error);
      return { success: false, error: error.message };
    }
  },

  // Seed data
  seedProducts: async () => {
    try {
      const response = await fetch(`${API_BASE}/seed`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error seeding products:", error);
      return { success: false, error: error.message };
    }
  },

  // Get payment status
  getPaymentStatus: async (externalId) => {
    try {
      const response = await fetch(`${API_BASE}/payment/status/${externalId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting payment status:", error);
      return { success: false, error: error.message };
    }
  },
};



