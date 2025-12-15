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

// 1. Dữ liệu chuẩn dùng trong App (UI)
export interface CartItem extends ModelCartItem {
  selected?: boolean;
  // product_data luôn tồn tại trong UI để render
  product_data?: Product;
}

// 2. Dữ liệu thô từ API hoặc LocalStorage (có thể thiếu trường, hoặc product là ID)
// Interface này giúp thay thế 'any' khi xử lý dữ liệu đầu vào không đồng nhất
interface RawCartItem {
  id?: number;
  product?: number | string | Product; // Có thể là ID hoặc Object
  product_id?: number | string; // Một số API trả về field này
  quantity: number;
  product_data?: Product; // Có thể chưa có
  selected?: boolean;
  preorder?: boolean;
}

interface CartContextType {
  cartItems: CartItem[];
  loading: boolean;
  cartItemCount: number;

  // Actions
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

  // Selection
  selectAllItems: () => void;
  deselectAllItems: () => void;
  toggleItem: (productId: number | string) => void;
  selectOnlyByProductId: (productId: number | string) => void;

  // Helper
  getItemProductId: (item: CartItem | RawCartItem) => string;
}

// ================== Helper ==================

// Helper lấy ID sản phẩm an toàn từ nhiều nguồn dữ liệu khác nhau
export const getItemProductId = (item: CartItem | RawCartItem): string => {
  // Ưu tiên lấy từ product_data đã normalized
  if (item.product_data?.id) return String(item.product_data.id);

  // Kiểm tra nếu product là Object Product
  if (
    typeof item.product === "object" &&
    item.product !== null &&
    "id" in item.product
  ) {
    return String(item.product.id);
  }

  // Kiểm tra nếu product là ID (number/string)
  if (
    item.product &&
    (typeof item.product === "string" || typeof item.product === "number")
  ) {
    return String(item.product);
  }

  // Fallback sang product_id
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
        duration: 1500, // Thời gian hiện (ms)
        position: "bottom", // 'top', 'middle', 'bottom'
        color: type, // Màu theo theme Ionic (success, danger, warning, dark...)
        icon: undefined, // Có thể thêm icon nếu muốn
        cssClass: "my-custom-toast", // Class CSS nếu muốn custom thêm
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
        const res = await API.get<RawCartItem[]>("/cartitems/", true);
        rawItems = Array.isArray(res) ? res : [];
      } else {
        rawItems = getGuestCart();
      }

      // Xử lý chuẩn hóa dữ liệu (Normalize)
      // Chuyển đổi RawCartItem -> CartItem (đảm bảo product_data luôn tồn tại)
      const normalizedItems: CartItem[] = await Promise.all(
        rawItems.map(async (item) => {
          // 1. Nếu đã có đầy đủ thông tin
          if (item.product_data?.name) {
            return {
              ...item,
              product: item.product_data.id, // Chuẩn hóa product thành ID
              product_data: item.product_data,
              selected: item.selected ?? true,
            } as CartItem;
          }

          // 2. Nếu thiếu thông tin, cần fetch bổ sung
          try {
            const pid = getItemProductId(item);
            if (!pid) throw new Error("Product ID not found");

            const prod = await productApi.getProduct(Number(pid));

            // Xử lý ảnh (Fallback logic)
            const primaryImage =
              prod.image ||
              prod.images?.find((img) => img.is_primary)?.image ||
              prod.images?.[0]?.image ||
              "";

            // Tạo product_data hoàn chỉnh
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
              product: prod.id, // Lưu ID
              product_data: fullProductData,
              selected: item.selected ?? true,
            } as CartItem;
          } catch (e) {
            console.warn(`Lỗi chuẩn hóa item ${item.id}:`, e);
            // Trả về item lỗi nhẹ để không crash app, nhưng đánh dấu
            return {
              ...item,
              product: item.product || 0,
              quantity: item.quantity,
              selected: false,
              product_data: item.product_data, // Có thể undefined
            } as CartItem;
          }
        })
      );

      // Lọc bỏ những item bị lỗi quá nặng (không có product_data sau khi normalize)
      const validItems = normalizedItems.filter(
        (i) => i.product_data && i.product_data.id
      );
      setCartItems(validItems);
    } catch (err) {
      console.error("Lỗi fetch giỏ hàng:", err);
      // Nếu lỗi mạng, có thể set empty hoặc giữ state cũ tùy policy
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
          // Lấy giỏ hàng hiện tại trên server để check trùng
          const userCartRes = await API.get<RawCartItem[]>("/cartitems/", true);
          const userCart = Array.isArray(userCartRes) ? userCartRes : [];

          for (const guestItem of guestCart) {
            const guestPid = getItemProductId(guestItem);
            const existing = userCart.find(
              (i) => getItemProductId(i) === guestPid
            );

            if (existing && existing.id) {
              await API.patch(
                `/cartitems/${existing.id}/`,
                { quantity: existing.quantity + guestItem.quantity },
                true
              );
            } else {
              await API.post(
                "/cartitems/",
                { product_id: guestPid, quantity: guestItem.quantity },
                true
              );
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
  }, [getGuestCart, fetchCart, isSyncing]);

  // --- 3. Actions ---

  const addToCart = async (
    product: Product,
    quantity = 1,
    productInfo?: Product
  ) => {
    setLoading(true);
    try {
      const targetProduct = productInfo || product; // Fallback

      if (isAuthenticated()) {
        await API.post(
          "/cartitems/",
          {
            product_id: targetProduct.id,
            quantity,
            preorder: !!targetProduct.preorder,
          },
          true
        );
        showToast("Đã thêm vào giỏ hàng");
      } else {
        const items = getGuestCart();
        const existing = items.find(
          (i) => getItemProductId(i) === String(targetProduct.id)
        );

        if (existing) {
          existing.quantity += quantity;
        } else {
          // Lưu cấu trúc đầy đủ cho Guest
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
      showToast("Không thể thêm vào giỏ");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: number | string, newQty: number) => {
    if (newQty < 1) return removeFromCart(productId);

    // Optimistic Update (Cập nhật UI trước khi gọi API)
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
          await API.patch(`/cartitems/${item.id}/`, { quantity: newQty }, true);
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
      // Fetch lại để đồng bộ chính xác (quan trọng để tính giá, khuyến mãi từ server)
      await fetchCart();
    } catch (err) {
      console.error(err);
      showToast("Lỗi cập nhật số lượng");
      await fetchCart(); // Revert state nếu lỗi
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
          await API.delete(`/cartitems/${item.id}/`, true);
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
      showToast("Không thể xóa sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    setLoading(true);
    try {
      if (isAuthenticated()) {
        // Tối ưu: Dùng Promise.all để xóa song song
        const deletePromises = cartItems.map((item) =>
          item.id
            ? API.delete(`/cartitems/${item.id}/`, true)
            : Promise.resolve()
        );
        await Promise.all(deletePromises);
      }
      localStorage.removeItem("guest_cart");
      setCartItems([]);
      showToast("Giỏ hàng đã được làm trống");
    } catch (err) {
      console.error(err);
      showToast("Lỗi khi làm trống giỏ hàng");
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
            ? API.delete(`/cartitems/${item.id}/`, true)
            : Promise.resolve()
        );
        await Promise.all(deletePromises);
      } else {
        const items = getGuestCart();
        // Giữ lại các item KHÔNG được chọn (so sánh bằng ID)
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
      showToast("Lỗi khi xóa sản phẩm");
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
