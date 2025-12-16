// src/features/cart/hooks/useCheckoutLogic.js

import { useState, useEffect, useMemo, useCallback } from "react";
import { useCart } from "../services/CartContext";
import { toast } from "react-toastify"; // Hoặc dùng message của Antd tùy bạn
import API from "../../login_register/services/api";
import { applyVoucher } from "../../admin/services/promotionServices";
import { message, notification } from "antd";
import { useNavigate } from "react-router-dom";

const useCheckoutLogic = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();
  const token = localStorage.getItem("token");

  // --- STATE QUẢN LÝ ---
  const [shippingFee, setShippingFee] = useState(0);
  const [shippingStatus, setShippingStatus] = useState("idle");
  const [shippingFeePerSeller, setShippingFeePerSeller] = useState({});
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  // State cho nhập thủ công
  const [manualEntry, setManualEntry] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [addressText, setAddressText] = useState("");
  const [geoManual, setGeoManual] = useState({
    provinceId: undefined,
    districtId: undefined,
    wardCode: undefined,
  });

  // State thanh toán & voucher
  const [note, setNote] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [payment, setPayment] = useState("Thanh toán khi nhận hàng");
  const [isLoading, setIsLoading] = useState(false);

  // --- 1. MEMOIZED VALUES ---

  // Lấy object địa chỉ đang chọn
  const selectedAddress = useMemo(() => {
    return addresses.find((a) => a.id === selectedAddressId) || null;
  }, [addresses, selectedAddressId]);

  // Tổng tiền hàng (chưa ship/voucher)
  const total = useMemo(() => {
    return cartItems
      .filter((item) => item.selected)
      .reduce((sum, item) => {
        const product = item.product_data || item.product || {};
        const price = parseFloat(product.price) || 0;
        return sum + price * (parseInt(item.quantity) || 0);
      }, 0);
  }, [cartItems]);

  // Items được chọn để mua
  const selectedItems = useMemo(() => {
    return cartItems.filter((i) => i.selected);
  }, [cartItems]);

  // Tổng thanh toán cuối cùng
  const totalAfterDiscount = Math.max(total + shippingFee - discount, 0);

  // --- 2. HÀM XỬ LÝ API CƠ BẢN (Address) ---

  // Hàm lấy danh sách địa chỉ (Dùng useCallback để gọi lại được khi cần)
  const fetchAddresses = useCallback(async () => {
    if (!token) return;
    try {
      const res = await API.get("users/addresses/");
      const list = res.data || [];
      setAddresses(list);

      // Nếu chưa chọn địa chỉ nào thì chọn mặc định
      if (!selectedAddressId) {
        const def = list.find((a) => a.is_default);
        if (def) {
          setSelectedAddressId(def.id);
          // Cập nhật luôn form thủ công để hiển thị đẹp
          setCustomerName(def.recipient_name || "");
          setCustomerPhone(def.phone || "");
          setAddressText(def.location || "");
        } else if (list.length > 0) {
          // Nếu không có mặc định thì chọn cái đầu tiên
          setSelectedAddressId(list[0].id);
        }
      }
    } catch (err) {
      console.error("Lỗi tải địa chỉ:", err);
      // Không cần toast lỗi ở đây để tránh spam khi mới vào trang
    }
  }, [token, selectedAddressId]);

  // Hàm xóa địa chỉ
  const deleteAddress = async (id) => {
    try {
      await API.delete(`users/addresses/${id}/`);
      notification.success({
        message: "Thành công",
        description: "Đã xóa địa chỉ!",
        placement: "topRight",
      });
      fetchAddresses();
      if (selectedAddressId === id) {
        setSelectedAddressId(null);
      }
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: "Không thể xóa địa chỉ này.",
        placement: "topRight",
      });
    }
  };

  // Hàm sửa địa chỉ
  const editAddress = async (id, updatedData) => {
    try {
      await API.put(`users/addresses/${id}/`, updatedData);
      notification.success({
        message: "Thành công",
        description: "Đã cập nhật địa chỉ!",
        placement: "topRight",
      });
      fetchAddresses();
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: "Không thể cập nhật địa chỉ.",
        placement: "topRight",
      });
      throw error;
    }
  };

  // Hàm thiết lập địa chỉ mặc định
  const setDefaultAddress = async (id) => {
    try {
      await API.patch(`users/addresses/${id}/set_default/`);
      notification.success({
        message: "Thành công",
        description: "Đã thiết lập địa chỉ mặc định!",
        placement: "topRight",
      });
      fetchAddresses();
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: "Không thể thiết lập địa chỉ mặc định.",
        placement: "topRight",
      });
    }
  };

  // Gọi fetchAddresses khi component mount
  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // --- 3. LOGIC TÍNH PHÍ SHIP (GHN) ---

  useEffect(() => {
    // Nếu chưa chọn địa chỉ và không nhập thủ công -> ko tính
    if (!manualEntry && !selectedAddress) return;

    // Kiểm tra thông tin tỉnh/huyện/xã
    const to_district_id = manualEntry
      ? geoManual.districtId
      : selectedAddress?.district_id;

    const to_ward_code = manualEntry
      ? geoManual.wardCode
      : selectedAddress?.ward_code;

    // Nếu thiếu thông tin địa lý -> Reset phí về 0
    if (!to_district_id || !to_ward_code) {
      setShippingFee(0);
      setShippingFeePerSeller({});
      setShippingStatus("idle");
      return;
    }

    const calculateShipping = async () => {
      setShippingFee(0);
      setShippingStatus("loading");

      // Nhóm hàng theo người bán (Seller)
      const sellerGroups = {};

      selectedItems.forEach((item) => {
        // Logic tìm Seller ID
        const sellerId =
          item.product_data?.store?.id ||
          item.product_data?.seller ||
          item.product?.store?.id ||
          item.product?.seller ||
          item.seller_id;

        if (!sellerId) return;
        if (!sellerGroups[sellerId]) sellerGroups[sellerId] = 0;

        // Logic tính cân nặng
        const productData = item.product_data || item.product || {};
        // Nếu không có cân nặng, giả định 200g/sp
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
        // Gọi API tính phí
        const res = await API.post("delivery/fee-per-seller/", {
          sellers: sellersPayload,
          to_district_id: parseInt(to_district_id),
          to_ward_code: String(to_ward_code),
        });

        // Cập nhật phí
        const totalFee = res.data?.total_shipping_fee || 0;
        setShippingFee(totalFee);

        // Cập nhật chi tiết phí từng shop (để hiển thị UI nếu cần)
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
        console.error("Lỗi tính phí ship:", error);
        setShippingFee(0); // Hoặc set 30k mặc định nếu muốn
        setShippingStatus("error");
      }
    };

    calculateShipping();
  }, [manualEntry, geoManual, selectedAddress, selectedItems]);

  // --- 4. CÁC HÀM XỬ LÝ SỰ KIỆN (Voucher, Order, Save Address) ---

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
        message.success(
          `Đã áp dụng voucher: giảm ${res?.discount?.toLocaleString()}đ`
        );
      } catch (err) {
        setDiscount(0);
        setVoucherCode("");
        message.error("Voucher không hợp lệ hoặc hết hạn!");
      }
    },
    [token, total]
  );

  const addAddress = async (newAddressData) => {
    if (!token) return;
    try {
      // Gọi API thêm mới
      const res = await API.post("users/addresses/", newAddressData);

      // Cập nhật lại danh sách địa chỉ ngay lập tức
      setAddresses((prev) => [...prev, res.data]);

      message.success("Thêm địa chỉ thành công!");

      return res.data; // Trả về data để component con biết là xong
    } catch (error) {
      console.error("Lỗi thêm địa chỉ:", error);
      message.error("Thêm địa chỉ thất bại");
      throw error; // Ném lỗi để AddressAddForm bắt được và tắt loading
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

  const handleOrder = async () => {
    if (!token) {
      notification.warning({ message: "Vui lòng đăng nhập để đặt hàng!" });
      navigate("/login?redirect=/checkout");
      return;
    }

    if (selectedItems.length === 0) {
      notification.error({ message: "Giỏ hàng trống!" });
      return;
    }

    // Xác định thông tin người nhận
    const finalName = manualEntry
      ? customerName
      : selectedAddress?.recipient_name;
    const finalPhone = manualEntry ? customerPhone : selectedAddress?.phone;
    const finalLocation = manualEntry ? addressText : selectedAddress?.location;

    if (!finalName || !finalPhone || !finalLocation) {
      notification.error({
        message: "Vui lòng cung cấp đủ thông tin giao hàng!",
      });
      return;
    }

    const orderData = {
      total_price: totalAfterDiscount,
      shipping_fee: shippingFee,
      customer_name: finalName,
      customer_phone: finalPhone,
      address: finalLocation,
      note: note,
      payment_method: payment === "Ví điện tử" ? "vnpay" : "cod",
      items: selectedItems.map((item) => ({
        product: item.product?.id || item.product, // ID sản phẩm
        quantity: parseInt(item.quantity) || 1,
        price: parseFloat(item.product?.price) || 0,
      })),
      // Nếu backend cần gửi thêm mã voucher
      voucher_code: voucherCode || null,
    };

    try {
      setIsLoading(true);
      await API.post("orders/", orderData);

      // Xóa giỏ hàng sau khi đặt thành công
      await clearCart();

      notification.success({
        message: "Đặt hàng thành công!",
        description: "Cảm ơn bạn đã mua sắm tại GreenFarm.",
      });

      navigate("/orders?tab=pending");
    } catch (error) {
      console.error("Order error:", error);
      notification.error({
        message: "Đặt hàng thất bại",
        description: "Vui lòng thử lại sau.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- RETURN ---
  return {
    // Data
    addresses,
    selectedAddress,
    selectedAddressId,
    shippingFee,
    shippingStatus,
    shippingFeePerSeller,

    // Form Inputs
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

    // Totals
    total,
    totalAfterDiscount,
    selectedItems,

    // Actions/Setters
    addAddress,
    editAddress,
    deleteAddress,
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

    // Logic Handlers
    handleApplyVoucher,
    handleSaveManualAddress,
    handleOrder,
  };
};

export default useCheckoutLogic;
