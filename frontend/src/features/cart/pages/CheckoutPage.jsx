// src/features/cart/pages/CheckoutPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../services/CartContext";
import { toast } from "react-toastify";
import {
  Card,
  Typography,
  Button,
  Select,
  notificationInfo,
  notification,
} from "antd";
import API from "../../login_register/services/api";

import PaymentButton from "../components/PaymnentButton"; // VNPAY button
import AddressSelector from "../components/AddressSelector";

import VoucherSection from "../components/VoucherSection";
import ProductList from "../components/ProductList";
import "../styles/CheckoutPage.css";

import { applyVoucher } from "../../admin/services/promotionServices";
import { message } from "antd";

const { Title, Text } = Typography;

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();

  const [shippingFee, setShippingFee] = useState(0);
  const [shippingStatus, setShippingStatus] = useState("idle"); // Thêm dòng này

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

  const handleApplyVoucher = async (code) => {
    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }

    if (!code) {
      setDiscount(0);
      setVoucherCode("");
      return;
    }
    try {
      const res = await applyVoucher(code, total); // gọi API apply_voucher

      setDiscount(res?.discount || 0); // 👈 lấy đúng key discount
      setVoucherCode(code);
    } catch (err) {
      setDiscount(0);
      setVoucherCode("");
      message.error("Mã voucher không hợp lệ hoặc đã hết hạn!");
    }
  };

  // Lấy địa chỉ đã chọn
  const selectedAddress = useMemo(() => {
    const addr = addresses.find((a) => a.id === selectedAddressId) || null;
    return addr;
  }, [addresses, selectedAddressId]);

  const total = useMemo(() => {
    return cartItems
      .filter((item) => item.selected)
      .reduce((sum, item) => {
        const product = item.product_data || item.product || {};
        const price = parseFloat(product.price) || 0;
        return sum + price * (parseInt(item.quantity) || 0);
      }, 0);
  }, [cartItems]);
  // Tổng tiền sau giảm giá
  const totalAfterDiscount = Math.max(total + shippingFee - discount, 0);

  useEffect(() => {
    // Auto-switch to manual entry if selected address lacks GHN IDs
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

    const fetchShippingFee = async () => {
      // Dùng GHN DistrictID thay vì mã hành chính (district_code)
      const to_district_id = manualEntry
        ? geoManual.districtId
        : selectedAddress?.district_id; // ✅ GHN DistrictID

      const to_ward_code = manualEntry
        ? geoManual.wardCode
        : selectedAddress?.ward_code
          ? String(selectedAddress.ward_code).trim()
          : undefined;

      // SỬA: Kiểm tra cả district_code và ward_code
      if (!to_district_id || !to_ward_code) {
        setShippingFee(0);
        setShippingStatus("idle");
        return;
      }

      setShippingFee(0);
      setShippingStatus("loading");

      const totalWeight = cartItems
        .filter((item) => item.selected)
        .reduce((sum, item) => sum + (parseInt(item.quantity) || 0) * 500, 0);

      try {
        const payload = {
          from_district_id: 1450,
          from_ward_code: "21007",
          to_district_id: parseInt(to_district_id), // ✅ CHUYỂN SANG SỐ
          to_ward_code: to_ward_code, // ✅ DÙNG GIÁ TRỊ THỰC
          weight: totalWeight > 0 ? totalWeight : 1,
          length: 20,
          width: 15,
          height: 10,
        };

        const res = await API.post("delivery/fee/", payload);

        const fee = res.data?.fee || 0;
        setShippingFee(fee);
        setShippingStatus("success");
      } catch (error) {
        console.error("❌ Lỗi API GHN:", error);
        toast.error("Không thể tính phí vận chuyển");
        setShippingFee(0);
        setShippingStatus("error");
      }
    };

    fetchShippingFee();
  }, [manualEntry, geoManual, selectedAddress, cartItems]);

  // Fetch danh sách địa chỉ
  // Fetch danh sách địa chỉ (chỉ khi đã đăng nhập)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return; // 👈 DỪNG nếu chưa đăng nhập

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
  }, []);

  // Áp dụng voucher

  // Xử lý đặt hàng
  const handleOrder = async () => {
    const token = localStorage.getItem("token"); // 👈 THÊM DÒNG NÀY
    if (!token) {
      notification.info("Vui lòng đăng nhập để tiếp tục đặt hàng!");
      navigate("/login?redirect=/checkout");
      return;
    }

    const selectedItems = cartItems.filter((i) => i.selected);
    if (selectedItems.length === 0) {
      return;
    }

    // 👇 TẠO orderData Ở ĐÂY
    const orderData = {
      total_price: totalAfterDiscount,
      customer_name: manualEntry
        ? customerName
        : selectedAddress?.recipient_name || "",
      customer_phone: manualEntry
        ? customerPhone
        : selectedAddress?.phone || "",
      address: manualEntry ? addressText : selectedAddress?.location || "",
      note,
      payment_method: payment === "Ví điện tử" ? "vnpay" : "cod",
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
      navigate("/orders?tab=pending");
    } catch (error) {
      console.error("Đặt hàng thất bại:", error);
      notification.error("Đặt hàng thất bại!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveManualAddress = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }
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
      is_default: false, // hoặc true nếu muốn set mặc định
    };

    try {
      const res = await API.post("users/addresses/", payload);

      const savedAddress = res.data;

      // Cập nhật danh sách địa chỉ
      setAddresses((prev) => [...prev, savedAddress]);
      setSelectedAddressId(savedAddress.id);

      toast.success("Đã lưu địa chỉ thành công!");
    } catch (error) {
      console.error("❌ Lỗi khi lưu địa chỉ:", error.response?.data || error);
      toast.error("Không thể lưu địa chỉ. Vui lòng thử lại!");
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: "100%", margin: "0 190px" }}>
      <Title level={2}>Thanh toán đơn hàng</Title>
      {/* Danh sách sản phẩm */}
      <Card style={{ marginBottom: 24, borderRadius: 4 }}>
        <ProductList
          cartItems={cartItems}
          onEditCart={() => navigate("/cart")}
        />
      </Card>

      {/* Address + Form */}
      <Card style={{ marginBottom: 24, borderRadius: 4 }}>
        <AddressSelector
          addresses={addresses}
          selectedAddressId={selectedAddressId}
          onSelect={setSelectedAddressId}
          onManage={() => navigate("/profile?tab=address&redirect=checkout")}
          onToggleManual={() => setManualEntry(!manualEntry)}
          manualEntry={manualEntry}
        />
      </Card>

      {/* Voucher */}
      <Card style={{ marginBottom: 24, borderRadius: 4 }}>
        {!localStorage.getItem("token") ? (
          <div style={{ padding: "12px", color: "#faad14" }}>
            💡 Đăng nhập để sử dụng voucher giảm giá!
          </div>
        ) : (
          <VoucherSection total={total} onApply={handleApplyVoucher} />
        )}
      </Card>

      {/* Payment Method */}
      <Card style={{ marginBottom: 24, borderRadius: 4 }}>
        <Text strong>Phương thức thanh toán:</Text>
        <Select
          style={{ width: "100%", marginTop: 8 }}
          value={payment}
          onChange={(value) => setPayment(value)}
        >
          <Select.Option value="Thanh toán khi nhận hàng">
            Thanh toán khi nhận hàng
          </Select.Option>
          <Select.Option value="Ví điện tử">VNPAY</Select.Option>
        </Select>
      </Card>

      {/* Total + Button */}
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "stretch", // giữ chiều cao hai bên bằng nhau
            gap: 24,
            borderRadius: 4,
          }}
        >
          {/* Bên trái: Chi tiết thanh toán */}
          <div style={{ flex: 1 }}>
            <Title level={4} style={{ marginBottom: 16 }}>
              Chi tiết thanh toán
            </Title>

            {/* Tạm tính */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <Text>Tạm tính:</Text>
              <Text>{total.toLocaleString()}đ</Text>
            </div>

            {/* Phí vận chuyển */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <Text>Phí vận chuyển:</Text>
              <Text>{shippingFee.toLocaleString()}đ</Text>
            </div>

            {/* Giảm giá */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <Text>Giảm giá:</Text>
              <Text type="danger">- {discount.toLocaleString()}đ</Text>
            </div>

            {/* Tổng thanh toán */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontWeight: "bold",
                fontSize: 16,
                paddingTop: 8,
                borderTop: "1px solid #f0f0f0",
              }}
            >
              <Text strong>Tổng thanh toán:</Text>
              <Text strong style={{ color: "#1890ff" }}>
                {totalAfterDiscount.toLocaleString()}đ
              </Text>
            </div>
          </div>

          {/* Bên phải: Nút thanh toán */}
          <div
            style={{
              minWidth: 220,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              paddingTop: 30, // căn giữa theo chiều dọc
            }}
          >
            {payment === "Ví điện tử" ? (
              <PaymentButton
                className="custom-pay-btn"
                title={"Thanh toán qua ví điện tử"}
                amount={totalAfterDiscount}
                orderData={{
                  total_price: totalAfterDiscount,
                  customer_name: manualEntry
                    ? customerName
                    : selectedAddress?.recipient_name || "",
                  customer_phone: manualEntry
                    ? customerPhone
                    : selectedAddress?.phone || "",
                  address: manualEntry
                    ? addressText
                    : selectedAddress?.location || "",
                  note,
                  items: cartItems
                    .filter((it) => it.selected)
                    .map((item) => ({
                      product: item.product?.id || item.product,
                      quantity: parseInt(item.quantity),
                      price: parseFloat(item.product?.price),
                    })),
                }}
                disabled={cartItems.filter((i) => i.selected).length === 0}
              />
            ) : (
              <Button
                type="primary"
                size="large"
                style={{
                  width: "100%",
                  height: "48px",
                  fontSize: "16px",
                  borderRadius: "8px",
                  backgroundColor: "#4caf50",
                }}
                className="custom-pay-btn"
                loading={isLoading}
                onClick={handleOrder}
                disabled={cartItems.filter((i) => i.selected).length === 0}
              >
                Xác nhận đặt hàng
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CheckoutPage;
