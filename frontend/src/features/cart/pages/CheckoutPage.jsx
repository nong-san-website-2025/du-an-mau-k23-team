// src/features/cart/pages/CheckoutPage.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../services/CartContext";
import { toast } from "react-toastify";
import API from "../../login_register/services/api";
import "../styles/CheckoutPage.css";
import PaymentButton from "../components/PaymnentButton"; // VNPAY button

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();

  // Address
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const selectedAddress = useMemo(
    () => addresses.find((a) => a.id === selectedAddressId) || null,
    [addresses, selectedAddressId]
  );

  // Customer info
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [addressText, setAddressText] = useState("");
  const [note, setNote] = useState("");

  const [manualEntry, setManualEntry] = useState(false);

  // Voucher/discount
  const [voucher, setVoucher] = useState("");
  const [discount, setDiscount] = useState(0);
  const [voucherError, setVoucherError] = useState("");

  // Payment method
  const [payment, setPayment] = useState("Thanh toán khi nhận hàng");
  const [isLoading, setIsLoading] = useState(false);

  // Refs để toast chỉ hiện 1 lần
  const addressToastShownRef = useRef(false);
  const defaultAddressToastShownRef = useRef(false);

  // Giữ nguyên trạng thái đã chọn từ trang giỏ hàng
  // Không cần làm gì thêm - cartItems đã có trạng thái selected từ trang giỏ hàng

  // Compute totals
  const total = useMemo(() => {
    return cartItems
      .filter((item) => item.selected)
      .reduce(
        (sum, item) =>
          sum +
          (Number(item.product?.price) || 0) * (Number(item.quantity) || 0),
        0
      );
  }, [cartItems]);

  const totalAfterDiscount = Math.max(total - discount, 0);

  // Load addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const res = await API.get("users/addresses/");
        const list = res.data || [];
        setAddresses(list);

        if (list.length === 0 && !addressToastShownRef.current) {
          toast.info("Bạn chưa có địa chỉ. Vui lòng thêm địa chỉ để tiếp tục.");
          addressToastShownRef.current = true;
          navigate("/profile?tab=address&redirect=checkout", { replace: true });
          return;
        }

        const def = list.find((a) => a.is_default);
        if (!def && !defaultAddressToastShownRef.current) {
          toast.info("Vui lòng đặt một địa chỉ mặc định trước khi thanh toán.");
          defaultAddressToastShownRef.current = true;
          navigate("/profile?tab=address&redirect=checkout", { replace: true });
          return;
        }

        if (def) {
          setSelectedAddressId(def.id);
          setCustomerName(def.recipient_name || "");
          setCustomerPhone(def.phone || "");
          setAddressText(def.location || "");
        }
      } catch (err) {
        console.error("Load addresses failed", err);
      }
    };
    fetchAddresses();
  }, [navigate]);

  // Keep customer form in sync with selected address
  useEffect(() => {
    if (!manualEntry && selectedAddress) {
      setCustomerName(selectedAddress.recipient_name || "");
      setCustomerPhone(selectedAddress.phone || "");
      setAddressText(selectedAddress.location || "");
    }
  }, [selectedAddress, manualEntry]);

  // Voucher handlers
  const voucherList = [
    { code: "SALE10", type: "percent", value: 10, desc: "Giảm 10% tổng đơn" },
    { code: "FREESHIP", type: "fixed", value: 20000, desc: "Giảm 20.000đ" },
    {
      code: "GREENFARM50",
      type: "fixed",
      value: 50000,
      desc: "Đơn từ 500k",
      minOrder: 500000,
    },
  ];

  const handleApplyVoucher = () => {
    setVoucherError("");
    setDiscount(0);
    if (!voucher.trim()) return;
    const found = voucherList.find(
      (v) => v.code === voucher.trim().toUpperCase()
    );
    if (!found) return setVoucherError("Mã giảm giá không hợp lệ!");
    if (found.minOrder && total < found.minOrder)
      return setVoucherError(
        `Đơn tối thiểu ${found.minOrder.toLocaleString()}đ mới dùng mã này!`
      );
    if (found.type === "percent")
      setDiscount(Math.floor((total * found.value) / 100));
    if (found.type === "fixed") setDiscount(found.value);
    toast.success(`Áp dụng mã ${found.code} thành công!`);
  };

  // Order for COD / bank transfer
  const handleOrder = async () => {
    if (cartItems.filter((i) => i.selected).length === 0)
      return toast.error("Giỏ hàng trống!");
    if (!manualEntry && !selectedAddress)
      return toast.error("Vui lòng chọn địa chỉ nhận hàng");
    if (
      manualEntry &&
      (!customerName.trim() || !customerPhone.trim() || !addressText.trim())
    )
      return toast.error("Vui lòng nhập đầy đủ thông tin nhận hàng");

    setIsLoading(true);
    try {
      const receiverName = manualEntry
        ? customerName.trim()
        : selectedAddress?.recipient_name || "";
      const receiverPhone = manualEntry
        ? customerPhone.trim()
        : selectedAddress?.phone || "";
      const receiverAddress = manualEntry
        ? addressText.trim()
        : selectedAddress?.location || "";

      const orderData = {
        total_price: total,
        status: "pending",
        customer_name: receiverName,
        customer_phone: receiverPhone,
        address: receiverAddress,
        note: note.trim(),
        payment_method: payment,
        items: cartItems
          .filter((it) => it.selected)
          .map((item) => ({
            product: item.product?.id || item.product,
            quantity: parseInt(item.quantity) || 1,
            price: parseFloat(item.product?.price) || 0,
          })),
      };

      await API.post("orders/", orderData);
      await clearCart();
      toast.success("Đặt hàng thành công!");
      navigate("/orders?tab=pending");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Đặt hàng thất bại!");
    } finally {
      setIsLoading(false);
    }
  };

  // VNPAY flow được xử lý hoàn toàn trong PaymentButton

  // Sau khi VNPAY redirect về trang orders?status=success, FE sẽ clearCart bằng effect đặt ở trang Orders (hoặc tại đây nếu bạn muốn)
  // Nếu muốn clear ngay tại Checkout khi quay lại (ít gặp), có thể nghe location.search. Nhưng đúng hơn là clear tại trang Orders.

  return (
    <div className="checkout-container">
      <h2 className="checkout-title">Thanh toán đơn hàng</h2>

      <div className="checkout-two-col">
        {/* Left panel: delivery */}
        <div className="left-panel">
          <section className="delivery-info-section">
            <div className="delivery-info-title">Thông tin giao hàng</div>
            {addresses.length > 0 ? (
              <div className="address-selection-container">
                <label>Chọn địa chỉ nhận hàng</label>
                <select
                  className="address-select"
                  value={selectedAddressId || ""}
                  onChange={(e) =>
                    setSelectedAddressId(Number(e.target.value) || null)
                  }
                >
                  {addresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {`${a.recipient_name} - ${a.phone} - ${a.location}${a.is_default ? " (Mặc định)" : ""}`}
                    </option>
                  ))}
                </select>
                <div className="quick-actions">
                  <button
                    onClick={() =>
                      navigate("/profile?tab=address&redirect=checkout")
                    }
                  >
                    Quản lý địa chỉ
                  </button>
                  <button onClick={() => setManualEntry((v) => !v)}>
                    {manualEntry ? "Dùng địa chỉ đã lưu" : "Chỉnh sửa"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="no-address-warning">
                <p>
                  Chưa có địa chỉ nhận hàng.
                  <button
                    onClick={() =>
                      navigate("/profile?tab=address&redirect=checkout")
                    }
                  >
                    Thêm ngay
                  </button>
                </p>
              </div>
            )}

            <div className="customer-form-section">
              <input
                type="text"
                placeholder="Họ và tên người nhận"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                disabled={!manualEntry}
              />
              <input
                type="tel"
                placeholder="Số điện thoại"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                disabled={!manualEntry}
              />
              <input
                type="text"
                placeholder="Địa chỉ nhận hàng"
                value={addressText}
                onChange={(e) => setAddressText(e.target.value)}
                disabled={!manualEntry}
              />
              <input
                type="text"
                placeholder="Ghi chú (tùy chọn)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </section>
        </div>

        {/* Right panel: payment */}
        <div className="right-panel">
          <div className="payment-section">
            <span>Phương thức thanh toán:</span>
            <select
              className="payment-select"
              value={payment}
              onChange={(e) => setPayment(e.target.value)}
            >
              <option>Thanh toán khi nhận hàng</option>
              <option>Chuyển khoản ngân hàng</option>
              <option>Ví điện tử</option>
            </select>
          </div>

          {/* Voucher */}
          <div className="voucher-section">
            <input
              type="text"
              placeholder="Nhập mã giảm giá/voucher"
              value={voucher}
              onChange={(e) => setVoucher(e.target.value)}
            />
            <button onClick={handleApplyVoucher}>Áp dụng</button>
            {voucherError && (
              <div style={{ color: "#d32f2f" }}>{voucherError}</div>
            )}
            {discount > 0 && (
              <div style={{ color: "#27ae60" }}>
                Đã giảm: -{discount.toLocaleString()}đ
              </div>
            )}
          </div>

          {/* Product list - chỉ hiển thị sản phẩm đã chọn */}
          <div className="product-list-section">
            <div style={{ marginBottom: '10px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Sản phẩm đã chọn để thanh toán:</span>
              <button 
                onClick={() => navigate('/cart')}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#FF9800',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Chỉnh sửa giỏ hàng
              </button>
            </div>
            {cartItems
              .filter((item) => item.selected)
              .map((item) => (
                <div
                  key={`${item.product?.id || item.product}-${item.quantity}`}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    marginBottom: '5px',
                    borderRadius: '4px',
                    backgroundColor: '#f9f9f9'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold' }}>{item.product?.name || `SP #${item.product}`}</div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      Số lượng: {item.quantity} x {item.product?.price?.toLocaleString()}đ
                    </div>
                  </div>
                  <div style={{ fontWeight: 'bold', color: '#2e7d32' }}>
                    {(
                      (item.product?.price || 0) * (item.quantity || 0)
                    ).toLocaleString()}đ
                  </div>
                </div>
              ))}
            {cartItems.filter(i => i.selected).length === 0 && (
              <div style={{ color: '#f44336', textAlign: 'center', padding: '20px' }}>
                <div style={{ marginBottom: '10px' }}>
                  Không có sản phẩm nào được chọn.
                </div>
                <button 
                  onClick={() => navigate('/cart')}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Quay lại giỏ hàng để chọn sản phẩm
                </button>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="total-section">
            <span>Tổng thanh toán: </span>
            <span>{totalAfterDiscount.toLocaleString()}đ</span>
          </div>

          {/* Payment button */}
          {payment === "Ví điện tử" ? (
            <PaymentButton
              amount={totalAfterDiscount}
              orderData={{
                total_price: total,
                customer_name: manualEntry
                  ? customerName.trim()
                  : selectedAddress?.recipient_name || "",
                customer_phone: manualEntry
                  ? customerPhone.trim()
                  : selectedAddress?.phone || "",
                address: manualEntry
                  ? addressText.trim()
                  : selectedAddress?.location || "",
                note,
                items: cartItems
                  .filter((it) => it.selected)
                  .map((item) => ({
                    product: item.product?.id || item.product,
                    quantity: parseInt(item.quantity) || 1,
                    price: parseFloat(item.product?.price) || 0,
                  })),
              }}
              disabled={cartItems.filter(i => i.selected).length === 0}
            />
          ) : (
            <button
              className="order-button"
              onClick={handleOrder}
              disabled={isLoading || cartItems.filter(i => i.selected).length === 0}
            >
              {isLoading ? "Đang xử lý..." : "Xác nhận đặt hàng"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
