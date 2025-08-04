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

  // Helper: get guest cart from localStorage
  const getGuestCart = () => {
    try {
      return JSON.parse(localStorage.getItem("guest_cart")) || [];
    } catch {
      return [];
    }
  };

  // Helper: save guest cart to localStorage
  const saveGuestCart = (items) => {
    localStorage.setItem("guest_cart", JSON.stringify(items));
  };

  // On mount or location change, load cart
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchCart();
    } else {
      setCartItems(getGuestCart());
    }
  }, [location]);

  // Sync guest cart to backend on login
  useEffect(() => {
    const token = localStorage.getItem("token");
    const guestCart = getGuestCart();

    if (token && guestCart.length > 0) {
      console.warn("🟨 Sync guest cart useEffect running", {
        token,
        guestCart,
      });

      // IIFE để dùng async trong useEffect
      (async () => {
        for (const item of guestCart) {
          console.log("🧪 Syncing item:", item);
          console.log(
            "🧪 Sending product ID:",
            item.product_data?.id || item.product
          );
          try {
            await API.post("cartitems/", {
              product: item.product_data?.id || item.product,
              quantity: item.quantity,
            });
          } catch (err) {
            console.error("❌ Sync cart item failed:", err);
          }
        }

        localStorage.removeItem("guest_cart");
        fetchCart();
      })();
    }
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await API.get("cartitems/");
      setCartItems(res.data);
    } catch (err) {
      setCartItems([]);
    }
    setLoading(false);
  };

  // Thêm sản phẩm vào giỏ hàng
  const addToCart = async (
    productId,
    quantity = 1,
    onSuccess,
    onError,
    productInfo
  ) => {
    const token = localStorage.getItem("token");
    setLoading(true);
    if (token) {
      try {
        await API.post("cartitems/", { product: productId, quantity });
        await fetchCart();
        if (onSuccess) onSuccess();
      } catch (err) {
        if (onError) onError(err);
        else toast.error("Không thể thêm vào giỏ hàng. Vui lòng thử lại.");
      }
    } else {
      // Guest: lưu vào localStorage với đầy đủ thông tin sản phẩm
      let items = getGuestCart();
      const idx = items.findIndex((i) => i.product === productId);
      if (idx >= 0) {
        items[idx].quantity += quantity;
      } else {
        // productInfo: { id, name, price, image }
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

  // Cập nhật số lượng sản phẩm trong giỏ hàng
  const updateQuantity = async (itemId, quantity) => {
    const token = localStorage.getItem("token");
    setLoading(true);
    if (token) {
      try {
        await API.put(`cartitems/${itemId}/update_quantity/`, { quantity });
        await fetchCart();
      } catch (err) {}
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

  // Xóa sản phẩm khỏi giỏ hàng
  const removeFromCart = async (itemId) => {
    const token = localStorage.getItem("token");
    setLoading(true);
    if (token) {
      try {
        await API.delete(`cartitems/${itemId}/delete/`);
        await fetchCart();
      } catch (err) {}
    } else {
      let items = getGuestCart();
      items = items.filter((i) => i.product !== itemId);
      saveGuestCart(items);
      setCartItems(items);
    }
    setLoading(false);
  };

  // Xóa toàn bộ giỏ hàng
  const clearCart = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    if (token) {
      try {
        for (const item of cartItems) {
          await API.delete(`cartitems/${item.id}/delete/`);
        }
        await fetchCart();
      } catch (err) {
        console.error("Error clearing cart:", err);
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
        fetchCart, // ✅ Thêm dòng này để các component khác sử dụng được fetchCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
