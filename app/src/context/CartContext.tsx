import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useIonToast } from "@ionic/react";
import { API } from "../api/api";
import { productApi } from "../api/productApi";
import { Product, CartItem as ModelCartItem } from "../types/models";

// ================== Type Definitions ==================

export interface CartItem extends ModelCartItem {
  selected?: boolean;
  product_data?: Product;
}

interface RawCartItem {
  id?: number;
  product?: number | string | Product;
  product_id?: number | string;
  quantity: number;
  product_data?: Product;
  selected?: boolean;
  preorder?: boolean;
}

interface CartContextType {
  cartItems: CartItem[];
  loading: boolean;
  cartItemCount: number;

  addToCart: (
    product: Product,
    quantity?: number,
    productInfo?: Product
  ) => Promise<void>;
  updateQuantity: (productId: number | string, newQty: number) => Promise<void>;
  removeFromCart: (productId: number | string) => Promise<void>;
  clearCart: () => Promise<void>;
  clearSelectedItems: () => Promise<void>;
  fetchCart: () => Promise<void>;

  selectAllItems: () => void;
  deselectAllItems: () => void;
  toggleItem: (productId: number | string) => void;
  selectOnlyByProductId: (productId: number | string) => void;

  getItemProductId: (item: CartItem | RawCartItem) => string;
}

// ================== Helper ==================

export const getItemProductId = (item: CartItem | RawCartItem): string => {
  if (item.product_data?.id) return String(item.product_data.id);

  if (
    typeof item.product === "object" &&
    item.product !== null &&
    "id" in item.product
  ) {
    return String(item.product.id);
  }

  if (
    item.product &&
    (typeof item.product === "string" || typeof item.product === "number")
  ) {
    return String(item.product);
  }

  if (item.product_id) return String(item.product_id);

  return "";
};

// ================== Context ==================
const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};

