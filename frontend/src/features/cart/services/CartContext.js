import React, { createContext, useContext, useState, useEffect } from "react";
import API from "../../login_register/services/api";
import { toast } from "react-toastify";
import { useLocation } from "react-router-dom";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  const isAuthenticated = () => !!localStorage.getItem("token");

  // --- Guest Cart Helpers ---
  const getGuestCart = () => {
    try {
      return JSON.parse(localStorage.getItem("guest_cart")) || [];
    } catch {
      return [];
    }
  };

  const saveGuestCart = (items) => {
    localStorage.setItem("guest_cart", JSON.stringify(items));
  };

  // --- Load cart on mount / location change ---
  useEffect(() => {
    if (isAuthenticated()) {
      fetchCart();
    } else {
      setCartItems(getGuestCart());
    }
  }, [location]);

  // --- Sync guest cart to server on login ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    const guestCart = getGuestCart();

    if (token && guestCart.length > 0) {
      (async () => {
        for (const item of guestCart) {
          try {
            await API.post("cartitems/", {
              product_id: item.product_data?.id || item.product,
              quantity: item.quantity,
            });
          } catch (err) {
            console.error("❌ Lỗi khi sync giỏ hàng:", err);
          }
        }
        localStorage.removeItem("guest_cart");
        fetchCart();
      })();
    }
  }, []);

  // --- Fetch user cart from API ---
  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await API.get("cartitems/");
      setCartItems(res.data);
    } catch {
      setCartItems([]);
    }
    setLoading(false);
  };

  // --- Add to cart ---
  const addToCart = async (
    productId,
    quantity = 1,
    onSuccess,
    onError,
    productInfo
  ) => {
    if (!productId || quantity <= 0) return;

    setLoading(true);
    const token = localStorage.getItem("token");

    if (token) {
      try {
        console.log("🟡 Đang gửi:", { product_id: productId, quantity });
        await API.post("cartitems/", {
          product_id: productId,
          quantity,
        });
        await fetchCart();
        if (onSuccess) onSuccess();
      } catch (err) {
        console.error("❌ addToCart error:", err.response?.data || err.message); // ❗ CHỈNH Ở ĐÂY
        if (onError) onError(err);
        else
          toast.error(
            "Lỗi: " +
              (err.response?.data?.detail || "Không thể thêm vào giỏ hàng")
          );
      }
    } else {
      // Guest
      let items = getGuestCart();
      const idx = items.findIndex((i) => i.product === productId);
      if (idx >= 0) {
        items[idx].quantity += quantity;
      } else {
        items.push({
          product: productId,
          quantity,
          product_data: {
            id: productInfo?.id || productId,
            name: productInfo?.name || "",
            price: productInfo?.price || 0,
            image: productInfo?.image || "",
          },
        });
      }
      saveGuestCart(items);
      setCartItems(items);
      if (onSuccess) onSuccess();
    }
    setLoading(false);
  };

  // --- Update quantity ---
  const updateQuantity = async (itemId, quantity) => {
    setLoading(true);
    if (isAuthenticated()) {
      try {
        await API.put(`cartitems/${itemId}/update-quantity/`, { quantity });
        await fetchCart();
      } catch (err) {
        console.error("❌ updateQuantity error:", err);
      }
    } else {
      let items = getGuestCart();
      const idx = items.findIndex((i) => i.product === itemId);
      if (idx >= 0) {
        items[idx].quantity = quantity;
        saveGuestCart(items);
        setCartItems(items);
      }
    }
    setLoading(false);
  };

  // --- Remove from cart ---
  const removeFromCart = async (itemId) => {
    setLoading(true);
    if (isAuthenticated()) {
      try {
        await API.delete(`cartitems/${itemId}/delete/`);
        await fetchCart();
      } catch (err) {
        console.error("❌ removeFromCart error:", err);
      }
    } else {
      let items = getGuestCart();
      items = items.filter((i) => i.product !== itemId);
      saveGuestCart(items);
      setCartItems(items);
    }
    setLoading(false);
  };

  // --- Clear cart ---
  const clearCart = async () => {
    setLoading(true);
    if (isAuthenticated()) {
      try {
        for (const item of cartItems) {
          await API.delete(`cartitems/${item.id}/delete/`);
        }
        await fetchCart();
      } catch (err) {
        console.error("❌ clearCart error:", err);
      }
    } else {
      saveGuestCart([]);
      setCartItems([]);
    }
    setLoading(false);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
