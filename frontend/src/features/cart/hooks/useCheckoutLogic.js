import { useState, useEffect, useMemo, useCallback } from "react";
import { useCart } from "../services/CartContext";
import { toast } from "react-toastify";
import API from "../../login_register/services/api";
import { message, notification } from "antd";
import { useNavigate } from "react-router-dom";

const useCheckoutLogic = () => {
  const navigate = useNavigate();
  // [MERGE] Lấy clearSelectedItems từ TruongAn1 để chỉ xóa các món đã mua
  const { cartItems, clearCart, clearSelectedItems } = useCart();
  const token = localStorage.getItem("token");

  // --- STATE QUẢN LÝ ---
  const [shippingFee, setShippingFee] = useState(0);
  const [shippingStatus, setShippingStatus] = useState("idle");
  const [shippingFeePerSeller, setShippingFeePerSeller] = useState({});
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  // State nhập thủ công (Vãng lai)
  const [manualEntry, setManualEntry] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [addressText, setAddressText] = useState("");
  const [geoManual, setGeoManual] = useState({
    provinceId: undefined,
    districtId: undefined,
    wardCode: undefined,
  });

  const [note, setNote] = useState("");
  
  // State Voucher & Payment
  const [voucherCode, setVoucherCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [payment, setPayment] = useState("Thanh toán khi nhận hàng");
  const [isLoading, setIsLoading] = useState(false);

  // --- MEMOIZED VALUES ---
  const selectedAddress = useMemo(() => {
    return addresses.find((a) => a.id === selectedAddressId) || null;
  }, [addresses, selectedAddressId]);

  const selectedItems = useMemo(() => {
    return cartItems.filter((i) => i.selected);
  }, [cartItems]);

  const total = useMemo(() => {
    return selectedItems.reduce((sum, item) => {
      const product = item.product_data || item.product || {};
      const price = parseFloat(product.price) || 0;
      return sum + price * (parseInt(item.quantity) || 0);
    }, 0);
  }, [selectedItems]);

  const totalAfterDiscount = Math.max(total + shippingFee - discount, 0);

  // --- ADDRESS LOGIC (FETCH & CRUD - Từ HEAD) ---
  const fetchAddresses = useCallback(async () => {
    if (!token) return;
    try {
      const res = await API.get("users/addresses/");
      const list = res.data || [];
      setAddresses(list);

      if (!selectedAddressId) {
        const def = list.find((a) => a.is_default);
        if (def) {
          setSelectedAddressId(def.id);
        } else if (list.length > 0) {
          setSelectedAddressId(list[0].id);
        }
      }
    } catch (err) {
      console.error("Fetch address error", err);
    }
  }, [token, selectedAddressId]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const deleteAddress = async (id) => {
    try {
      await API.delete(`users/addresses/${id}/`);
      notification.success({ message: "Đã xóa địa chỉ!" });
      setAddresses((prev) => prev.filter((item) => item.id !== id));
      if (selectedAddressId === id) setSelectedAddressId(null);
    } catch (error) {
      notification.error({ message: "Không thể xóa địa chỉ này." });
    }
  };

  const editAddress = async (id, updatedData) => {
    try {
      const res = await API.put(`users/addresses/${id}/`, updatedData);
      notification.success({ message: "Đã cập nhật địa chỉ!" });
      setAddresses((prev) =>
        prev.map((item) => (item.id === id ? res.data : item))
      );
    } catch (error) {
      notification.error({ message: "Lỗi cập nhật địa chỉ." });
    }
  };

  const setDefaultAddress = async (id) => {
    try {
      await API.patch(`users/addresses/${id}/set_default/`);
      notification.success({ message: "Đã thiết lập mặc định!" });
      fetchAddresses();
    } catch (error) {
      notification.error({ message: "Lỗi thiết lập mặc định." });
    }
  };

  const addAddress = async (newAddressData) => {
    if (!token) return;
    try {
      const res = await API.post("users/addresses/", newAddressData);
      setAddresses((prev) => [...prev, res.data]);
      message.success("Thêm địa chỉ thành công!");
      return res.data;
    } catch (error) {
      message.error("Thêm địa chỉ thất bại");
      throw error;
    }
  };

  const handleSaveManualAddress = async () => {
    if (!token) return;
    if (!geoManual.provinceId || !geoManual.districtId || !geoManual.wardCode) {
      toast.error("Vui lòng chọn đầy đủ Tỉnh/Quận/Phường!");
      return;
    }
    const payload = {
      recipient_name: customerName,
      phone: customerPhone,
      location: addressText,
      province_code: geoManual.provinceId,
      district_id: geoManual.districtId,
      ward_code: geoManual.wardCode,
      is_default: false,
    };
    try {
      const res = await API.post("users/addresses/", payload);
      setAddresses((prev) => [...prev, res.data]);
      setSelectedAddressId(res.data.id);
      setManualEntry(false);
      toast.success("Lưu địa chỉ mới thành công!");
    } catch (error) {
      toast.error("Không thể lưu địa chỉ.");
    }
  };

  // --- SHIPPING LOGIC (Giữ logic HEAD vì hỗ trợ nhiều seller) ---
  useEffect(() => {
    if (!manualEntry && !selectedAddress) return;

    const to_district_id = manualEntry
      ? geoManual.districtId
      : selectedAddress?.district_id;
    const to_ward_code = manualEntry
      ? geoManual.wardCode
      : selectedAddress?.ward_code;

    if (!to_district_id || !to_ward_code) {
      setShippingFee(0);
      setShippingFeePerSeller({});
      setShippingStatus("idle");
      return;
    }

    const calculateShipping = async () => {
      setShippingFee(0);
      setShippingStatus("loading");
      const sellerGroups = {};

      selectedItems.forEach((item) => {
        const sellerId =
          item.product_data?.store?.id ||
          item.product_data?.seller ||
          item.product?.store?.id ||
          item.product?.seller ||
          item.seller_id;

        if (!sellerId) return;
        if (!sellerGroups[sellerId]) sellerGroups[sellerId] = 0;

        const productData = item.product_data || item.product || {};
        let weightPerItem = 200;
        if (productData.weight_g && parseInt(productData.weight_g) > 0) {
          weightPerItem = parseInt(productData.weight_g);
        }
        const quantity = parseInt(item.quantity) || 1;
        sellerGroups[sellerId] += quantity * weightPerItem;
      });

      const sellersPayload = Object.keys(sellerGroups).map((sid) => ({
        seller_id: parseInt(sid),
        weight: sellerGroups[sid],
      }));

      if (sellersPayload.length === 0) {
        setShippingFee(0);
        setShippingStatus("idle");
        return;
      }

      try {
        const res = await API.post("delivery/fee-per-seller/", {
          sellers: sellersPayload,
          to_district_id: parseInt(to_district_id),
          to_ward_code: String(to_ward_code),
        });

        const totalFee = res.data?.total_shipping_fee || 0;
        setShippingFee(totalFee);

        const feesDetail = {};
        if (res.data?.sellers) {
          Object.keys(res.data.sellers).forEach((key) => {
            if (res.data.sellers[key].success) {
              feesDetail[key] = res.data.sellers[key].fee;
            }
          });
        }
        setShippingFeePerSeller(feesDetail);
        setShippingStatus("success");
      } catch (error) {
        console.error("Shipping calc error:", error);
        setShippingFee(0);
        setShippingStatus("error");
      }
    };

    const timer = setTimeout(() => {
      calculateShipping();
    }, 500);

    return () => clearTimeout(timer);
  }, [manualEntry, geoManual, selectedAddress, selectedItems]);

  // --- VOUCHER LOGIC (Logic TruongAn1 - Hỗ trợ object data) ---
  const handleApplyVoucher = useCallback((data) => {
    if (!data) {
        setDiscount(0);
        setVoucherCode("");
        return;
    }
    // Set tổng tiền giảm (Shop + Ship)
    setDiscount(data.totalDiscount || 0);

    // Lấy code để gửi backend (ưu tiên shop voucher hoặc ship voucher)
    // Lưu ý: Backend cần hỗ trợ nhận cả 2 code nếu muốn lưu lịch sử dùng cả 2
    // Ở đây ta tạm lấy 1 code đại diện hoặc logic tùy backend của bạn
    let code = "";
    if (data.shopVoucher) code = data.shopVoucher.voucher.code;
    else if (data.shipVoucher) code = data.shipVoucher.voucher.code;
    
    setVoucherCode(code);
  }, []);

  // --- HANDLE ORDER (MERGED) ---
  const handleOrder = async (extraPayload = {}) => {
    if (!token) {
      notification.warning({ message: "Vui lòng đăng nhập để đặt hàng!" });
      navigate("/login?redirect=/checkout");
      return null;
    }

    if (selectedItems.length === 0) {
      notification.error({ message: "Giỏ hàng trống!" });
      return null;
    }

    const finalName = manualEntry
      ? customerName
      : selectedAddress?.recipient_name;
    const finalPhone = manualEntry ? customerPhone : selectedAddress?.phone;
    const finalLocation = manualEntry ? addressText : selectedAddress?.location;

    if (!finalName || !finalPhone || !finalLocation) {
      notification.error({
        message: "Vui lòng điền đủ tên, số điện thoại và địa chỉ!",
      });
      return null;
    }

    // Mapping items chuẩn (Logic HEAD)
    const cleanItems = selectedItems.map((item) => {
      let productId = item.product;
      if (typeof item.product === "object" && item.product !== null) {
        productId = item.product.id;
      }
      if (!productId && item.product_data) {
        productId = item.product_data.id;
      }

      return {
        product: parseInt(productId),
        quantity: parseInt(item.quantity) || 1,
        price: parseFloat(item.product?.price || item.product_data?.price || 0),
      };
    });

    const orderData = {
      total_price: totalAfterDiscount,
      shipping_fee: shippingFee,
      customer_name: finalName,
      customer_phone: finalPhone,
      address: finalLocation,
      note: note || "",
      payment_method: payment === "Ví điện tử" ? "banking" : "cod", // Logic HEAD map đúng với VNPAY
      items: cleanItems,
      voucher_code: voucherCode || null,
      ...extraPayload // Cho phép ghi đè từ UI (ví dụ shop_voucher_code, ship_voucher_code)
    };

    try {
      setIsLoading(true);
      const res = await API.post("orders/", orderData);

      // Thành công
      const newOrderId = res.data.id;
      
      // [QUAN TRỌNG] Chỉ xóa các món đã chọn (Logic TruongAn1)
      if (clearSelectedItems) {
        await clearSelectedItems();
      } else {
        await clearCart(); // Fallback
      }
      
      notification.success({ message: "Đặt hàng thành công!" });

      // Điều hướng
      if (payment === "Ví điện tử" || payment === "Thanh toán qua VNPAY") {
        navigate(`/payment/waiting/${newOrderId}`);
      } else {
        navigate(`/orders?tab=active`);
      }

      return newOrderId;
    } catch (error) {
      console.error("❌ LỖI API:", error);
      const backendData = error.response?.data;

      // [QUAN TRỌNG] Bắt lỗi hết hàng (Logic HEAD)
      if (backendData && backendData.unavailable_items) {
        throw { response: { data: backendData } };
      }

      // Các lỗi khác
      let errorMsg = "Có lỗi xảy ra khi đặt hàng.";
      if (backendData) {
        if (backendData.voucher_code) errorMsg = backendData.voucher_code[0]; // Lỗi voucher
        else if (typeof backendData.detail === "string") errorMsg = backendData.detail;
        else if (typeof backendData === "string") errorMsg = backendData;
      }

      notification.error({
        message: "Đặt hàng thất bại",
        description: errorMsg,
      });

      // Reset voucher nếu lỗi (Logic TruongAn1)
      if (errorMsg.toLowerCase().includes("voucher")) {
          setVoucherCode("");
          setDiscount(0);
      }

      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // State
    addresses,
    selectedAddress,
    selectedAddressId,
    shippingFee,
    shippingStatus,
    shippingFeePerSeller,
    manualEntry,
    customerName,
    customerPhone,
    addressText,
    note,
    voucherCode,
    discount,
    geoManual,
    payment,
    isLoading,
    total,
    totalAfterDiscount,
    selectedItems,

    // Actions
    addAddress,
    deleteAddress,
    editAddress,
    setDefaultAddress,
    fetchAddresses,
    setSelectedAddressId,
    setManualEntry,
    setCustomerName,
    setCustomerPhone,
    setAddressText,
    setNote,
    setGeoManual,
    setPayment,
    handleApplyVoucher,
    handleSaveManualAddress,
    handleOrder,
    addAddress, // Đảm bảo export hàm này cho UI dùng
  };
};

export default useCheckoutLogic;