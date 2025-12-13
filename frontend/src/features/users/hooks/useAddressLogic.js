import { useState, useEffect, useCallback } from "react";
import { message, notification } from "antd";
import { useCart } from "../../cart/services/CartContext";
// ĐƯỜNG DẪN API (Sửa lại cho đúng với dự án của bạn)
import API from "../../login_register/services/api";

const useCheckoutLogic = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [addresses, setAddresses] = useState([]); // Danh sách địa chỉ
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  // Các state khác (giữ nguyên logic cũ của bạn)
  const [manualEntry, setManualEntry] = useState(false);
  const [payment, setPayment] = useState("Tiền mặt"); // Mặc định
  const [note, setNote] = useState("");
  const { cartItems, total } = useCart();

  // Tính toán phí ship, giảm giá (Logic giả định)
  const [shippingFee, setShippingFee] = useState(0);
  const [discount, setDiscount] = useState(0);

  // --- 1. HÀM TẢI DANH SÁCH ĐỊA CHỈ (QUAN TRỌNG NHẤT) ---
  const fetchAddresses = useCallback(async () => {
    try {
      // Gọi API lấy list địa chỉ
      const response = await API.get("users/addresses/");

      // Cập nhật State
      setAddresses(response.data);

      // Logic tự động chọn địa chỉ mặc định nếu chưa chọn cái nào
      if (!selectedAddressId && response.data.length > 0) {
        const defaultAddr = response.data.find((a) => a.is_default);
        setSelectedAddressId(
          defaultAddr ? defaultAddr.id : response.data[0].id
        );
      }

      // Tính phí ship giả định (nếu cần)
      if (response.data.length > 0) setShippingFee(30000);
    } catch (error) {
      console.error("Lỗi tải địa chỉ:", error);
    }
  }, [selectedAddressId]);

  // --- 2. GỌI KHI COMPONENT MOUNT ---
  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // Logic tính toán tổng tiền
  const totalAfterDiscount = total + shippingFee - discount;
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
  const selectedItems = cartItems; // Giả sử mua hết giỏ hàng

  // Hàm xử lý đặt hàng (Giữ nguyên logic của bạn)
  const handleOrder = async () => {
    // ... logic đặt hàng của bạn
    message.success("Đặt hàng thành công!");
  };

  const deleteAddress = async (id) => {
    try {
      await API.delete(`users/addresses/${id}/`);
      fetchAddresses();

      notification.success({
        message: "Thành công",
        description: "Xóa địa chỉ thành công!",
        placement: "topRight",
      });
    } catch (error) {
      notification.error({
        message: "Thất bại",
        description: "Xóa địa chỉ thất bại!",
        placement: "topRight",
      });
    }
  };

  const handleApplyVoucher = (code) => {
    /* logic voucher */
  };

  return {
    addresses,
    fetchAddresses, // <--- BẮT BUỘC PHẢI RETURN HÀM NÀY
    selectedAddressId,
    setSelectedAddressId,
    manualEntry,
    setManualEntry,
    payment,
    setPayment,
    note,
    setNote,
    shippingFee,
    discount,
    total,
    totalAfterDiscount,
    selectedItems,
    selectedAddress,
    isLoading,
    handleOrder,
    handleApplyVoucher,
    deleteAddress, // <--- BẮT BUỘC PHẢI CÓ DÒNG NÀY
  };
};

export default useCheckoutLogic;
