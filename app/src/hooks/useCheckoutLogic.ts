import { useState, useEffect, useMemo, useCallback } from "react";
import { useIonRouter } from "@ionic/react";
import { useCart, CartItem } from "../context/CartContext";
import { Address } from "../types/Address";
import { API } from "../api/api";
import { Product } from "../types/models";

interface ExtendedProduct extends Product {
  seller?: number;
  weight_g?: number;
  store_id?: number;
}

interface SellerShippingDetail {
  success: boolean;
  fee: number;
}

interface ShippingFeeResponse {
  total_shipping_fee: number;
  sellers: Record<string, SellerShippingDetail>;
}

export interface StoreGroup {
  storeName: string;
  storeId: string;
  items: CartItem[];
  subtotal: number;
}

const useCheckoutLogic = () => {
  const router = useIonRouter();
  const { cartItems, clearCart } = useCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null
  );
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [shippingStatus, setShippingStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [shippingFeePerSeller, setShippingFeePerSeller] = useState<
    Record<string, number>
  >({});
  const [paymentMethod, setPaymentMethod] = useState<string>("cod");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [discount, setDiscount] = useState<number>(0);

  const checkoutItems = useMemo(
    () => cartItems.filter((item) => item.selected),
    [cartItems]
  );

  const selectedAddress = useMemo(
    () => addresses.find((a) => a.id === selectedAddressId) || null,
    [addresses, selectedAddressId]
  );

  const groupedCheckoutItems = useMemo(() => {
    return checkoutItems.reduce<Record<string, StoreGroup>>((acc, item) => {
      const product = item.product_data;
      if (!product) return acc;
      const storeId = product.store?.id ? String(product.store.id) : "other";
      const storeName = product.store?.store_name || "Cửa hàng";

      if (!acc[storeId]) {
        acc[storeId] = { storeName, storeId, items: [], subtotal: 0 };
      }
      acc[storeId].items.push(item);
      acc[storeId].subtotal += (product.price || 0) * item.quantity;
      return acc;
    }, {});
  }, [checkoutItems]);

  const totalGoods = useMemo(
    () =>
      checkoutItems.reduce(
        (acc, item) => acc + (item.product_data?.price || 0) * item.quantity,
        0
      ),
    [checkoutItems]
  );

  const finalTotal = Math.max(totalGoods + shippingFee - discount, 0);

  const fetchAddresses = useCallback(async () => {
    try {
      const res: any = await API.get("/users/addresses/");
      const list = Array.isArray(res) ? res : res.data || [];
      setAddresses(list);
      if (list.length > 0 && !selectedAddressId) {
        const defaultAddr = list.find((a: any) => a.is_default) || list[0];
        setSelectedAddressId(defaultAddr.id);
      }
    } catch (err) {
      console.error("Lỗi tải địa chỉ", err);
    }
  }, [selectedAddressId]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // TÍNH PHÍ SHIP
  useEffect(() => {
    if (!selectedAddress?.district_id || !selectedAddress?.ward_code) {
      setShippingStatus("idle");
      return;
    }

    const calculateShipping = async () => {
      setShippingStatus("loading");
      try {
        const sellerGroups: Record<string, number> = {};
        checkoutItems.forEach((item) => {
          const p = item.product_data as unknown as ExtendedProduct;
          const sId = p.store?.id || p.seller || "other";
          sellerGroups[String(sId)] =
            (sellerGroups[String(sId)] || 0) +
            item.quantity * (p.weight_g || 200);
        });

        const res: any = await API.post("/delivery/fee-per-seller/", {
          sellers: Object.keys(sellerGroups).map((id) => ({
            seller_id: id === "other" ? null : parseInt(id),
            weight: sellerGroups[id],
          })),
          to_district_id: Number(selectedAddress.district_id),
          to_ward_code: String(selectedAddress.ward_code),
        });

        const data = res.data || res;
        setShippingFee(data.total_shipping_fee || 0);
        const details: Record<string, number> = {};
        if (data.sellers) {
          Object.keys(data.sellers).forEach(
            (k) => (details[k] = data.sellers[k].fee)
          );
        }
        setShippingFeePerSeller(details);
        setShippingStatus("success");
      } catch (error) {
        setShippingStatus("error");
        setShippingFee(0);
      }
    };
    calculateShipping();
  }, [selectedAddress, checkoutItems]);

  const handlePlaceOrder = async () => {
    if (!selectedAddress) return alert("Vui lòng chọn địa chỉ giao hàng");
    if (shippingStatus === "loading") return;

    setIsProcessing(true);
    try {
      const orderPayload = {
        total_price: finalTotal,
        shipping_fee: shippingFee,
        customer_name: selectedAddress.recipient_name,
        customer_phone: selectedAddress.phone,
        address: selectedAddress.location,
        payment_method: paymentMethod,
        items: checkoutItems.map((item) => ({
          product: item.product_data?.id,
          quantity: item.quantity,
          price: item.product_data?.price,
        })),
      };

      await API.post("/orders/", orderPayload);
      await clearCart();
      alert("Đặt hàng thành công!");
      router.push("/home", "root", "replace");
    } catch (error) {
      alert("Đặt hàng thất bại, vui lòng thử lại.");
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    checkoutItems,
    groupedCheckoutItems,
    selectedAddress,
    totalGoods,
    shippingFee,
    shippingStatus,
    shippingFeePerSeller,
    discount,
    finalTotal,
    paymentMethod,
    setPaymentMethod,
    isProcessing,
    handlePlaceOrder,
    saveAddress: fetchAddresses, // Giả định đơn giản hóa
    formatPrice: (p: number) => p.toLocaleString("vi-VN") + "đ",
  };
};

export default useCheckoutLogic;
