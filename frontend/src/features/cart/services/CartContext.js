// src/features/cart/services/CartContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import API from "../../login_register/services/api";
import { productApi } from "../../products/services/productApi";
import { notification } from "antd"; // dùng notification của Ant Design

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

// Helper lấy productId nhất quán
const getItemProductId = (item) => {
  const id =
    item.product_data?.id ||
    item.product?.id ||
    item.product_id ||
    item.product;
  return id != null ? String(id) : null;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const isAuthenticated = useCallback(
    () => !!localStorage.getItem("token"),
    []
  );

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
                const primaryImage =
                  prod.image ||
                  prod.images?.find((img) => img.is_primary)?.image ||
                  prod.images?.[0]?.image ||
                  "";
                const storeData =
                  typeof prod.store === "object" && prod.store !== null
                    ? prod.store
                    : null;
                return {
                  ...item,
                  selected: true,
                  product_data: {
                    ...prod,
                    image: primaryImage,
                    store: storeData,
                    store_name:
                      prod.store_name ||
                      storeData?.store_name ||
                      storeData?.name ||
                      "",
                  },
                };
              } catch {
                return { ...item, selected: true };
              }
            }
          })
        );
        const normalizedItems = itemsWithDetails.map((cartItem) => {
          const productData = cartItem.product_data || {};
          const productSource =
            typeof cartItem.product === "object" && cartItem.product !== null
              ? cartItem.product
              : {};
          const storeFromProductData =
            typeof productData.store === "object" && productData.store !== null
              ? productData.store
              : {};
          const storeFromProductSource =
            typeof productSource.store === "object" &&
            productSource.store !== null
              ? productSource.store
              : {};
          const mergedStore = {
            ...storeFromProductSource,
            ...storeFromProductData,
          };
          const hasStore = Object.keys(mergedStore).length > 0;
          const primaryImage =
            productData.image ||
            productSource.image ||
            productData.images?.find((img) => img.is_primary)?.image ||
            productData.images?.[0]?.image ||
            productSource.images?.find((img) => img.is_primary)?.image ||
            productSource.images?.[0]?.image ||
            "";
          return {
            ...cartItem,
            product_data: {
              ...productSource,
              ...productData,
              image: primaryImage,
              store: hasStore ? mergedStore : null,
              store_name:
                productData.store_name ||
                mergedStore.store_name ||
                mergedStore.name ||
                productSource.store_name ||
                "",
            },
          };
        });
        setCartItems(normalizedItems);
      } else {
        const guestItems = getGuestCart().map((i) => ({
          ...i,
          selected: true,
        }));
        setCartItems(guestItems);
      }
    } catch (err) {
      console.error("❌ Lỗi fetch giỏ hàng:", err);
      notification.error({
        message: "Lỗi tải giỏ hàng",
        description: "Không thể tải giỏ hàng, vui lòng thử lại.",
        placement: "topRight",
        duration: 3,
      });
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
          notification.success({
            message: "Đồng bộ giỏ hàng thành công",
            description:
              "Các sản phẩm từ chế độ khách đã được thêm vào giỏ hàng.",
            placement: "topRight",
            duration: 2,
          });
        } catch (err) {
          console.error("❌ Sync guest cart failed:", err);
          notification.error({
            message: "Đồng bộ giỏ hàng thất bại",
            description: "Không thể đồng bộ giỏ hàng từ chế độ khách.",
            placement: "topRight",
            duration: 3,
          });
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
  const addToCart = useCallback(
    async (productId, quantity = 1, productInfo, onSuccess, onError) => {
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
          const stringProductId = String(productId);
          const idx = items.findIndex((i) => getItemProductId(i) === stringProductId);
          if (idx >= 0) {
            items[idx].quantity += quantity;
          } else {
            items.push({
              product: stringProductId, // 👈 lưu dạng string

              quantity,
              preorder: !!productInfo?.preorder,
              product_data: {
                id: productInfo?.id || productId,
                name: productInfo?.name || "",
                price: productInfo?.price || 0,
                image: productInfo?.image || "", // ✅
                store: productInfo?.store || null, // ✅
                store_name:
                  productInfo?.store_name ||
                  productInfo?.store?.store_name ||
                  productInfo?.store?.name ||
                  "", // ✅
              },
            });
          }
          saveGuestCart(items);
          setCartItems(items.map((i) => ({ ...i, selected: true })));
        }

        notification.success({
          message: "Thêm giỏ hàng thành công",
          description: `"${productInfo?.name}" đã được thêm vào giỏ hàng!`,
          placement: "topRight",
          duration: 2,
        });

        onSuccess?.();
      } catch (err) {
        console.error(err);
        notification.error({
          message: "Thêm giỏ hàng thất bại",
          description: err?.message || "Có lỗi xảy ra, vui lòng thử lại",
          placement: "topRight",
          duration: 3,
        });
        onError?.(err);
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, fetchCart, getGuestCart, saveGuestCart]
  );
  const removeFromCart = useCallback(
    async (productId) => {
      if (!productId) return;

      if (isAuthenticated()) {
        const item = cartItems.find((i) => getItemProductId(i) == productId);
        if (!item?.id) return;

        try {
          await API.delete(`cartitems/${item.id}/`);
          await fetchCart();
          notification.success({
            message: "Xóa sản phẩm thành công",
            description: `"${item.product_data?.name}" đã được xóa khỏi giỏ hàng.`,
            placement: "topRight",
            duration: 2,
          });
        } catch (err) {
          console.error("Failed to delete cart item:", err);
          notification.error({
            message: "Xóa sản phẩm thất bại",
            description: "Vui lòng thử lại.",
            placement: "topRight",
            duration: 3,
          });
        }
      } else {
        const current = getGuestCart();
        const filtered = current.filter(
          (i) => getItemProductId(i) != productId
        );
        saveGuestCart(filtered);
        setCartItems(filtered.map((i) => ({ ...i, selected: true })));
      }
    },
    [cartItems, isAuthenticated, fetchCart, getGuestCart, saveGuestCart]
  );
  // Update quantity
  // Update quantity
  const updateQuantity = useCallback(
    async (productId, newQty) => {
      if (newQty < 1) {
        await removeFromCart(productId);
        return;
      }

      if (isAuthenticated()) {
        const item = cartItems.find((i) => getItemProductId(i) == productId);
        if (!item) return;

        try {
          await API.patch(`cartitems/${item.id}/`, { quantity: newQty });
          // ✅ Cập nhật ngay lập tức state để UI phản ánh thay đổi
          setCartItems((prev) =>
            prev.map((i) =>
              String(i.id) === String(item.id) ? { ...i, quantity: newQty } : i
            )
          );
          // ✅ Không cần hiển thị notification cho mỗi lần thay đổi số lượng
        } catch (err) {
          console.error("Lỗi cập nhật số lượng:", err);
          notification.error({
            message: "Cập nhật số lượng thất bại",
            description: "Vui lòng thử lại.",
            placement: "topRight",
            duration: 3,
          });
          // ✅ Fetch lại để đảm bảo đồng bộ nếu có lỗi
          await fetchCart();
        }
      } else {
        const items = getGuestCart();
        const stringProductId = String(productId); // 👈 chuẩn hóa
        const idx = items.findIndex(
          (i) => getItemProductId(i) === stringProductId
        );
        if (idx >= 0) {
          items[idx].quantity = newQty;
          saveGuestCart(items);
          setCartItems(items.map((i) => ({ ...i, selected: true })));
        }
      }
    },
    [
      cartItems,
      isAuthenticated,
      getGuestCart,
      saveGuestCart,
      removeFromCart,
      fetchCart,
    ]
  );

  // Remove item

  // Clear cart
  const clearCart = useCallback(async () => {
    if (isAuthenticated()) {
      for (const item of cartItems) {
        try {
          await API.delete(`cartitems/${item.id}/`);
        } catch {}
      }
    }
    setCartItems([]);
    saveGuestCart([]);
    notification.info({
      message: "Giỏ hàng đã được làm trống",
      placement: "topRight",
      duration: 2,
    });
  }, [cartItems, isAuthenticated, saveGuestCart]);

  // Clear selected items
  const clearSelectedItems = useCallback(async () => {
    const selectedItems = cartItems.filter((item) => item.selected);
    if (isAuthenticated()) {
      for (const item of selectedItems) {
        try {
          await API.delete(`cartitems/${item.id}/`);
        } catch {}
      }
    }

    setCartItems((prev) => prev.filter((item) => !item.selected));
    const guestItems = getGuestCart();
    const updatedGuestItems = guestItems.filter(
      (item) =>
        !selectedItems.some(
          (sel) => getItemProductId(sel) === getItemProductId(item)
        )
    );
    saveGuestCart(updatedGuestItems);
    notification.info({
      message: "Các sản phẩm đã chọn đã được xóa",
      placement: "topRight",
      duration: 2,
    });
  }, [cartItems, isAuthenticated, getGuestCart, saveGuestCart]);

  // Event listener for payment success
  useEffect(() => {
    const handler = () => clearSelectedItems();
    window.addEventListener("clear-cart", handler);
    return () => window.removeEventListener("clear-cart", handler);
  }, [clearSelectedItems]);

  // Selection handlers
  const selectAllItems = useCallback(
    () => setCartItems((prev) => prev.map((i) => ({ ...i, selected: true }))),
    []
  );
  const deselectAllItems = useCallback(
    () => setCartItems((prev) => prev.map((i) => ({ ...i, selected: false }))),
    []
  );
  const toggleItem = useCallback(
    (productId) =>
      setCartItems((prev) =>
        prev.map((i) =>
          getItemProductId(i) == productId ? { ...i, selected: !i.selected } : i
        )
      ),
    []
  );
  const selectOnlyByProductId = useCallback(
    (productId) =>
      setCartItems((prev) =>
        prev.map((i) => ({
          ...i,
          selected: String(getItemProductId(i)) === String(productId),
        }))
      ),
    []
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
        getItemProductId,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};