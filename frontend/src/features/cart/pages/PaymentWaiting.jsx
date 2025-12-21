// src/features/checkout/pages/PaymentWaiting.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Result, Button, Spin, Typography, Card, message } from "antd";
import {
  LoadingOutlined,
  CheckCircleFilled,
  QrcodeOutlined,
} from "@ant-design/icons";
import { QRCodeCanvas } from "qrcode.react"; // ✅ Thư viện tạo QR
import API from "../../login_register/services/api";

const { Title, Text } = Typography;

const PaymentWaiting = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [isPaid, setIsPaid] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState(""); // Lưu link thanh toán VNPAY
  const [loadingUrl, setLoadingUrl] = useState(true);

  // 1. Lấy Link thanh toán VNPAY (chạy 1 lần khi vào trang)
  useEffect(() => {
    const fetchPaymentUrl = async () => {
      try {
        // Gọi API Backend để lấy link thanh toán cho Order ID này
        // Backend cần có endpoint trả về: { payment_url: "https://sandbox.vnpayment.vn/..." }
        const res = await API.post(`orders/${orderId}/create_payment_url/`);

        if (res.data && res.data.payment_url) {
          setPaymentUrl(res.data.payment_url);
        } else {
          message.error("Không lấy được link thanh toán!");
        }
      } catch (error) {
        console.error("Lỗi lấy link thanh toán:", error);
        message.error("Có lỗi khi tạo mã thanh toán.");
      } finally {
        setLoadingUrl(false);
      }
    };

    fetchPaymentUrl();
  }, [orderId]);

  // 2. Polling: Kiểm tra trạng thái đơn hàng mỗi 3 giây
  useEffect(() => {
    if (isPaid) return; // Nếu đã thanh toán rồi thì thôi check

    const checkOrderStatus = async () => {
      try {
        const res = await API.get(`orders/${orderId}/`);
        // Kiểm tra status từ Backend trả về
        const status = res.data.status || res.data.payment_status;

        // Cần khớp với quy ước Backend của bạn (ví dụ: 'PAID', 'SUCCESS', 'COMPLETED')
        if (["PAID", "SUCCESS", "COMPLETED"].includes(status)) {
          setIsPaid(true);
          return true;
        }
      } catch (error) {
        console.error("Check status error", error);
      }
      return false;
    };

    const intervalId = setInterval(async () => {
      const paid = await checkOrderStatus();
      if (paid) clearInterval(intervalId);
    }, 3000); // 3 giây hỏi 1 lần

    return () => clearInterval(intervalId);
  }, [orderId, isPaid]);

  // 3. Chuyển hướng khi thành công
  useEffect(() => {
    if (isPaid) {
      message.success("Thanh toán thành công! Đang chuyển hướng...");
      setTimeout(() => {
        // Chuyển sang trang chi tiết đơn hàng hoặc trang Cảm ơn
        navigate(`/orders?tab=active`);
      }, 2000);
    }
  }, [isPaid, navigate]);

  // --- GIAO DIỆN KHI ĐÃ THANH TOÁN ---
  if (isPaid) {
    return (
      <div
        style={{
          height: "80vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Result
          status="success"
          icon={
            <CheckCircleFilled style={{ color: "#52c41a", fontSize: 80 }} />
          }
          title="Thanh toán thành công!"
          subTitle="Cảm ơn bạn đã mua hàng. Hệ thống đã xác nhận đơn hàng của bạn."
          extra={[
            <Button
              type="primary"
              key="console"
              onClick={() => navigate("/orders")}
            >
              Xem đơn hàng
            </Button>,
          ]}
        />
      </div>
    );
  }

  // --- GIAO DIỆN CHỜ QUÉT MÃ ---
  return (
    <div
      style={{
        background: "#f5f5f5",
        minHeight: "100vh",
        padding: "40px 20px",
      }}
    >
      <Card
        style={{
          maxWidth: 500,
          margin: "0 auto",
          textAlign: "center",
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <Title level={3} style={{ color: "#00b96b", marginBottom: 5 }}>
          Thanh toán VNPAY
        </Title>
        <Text type="secondary">Mã đơn hàng: #{orderId}</Text>

        <div
          style={{
            margin: "30px 0",
            minHeight: 250,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {loadingUrl ? (
            <Spin tip="Đang tạo mã QR..." />
          ) : paymentUrl ? (
            <div
              style={{
                padding: 10,
                border: "1px solid #eee",
                borderRadius: 8,
                display: "inline-block",
              }}
            >
              {/* 👇 Component biến URL thành mã QR 👇 */}
              <QRCodeCanvas
                value={paymentUrl}
                size={240}
                level={"H"} // Độ chính xác cao
                includeMargin={true}
                imageSettings={{
                  src: "https://vnpay.vn/s1/statics.vnpay.vn/2023/6/0oxhzjmxbksr1686814746087_15062023_logo_vnpay.png", // Logo VNPAY ở giữa (tuỳ chọn)
                  height: 40,
                  width: 100,
                  excavate: true,
                }}
              />
            </div>
          ) : (
            <Result status="error" title="Không tạo được mã thanh toán" />
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            background: "#e6f7ff",
            padding: 15,
            borderRadius: 8,
          }}
        >
          <Spin
            indicator={
              <LoadingOutlined
                style={{ fontSize: 24, color: "#1890ff" }}
                spin
              />
            }
          />
          <div style={{ textAlign: "left" }}>
            <Text strong>Đang chờ bạn quét mã...</Text>
            <br />
            <Text style={{ fontSize: 12, color: "#666" }}>
              Hệ thống tự động cập nhật sau vài giây.
            </Text>
          </div>
        </div>

        <div style={{ marginTop: 25 }}>
          <Text type="secondary">Gặp khó khăn?</Text>
          <div style={{ marginTop: 10 }}>
            {paymentUrl && (
              <Button
                href={paymentUrl}
                target="_blank"
                icon={<QrcodeOutlined />}
              >
                Mở trang thanh toán VNPAY
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PaymentWaiting;
