import { useState, useEffect, useMemo, useCallback } from "react";
import { useCart } from "../services/CartContext"; // Đảm bảo import đúng
import { toast } from "react-toastify";
import API from "../../login_register/services/api";
import { message, notification } from "antd";
import { useNavigate } from "react-router-dom";

const useCheckoutLogic = () => {
  const navigate = useNavigate();
  // [FIX] Lấy thêm hàm clearSelectedItems từ CartContext
  const { cartItems, clearCart, clearSelectedItems } = useCart();
  const token = localStorage.getItem("token");

  // State
  const [shippingFee, setShippingFee] = useState(0);
  const [shippingStatus, setShippingStatus] = useState("idle");
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [manualEntry, setManualEntry] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [addressText, setAddressText] = useState("");
  const [note, setNote] = useState("");
  
  // State Voucher
  const [voucherCode, setVoucherCode] = useState(""); 
  const [discount, setDiscount] = useState(0);

  const [geoManual, setGeoManual] = useState({
    provinceId: undefined, districtId: undefined, wardCode: undefined,
  });
  const [payment, setPayment] = useState("Thanh toán khi nhận hàng");
  const [isLoading, setIsLoading] = useState(false);

  // Memoized
  const selectedAddress = useMemo(() => addresses.find((a) => a.id === selectedAddressId) || null, [addresses, selectedAddressId]);
  
  const total = useMemo(() => {
    return cartItems.filter((i) => i.selected).reduce((sum, item) => {
        return sum + (parseFloat(item.product?.price || 0) * (parseInt(item.quantity) || 0));
    }, 0);
  }, [cartItems]);

  const totalAfterDiscount = Math.max(total + shippingFee - discount, 0);
  const selectedItems = useMemo(() => cartItems.filter((i) => i.selected), [cartItems]);

  // --- ÁP DỤNG VOUCHER ---
  const handleApplyVoucher = useCallback((data) => {
      if (!data) {
          setDiscount(0);
          setVoucherCode("");
          return;
      }
      setDiscount(data.totalDiscount || 0);

      let code = "";
      if (data.shopVoucher) code = data.shopVoucher.voucher.code;
      else if (data.shipVoucher) code = data.shipVoucher.voucher.code;
      
      setVoucherCode(code);
  }, []);

  // --- ĐẶT HÀNG ---
  const handleOrder = async () => {
    if (!token) return navigate("/login");
    if (selectedItems.length === 0) return notification.warning({ message: "Giỏ hàng trống" });

    const orderData = {
      total_price: totalAfterDiscount,
      shipping_fee: shippingFee,
      customer_name: manualEntry ? customerName : selectedAddress?.recipient_name || "",
      customer_phone: manualEntry ? customerPhone : selectedAddress?.phone || "",
      address: manualEntry ? addressText : selectedAddress?.location || "",
      note,
      payment_method: payment === "Ví điện tử" ? "vnpay" : "cod",
      voucher_code: voucherCode, 
      items: selectedItems.map((item) => ({
        product: item.product?.id || item.product,
        quantity: parseInt(item.quantity) || 1,
        price: parseFloat(item.product?.price) || 0,
      })),
    };

    try {
      setIsLoading(true);
      await API.post("orders/", orderData);
      
      // [QUAN TRỌNG] Chỉ xóa những món đã chọn (selectedItems), giữ lại các món khác
      await clearSelectedItems(); 
      
      notification.success({ message: "Đặt hàng thành công!" });
      
      // Reset voucher state
      setVoucherCode("");
      setDiscount(0);
      
      navigate("/orders?tab=pending");
    } catch (error) {
      console.error("Lỗi đặt hàng:", error);
      const msg = error.response?.data?.voucher_code?.[0] || error.response?.data?.error || "Có lỗi xảy ra.";
      if (msg.includes("Voucher")) {
          notification.error({ message: "Lỗi Voucher", description: msg });
          setVoucherCode(""); 
          setDiscount(0);
      } else {
          notification.error({ message: "Đặt hàng thất bại", description: msg });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ... (Giữ nguyên các phần khác: handleSaveManualAddress, useEffect fetch...) 
  // Code dưới đây chỉ để tham khảo, không cần thay đổi nếu logic cũ đã chạy tốt
  const handleSaveManualAddress = async () => {
    if (!token) return;
    if (!geoManual.provinceId || !geoManual.districtId || !geoManual.wardCode) {
      toast.error("Vui lòng chọn đầy đủ Tỉnh/Quận/Phường trước khi lưu!");
      return;
    }
    const payload = {
      recipient_name: customerName,
      phone: customerPhone,
      location: addressText,
      province_code: geoManual.provinceId,
      district_code: geoManual.districtId,
      district_id: geoManual.districtId,
      ward_code: geoManual.wardCode,
      is_default: false,
    };
    try {
      const res = await API.post("users/addresses/", payload);
      setAddresses((prev) => [...prev, res.data]);
      setSelectedAddressId(res.data.id);
      setManualEntry(false);
      toast.success("Đã lưu địa chỉ thành công!");
    } catch (error) {
      toast.error("Không thể lưu địa chỉ.");
    }
  };

  useEffect(() => {
    if (!token) return;
    const fetchAddresses = async () => {
      try {
        const res = await API.get("users/addresses/");
        setAddresses(res.data || []);
        const def = (res.data || []).find((a) => a.is_default);
        if (def) {
          setSelectedAddressId(def.id);
          setCustomerName(def.recipient_name || "");
          setCustomerPhone(def.phone || "");
          setAddressText(def.location || "");
        }
      } catch (err) {}
    };
    fetchAddresses();
  }, [token]);

  useEffect(() => {
    if (selectedAddress && (!selectedAddress.district_id || !selectedAddress.ward_code)) {
      setManualEntry(true);
      return;
    }
    const fetchShippingFee = async () => {
      const to_district_id = manualEntry ? geoManual.districtId : selectedAddress?.district_id;
      const to_ward_code = manualEntry ? geoManual.wardCode : selectedAddress?.ward_code;
      if (!to_district_id || !to_ward_code) {
        setShippingFee(0); setShippingStatus("idle"); return;
      }
      setShippingFee(0); setShippingStatus("loading");
      const totalWeight = selectedItems.reduce((sum, item) => sum + (parseInt(item.quantity) || 0) * 500, 0);
      try {
        const payload = {
          from_district_id: 1450, from_ward_code: "21007",
          to_district_id: parseInt(to_district_id), to_ward_code: String(to_ward_code).trim(),
          weight: totalWeight > 0 ? totalWeight : 1, length: 20, width: 15, height: 10,
        };
        const res = await API.post("delivery/fee/", payload);
        setShippingFee(res.data?.fee || 0); setShippingStatus("success");
      } catch (error) { setShippingFee(0); setShippingStatus("error"); }
    };
    fetchShippingFee();
  }, [manualEntry, geoManual, selectedAddress, selectedItems]);

  return {
    shippingFee, shippingStatus, addresses, selectedAddressId, manualEntry,
    customerName, customerPhone, addressText, note, voucherCode, geoManual,
    discount, payment, isLoading, token,
    setShippingFee, setShippingStatus, setAddresses, setSelectedAddressId,
    setManualEntry, setCustomerName, setCustomerPhone, setAddressText, setNote,
    setVoucherCode, setGeoManual, setDiscount, setPayment, setIsLoading,
    selectedAddress, total, totalAfterDiscount, selectedItems,
    handleApplyVoucher, handleOrder, handleSaveManualAddress
  };
};

export default useCheckoutLogic;