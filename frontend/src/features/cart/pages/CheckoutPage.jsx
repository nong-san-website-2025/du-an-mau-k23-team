import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../services/CartContext";
import { toast } from "react-toastify";
import { QRCodeSVG } from "qrcode.react";
import API from "../../login_register/services/api";
import "../styles/CheckoutPage.css";



const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart, selectAllItems } = useCart();

  // Address related
  const [addresses, setAddresses] = useState([]); // [{id, recipient_name, phone, location, is_default}]
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const selectedAddress = useMemo(
    () => addresses.find((a) => a.id === selectedAddressId) || null,
    [addresses, selectedAddressId]
  );

  // Customer info (prefilled from selected address; allow manual override if needed)
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [addressText, setAddressText] = useState("");
  const [note, setNote] = useState("");
  const [payment, setPayment] = useState("Thanh toán khi nhận hàng");
  const [isLoading, setIsLoading] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);

  // Voucher/discount
  const [showQR, setShowQR] = useState(false);
  const [qrScanned, setQrScanned] = useState(false);
  const [voucher, setVoucher] = useState("");
  const [discount, setDiscount] = useState(0);
  const [voucherError, setVoucherError] = useState("");

  // Select all items on load
  useEffect(() => {
    selectAllItems();
  }, []);

  // Compute totals from selected cart items
  const total = useMemo(() => {
    return cartItems
      .filter((item) => item.selected)
      .reduce(
        (sum, item) => sum + (Number(item.product?.price) || 0) * (Number(item.quantity) || 0),
        0
      );
  }, [cartItems]);

  const totalAfterDiscount = Math.max(total - discount, 0);

  // Load addresses and enforce default selection workflow
  // Biến cục bộ để đảm bảo chỉ hiện 1 lần trong vòng đời trang
  const addressToastShownRef = React.useRef(false);
  const defaultAddressToastShownRef = React.useRef(false);
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const res = await API.get("users/addresses/");
        const list = res.data || [];
        setAddresses(list);

        if (list.length === 0) {
          if (!addressToastShownRef.current) {
            toast.info("Bạn chưa có địa chỉ. Vui lòng thêm địa chỉ để tiếp tục.");
            addressToastShownRef.current = true;
          }
          navigate("/profile?tab=address&redirect=checkout", { replace: true });
          return;
        }


        const def = list.find((a) => a.is_default);
        if (!def) {
          if (!defaultAddressToastShownRef.current) {
            toast.info("Vui lòng đặt một địa chỉ mặc định trước khi thanh toán.");
            defaultAddressToastShownRef.current = true;
          }
          navigate("/profile?tab=address&redirect=checkout", { replace: true });
          return;
        }

        // Preselect default and prefill
        setSelectedAddressId(def.id);
        setCustomerName(def.recipient_name || "");
        setCustomerPhone(def.phone || "");
        setAddressText(def.location || "");
      } catch (err) {
        console.error("Load addresses failed", err);
      }
    };

    fetchAddresses();
  }, [navigate]);

  // Keep customer form in sync with selected address (when not in manual mode)
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
    { code: "GREENFARM50", type: "fixed", value: 50000, desc: "Giảm 50.000đ cho đơn từ 500k", minOrder: 500000 },
  ];

  const handleApplyVoucher = () => {
    setVoucherError("");
    setDiscount(0);
    if (!voucher.trim()) return;
    const found = voucherList.find((v) => v.code === voucher.trim().toUpperCase());
    if (!found) {
      setVoucherError("Mã giảm giá không hợp lệ!");
      return;
    }
    if (found.minOrder && total < found.minOrder) {
      setVoucherError(`Đơn tối thiểu ${found.minOrder.toLocaleString()}đ mới dùng mã này!`);
      return;
    }
    if (found.type === "percent") setDiscount(Math.floor((total * found.value) / 100));
    if (found.type === "fixed") setDiscount(found.value);
    toast.success(`Áp dụng mã ${found.code} thành công!`);
  };

  // Order handlers
  const handleOrder = () => {
    if (cartItems.filter((i) => i.selected).length === 0) {
      toast.error("Giỏ hàng của bạn đang trống");
      return;
    }

    // Require address selection or manual input
    if (!manualEntry && !selectedAddress) {
      toast.error("Vui lòng chọn địa chỉ nhận hàng");
      return;
    }
    if (manualEntry) {
      if (!customerName.trim() || !customerPhone.trim() || !addressText.trim()) {
        toast.error("Vui lòng nhập đầy đủ thông tin nhận hàng");
        return;
      }
    }

    // QR branch
    if (payment === "Ví điện tử") {
      setShowQR(true);
      setQrScanned(false);
      return;
    }

    // COD or transfer
    completeOrder();
  };

  const handleQrScan = () => setQrScanned(true);
  const handleQRConfirm = async () => {
    await completeOrder();
  };

  const completeOrder = async () => {
    setIsLoading(true);
    try {
      // Use selected address if not manual
      const receiverName = manualEntry ? customerName.trim() : (selectedAddress?.recipient_name || "");
      const receiverPhone = manualEntry ? customerPhone.trim() : (selectedAddress?.phone || "");
      const receiverAddress = manualEntry ? addressText.trim() : (selectedAddress?.location || "");

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
    } catch (error) {
      console.error(error);
      const message = error?.response?.data?.error || "Đặt hàng thất bại! Vui lòng thử lại.";
      toast.error(message);
    } finally {
      setIsLoading(false);
      setShowQR(false);
      setQrScanned(false);
    }
  };

  // Render
  return (
    <div className="checkout-container">
      <h2 className="checkout-title">Thanh toán đơn hàng</h2>

      <div className="checkout-two-col">
        {/* Left: Delivery info (30%) */}
        <div className="left-panel">
          <section className="delivery-info-section">
            <div className="delivery-info-title">Thông tin giao hàng</div>

            {/* Address selection */}
            {addresses.length > 0 ? (
              <div className="address-selection-container">
                <label className="address-selection-label">Chọn địa chỉ nhận hàng</label>
                <select
                  className="address-select"
                  value={selectedAddressId || ''}
                  onChange={(e) => setSelectedAddressId(Number(e.target.value) || null)}
                >
                  {addresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {`${a.recipient_name} - ${a.phone} - ${a.location}${a.is_default ? ' (Mặc định)' : ''}`}
                    </option>
                  ))}
                </select>
                <div className="quick-actions">
                  <button
                    type="button"
                    className="quick-action-btn manage-address-btn"
                    onClick={() => navigate("/profile?tab=address&redirect=checkout")}
                  >
                    Quản lý địa chỉ
                  </button>
                  <button
                    type="button"
                    className="quick-action-btn manual-input-btn"
                    onClick={() => setManualEntry((v) => !v)}
                  >
                    {manualEntry ? "Dùng địa chỉ đã lưu" : "Nhập tay"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="no-address-warning">
                <p>
                  Chưa có địa chỉ nhận hàng.
                  <button
                    className="no-address-link"
                    onClick={() => navigate("/profile?tab=address&redirect=checkout")}
                  >
                    Thêm ngay
                  </button>
                </p>
              </div>
            )}

            {/* Customer form */}
            <div className="customer-form-section">
              <input
                type="text"
                className="form-input"
                placeholder="Họ và tên người nhận"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                disabled={!manualEntry}
              />
              <input
                type="tel"
                className="form-input"
                placeholder="Số điện thoại"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                disabled={!manualEntry}
              />
              <input
                type="text"
                className="form-input"
                placeholder="Địa chỉ nhận hàng"
                value={addressText}
                onChange={(e) => setAddressText(e.target.value)}
                disabled={!manualEntry}
              />
              <input
                type="text"
                className="form-input"
                placeholder="Ghi chú (tùy chọn)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </section>
        </div>

        {/* Right: Payment + Products (70%) */}
        <div className="right-panel">
          {/* Payment */}
          <div className="payment-section">
            <span className="payment-label">Hình thức thanh toán:</span>
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
          <div className="voucher-section" style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="text"
                className="form-input"
                style={{ marginBottom: 0 }}
                placeholder="Nhập mã giảm giá/voucher"
                value={voucher}
                onChange={(e) => setVoucher(e.target.value)}
              />
              <button onClick={handleApplyVoucher} className="quick-action-btn" style={{ background: "#f39c12", color: "#fff" }}>
                Áp dụng
              </button>
            </div>
            {voucherError && <div style={{ color: "#d32f2f", marginTop: 6 }}>{voucherError}</div>}
            {discount > 0 && (
              <div style={{ color: "#27ae60", marginTop: 6 }}>Đã giảm: -{discount.toLocaleString()}đ</div>
            )}
          </div>

          {/* Product list */}
          <div className="product-list-section">
            <div className="product-list-title">Sản phẩm</div>
            {cartItems.filter((i) => i.selected).map((item) => (
              <div className="product-item" key={`${item.product?.id || item.product}-${item.quantity}`}>
                {item.product?.image && (
                  <img src={item.product.image} alt={item.product?.name} className="product-image" />
                )}
                <div className="product-name">{item.product?.name || `SP #${item.product}`}</div>
                <div className="product-price">{(item.product?.price || 0).toLocaleString()}đ</div>
                <div className="product-quantity">x{item.quantity}</div>
                <div className="product-total">{(((item.product?.price || 0)) * (item.quantity || 0)).toLocaleString()}đ</div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="total-section">
            <span>Tổng thanh toán: </span>
            <span className="total-amount">{totalAfterDiscount.toLocaleString()}đ</span>
          </div>

          {/* QR flow */}
          {showQR && (
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <p>
                Quét QR để thanh toán số tiền: <strong>{totalAfterDiscount.toLocaleString()}đ</strong>
              </p>
              <QRCodeSVG value={`mock_payment_amount:${totalAfterDiscount}`} size={180} />
              {!qrScanned ? (
                <button onClick={handleQrScan} className="quick-action-btn" style={{ marginTop: 12, background: "#3498db", color: "#fff" }}>
                  Tôi đã quét QR
                </button>
              ) : (
                <button onClick={handleQRConfirm} className="quick-action-btn" style={{ marginTop: 12, background: "#27ae60", color: "#fff" }}>
                  Xác nhận thanh toán
                </button>
              )}
            </div>
          )}

          {/* Order button (hidden when QR step is showing) */}
          {!showQR && (
            <button className="order-button" onClick={handleOrder} disabled={isLoading}>
              {isLoading ? "Đang xử lý..." : "Xác nhận đặt hàng"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;