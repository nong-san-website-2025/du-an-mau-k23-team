import { useState, useEffect, useMemo, useCallback } from "react";
import { useHistory } from "react-router-dom";
import { useCart, CartItem } from "../context/CartContext";
import { Address } from "../types/Address";
import { API } from "../api/api";
import { Product } from "../types/models";

// --- 1. TYPE DEFINITIONS (Strict Typing) ---

// Interface mở rộng cho Product (để fix lỗi thiếu field)
interface ExtendedProduct extends Product {
  seller?: number;
  weight_g?: number;
  store_id?: number;
}

// Chi tiết phí ship của từng seller
interface SellerShippingDetail {
  success: boolean;
  fee: number;
  service_id?: number;
  detail?: unknown; // Dùng unknown thay vì any nếu không cần truy cập sâu
}

// Cấu trúc Response chính từ Backend
interface ShippingFeeResponse {
  total_shipping_fee: number;
  sellers: Record<string, SellerShippingDetail>;
  success?: boolean;
}

// Helper Type để xử lý trường hợp API trả về bọc trong { data: ... }
// Đây là Union Type: hoặc là Response chuẩn, hoặc là Response bọc trong data
type MaybeWrappedResponse = ShippingFeeResponse | { data: ShippingFeeResponse };

// Interface cho việc gom nhóm UI
export interface StoreGroup {
  storeName: string;
  storeId: string;
  items: CartItem[];
  subtotal: number;
}

export interface GroupedItems {
  [key: string]: StoreGroup;
}

// --- 2. HOOK LOGIC ---

