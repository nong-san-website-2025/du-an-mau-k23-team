// src/features/cart/services/CartContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import API from "../../login_register/services/api";
import { toast } from "react-toastify";
import { productApi } from "../../products/services/productApi";

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

// Hàm helper trích xuất product ID nhất quán
const getItemProductId = (item) =>
  item.product_data?.id ||
  item.product?.id ||
  item.product_id ||
  item.product;

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const isAuthenticated = useCallback(
    () => !!localStorage.getItem("token"),
    []
  );

  // Guest cart helpers
  const getGuestCart = useCallback(() => {
    try {
      return JSON.parse(localStorage.getItem("guest_cart")) || [];
    } catch {
      return [];
    }
  }, []);

  const saveGuestCart = useCallback((items) => {
    localStorage.setItem("guest_cart", JSON.stringify(items));
  }, []);

  // Fetch cart
  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      if (isAuthenticated()) {
        const res = await API.get("cartitems/");
        const items = res.data;

        const itemsWithDetails = await Promise.all(
          items.map(async (item) => {
            if (item.product_data?.name) {
              return { ...item, selected: true };
            } else {
              try {
                const productId = item.product?.id || item.product_id;
                const prod = await productApi.getProduct(productId);
                return {
                  ...item,
                  selected: true,
                  product_data: {
                    id: prod.id,
                    name: prod.name,
                    price: prod.price,
                    image: prod.image,
                    category: prod.category,
                    stock: prod.stock,
                  },
                };
              } catch (err) {
                console.warn("⚠️ Không fetch được product:", item);
                return { ...item, selected: true };
              }
            }
          })
        );
        setCartItems(itemsWithDetails);
      } else {
        const guestItems = getGuestCart().map((i) => ({
          ...i,
          selected: true,
        }));
        setCartItems(guestItems);
      }
    } catch (err) {
      console.error("❌ Lỗi khi fetch giỏ hàng:", err);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, getGuestCart]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Sync guest cart on login
  useEffect(() => {
    const handleUserLoggedIn = async () => {
      const guestCart = getGuestCart();
      if (guestCart.length > 0 && !isSyncing) {
        setIsSyncing(true);
        try {
          const userCartRes = await API.get("cartitems/");
          const userCart = userCartRes.data || [];

          for (const guestItem of guestCart) {
            const guestProductId = getItemProductId(guestItem);
            const existingItem = userCart.find(
              (item) => getItemProductId(item) === guestProductId
            );

            if (existingItem) {
              await API.patch(`cartitems/${existingItem.id}/`, {
                quantity: existingItem.quantity + guestItem.quantity,
              });
            } else {
              await API.post("cartitems/", {
                product_id: guestProductId,
                quantity: guestItem.quantity,
              });
            }
          }

          localStorage.removeItem("guest_cart");
          await fetchCart();
        } catch (err) {
          console.error("❌ Sync guest cart failed:", err);
          toast.error("Đồng bộ giỏ hàng từ chế độ khách thất bại");
        } finally {
          setIsSyncing(false);
        }
      }
    };

    window.addEventListener("user-logged-in", handleUserLoggedIn);
    return () => window.removeEventListener("user-logged-in", handleUserLoggedIn);
  }, [getGuestCart, fetchCart, isSyncing]);

  // Add item
  const addToCart = useCallback(async (
    productId,
    quantity = 1,
    productInfo,
    onSuccess,
    onError
  ) => {
    if (!productId || quantity < 1) return;
    setLoading(true);
    try {
      if (isAuthenticated()) {
        await API.post("cartitems/", {
          product_id: productId,
          quantity,
          preorder: !!productInfo?.preorder,
        });
        await fetchCart();
      } else {
        let items = getGuestCart();
        const idx = items.findIndex((i) => getItemProductId(i) === productId);
        if (idx >= 0) {
          items[idx].quantity += quantity;
        } else {
          items.push({
            product: productId,
            quantity,
            preorder: !!productInfo?.preorder,
            product_data: {
              id: productInfo?.id || productId,
              name: productInfo?.name || "",
              price: productInfo?.price || 0,
            },
          });
        }
        saveGuestCart(items);
        setCartItems(items.map((i) => ({ ...i, selected: true })));
      }
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error("Không thể thêm vào giỏ hàng");
      onError?.(err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, fetchCart, getGuestCart, saveGuestCart]);

  // Update quantity
  const updateQuantity = useCallback(async (productId, newQty) => {
    if (newQty < 1) {
      await removeFromCart(productId);
      return;
    }

    if (isAuthenticated()) {
      const item = cartItems.find(i => getItemProductId(i) == productId);
      if (!item) return;

      try {
        await API.patch(`cartitems/${item.id}/`, { quantity: newQty });
        setCartItems(prev =>
          prev.map(i => (i.id === item.id ? { ...i, quantity: newQty } : i))
        );
      } catch (err) {
        console.error("Lỗi cập nhật số lượng:", err);
        toast.error("Cập nhật số lượng thất bại");
      }
    } else {
      const items = getGuestCart();
      const idx = items.findIndex(i => getItemProductId(i) === productId);
      if (idx >= 0) {
        items[idx].quantity = newQty;
        saveGuestCart(items);
        setCartItems(items.map(i => ({ ...i, selected: true })));
      }
    }
  }, [cartItems, isAuthenticated, getGuestCart, saveGuestCart]);

  // ✅ FIXED: removeFromCart không còn bị stale state
  const removeFromCart = useCallback(async (productId) => {
    if (!productId) return;

    if (isAuthenticated()) {
      // Dùng cartItems hiện tại (có thể stale, nhưng thường OK)
      const item = cartItems.find(i => getItemProductId(i) == productId);
      if (!item?.id) {
        console.warn("Item not found for deletion:", productId);
        return;
      }

      try {
        await API.delete(`cartitems/${item.id}/`);
        await fetchCart(); // ✅ Đồng bộ lại toàn bộ giỏ
      } catch (err) {
        console.error("Failed to delete cart item:", err);
        toast.error("Xóa sản phẩm thất bại");
      }
    } else {
      // ✅ Guest: luôn đọc từ localStorage → không stale
      const current = getGuestCart();
      const filtered = current.filter(i => getItemProductId(i) != productId);
      saveGuestCart(filtered);
      setCartItems(filtered.map(i => ({ ...i, selected: true })));
    }
  }, [cartItems, isAuthenticated, fetchCart, getGuestCart, saveGuestCart]);

  // Clear cart
  const clearCart = useCallback(async () => {
    if (isAuthenticated()) {
      for (const item of cartItems) {
        try {
          await API.delete(`cartitems/${item.id}/`);
        } catch (err) {
          console.error("Error deleting item:", err);
        }
      }
    }
    setCartItems([]);
    saveGuestCart([]);
  }, [cartItems, isAuthenticated, saveGuestCart]);

  // Clear selected items
  const clearSelectedItems = useCallback(async () => {
    const selectedItems = cartItems.filter(item => item.selected);
    if (isAuthenticated()) {
      for (const item of selectedItems) {
        try {
          await API.delete(`cartitems/${item.id}/`);
        } catch (err) {
          console.error("Error deleting cart item:", err);
        }
      }
    }
    // Update state
    setCartItems(prev => prev.filter(item => !item.selected));
    // Update guest cart
    const guestItems = getGuestCart();
    const updatedGuestItems = guestItems.filter(
      item => !selectedItems.some(sel => getItemProductId(sel) === getItemProductId(item))
    );
    saveGuestCart(updatedGuestItems);
  }, [cartItems, isAuthenticated, getGuestCart, saveGuestCart]);

  // Event listener for payment success
  useEffect(() => {
    const handler = () => clearSelectedItems();
    window.addEventListener("clear-cart", handler);
    return () => window.removeEventListener("clear-cart", handler);
  }, [clearSelectedItems]);

  // Selection handlers
  const selectAllItems = useCallback(() =>
    setCartItems(prev => prev.map(i => ({ ...i, selected: true }))), []);
  const deselectAllItems = useCallback(() =>
    setCartItems(prev => prev.map(i => ({ ...i, selected: false }))), []);

  const toggleItem = useCallback((productId) =>
    setCartItems(prev =>
      prev.map(i =>
        getItemProductId(i) == productId ? { ...i, selected: !i.selected } : i
      )
    ), []);

  const selectOnlyByProductId = useCallback((productId) =>
    setCartItems(prev =>
      prev.map(i => ({
        ...i,
        selected: String(getItemProductId(i)) === String(productId)
      }))
    ), []);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        clearSelectedItems,
        fetchCart,
        selectAllItems,
        deselectAllItems,
        toggleItem,
        selectOnlyByProductId,
        getItemProductId, // expose helper if needed elsewhere
      }}
    >
      {children}
    </CartContext.Provider>
  );
};