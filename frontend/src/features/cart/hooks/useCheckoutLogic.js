// src/features/cart/hooks/useCheckoutLogic.js

import { useState, useEffect, useMemo, useCallback } from "react";
import { useCart } from "../services/CartContext";
import { toast } from "react-toastify";
import API from "../../login_register/services/api";
import { applyVoucher } from "../../admin/services/promotionServices";
import { message, notification } from "antd";
import { useNavigate } from "react-router-dom";

const useCheckoutLogic = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();
  const token = localStorage.getItem("token");

  // State quản lý dữ liệu và UI
  const [shippingFee, setShippingFee] = useState(0);
  const [shippingStatus, setShippingStatus] = useState("idle");
  const [shippingFeePerSeller, setShippingFeePerSeller] = useState({}); // { seller_id: fee }
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [manualEntry, setManualEntry] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [addressText, setAddressText] = useState("");
  const [note, setNote] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [geoManual, setGeoManual] = useState({
    provinceId: undefined,
    districtId: undefined,
    wardCode: undefined,
  });
  const [discount, setDiscount] = useState(0);
  const [payment, setPayment] = useState("Thanh toán khi nhận hàng");
  const [isLoading, setIsLoading] = useState(false);

  // --- MEMOIZED VALUES ---

  // Lấy địa chỉ đã chọn
  const selectedAddress = useMemo(() => {
    return addresses.find((a) => a.id === selectedAddressId) || null;
  }, [addresses, selectedAddressId]);

  // Tổng tiền tạm tính (trước phí ship và giảm giá)
  const total = useMemo(() => {
    return cartItems
      .filter((item) => item.selected)
      .reduce((sum, item) => {
        const product = item.product_data || item.product || {};
        const price = parseFloat(product.price) || 0;
        return sum + price * (parseInt(item.quantity) || 0);
      }, 0);
  }, [cartItems]);

  // Tổng tiền sau giảm giá và phí ship
  const totalAfterDiscount = Math.max(total + shippingFee - discount, 0);

  const selectedItems = useMemo(() => {
    return cartItems.filter((i) => i.selected);
  }, [cartItems]);

  // --- ASYNC HANDLERS ---

  // Xử lý áp dụng Voucher
  const handleApplyVoucher = useCallback(
    async (code) => {
      if (!token) return;

      if (!code) {
        setDiscount(0);
        setVoucherCode("");
        return;
      }
      try {
        const res = await applyVoucher(code, total);
        setDiscount(res?.discount || 0);
        setVoucherCode(code);
      } catch (err) {
        setDiscount(0);
        setVoucherCode("");
        message.error("Mã voucher không hợp lệ hoặc đã hết hạn!");
      }
    },
    [token, total]
  );

  // Xử lý đặt hàng (COD)
  const handleOrder = async () => {
    if (!token) {
      notification.info("Vui lòng đăng nhập để tiếp tục đặt hàng!");
      navigate("/login?redirect=/checkout");
      return;
    }

    if (selectedItems.length === 0) {
      return;
    }

    const orderData = {
      total_price: totalAfterDiscount,
      shipping_fee: shippingFee,
      customer_name: manualEntry
        ? customerName
        : selectedAddress?.recipient_name || "",
      customer_phone: manualEntry
        ? customerPhone
        : selectedAddress?.phone || "",
      address: manualEntry ? addressText : selectedAddress?.location || "",
      note,
      payment_method: payment === "Ví điện tử" ? "vnpay" : "cod", // Mặc định là COD
      items: selectedItems.map((item) => ({
        product: item.product?.id || item.product,
        quantity: parseInt(item.quantity) || 1,
        price: parseFloat(item.product?.price) || 0,
      })),
    };

    try {
      setIsLoading(true);
      await API.post("orders/", orderData);
      await clearCart();
      notification.success({
        message: "Đơn hàng đã được đặt",
        placement: "topRight",
        duration: 2,
      });
      navigate("/orders?tab=pending");
    } catch (error) {
      console.error("Đặt hàng thất bại:", error);
      notification.error("Đặt hàng thất bại!");
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý lưu địa chỉ thủ công
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
      const savedAddress = res.data;

      setAddresses((prev) => [...prev, savedAddress]);
      setSelectedAddressId(savedAddress.id);
      setManualEntry(false); // Đóng form sau khi lưu
      toast.success("Đã lưu địa chỉ thành công!");
    } catch (error) {
      console.error("❌ Lỗi khi lưu địa chỉ:", error.response?.data || error);
      toast.error("Không thể lưu địa chỉ. Vui lòng thử lại!");
    }
  };

  // --- EFFECTS ---

  // Fetch danh sách địa chỉ và đặt địa chỉ mặc định
  useEffect(() => {
    if (!token) return;

    const fetchAddresses = async () => {
      try {
        const res = await API.get("users/addresses/");
        const list = res.data || [];
        setAddresses(list);

        const def = list.find((a) => a.is_default);
        if (def) {
          setSelectedAddressId(def.id);
          setCustomerName(def.recipient_name || "");
          setCustomerPhone(def.phone || "");
          setAddressText(def.location || "");
        }
      } catch (err) {
        toast.error("Không thể tải địa chỉ");
      }
    };
    fetchAddresses();
  }, [token]);

  // Tính phí vận chuyển GHN cho từng seller
  useEffect(() => {
    if (
      selectedAddress &&
      (!selectedAddress.district_id || !selectedAddress.ward_code)
    ) {
      setManualEntry(true);
      toast.warn(
        "Địa chỉ thiếu thông tin GHN. Vui lòng chọn Tỉnh/Quận/Phường thủ công."
      );
      return;
    }

    // Tính phí vận chuyển GHN cho từng seller
    const fetchShippingFee = async () => {
      const to_district_id = manualEntry
        ? geoManual.districtId
        : selectedAddress?.district_id;

      const to_ward_code = manualEntry
        ? geoManual.wardCode
        : selectedAddress?.ward_code
          ? String(selectedAddress.ward_code).trim()
          : undefined;

      if (!to_district_id || !to_ward_code) {
        setShippingFee(0);
        setShippingFeePerSeller({});
        setShippingStatus("idle");
        return;
      }

      setShippingFee(0);
      setShippingStatus("loading");

      // Nhóm items theo seller và tính tổng cân nặng thực tế
      const sellerGroups = {};

      selectedItems.forEach((item) => {
        // Lấy Seller ID (giữ nguyên logic cũ của bạn)
        const sellerId =
          item.product_data?.store?.id ||
          item.product_data?.seller ||
          item.product?.store?.id ||
          item.product?.seller ||
          item.seller_id;

        if (!sellerId) return;

        if (!sellerGroups[sellerId]) {
          sellerGroups[sellerId] = 0;
        }

        // --- ĐOẠN SỬA ĐỔI QUAN TRỌNG ---
        // 1. Lấy thông tin sản phẩm từ product_data hoặc product
        const productData = item.product_data || item.product || {};

        // 2. Lấy weight_g từ API Backend trả về
        // Nếu null hoặc = 0 thì fallback về 200g (mức an toàn)
        let weightPerItem = 200;
        if (productData.weight_g && parseInt(productData.weight_g) > 0) {
          weightPerItem = parseInt(productData.weight_g);
        }

        // 3. Tính tổng: số lượng * cân nặng thực
        const quantity = parseInt(item.quantity) || 0;
        sellerGroups[sellerId] += quantity * weightPerItem;
      });

      try {
        const sellers = Object.keys(sellerGroups).map((sellerId) => ({
          seller_id: parseInt(sellerId),
          weight: sellerGroups[sellerId] > 0 ? sellerGroups[sellerId] : 1, // Tối thiểu 1g
        }));

        console.log(
          "📦 GHN DEBUG - DATA GỬI ĐI:",
          JSON.stringify(sellers, null, 2)
        );

        if (sellers.length === 0) {
          setShippingFee(0);
          setShippingFeePerSeller({});
          setShippingStatus("idle");
          return;
        }

        const payload = {
          sellers: sellers,
          to_district_id: parseInt(to_district_id),
          to_ward_code: to_ward_code,
        };

        const res = await API.post("delivery/fee-per-seller/", payload);

        const totalFee = res.data?.total_shipping_fee || 0;
        const sellerFees = {};
        if (res.data?.sellers) {
          Object.keys(res.data.sellers).forEach((sellerId) => {
            if (res.data.sellers[sellerId].success) {
              sellerFees[sellerId] = res.data.sellers[sellerId].fee;
            }
          });
        }

        setShippingFee(totalFee);
        setShippingFeePerSeller(sellerFees);
        setShippingStatus("success");
      } catch (error) {
        console.error("❌ Lỗi API GHN:", error);
        setShippingFee(0);
        setShippingFeePerSeller({});
        setShippingStatus("error");
      }
    };

    fetchShippingFee();
  }, [manualEntry, geoManual, selectedAddress, selectedItems]);

  return {
    // State
    shippingFee,
    shippingStatus,
    shippingFeePerSeller,
    addresses,
    selectedAddressId,
    manualEntry,
    customerName,
    customerPhone,
    addressText,
    note,
    voucherCode,
    geoManual,
    discount,
    payment,
    isLoading,
    token, // Cần để kiểm tra đã đăng nhập chưa

    // Setters
    setShippingFee,
    setShippingStatus,
    setShippingFeePerSeller,
    setAddresses,
    setSelectedAddressId,
    setManualEntry,
    setCustomerName,
    setCustomerPhone,
    setAddressText,
    setNote,
    setVoucherCode,
    setGeoManual,
    setDiscount,
    setPayment,
    setIsLoading,

    // Memoized
    selectedAddress,
    total,
    totalAfterDiscount,
    selectedItems,

    // Handlers
    handleApplyVoucher,
    handleOrder,
    handleSaveManualAddress,
  };
};

export default useCheckoutLogic;
