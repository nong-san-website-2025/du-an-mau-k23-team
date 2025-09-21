// src/features/cart/pages/CheckoutPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../services/CartContext";
import { toast } from "react-toastify";
import { Card, Typography, Button, Select } from "antd";
import API from "../../login_register/services/api";

import PaymentButton from "../components/PaymnentButton"; // VNPAY button
import AddressSelector from "../components/AddressSelector";
import CustomerForm from "../components/CustomerForm";
import VoucherSection from "../components/VoucherSection";
import ProductList from "../components/ProductList";
import "../styles/CheckoutPage.css"

const { Title, Text } = Typography;

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [manualEntry, setManualEntry] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [addressText, setAddressText] = useState("");
  const [note, setNote] = useState("");

  const [discount, setDiscount] = useState(0);
  const [payment, setPayment] = useState("Thanh toán khi nhận hàng");
  const [isLoading, setIsLoading] = useState(false);

  // Lấy địa chỉ đã chọn
  const selectedAddress = useMemo(
    () => addresses.find((a) => a.id === selectedAddressId) || null,
    [addresses, selectedAddressId]
  );

  // Tổng tiền gốc
  const total = useMemo(() => {
    return cartItems
      .filter((item) => item.selected)
      .reduce(
        (sum, item) => sum + (item.product?.price || 0) * (item.quantity || 0),
        0
      );
  }, [cartItems]);

  // Tổng tiền sau giảm giá
  const totalAfterDiscount = Math.max(total - discount, 0);

  // Fetch danh sách địa chỉ
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const res = await API.get("users/addresses/");
        const list = res.data || [];
        setAddresses(list);

        // Nếu có địa chỉ mặc định -> set
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
  const handleApplyVoucher = (voucherCode) => {
    const voucherList = [
      { code: "SALE10", type: "percent", value: 10 },
      { code: "FREESHIP", type: "fixed", value: 20000 },
    ];

    const found = voucherList.find((v) => v.code === voucherCode);
    if (!found) {
      toast.error("Mã giảm giá không hợp lệ!");
      return;
    }

    if (found.type === "percent")
      setDiscount(Math.floor((total * found.value) / 100));
    if (found.type === "fixed") setDiscount(found.value);

    toast.success(`Áp dụng mã ${found.code} thành công!`);
  };

  // Xử lý đặt hàng
  const handleOrder = async () => {
    if (cartItems.filter((i) => i.selected).length === 0)
      return toast.error("Giỏ hàng trống!");

    setIsLoading(true);
    try {
      const orderData = {
        total_price: totalAfterDiscount,
        status: "pending",
        customer_name: manualEntry
          ? customerName
          : selectedAddress?.recipient_name || "",
        customer_phone: manualEntry
          ? customerPhone
          : selectedAddress?.phone || "",
        address: manualEntry ? addressText : selectedAddress?.location || "",
        note: note.trim(),
        payment_method: payment,
        items: cartItems
          .filter((it) => it.selected)
          .map((item) => ({
            product: item.product?.id || item.product,
            quantity: parseInt(item.quantity),
            price: parseFloat(item.product?.price),
          })),
      };

      await API.post("orders/", orderData);
      await clearCart();
      toast.success("Đặt hàng thành công!");
      navigate("/orders?tab=pending");
    } catch (err) {
      toast.error("Đặt hàng thất bại!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <Title level={2}>Thanh toán đơn hàng</Title>

      {/* Address + Form */}
      <Card style={{ marginBottom: 24 }}>
        <AddressSelector
          addresses={addresses}
          selectedAddressId={selectedAddressId}
          onChange={setSelectedAddressId}
          onManage={() => navigate("/profile?tab=address&redirect=checkout")}
          onToggleManual={() => setManualEntry(!manualEntry)}
          manualEntry={manualEntry}
        />

        {manualEntry && (
          <CustomerForm
            customerName={customerName}
            customerPhone={customerPhone}
            addressText={addressText}
            note={note}
            setCustomerName={setCustomerName}
            setCustomerPhone={setCustomerPhone}
            setAddressText={setAddressText}
            setNote={setNote}
          />
        )}
      </Card>

      {/* Danh sách sản phẩm */}
      <Card style={{ marginBottom: 24 }}>
        <ProductList
          cartItems={cartItems}
          onEditCart={() => navigate("/cart")}
        />
      </Card>

      {/* Voucher */}
      <Card style={{ marginBottom: 24 }}>
        <VoucherSection total={total} onApply={handleApplyVoucher} />
      </Card>

      {/* Payment Method */}
      <Card style={{ marginBottom: 24 }}>
        <Text strong>Phương thức thanh toán:</Text>
        <Select
          style={{ width: "100%", marginTop: 8 }}
          value={payment}
          onChange={(value) => setPayment(value)}
        >
          <Select.Option value="Thanh toán khi nhận hàng">
            Thanh toán khi nhận hàng
          </Select.Option>
          <Select.Option value="Chuyển khoản ngân hàng">
            Chuyển khoản ngân hàng
          </Select.Option>
          <Select.Option value="Ví điện tử">Ví điện tử</Select.Option>
        </Select>
      </Card>

      {/* Total + Button */}
      {/* Total + Button */}
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "stretch", // giữ chiều cao hai bên bằng nhau
            gap: 24,
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
