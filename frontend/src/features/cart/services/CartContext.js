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

  // Guest cart helpers
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

  // Fetch cart
  const fetchCart = async () => {
    setLoading(true);
    try {
      if (isAuthenticated()) {
        const res = await API.get("cartitems/");
        const itemsWithSelected = res.data.map(i => ({ ...i, selected: true }));
        setCartItems(itemsWithSelected);
      } else {
        const guestItems = getGuestCart().map(i => ({ ...i, selected: true }));
        setCartItems(guestItems);
      }
    } catch (err) {
      console.error(err);
      setCartItems([]);
    }
    setLoading(false);
  };

  // Load cart on mount / location change
  useEffect(() => {
    fetchCart();
  }, [location]);

  // Sync guest cart to server on login
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
            console.error("❌ Sync guest cart error:", err);
          }
        }
        localStorage.removeItem("guest_cart");
        fetchCart();
      })();
    }
  }, []);

  // Add item
  const addToCart = async (productId, quantity = 1, productInfo) => {
    if (!productId || quantity < 1) return;
    setLoading(true);
    try {
      if (isAuthenticated()) {
        await API.post("cartitems/", { product_id: productId, quantity });
        await fetchCart();
      } else {
        let items = getGuestCart();
        const idx = items.findIndex(i => i.product === productId);
        if (idx >= 0) items[idx].quantity += quantity;
        else items.push({
          product: productId,
          quantity,
          product_data: { id: productInfo?.id || productId, name: productInfo?.name || "", price: productInfo?.price || 0 }
        });
        saveGuestCart(items);
        setCartItems(items.map(i => ({ ...i, selected: true })));
      }
    } catch (err) {
      console.error(err);
      toast.error("Không thể thêm vào giỏ hàng");
    }
    setLoading(false);
  };

  // Update quantity
  const updateQuantity = async (itemId, newQty) => {
    if (newQty < 1) return removeFromCart(itemId);
    if (isAuthenticated()) {
      try {
        await API.patch(`cartitems/${itemId}/`, { quantity: newQty });
        await fetchCart();
      } catch (err) {
        console.error(err);
        toast.error("Không thể cập nhật số lượng");
      }
    } else {
      let items = getGuestCart().map(i => i.product === itemId ? { ...i, quantity: newQty } : i);
      saveGuestCart(items);
      setCartItems(items.map(i => ({ ...i, selected: true })));
    }
  };

  // Remove item
  const removeFromCart = async (itemId) => {
    if (isAuthenticated()) {
      try {
        await API.delete(`cartitems/${itemId}/`);
        await fetchCart();
      } catch (err) {
        console.error(err);
      }
    } else {
      let items = getGuestCart().filter(i => i.product !== itemId);
      saveGuestCart(items);
      setCartItems(items.map(i => ({ ...i, selected: true })));
    }
  };

  // Clear cart
  const clearCart = async () => {
    if (isAuthenticated()) {
      for (const item of cartItems) {
        await API.delete(`cartitems/${item.id}/`);
      }
    }
    setCartItems([]);
    saveGuestCart([]);
  };

  // Tick/untick
  const selectAllItems = () => setCartItems(prev => prev.map(i => ({ ...i, selected: true })));
  const deselectAllItems = () => setCartItems(prev => prev.map(i => ({ ...i, selected: false })));
  const toggleItem = (itemId) => setCartItems(prev =>
    prev.map(i => (i.id === itemId || i.product === itemId ? { ...i, selected: !i.selected } : i))
  );

  return (
    <CartContext.Provider value={{
      cartItems, loading, addToCart, updateQuantity, removeFromCart, clearCart,
      fetchCart, selectAllItems, deselectAllItems, toggleItem
    }}>
      {children}
    </CartContext.Provider>
  );
};