const useCheckoutLogic = () => {
  const history = useHistory();
  const { cartItems, clearCart } = useCart();
  // const token = localStorage.getItem("token"); // Đã bỏ theo logic mới

  // State
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  const [shippingFee, setShippingFee] = useState<number>(0);
  const [shippingStatus, setShippingStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [shippingFeePerSeller, setShippingFeePerSeller] = useState<Record<string, number>>({});

  const [paymentMethod, setPaymentMethod] = useState<string>("cod");
  const [note, setNote] = useState<string>("");
  const [voucherCode, setVoucherCode] = useState<string>("");
  const [discount, setDiscount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // --- MEMOIZED DATA ---

  const checkoutItems = useMemo(() => {
    return cartItems.filter((item) => item.selected);
  }, [cartItems]);

  const selectedAddress = useMemo(() => {
    return addresses.find((a) => a.id === selectedAddressId) || null;
  }, [addresses, selectedAddressId]);

  const groupedCheckoutItems = useMemo(() => {
    return checkoutItems.reduce<GroupedItems>((acc, item) => {
      const product = item.product_data;
      if (!product) return acc;

      let storeId = "other";
      let storeName = "Cửa hàng khác";

      if (product.store && typeof product.store === "object") {
        storeId = String(product.store.id);
        storeName = product.store.store_name || product.store.name || "Cửa hàng";
      } else if (product.store_name) {
        storeName = product.store_name;
      }

      if (!acc[storeId]) {
        acc[storeId] = { storeName, storeId, items: [], subtotal: 0 };
      }

      acc[storeId].items.push(item);
      acc[storeId].subtotal += (product.price || 0) * item.quantity;
      return acc;
    }, {});
  }, [checkoutItems]);

  const totalGoods = useMemo(() => {
    return checkoutItems.reduce((acc, item) => {
      const price = item.product_data?.price || 0;
      return acc + price * item.quantity;
    }, 0);
  }, [checkoutItems]);

  const finalTotal = Math.max(totalGoods + shippingFee - discount, 0);

  // --- API ACTIONS ---

  const fetchAddresses = useCallback(async () => {
    try {
      // Dùng unknown trước rồi ép kiểu an toàn sau
      const res = await API.get<unknown>("/users/addresses/");
      
      // Type Guard đơn giản để lấy data
      let list: Address[] = [];
      if (Array.isArray(res)) {
        list = res as Address[];
      } else if (typeof res === 'object' && res !== null && 'data' in res && Array.isArray((res as {data: unknown}).data)) {
        list = (res as {data: Address[]}).data;
      }

      setAddresses(list);

      if (!selectedAddressId && list.length > 0) {
        const defaultAddr = list.find((a) => a.is_default);
        const targetId = defaultAddr ? defaultAddr.id : list[0].id;
        setSelectedAddressId(targetId);
      }
    } catch (err) {
      console.error("Lỗi tải địa chỉ", err);
    }
  }, [selectedAddressId]);

  const saveAddress = async (data: Partial<Address>) => {
    try {
      // Gọi API, tạm thời dùng unknown để handle response linh hoạt
      let res: unknown;
      if (data.id) {
        res = await API.put(`/users/addresses/${data.id}/`, data);
      } else {
        res = await API.post("/users/addresses/", data);
      }

      await fetchAddresses();

      // Type checking an toàn để lấy ID
      let newId: number | undefined;
      if (res && typeof res === 'object') {
          if ('id' in res && typeof (res as Address).id === 'number') {
              newId = (res as Address).id;
          } else if ('data' in res) {
              const nested = (res as {data: Address}).data;
              if (nested && nested.id) newId = nested.id;
          }
      }

      if (newId) setSelectedAddressId(newId);
      return true;
    } catch (error) {
      console.error("Lỗi lưu địa chỉ", error);
      return false;
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // --- TÍNH PHÍ SHIP (GHN) ---
  useEffect(() => {
    if (!selectedAddress || !selectedAddress.district_id || !selectedAddress.ward_code) {
      setShippingFee(0);
      setShippingStatus("idle");
      return;
    }

    const calculateShipping = async () => {
      setShippingStatus("loading");
      setShippingFee(0);

      const sellerGroups: Record<string, number> = {};

      checkoutItems.forEach((item) => {
        const product = item.product_data;
        if (!product) return;

        // Ép kiểu an toàn (Safe Cast)
        const extProduct = product as unknown as ExtendedProduct;

        let sellerId: number | string = "other";
        if (extProduct.store && typeof extProduct.store === "object") {
          sellerId = extProduct.store.id;
        } else if (extProduct.seller) {
          sellerId = extProduct.seller;
        } else if (extProduct.store_id) {
          sellerId = extProduct.store_id;
        }

        const sidString = String(sellerId);
        if (!sellerGroups[sidString]) sellerGroups[sidString] = 0;

        const weight = extProduct.weight_g ? Number(extProduct.weight_g) : 200;
        sellerGroups[sidString] += item.quantity * weight;
      });

      const sellersPayload = Object.keys(sellerGroups).map((sid) => ({
        seller_id: sid === "other" ? null : parseInt(sid),
        weight: sellerGroups[sid],
      }));

      if (sellersPayload.length === 0) {
        setShippingStatus("idle");
        return;
      }

      try {
        // ✅ GỌI API VỚI TYPE CHUẨN (MaybeWrappedResponse)
        const res = await API.post<MaybeWrappedResponse>(
          "/delivery/fee-per-seller/",
          {
            sellers: sellersPayload,
            to_district_id: Number(selectedAddress.district_id),
            to_ward_code: String(selectedAddress.ward_code),
          }
        );

        let finalFee = 0;
        let finalSellers: Record<string, SellerShippingDetail> = {};

        // ✅ LOGIC CHECK TYPE (Type Guard) - Không dùng 'any'
        // Trường hợp 1: Dữ liệu nằm trực tiếp ở root (JSON backend trả về)
        if ('total_shipping_fee' in res) {
            finalFee = res.total_shipping_fee;
            finalSellers = res.sellers;
        } 
        // Trường hợp 2: Dữ liệu bị bọc trong 'data' (do axios wrapper nào đó)
        else if ('data' in res && 'total_shipping_fee' in res.data) {
            finalFee = res.data.total_shipping_fee;
            finalSellers = res.data.sellers;
        }

        setShippingFee(finalFee);

        // Map chi tiết phí từng shop
        const details: Record<string, number> = {};
        if (finalSellers) {
          Object.keys(finalSellers).forEach((k) => {
            const sData = finalSellers[k]; // TS tự hiểu đây là SellerShippingDetail
            if (sData && typeof sData.fee === 'number') {
                details[k] = sData.fee;
            }
          });
        }
        setShippingFeePerSeller(details);
        setShippingStatus("success");

      } catch (error) {
        console.error("Lỗi tính phí ship GHN:", error);
        setShippingStatus("error");
        setShippingFee(0);
      }
    };

    calculateShipping();
  }, [selectedAddress, checkoutItems]);

  // --- ORDER ---
  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      alert("Vui lòng chọn địa chỉ giao hàng");
      return;
    }

    setIsProcessing(true);
    try {
      const orderPayload = {
        total_price: finalTotal,
        shipping_fee: shippingFee,
        customer_name: selectedAddress.recipient_name,
        customer_phone: selectedAddress.phone,
        address: selectedAddress.location,
        note: note,
        payment_method: paymentMethod,
        items: checkoutItems.map((item) => ({
          product: item.product_data?.id,
          quantity: item.quantity,
          price: item.product_data?.price,
        })),
        voucher_code: voucherCode || null,
      };

      await API.post("/orders/", orderPayload);
      await clearCart();

      history.push("/home");
      alert("Đặt hàng thành công!");
    } catch (error) {
      console.error("Order failed", error);
      alert("Đặt hàng thất bại, vui lòng thử lại.");
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    addresses,
    selectedAddress,
    groupedCheckoutItems,
    checkoutItems,
    totalGoods,
    shippingFee,
    discount,
    finalTotal,
    shippingStatus,
    shippingFeePerSeller,
    setSelectedAddressId,
    setPaymentMethod,
    paymentMethod,
    setNote,
    saveAddress,
    handlePlaceOrder,
    isProcessing,
    setVoucherCode,
    setDiscount,
    formatPrice: (price: number) =>
      new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(price),
  };
};

export default useCheckoutLogic;