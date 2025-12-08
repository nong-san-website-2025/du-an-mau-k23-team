import React from "react";
import { Card, Button } from "react-bootstrap";
import { formatVND } from "./utils/utils";

// Component này giờ nhận thêm props: myVoucherCodes, onClaimVoucher, isClaiming
const VoucherSection = ({ vouchers, onUseVoucher, myVoucherCodes, onClaimVoucher, isClaiming }) => {
  return (
    <Card className="mb-3 border-0 shadow-sm" style={{ borderRadius: 4 }}>
      <Card.Body>
        {vouchers && vouchers.length > 0 ? (
          <div className="d-flex flex-wrap gap-3 justify-content-start">
            {vouchers.slice(0, 8).map((v) => {
              // Kiểm tra xem voucher này đã được lưu hay chưa
              const isClaimed = myVoucherCodes.has(v.code); 
              
              return (
                <div
                  key={v.id || v.code}
                  onClick={() => onUseVoucher(v)} // Giữ lại sự kiện click trên toàn bộ thẻ
                  className="position-relative d-flex" // Dùng flexbox để chia cột
                  style={{
                    width: 280,
                    background: "linear-gradient(145deg, #fff9db 0%, #fff3bf 100%)",
                    border: "1px dashed #d4af37", // Sửa lại màu cho đúng
                    borderRadius: "4px",
                    padding: "8px",
                    cursor: "pointer",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                    overflow: "hidden",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.18)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)"; }}
                >
                  {/* Cột bên trái chứa thông tin voucher */}
                  <div style={{ flex: 1, paddingRight: '8px' }}>
                    <div className="text-left fw-bold" style={{ fontSize: "0.95rem", color: "#5a3e0f", lineHeight: 1.3, minHeight: "1.3em" }} title={v.title}>
                      {v.title || "Ưu đãi đặc biệt"}
                    </div>

                    {v.discount_amount && (
                      <div className="text-left">
                        <span className="fw-normal" style={{ fontSize: "0.9rem", color: "#c62828", textShadow: "0 1px 1px rgba(0,0,0,0.1)" }}>
                          Giảm giá: {formatVND(v.discount_amount)}₫
                        </span>
                      </div>
                    )}

                    {v.min_order_value > 0 && ( // Sửa lại điều kiện để không hiển thị khi min_order_value = 0
                      <div className="text-left" style={{ fontSize: "0.75rem", color: "#6b5b2d", marginTop: "4px" }}>
                        Áp dụng khi mua từ {formatVND(v.min_order_value)}₫
                      </div>
                    )}
                  </div>

                  {/* Cột bên phải chứa nút Lưu/Đã lưu */}
                  <div className="d-flex align-items-center justify-content-center" style={{ width: '80px', borderLeft: '1px dashed #d4af37', paddingLeft: '8px' }}>
                    {isClaimed ? (
                      <Button variant="outline-success" size="sm" disabled style={{ pointerEvents: 'none' }}>
                        Đã Lưu
                      </Button>
                    ) : (
                      <Button 
                        variant="success" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation(); // Ngăn sự kiện click lan ra thẻ div cha
                          onClaimVoucher(v.code);
                        }}
                        disabled={isClaiming === v.code}
                      >
                        {isClaiming === v.code ? '...' : 'Lưu'}
                      </Button>
                    )}
                  </div>
                  
                  {/* Dải sóng ở dưới */}
                  <div
                    className="position-absolute bottom-0 start-0 w-100"
                    style={{
                      height: "10px",
                      background: `url("data:image/svg+xml,%3Csvg width='100%25' height='10' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0,5 Q5,0 10,5 T20,5 T30,5 T40,5 T50,5 T60,5 T70,5 T80,5 T90,5 T100,5' stroke='%23d4af37' fill='none' stroke-width='1.2'/%3E%3C/svg%3E")`,
                      backgroundSize: "cover",
                    }}
                  ></div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4 text-muted" style={{ fontSize: "1rem" }}>
            🎟️ Cửa hàng chưa có mã giảm giá nào.
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default VoucherSection;