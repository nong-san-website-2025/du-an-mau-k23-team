import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { toast } from "react-toastify";
import { API } from "../api/api";

// ================== Interfaces ==================
export interface Product {
  id: number;
  name: string;
  price: number;
  image?: string;
}

export interface CartItem {
  id?: number; // id trên server (nếu có)
  product: Product;
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  loading: boolean;
  cartItemCount: number;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  updateQuantity: (productId: number, newQty: number) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
  fetchCart: () => Promise<void>;
  clearCart: () => Promise<void>;
}

// ================== Context setup ==================
const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};

// ================== Provider Component ==================
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const cartItemCount = cartItems.length;

  const isAuthenticated = useCallback(
    () => !!localStorage.getItem("token"),
    []
  );

  // 🧠 Lấy giỏ hàng từ backend hoặc localStorage
  const fetchCart = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      if (isAuthenticated()) {
        const data = await API.get<CartItem[]>("/cartitems/", true);
        setCartItems(data);
      } else {
        const stored = JSON.parse(
          localStorage.getItem("guest_cart") || "[]"
        ) as CartItem[];
        setCartItems(stored);
      }
    } catch (err) {
      console.error("Lỗi khi tải giỏ hàng:", err);
      toast.error("Không thể tải giỏ hàng");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // ================== ➕ Thêm sản phẩm ==================
  const addToCart = async (product: Product, quantity = 1): Promise<void> => {
    setLoading(true);
    try {
      if (isAuthenticated()) {
        await API.post(
          "/cartitems/",
          { product_id: product.id, quantity },
          true
        );
        toast.success("Đã thêm vào giỏ hàng!");
      } else {
        const current = JSON.parse(
          localStorage.getItem("guest_cart") || "[]"
        ) as CartItem[];
        const existing = current.find((i) => i.product.id === product.id);
        if (existing) existing.quantity += quantity;
        else current.push({ product, quantity });
        localStorage.setItem("guest_cart", JSON.stringify(current));
        toast.success("Đã thêm vào giỏ hàng", {
          className: "custom-toast",
        });
      }
      await fetchCart();
    } catch (err) {
      console.error("Không thể thêm vào giỏ hàng:", err);
      toast.error("Không thể thêm vào giỏ hàng");
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async (): Promise<void> => {
    setLoading(true);
    try {
      if (isAuthenticated()) {
        // Xóa từng item trên server
        await Promise.all(
          cartItems.map((item) =>
            item.id
              ? API.delete(`/cartitems/${item.id}/`, true)
              : Promise.resolve()
          )
        );
      }
      // Dọn localStorage
      localStorage.removeItem("guest_cart");
      setCartItems([]);
      toast.info("Đã xóa toàn bộ giỏ hàng");
    } catch (err) {
      console.error("Lỗi khi xóa giỏ hàng:", err);
      toast.error("Không thể xóa giỏ hàng");
    } finally {
      setLoading(false);
    }
  };

  // ================== 🔁 Cập nhật số lượng ==================
  const updateQuantity = async (
    productId: number,
    newQty: number
  ): Promise<void> => {
    if (newQty < 1) return removeFromCart(productId);
    setLoading(true);
    try {
      if (isAuthenticated()) {
        const item = cartItems.find((i) => i.product.id === productId);
        if (item)
          await API.patch(`/cartitems/${item.id}/`, { quantity: newQty }, true);
      } else {
        const current = JSON.parse(
          localStorage.getItem("guest_cart") || "[]"
        ) as CartItem[];
        const updated = current.map((i) =>
          i.product.id === productId ? { ...i, quantity: newQty } : i
        );
        localStorage.setItem("guest_cart", JSON.stringify(updated));
      }
      await fetchCart();
    } catch (err) {
      console.error("Lỗi cập nhật số lượng:", err);
      toast.error("Không thể cập nhật số lượng");
    } finally {
      setLoading(false);
    }
  };

  // ================== ❌ Xóa sản phẩm ==================
  const removeFromCart = async (productId: number): Promise<void> => {
    setLoading(true);
    try {
      if (isAuthenticated()) {
        const item = cartItems.find((i) => i.product.id === productId);
        if (item) await API.delete(`/cartitems/${item.id}/`, true);
      } else {
        const current = JSON.parse(
          localStorage.getItem("guest_cart") || "[]"
        ) as CartItem[];
        const filtered = current.filter((i) => i.product.id !== productId);
        localStorage.setItem("guest_cart", JSON.stringify(filtered));
      }
      await fetchCart();
      toast.info("Đã xóa sản phẩm khỏi giỏ hàng");
    } catch (err) {
      console.error("Không thể xóa sản phẩm:", err);
      toast.error("Không thể xóa sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        cartItemCount,
        addToCart,
        updateQuantity,
        removeFromCart,
        fetchCart,
        clearCart, 
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
