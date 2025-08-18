import React, { createContext, useContext, useState, useEffect } from "react";
import API from "../../login_register/services/api";
import { toast } from "react-toastify";
import { useLocation } from "react-router-dom";
import axios from "axios";


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
        const res = await API.post("cartitems/", {
          product_id: productId,
          quantity,
        });
        // Nếu API trả về status 200/201 hoặc có data, coi là thành công
        if (res && res.status >= 200 && res.status < 300) {
          await fetchCart();
          if (onSuccess) onSuccess();
        } else {
          if (onError) onError(new Error("Không thể thêm vào giỏ hàng"));
        }
      } catch (err) {
        // Nếu lỗi là UNIQUE constraint (đã có sản phẩm trong cart), thì gọi updateQuantity để tăng số lượng
        const errMsg = err.response?.data?.detail || err.message || "";
        if (
          errMsg.includes("UNIQUE constraint failed") ||
          errMsg.includes("unique")
        ) {
          // Luôn fetch lại cart để lấy itemId mới nhất từ response, không lấy từ state
          let latestCart = [];
          try {
            setLoading(true);
            const res = await API.get("cartitems/");
            latestCart = res.data || [];
            setCartItems(latestCart); // vẫn update state cho UI
          } catch {}
          // Tìm item trong latestCart (không lấy từ state)
          const item = latestCart.find(
            (i) => i.product === productId || i.product_data?.id === productId
          );
          if (item) {
            await API.put(`cartitems/${item.id}/update-quantity/`, {
              quantity: item.quantity + quantity,
            });
            await fetchCart();
            if (onSuccess) onSuccess();
            setLoading(false);
            return;
          }
        }
        // Nếu lỗi nhưng vẫn fetchCart được (trường hợp backend trả lỗi nhưng vẫn thêm)
        try {
          await fetchCart();
          // Kiểm tra xem sản phẩm đã có trong cart chưa
          const found = cartItems.some(
            (item) =>
              item.product === productId || item.product_data?.id === productId
          );
          if (found) {
            if (onSuccess) onSuccess();
            setLoading(false);
            return;
          }
        } catch {}
        console.error("❌ addToCart error:", err.response?.data || err.message);
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
  // CartContext.js
// --- Update quantity ---
const updateQuantity = async (cartItemId, newQuantity) => {
  try {
    if (isAuthenticated()) {
      if (newQuantity < 1) {
        // Xóa item nếu số lượng < 1
        await API.delete(`cartitems/${cartItemId}/`);
        setCartItems((prev) => prev.filter((item) => item.id !== cartItemId));
      } else {
        // Update số lượng
        const res = await API.patch(`cartitems/${cartItemId}/`, {
          quantity: newQuantity,
        });
        setCartItems((prev) =>
          prev.map((item) =>
            item.id === cartItemId
              ? { ...item, quantity: res.data.quantity }
              : item
          )
        );
      }
    } else {
      // --- Guest cart ---
      let items = getGuestCart();
      if (newQuantity < 1) {
        items = items.filter((item) => item.product !== cartItemId);
      } else {
        items = items.map((item) =>
          item.product === cartItemId
            ? { ...item, quantity: newQuantity }
            : item
        );
      }
      saveGuestCart(items);
      setCartItems(items);
    }
  } catch (err) {
    console.error("❌ updateQuantity error:", err.response?.data || err.message);
    toast.error("Không thể cập nhật số lượng sản phẩm");
  }
};

  // --- Remove from cart ---
  const removeFromCart = async (itemId) => {
    setLoading(true);
    if (isAuthenticated()) {
      try {
        await API.delete(`cartitems/${itemId}/`);
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
    setCartItems([]); // Cập nhật UI ngay lập tức
    if (isAuthenticated()) {
      try {
        for (const item of cartItems) {
          await API.delete(`cartitems/${item.id}/`);
        }
      } catch (err) {
        console.error("❌ clearCart error:", err);
      }
    } else {
      saveGuestCart([]);
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
