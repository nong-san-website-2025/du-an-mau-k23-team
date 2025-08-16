import { CircleDollarSign } from "lucide-react";
import React from "react";
import { Card, Button, Spinner, Row, Col } from "react-bootstrap";
import { FaWallet, FaMoneyBillWave, FaPlusCircle } from "react-icons/fa";

const mainColor = "#4B0082";

// Hàm format tiền với dấu phẩy ngăn cách
function formatMoney(amount) {
  const num = parseFloat(amount);
  if (isNaN(num)) return "0";
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export default function WalletTab({
  walletBalance,
  loadingWallet,
  rechargeAmount,
  setRechargeAmount,
  rechargeLoading,
  rechargeError,
  handleRecharge,
}) {
  return (
    <Card
      className="shadow border-0 p-4"
      style={{ background: "#f8f9fa", borderRadius: 18 }}
    >
      {/* Header */}
      <Row className="align-items-center mb-4">
        <Col xs="auto">
          <div
            style={{
              background: mainColor,
              borderRadius: 32,
              width: 64,
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircleDollarSign size={36} style={{ color: "#fff" }} />
          </div>
        </Col>
        <Col>
          <div style={{ fontWeight: 700, fontSize: 22, color: mainColor }}>
            GFarmPay
          </div>
        </Col>
      </Row>

      {/* Số dư ví */}
      <Card
        className="mb-4"
        style={{
          background: "#fff",
          borderRadius: 14,
          border: "none",
          boxShadow: "0 2px 8px rgba(75,0,130,0.07)",
        }}
      >
        <Card.Body className="d-flex align-items-center justify-content-between">
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: mainColor,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <FaMoneyBillWave size={24} style={{ marginRight: 6 }} />
            Số dư:
            <span
              style={{
                color: "#388e3c",
                fontSize: 24,
                fontWeight: 800,
                marginLeft: 8,
              }}
            >
              {loadingWallet ? (
                <Spinner
                  animation="border"
                  size="sm"
                  style={{ color: mainColor }}
                />
              ) : walletBalance !== null ? (
                formatMoney(walletBalance)
              ) : (
                "---"
              )}
            </span>
          </div>
        </Card.Body>
      </Card>

      {/* Nạp tiền */}
      <div style={{ fontWeight: 600, color: mainColor, marginBottom: 10 }}>
        Nạp tiền vào ví
      </div>
      <Row className="align-items-center g-2 mb-2">
        {/* Mệnh giá nhanh */}
        <Col xs={12} md={5} className="d-flex flex-wrap gap-2">
          {[100000, 200000, 500000].map((value) => {
            const isSelected = parseInt(rechargeAmount) === value;
            return (
              <Button
                key={value}
                style={{
                  border: `1.5px solid ${mainColor}`,
                  borderRadius: 10,
                  fontWeight: 600,
                  flex: "1 1 auto",
                  minWidth: 100,
                  background: isSelected ? mainColor : "transparent",
                  color: isSelected ? "#fff" : mainColor,
                }}
                onClick={() => setRechargeAmount(value)}
                disabled={rechargeLoading}
              >
                {formatMoney(value)} ₫
              </Button>
            );
          })}
        </Col>

        {/* Nhập số tiền & nút nạp */}
        <Col xs={12} md={7} className="d-flex gap-2">
          <input
            type="number"
            className="form-control"
            placeholder="Nhập số tiền muốn nạp"
            value={rechargeAmount}
            onChange={(e) => setRechargeAmount(e.target.value)}
            min={10000}
            max={300000000}
            disabled={rechargeLoading}
            style={{
              border: `1.5px solid ${mainColor}`,
              borderRadius: 10,
              fontWeight: 600,
            }}
          />
          <Button
            style={{
              background: mainColor,
              border: "none",
              borderRadius: 10,
              fontWeight: 700,
              minWidth: 120,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
            onClick={handleRecharge}
            disabled={rechargeLoading}
          >
            <FaPlusCircle /> {rechargeLoading ? "Đang nạp..." : "Nạp tiền"}
          </Button>
        </Col>
      </Row>

      {rechargeError && (
        <div style={{ color: "red", marginBottom: 10 }}>{rechargeError}</div>
      )}
      <div style={{ color: "#888", fontSize: 13, marginTop: 8 }}>
        Số tiền nạp tối thiểu 10.000 ₫, tối đa 300.000.000 ₫/lần.
      </div>
    </Card>
  );
}
