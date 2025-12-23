import { useState, useEffect, useMemo, useCallback } from "react";
import { useCart } from "../services/CartContext";
import { toast } from "react-toastify";
import API from "../../login_register/services/api";
import { message, notification } from "antd";
import { useNavigate } from "react-router-dom";

const useCheckoutLogic = () => {
  const navigate = useNavigate();
  // [MERGE] Lấy clearSelectedItems từ CartContext
  const { cartItems, clearCart, clearSelectedItems } = useCart();
  const token = localStorage.getItem("token");

  // 1. Xác định khách vãng lai (Guest)
  const isGuest = !token;

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

  // --- 2. LOGIC TỰ ĐỘNG BẬT NHẬP TAY NẾU LÀ GUEST ---
  useEffect(() => {
    if (isGuest) {
      setManualEntry(true);
    }
  }, [isGuest]);

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

  // --- ADDRESS LOGIC (FETCH & CRUD) ---

  // 3. CHẶN GỌI API NẾU KHÔNG CÓ TOKEN
  const fetchAddresses = useCallback(async () => {
    if (!token) {
      setAddresses([]);
      return; // Dừng ngay lập tức, không gọi API để tránh lỗi 401 Unauthorized
    }
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
      setAddresses([]);
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

  // --- SHIPPING LOGIC ---
  useEffect(() => {
    // Guest vẫn có thể tính phí ship nếu nhập địa chỉ tay
    // Nhưng nếu không nhập gì thì thôi
    if (isGuest && !manualEntry) {
      setShippingFee(0);
      setShippingFeePerSeller({});
      return;
    }

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
        // Lưu ý: Backend cần cho phép Guest gọi API này, nếu không sẽ bị 401
        // Nếu Backend chặn, bạn cần bọc try/catch mà không redirect
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
  }, [manualEntry, geoManual, selectedAddress, selectedItems, isGuest]);

  // --- VOUCHER LOGIC ---
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

  // --- 4. HANDLE ORDER (CHECK LOGIN TẠI ĐÂY) ---
  // --- 4. HANDLE ORDER (CHECK LOGIN TẠI ĐÂY) ---
  // --- 4. HANDLE ORDER (CHECK LOGIN TẠI ĐÂY) ---
  const handleOrder = async (extraPayload = {}) => {
    // 1. Check Login
    if (!token) {
      notification.warning({
        message: "Yêu cầu đăng nhập",
        description: "Vui lòng đăng nhập để hoàn tất đơn hàng.",
      });
      navigate("/login?redirect=/checkout", { replace: false });
      return null;
    }

    if (selectedItems.length === 0) {
      notification.error({ message: "Giỏ hàng trống!" });
      return null;
    }

    // 2. Validate thông tin
    const finalName = manualEntry
      ? customerName
      : selectedAddress?.recipient_name;
    const finalPhone = manualEntry ? customerPhone : selectedAddress?.phone;
    const finalLocation = manualEntry ? addressText : selectedAddress?.location;

    if (!finalName || !finalPhone || !finalLocation) {
      notification.error({ message: "Vui lòng điền đủ tên, sđt và địa chỉ!" });
      return null;
    }

    // 3. Làm sạch danh sách sản phẩm (Cực quan trọng)
    const cleanItems = selectedItems
      .map((item) => {
        // Lấy ID an toàn
        const pid = item.product?.id || item.product_data?.id || item.product;
        const prc = item.product?.price || item.product_data?.price || 0;

        return {
          product: parseInt(pid),
          quantity: parseInt(item.quantity) || 1,
          price: parseFloat(prc),
        };
      })
      .filter((i) => !isNaN(i.product) && i.product > 0); // Lọc bỏ ID lỗi (NaN)

    if (cleanItems.length === 0) {
      notification.error({
        message: "Dữ liệu sản phẩm bị lỗi (ID không hợp lệ).",
      });
      return null;
    }

    // 4. Chuẩn bị Payload (Loại bỏ hoàn toàn undefined)
    const orderData = {
      total_price: parseFloat(totalAfterDiscount).toFixed(2),
      shipping_fee: parseFloat(shippingFee).toFixed(2),
      customer_name: finalName,
      customer_phone: finalPhone,
      address: finalLocation,
      note: note || "",
      payment_method:
        payment.includes("VNPAY") || payment.includes("Ví") ? "banking" : "cod",
      items: cleanItems,

      // --- [FIX] CHỈ THÊM NẾU CÓ GIÁ TRỊ (TRÁNH UNDEFINED) ---
      ...(voucherCode ? { shop_voucher_code: voucherCode } : {}),
      // Loại bỏ ship_voucher_code nếu backend không hỗ trợ, hoặc chỉ gửi nếu có
      // ...(shipVoucherCode ? { ship_voucher_code: shipVoucherCode } : {}),

      ...extraPayload,
    };

    try {
      setIsLoading(true);
      console.log("🚀 PAYLOAD SẠCH SẼ:", orderData);

      const res = await API.post("orders/", orderData);

      const newOrderId = res.data.id;
      if (clearSelectedItems) await clearSelectedItems();
      else await clearCart();

      notification.success({ message: "Đặt hàng thành công!" });

      if (orderData.payment_method === "banking") {
        navigate(`/payment/waiting/${newOrderId}`);
      } else {
        navigate(`/orders?tab=active`);
      }
      return newOrderId;
    } catch (error) {
      console.error("❌ LỖI API:", error);

      // --- XEM LỖI CHI TIẾT ---
      if (error.response?.data) {
        console.log("🔥 CHI TIẾT LỖI TỪ SERVER:", error.response.data);

        // Hiển thị lỗi cụ thể lên màn hình để dễ sửa
        const data = error.response.data;
        let msg = "Lỗi đặt hàng.";

        if (data.items) msg = "Lỗi sản phẩm: " + JSON.stringify(data.items);
        else if (data.unavailable_items) msg = "Sản phẩm hết hàng!";
        else if (data.shop_voucher_code)
          msg = "Voucher: " + data.shop_voucher_code;
        else if (data.detail) msg = data.detail;
        else msg = JSON.stringify(data); // In hết ra nếu không biết lỗi gì

        notification.error({ message: "Thất bại", description: msg });
      } else {
        notification.error({ message: "Lỗi kết nối server (500)" });
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isGuest, // EXPORT BIẾN NÀY
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
    addAddress,
  };
};

export default useCheckoutLogic;