// ================== Provider ==================
export const CartProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [present] = useIonToast();

  const showToast = useCallback(
    (message: string, type: "success" | "danger" | "warning" = "success") => {
      present({
        message: message,
        duration: 1500,
        position: "bottom",
        color: type,
        cssClass: "my-custom-toast",
      });
    },
    [present]
  );

  const cartItemCount = cartItems.length;

  const isAuthenticated = useCallback(
    () => !!localStorage.getItem("token"),
    []
  );

  // --- Helper LocalStorage ---
  const getGuestCart = useCallback((): RawCartItem[] => {
    try {
      const stored = localStorage.getItem("guest_cart");
      return stored ? (JSON.parse(stored) as RawCartItem[]) : [];
    } catch {
      return [];
    }
  }, []);

  const saveGuestCart = useCallback((items: RawCartItem[]) => {
    localStorage.setItem("guest_cart", JSON.stringify(items));
  }, []);

  // --- 1. Fetch Cart & Normalization ---
  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      let rawItems: RawCartItem[] = [];

      if (isAuthenticated()) {
        // FIX: Bỏ tham số 'true'
        const res = await API.get<RawCartItem[]>("/cartitems/");
        rawItems = Array.isArray(res) ? res : [];
      } else {
        rawItems = getGuestCart();
      }

      const normalizedItems: CartItem[] = await Promise.all(
        rawItems.map(async (item) => {
          if (item.product_data?.name) {
            return {
              ...item,
              product: item.product_data.id,
              product_data: item.product_data,
              selected: item.selected ?? true,
            } as CartItem;
          }

          try {
            const pid = getItemProductId(item);
            if (!pid) throw new Error("Product ID not found");

            const prod = await productApi.getProduct(Number(pid));

            const primaryImage =
              prod.image ||
              prod.images?.find((img) => img.is_primary)?.image ||
              prod.images?.[0]?.image ||
              "";

            const fullProductData: Product = {
              ...prod,
              image: primaryImage,
              store_name:
                prod.store_name ||
                (typeof prod.store === "object"
                  ? prod.store?.store_name
                  : "") ||
                "",
            };

            return {
              ...item,
              id: item.id,
              quantity: item.quantity,
              product: prod.id,
              product_data: fullProductData,
              selected: item.selected ?? true,
            } as CartItem;
          } catch (e) {
            console.warn(`Lỗi chuẩn hóa item ${item.id}:`, e);
            return {
              ...item,
              product: item.product || 0,
              quantity: item.quantity,
              selected: false,
              product_data: item.product_data,
            } as CartItem;
          }
        })
      );

      const validItems = normalizedItems.filter(
        (i) => i.product_data && i.product_data.id
      );
      setCartItems(validItems);
    } catch (err) {
      console.error("Lỗi fetch giỏ hàng:", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, getGuestCart]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // --- 2. Sync Guest Cart ---
  useEffect(() => {
    const handleUserLoggedIn = async () => {
      const guestCart = getGuestCart();
      if (guestCart.length > 0 && !isSyncing) {
        setIsSyncing(true);
        try {
          // FIX: Bỏ tham số 'true'
          const userCartRes = await API.get<RawCartItem[]>("/cartitems/");
          const userCart = Array.isArray(userCartRes) ? userCartRes : [];

          for (const guestItem of guestCart) {
            const guestPid = getItemProductId(guestItem);
            const existing = userCart.find(
              (i) => getItemProductId(i) === guestPid
            );

            if (existing && existing.id) {
              // FIX: Bỏ tham số 'true'
              await API.patch(`/cartitems/${existing.id}/`, {
                quantity: existing.quantity + guestItem.quantity,
              });
            } else {
              // FIX: Bỏ tham số 'true'
              await API.post("/cartitems/", {
                product_id: guestPid,
                quantity: guestItem.quantity,
              });
            }
          }

          localStorage.removeItem("guest_cart");
          await fetchCart();
          showToast("Đồng bộ giỏ hàng thành công!");
        } catch (err) {
          console.error("Sync error:", err);
        } finally {
          setIsSyncing(false);
        }
      }
    };

    window.addEventListener("user-logged-in", handleUserLoggedIn);
    return () =>
      window.removeEventListener("user-logged-in", handleUserLoggedIn);
  }, [getGuestCart, fetchCart, isSyncing, showToast]); // FIX: Thêm showToast vào dependency

  // --- 3. Actions ---

  const addToCart = async (
    product: Product,
    quantity = 1,
    productInfo?: Product
  ) => {
    setLoading(true);
    try {
      const targetProduct = productInfo || product;

      if (isAuthenticated()) {
        // FIX: Bỏ tham số 'true'
        await API.post("/cartitems/", {
          product_id: targetProduct.id,
          quantity,
          preorder: !!targetProduct.preorder,
        });
        showToast("Đã thêm vào giỏ hàng");
      } else {
        const items = getGuestCart();
        const existing = items.find(
          (i) => getItemProductId(i) === String(targetProduct.id)
        );

        if (existing) {
          existing.quantity += quantity;
        } else {
          items.push({
            product: targetProduct.id,
            quantity,
            preorder: !!targetProduct.preorder,
            product_data: targetProduct,
            selected: true,
          });
        }
        saveGuestCart(items);
        showToast("Đã thêm vào giỏ hàng");
      }
      await fetchCart();
    } catch (err) {
      console.error("Add to cart error:", err);
      showToast("Không thể thêm vào giỏ", "danger");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: number | string, newQty: number) => {
    if (newQty < 1) return removeFromCart(productId);

    setCartItems((prev) =>
      prev.map((item) =>
        getItemProductId(item) === String(productId)
          ? { ...item, quantity: newQty }
          : item
      )
    );

    try {
      if (isAuthenticated()) {
        const item = cartItems.find(
          (i) => getItemProductId(i) === String(productId)
        );
        if (item && item.id) {
          // FIX: Bỏ tham số 'true'
          await API.patch(`/cartitems/${item.id}/`, { quantity: newQty });
        }
      } else {
        const items = getGuestCart();
        const item = items.find(
          (i) => getItemProductId(i) === String(productId)
        );
        if (item) {
          item.quantity = newQty;
          saveGuestCart(items);
        }
      }
      await fetchCart();
    } catch (err) {
      console.error(err);
      showToast("Lỗi cập nhật số lượng", "danger");
      await fetchCart();
    }
  };

  const removeFromCart = async (productId: number | string) => {
    setLoading(true);
    try {
      if (isAuthenticated()) {
        const item = cartItems.find(
          (i) => getItemProductId(i) === String(productId)
        );
        if (item && item.id) {
          // FIX: Bỏ tham số 'true'
          await API.delete(`/cartitems/${item.id}/`);
        }
      } else {
        const items = getGuestCart();
        const newItems = items.filter(
          (i) => getItemProductId(i) !== String(productId)
        );
        saveGuestCart(newItems);
      }
      await fetchCart();
      showToast("Đã xóa sản phẩm");
    } catch (err) {
      console.error(err);
      showToast("Không thể xóa sản phẩm", "danger");
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    setLoading(true);
    try {
      if (isAuthenticated()) {
        const deletePromises = cartItems.map((item) =>
          item.id
            ? API.delete(`/cartitems/${item.id}/`) // FIX: Bỏ tham số 'true'
            : Promise.resolve()
        );
        await Promise.all(deletePromises);
      }
      localStorage.removeItem("guest_cart");
      setCartItems([]);
      showToast("Giỏ hàng đã được làm trống");
    } catch (err) {
      console.error(err);
      showToast("Lỗi khi làm trống giỏ hàng", "danger");
    } finally {
      setLoading(false);
    }
  };

  const clearSelectedItems = async () => {
    const selected = cartItems.filter((i) => i.selected);
    if (selected.length === 0) return;

    setLoading(true);
    try {
      if (isAuthenticated()) {
        const deletePromises = selected.map((item) =>
          item.id
            ? API.delete(`/cartitems/${item.id}/`) // FIX: Bỏ tham số 'true'
            : Promise.resolve()
        );
        await Promise.all(deletePromises);
      } else {
        const items = getGuestCart();
        const remaining = items.filter(
          (rawItem) =>
            !selected.some(
              (selItem) =>
                getItemProductId(selItem) === getItemProductId(rawItem)
            )
        );
        saveGuestCart(remaining);
      }
      await fetchCart();
      showToast("Đã xóa các sản phẩm đã chọn");
    } catch (err) {
      console.error(err);
      showToast("Lỗi khi xóa sản phẩm", "danger");
    } finally {
      setLoading(false);
    }
  };

  // --- 4. Selection Logic ---

  const selectAllItems = useCallback(() => {
    setCartItems((prev) => prev.map((i) => ({ ...i, selected: true })));
  }, []);

  const deselectAllItems = useCallback(() => {
    setCartItems((prev) => prev.map((i) => ({ ...i, selected: false })));
  }, []);

  const toggleItem = useCallback((productId: number | string) => {
    setCartItems((prev) =>
      prev.map((i) =>
        getItemProductId(i) === String(productId)
          ? { ...i, selected: !i.selected }
          : i
      )
    );
  }, []);

  const selectOnlyByProductId = useCallback((productId: number | string) => {
    setCartItems((prev) =>
      prev.map((i) => ({
        ...i,
        selected: getItemProductId(i) === String(productId),
      }))
    );
  }, []);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        cartItemCount,
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