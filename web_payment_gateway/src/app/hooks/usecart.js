// src/hooks/useCart.js
"use client";
import { useState, useEffect } from "react";

// Cart utility functions
const getCartFromStorage = () => {
  if (typeof window !== "undefined") {
    try {
      const cart = localStorage.getItem("shopping_cart");
      return cart ? JSON.parse(cart) : [];
    } catch (error) {
      console.error("Error getting cart from storage:", error);
      return [];
    }
  }
  return [];
};

const saveCartToStorage = (cart) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("shopping_cart", JSON.stringify(cart));
    } catch (error) {
      console.error("Error saving cart to storage:", error);
    }
  }
};

const addToCartUtil = (product, quantity = 1) => {
  const cart = getCartFromStorage();
  const existingItemIndex = cart.findIndex((item) => item._id === product._id);

  if (existingItemIndex > -1) {
    cart[existingItemIndex].quantity += quantity;
  } else {
    cart.push({
      ...product,
      quantity,
    });
  }

  saveCartToStorage(cart);
  return cart;
};

const removeFromCartUtil = (productId) => {
  const cart = getCartFromStorage();
  const updatedCart = cart.filter((item) => item._id !== productId);
  saveCartToStorage(updatedCart);
  return updatedCart;
};

const updateCartQuantityUtil = (productId, quantity) => {
  const cart = getCartFromStorage();
  const itemIndex = cart.findIndex((item) => item._id === productId);

  if (itemIndex > -1) {
    if (quantity <= 0) {
      cart.splice(itemIndex, 1);
    } else {
      cart[itemIndex].quantity = quantity;
    }
  }

  saveCartToStorage(cart);
  return cart;
};

const clearCartUtil = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("shopping_cart");
  }
  return [];
};

const calculateCartTotals = (cart) => {
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const tax = Math.round(subtotal * 0.1); // 10% tax
  const shippingCost = subtotal > 50000 ? 0 : 10000; // Free shipping over 50k IDR
  const total = subtotal + tax + shippingCost;

  return {
    subtotal,
    tax,
    shippingCost,
    total,
    itemCount: cart.reduce((sum, item) => sum + item.quantity, 0),
  };
};

// Custom hook
export const useCart = () => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCart(getCartFromStorage());
    setLoading(false);
  }, []);

  const addToCart = (product, quantity = 1) => {
    const updatedCart = addToCartUtil(product, quantity);
    setCart(updatedCart);
    return updatedCart;
  };

  const removeFromCart = (productId) => {
    const updatedCart = removeFromCartUtil(productId);
    setCart(updatedCart);
    return updatedCart;
  };

  const updateQuantity = (productId, quantity) => {
    const updatedCart = updateCartQuantityUtil(productId, quantity);
    setCart(updatedCart);
    return updatedCart;
  };

  const clearCart = () => {
    const updatedCart = clearCartUtil();
    setCart(updatedCart);
    return updatedCart;
  };

  const totals = calculateCartTotals(cart);

  return {
    cart,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    ...totals,
  };
};
