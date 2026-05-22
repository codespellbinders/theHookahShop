import React, { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem("cart_items");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("cart_items", JSON.stringify(items));
  }, [items]);

  const addToCart = (product, qty = 1) => {
    setItems((prev) => {
      const found = prev.find((p) => p.id === product.id);
      if (found) {
        return prev.map((p) => (p.id === product.id ? { ...p, qty: (p.qty || 0) + qty } : p));
      }
      return [...prev, { ...product, qty }];
    });
  };

  const removeFromCart = (productId) => setItems((prev) => prev.filter((p) => p.id !== productId));

  const updateQty = (productId, qty) => {
    if (qty <= 0) return removeFromCart(productId);
    setItems((prev) => prev.map((p) => (p.id === productId ? { ...p, qty } : p)));
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((s, it) => s + it.price * (it.qty || 1), 0);

  const openCart = () => setDrawerOpen(true);
  const closeCart = () => setDrawerOpen(false);

  const value = { items, addToCart, removeFromCart, updateQty, clearCart, total, drawerOpen, openCart, closeCart };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
