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

        // Lấy danh sách item từ server
        const items = res.data;

        // Fetch chi tiết product nếu thiếu
        const itemsWithDetails = await Promise.all(
          items.map(async (item) => {
            if (item.product_data && item.product_data.name) {
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
    }
    setLoading(false);
  }, [isAuthenticated, getGuestCart]);

  // Load cart on mount / location change
  useEffect(() => {
    fetchCart();
  }, [fetchCart]); // chỉ chạy 1 lần khi component mount

  // Thay thế useEffect cũ (dựa vào localStorage) bằng useEffect lắng nghe sự kiện
  useEffect(() => {
    const handleUserLoggedIn = async () => {
      const guestCart = getGuestCart();
      if (guestCart.length > 0 && !isSyncing) {
        setIsSyncing(true);
        try {
          // 1. Lấy giỏ hàng hiện tại của user
          const userCartRes = await API.get("cartitems/");
          const userCart = userCartRes.data || [];

          // 2. Đồng bộ guest cart vào user cart
          for (const guestItem of guestCart) {
            const guestProductId =
              guestItem.product_data?.id || guestItem.product;
            const existingItem = userCart.find(
              (item) => (item.product?.id || item.product_id) == guestProductId
            );

            if (existingItem) {
              // Cập nhật số lượng
              await API.patch(`cartitems/${existingItem.id}/`, {
                quantity: existingItem.quantity + guestItem.quantity,
              });
            } else {
              // Thêm mới
              await API.post("cartitems/", {
                product_id: guestProductId,
                quantity: guestItem.quantity,
              });
            }
          }

          // 3. Dọn dẹp guest cart
          localStorage.removeItem("guest_cart");
          await fetchCart(); // Cập nhật UI
        } catch (err) {
          console.error("❌ Sync guest cart failed:", err);
          toast.error("Đồng bộ giỏ hàng từ chế độ khách thất bại");
        } finally {
          setIsSyncing(false);
        }
      }
    };

    window.addEventListener("user-logged-in", handleUserLoggedIn);
    return () =>
      window.removeEventListener("user-logged-in", handleUserLoggedIn);
  }, [getGuestCart, fetchCart, isSyncing]);

  // Add item
  const addToCart = async (
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
        await API.post("cartitems/", { product_id: productId, quantity });
        await fetchCart();
      } else {
        let items = getGuestCart();
        const idx = items.findIndex((i) => i.product === productId);
        if (idx >= 0) items[idx].quantity += quantity;
        else
          items.push({
            product: productId,
            quantity,
            product_data: {
              id: productInfo?.id || productId,
              name: productInfo?.name || "",
              price: productInfo?.price || 0,
            },
          });
        saveGuestCart(items);
        setCartItems(items.map((i) => ({ ...i, selected: true })));
      }

      if (onSuccess) onSuccess(); // ✅ gọi callback khi thành công
    } catch (err) {
      console.error(err);
      toast.error("Không thể thêm vào giỏ hàng");
      if (onError) onError(err); // ✅ gọi callback khi lỗi
    } finally {
      setLoading(false);
    }
  };

  // Update quantity
  // Trong CartContext.js
  const updateQuantity = async (productId, newQty) => {
    if (newQty < 1) return removeFromCart(productId);

    if (isAuthenticated()) {
      // Đã đăng nhập: cần tìm `item.id` từ `cartItems`
      const item = cartItems.find(
        (i) =>
          (i.product?.id || i.product_id || i.product_data?.id || i.product) ==
          productId
      );
      if (!item) return;

      try {
        await API.patch(`cartitems/${item.id}/`, { quantity: newQty });
        setCartItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, quantity: newQty } : i))
        );
      } catch (err) {
        console.error("Lỗi cập nhật số lượng:", err);
      }
    } else {
      // Guest: dùng productId để tìm
      const items = getGuestCart();
      const idx = items.findIndex(
        (i) => (i.product_data?.id || i.product) == productId
      );
      if (idx >= 0) {
        items[idx].quantity = newQty;
        saveGuestCart(items);
        setCartItems(items.map((i) => ({ ...i, selected: true })));
      }
    }
  };

  // Remove item
  // Remove item by PRODUCT ID (not cart item ID)
  const removeFromCart = async (productId) => {
    if (isAuthenticated()) {
      // Tìm cart item có product = productId
      const item = cartItems.find(
        (i) =>
          (i.product?.id || i.product_id || i.product_data?.id || i.product) ==
          productId
      );
      if (!item) return;

      try {
        await API.delete(`cartitems/${item.id}/`);
        await fetchCart();
      } catch (err) {
        console.error(err);
      }
    } else {
      // Guest: xóa dựa trên productId
      const items = getGuestCart().filter(
        (i) => (i.product_data?.id || i.product) != productId
      );
      saveGuestCart(items);
      setCartItems(items.map((i) => ({ ...i, selected: true })));
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

  // Clear only selected items
  const clearSelectedItems = useCallback(async () => {
    const selectedItems = cartItems.filter((item) => item.selected);
    if (isAuthenticated()) {
      for (const item of selectedItems) {
        try {
          await API.delete(`cartitems/${item.id}/`);
        } catch (err) {
          console.error("Error deleting cart item:", err);
        }
      }
    }
    // Update local state: remove selected items
    setCartItems((prev) => prev.filter((item) => !item.selected));
    // Update guest cart: remove selected items
    const guestItems = getGuestCart();
    const updatedGuestItems = guestItems.filter(
      (item) =>
        !selectedItems.some(
          (selected) =>
            selected.product === item.product ||
            selected.product_id === item.product
        )
    );
    saveGuestCart(updatedGuestItems);
  }, [cartItems, isAuthenticated, getGuestCart, saveGuestCart]);

  // Lắng nghe sự kiện clear-cart từ Orders page khi VNPAY success
  useEffect(() => {
    const handler = async () => {
      try {
        await clearSelectedItems(); // Chỉ xóa những item đã chọn
      } catch (e) {}
    };
    window.addEventListener("clear-cart", handler);
    return () => window.removeEventListener("clear-cart", handler);
  }, [clearSelectedItems]);

  // Tick/untick
  const selectAllItems = () =>
    setCartItems((prev) => prev.map((i) => ({ ...i, selected: true })));
  const deselectAllItems = () =>
    setCartItems((prev) => prev.map((i) => ({ ...i, selected: false })));
  const toggleItem = (itemId) =>
    setCartItems((prev) =>
      prev.map((i) =>
        i.id === itemId || i.product === itemId
          ? { ...i, selected: !i.selected }
          : i
      )
    );

  // Select only one product by productId (works for both guest and server cart shapes)
  const selectOnlyByProductId = (productId) =>
    setCartItems((prev) =>
      prev.map((i) => {
        const pid =
          i.product?.id || i.product_id || i.product_data?.id || i.product;
        return { ...i, selected: String(pid) === String(productId) };
      })
    );

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
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
