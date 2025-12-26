import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef
} from "react";
import API from "../../login_register/services/api";
import { productApi } from "../../products/services/productApi";
import { notification } from "antd";
import axios from "axios";

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

// Key lưu trữ ID các món đang chọn
const CART_SELECTED_KEY = "cart_selected_ids";

// Helper lấy productId nhất quán
export const getItemProductId = (item) => {
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
  const lastFlashSaleFetchRef = useRef(0);

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

  // [FIX 1] Helper để cập nhật LocalStorage thủ công (An toàn hơn useEffect)
  const updateSelectedLocalStorage = (items) => {
      const selectedIds = items
          .filter(item => item.selected)
          .map(item => getItemProductId(item));
      localStorage.setItem(CART_SELECTED_KEY, JSON.stringify(selectedIds));
  };

  // Fetch cart
  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      // [FIX 2] Lấy danh sách ID đã chọn từ LocalStorage
      let savedSelectedIds = [];
      try {
          savedSelectedIds = JSON.parse(localStorage.getItem(CART_SELECTED_KEY)) || [];
      } catch {}

      // [FIX] Lấy dữ liệu flash sale một lần khi tải giỏ hàng để đảm bảo giá chính xác và ổn định.
      let flashSaleProducts = [];
      try {
        const flashSaleRes = await axios.get(`${process.env.REACT_APP_API_URL}/promotions/flash-sales/`);
        const activeFlashSale = (Array.isArray(flashSaleRes.data) ? flashSaleRes.data[0] : flashSaleRes.data.results?.[0]);
        if (activeFlashSale) flashSaleProducts = activeFlashSale.flashsale_products || [];
      } catch (e) { console.warn("Không thể tải dữ liệu flash sale.", e); }


      if (isAuthenticated()) {
        const res = await API.get("cartitems/");
        const items = res.data;

        const itemsWithDetails = await Promise.all(
          items.map(async (item) => {
            let productInfo = {};
            if (item.product_data?.name) {
                productInfo = item.product_data;
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
                
                productInfo = {
                    ...prod,
                    image: primaryImage,
                    store: storeData,
                    store_name: prod.store_name || storeData?.store_name || storeData?.name || "",
                };
              } catch {
                 productInfo = {};
              }
            }

            // [FIX] Kiểm tra và áp dụng giá flash sale ngay sau khi có thông tin sản phẩm.
            const productInFlashSale = flashSaleProducts.find(
              p => String(p.product_id || p.product) === String(productInfo.id)
            );
            if (productInFlashSale) {
              productInfo.original_price = productInFlashSale.original_price;
              productInfo.flash_sale_price = productInFlashSale.flash_price;
            }

            const currentId = getItemProductId({ ...item, product_data: productInfo });
            const isSelected = savedSelectedIds.includes(currentId);

            return {
                ...item,
                selected: isSelected, 
                product_data: productInfo
            };
          })
        );
        
        // Chuẩn hóa dữ liệu
        const normalizedItems = itemsWithDetails.map((cartItem) => {
             const productData = cartItem.product_data || {};
             const productSource = typeof cartItem.product === "object" && cartItem.product !== null ? cartItem.product : {};
             const storeFromProductData = typeof productData.store === "object" && productData.store !== null ? productData.store : {};
             const storeFromProductSource = typeof productSource.store === "object" && productSource.store !== null ? productSource.store : {};
             const mergedStore = { ...storeFromProductSource, ...storeFromProductData };
             const hasStore = Object.keys(mergedStore).length > 0;
             const primaryImage = productData.image || productSource.image || "";

             return {
                ...cartItem,
                product_data: {
                    ...productSource,
                    ...productData,
                    image: primaryImage || cartItem.product_data?.image,
                    store: hasStore ? mergedStore : null,
                    store_name: productData.store_name || mergedStore.store_name || "",
                }
             };
        });

        setCartItems(normalizedItems);

      } else {
        // --- CHẾ ĐỘ KHÁCH ---
        const guestItems = getGuestCart().map((i) => {
            const currentId = getItemProductId(i);
            const isSelected = savedSelectedIds.includes(currentId);
            return {
                ...i,
                selected: isSelected, 
            };
        });
        setCartItems(guestItems);
      }
    } catch (err) {
      console.error("❌ Lỗi fetch giỏ hàng:", err);
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
            placement: "topRight",
            duration: 2,
          });
        } catch (err) {
          console.error("❌ Sync guest cart failed:", err);
        } finally {
          setIsSyncing(false);
        }
      }
    };

    window.addEventListener("user-logged-in", handleUserLoggedIn);
    return () => window.removeEventListener("user-logged-in", handleUserLoggedIn);
  }, [getGuestCart, fetchCart, isSyncing]);

  // Add item
  const addToCart = useCallback(
    async (productId, quantity = 1, productInfo, onSuccess, onError) => {
      if (!productId || quantity < 1) return;
      setLoading(true);
      try {
        // [FIX 4] Lưu chọn món mới vào LS ngay lập tức
        const currentSelectedIds = JSON.parse(localStorage.getItem(CART_SELECTED_KEY)) || [];
        const newIdString = String(productId);
        if (!currentSelectedIds.includes(newIdString)) {
            localStorage.setItem(CART_SELECTED_KEY, JSON.stringify([...currentSelectedIds, newIdString]));
        }

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
              product: stringProductId,
              quantity,
              preorder: !!productInfo?.preorder,
              selected: true, 
              product_data: { ...productInfo, id: productId },
            });
          }
          saveGuestCart(items);
          
          const updatedItems = items.map(i => {
             const pid = getItemProductId(i);
             const isSel = pid === stringProductId ? true : i.selected; 
             return { ...i, selected: isSel };
          });
          setCartItems(updatedItems);
        }

        notification.success({
          message: "Thêm thành công",
          description: `"${productInfo?.name || 'Sản phẩm'}" vào giỏ hàng!`,
          placement: "topRight",
          duration: 2,
        });

        onSuccess?.();
      } catch (err) {
        notification.error({
          message: "Lỗi thêm giỏ hàng",
          description: err?.message,
          placement: "topRight",
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
      
      // Update LS: xóa ID khỏi danh sách chọn (nếu có)
      const currentSelectedIds = JSON.parse(localStorage.getItem(CART_SELECTED_KEY)) || [];
      const newSelectedIds = currentSelectedIds.filter(id => id !== String(productId));
      localStorage.setItem(CART_SELECTED_KEY, JSON.stringify(newSelectedIds));

      if (isAuthenticated()) {
        const item = cartItems.find((i) => getItemProductId(i) == productId);
        if (!item?.id) return;
        try {
          await API.delete(`cartitems/${item.id}/`);
          setCartItems(prev => prev.filter(i => i.id !== item.id)); 
          notification.success({ message: "Đã xóa sản phẩm", placement: "topRight", duration: 2 });
        } catch (err) {
          await fetchCart(); 
        }
      } else {
        const current = getGuestCart();
        const filtered = current.filter((i) => getItemProductId(i) != productId);
        saveGuestCart(filtered);
        setCartItems(filtered);
      }
    },
    [cartItems, isAuthenticated, fetchCart, getGuestCart, saveGuestCart]
  );

  const updateQuantity = useCallback(
    async (productId, newQty) => {
      if (newQty < 1) {
        await removeFromCart(productId);
        return;
      }
      if (isAuthenticated()) {
        const item = cartItems.find((i) => getItemProductId(i) == productId);
        if (!item) return;

        const itemId = item.id;

        setCartItems((prev) =>
            prev.map((i) =>
              String(i.id) === String(itemId) ? { ...i, quantity: newQty } : i
            )
        );

        try {
          await API.patch(`cartitems/${itemId}/`, { quantity: newQty });
        } catch (err) {
          await fetchCart(); 
        }
      } else {
        const items = getGuestCart();
        const idx = items.findIndex((i) => getItemProductId(i) === String(productId));
        if (idx >= 0) {
          items[idx].quantity = newQty;
          saveGuestCart(items);
          
          const currentSelectedMap = cartItems.reduce((acc, curr) => {
              acc[getItemProductId(curr)] = curr.selected;
              return acc;
          }, {});
          setCartItems(items.map((i) => ({ 
              ...i, 
              selected: currentSelectedMap[getItemProductId(i)] || false 
          })));
        }
      }
    },
    [cartItems, isAuthenticated, getGuestCart, saveGuestCart, removeFromCart, fetchCart]
  );

  const clearCart = useCallback(async () => {
    if (isAuthenticated()) {
      const promises = cartItems.map(item => API.delete(`cartitems/${item.id}/`).catch(e => e));
      await Promise.all(promises);
    }
    setCartItems([]);
    saveGuestCart([]);
    localStorage.removeItem(CART_SELECTED_KEY); 
  }, [cartItems, isAuthenticated, saveGuestCart]);

  // [FIX 5] Xóa CHỈ NHỮNG MÓN ĐÃ CHỌN (An toàn)
  const clearSelectedItems = useCallback(async () => {
    const selectedItems = cartItems.filter((item) => item.selected);
    if (selectedItems.length === 0) return;

    if (isAuthenticated()) {
        const promises = selectedItems.map(item => API.delete(`cartitems/${item.id}/`).catch(e => e));
        await Promise.all(promises);
    }

    // Giữ lại các món KHÔNG được chọn
    const remainingItems = cartItems.filter((item) => !item.selected);
    setCartItems(remainingItems);
    
    // Cập nhật Guest Cart
    const guestItems = getGuestCart();
    const updatedGuestItems = guestItems.filter(
      (item) => !selectedItems.some((sel) => getItemProductId(sel) === getItemProductId(item))
    );
    saveGuestCart(updatedGuestItems);

    // Reset danh sách chọn trong LocalStorage
    localStorage.removeItem(CART_SELECTED_KEY);

  }, [cartItems, isAuthenticated, getGuestCart, saveGuestCart]);

  useEffect(() => {
    const handler = () => clearSelectedItems();
    window.addEventListener("clear-cart", handler);
    return () => window.removeEventListener("clear-cart", handler);
  }, [clearSelectedItems]);

  // [FIX 6] Cập nhật LocalStorage ngay khi user thao tác chọn
  const selectAllItems = useCallback(() => {
    setCartItems((prev) => {
        const newItems = prev.map((i) => ({ ...i, selected: true }));
        updateSelectedLocalStorage(newItems);
        return newItems;
    });
  }, []);

  const deselectAllItems = useCallback(() => {
    setCartItems((prev) => {
        const newItems = prev.map((i) => ({ ...i, selected: false }));
        updateSelectedLocalStorage(newItems);
        return newItems;
    });
  }, []);
  
  const toggleItem = useCallback((productId) => {
    const targetId = String(productId); 
    setCartItems((prev) => {
        const newItems = prev.map((i) => {
            const currentId = getItemProductId(i);
            return String(currentId) === targetId 
              ? { ...i, selected: !i.selected }
              : i;
        });
        updateSelectedLocalStorage(newItems);
        return newItems;
    });
  }, []);

  const selectOnlyByProductId = useCallback((productId) => {
      setCartItems((prev) => {
        const newItems = prev.map((i) => ({
          ...i,
          selected: String(getItemProductId(i)) === String(productId),
        }));
        updateSelectedLocalStorage(newItems);
        return newItems;
      });
  }, []);

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