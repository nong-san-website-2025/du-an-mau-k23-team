// src/components/StoreDetail/VoucherSection.jsx
import React from "react";
import { Card } from "react-bootstrap";
import { formatVND } from "./utils/utils";

const VoucherSection = ({ vouchers, onUseVoucher }) => {
  return (
    <Card className="mb-2 border-0 shadow-sm" style={{ borderRadius: 4 }}>
      <Card.Body>
        {vouchers && vouchers.length > 0 ? (
          <div className="d-flex flex-wrap gap-2 justify-content-center">
            {vouchers.slice(0, 8).map((v) => (
              <div
                key={v.id || v.code}
                onClick={() => onUseVoucher(v)}
                className="position-relative"
                style={{
                  width: 240,
                  background: "linear-gradient(145deg, #fff9db 0%, #fff3bf 100%)",
                  border: "1px dashed #d4af37",
                  borderRadius: "4px",
                  padding: "8px",
                  cursor: "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.03)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.18)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)";
                }}
              >
                <div
                  className="text-left fw-bold"
                  style={{
                    fontSize: "0.95rem",
                    color: "#5a3e0f",
                    lineHeight: 1.3,
                    minHeight: "1.3em",
                  }}
                  title={v.title}
                >
                  {v.title || "Ưu đãi đặc biệt"}
                </div>

                {v.discount_amount && (
                  <div className="text-left">
                    <span
                      className="fw-normal"
                      style={{
                        fontSize: "0.9rem",
                        color: "#c62828",
                        textShadow: "0 1px 1px rgba(0,0,0,0.1)",
                      }}
                    >
                      Giảm giá: {formatVND(v.discount_amount)}₫
                    </span>
                  </div>
                )}

                {v.min_order_value && (
                  <div
                    className="text-left"
                    style={{
                      fontSize: "0.75rem",
                      color: "#6b5b2d",
                      marginTop: "4px",
                    }}
                  >
                    Áp dụng khi mua từ {formatVND(v.min_order_value)}₫
                  </div>
                )}

                <div
                  className="position-absolute bottom-0 start-0 w-100"
                  style={{
                    height: "10px",
                    background: `url("data:image/svg+xml,%3Csvg width='100%25' height='10' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0,5 Q5,0 10,5 T20,5 T30,5 T40,5 T50,5 T60,5 T70,5 T80,5 T90,5 T100,5' stroke='%23d4af37' fill='none' stroke-width='1.2'/%3E%3C/svg%3E")`,
                    backgroundSize: "cover",
                  }}
                ></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-muted" style={{ fontSize: "1rem" }}>
            🎟️ Cửa hàng chưa phát hành voucher nào. Theo dõi để không bỏ lỡ ưu đãi!
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default VoucherSection;