


import React, { useEffect, useState } from "react";
import { Card, Button, Table, Statistic, Input, DatePicker, message, Row, Col } from "antd";
import { DownloadOutlined } from "@ant-design/icons";

export default function Finance() {
  const [withdrawHistory, setWithdrawHistory] = useState([]);
  const [revenueTable, setRevenueTable] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/withdraw/history/", { credentials: "include" }),
      fetch("/api/payments/seller/revenue_chart/", { credentials: "include" }),
      fetch("/api/wallet/balance/", { credentials: "include" })
    ])
      .then(async ([h, r, b]) => {
        const history = h.ok ? await h.json() : [];
        const chart = r.ok ? await r.json() : [];
        const bal = b.ok ? await b.json() : { balance: 0 };
        setWithdrawHistory(history.data || []);
        // Chỉ lấy doanh thu theo ngày cho bảng
        setRevenueTable((chart.data || []).filter(d => d.type === "Ngày"));
        setBalance(bal.balance || 0);
      })
      .catch(() => message.error("Không thể tải dữ liệu tài chính"))
      .finally(() => setLoading(false));
  }, []);

  const handleWithdraw = async () => {
    if (!withdrawAmount || withdrawAmount < 10000) {
      message.warning("Nhập số tiền muốn rút (tối thiểu 10.000 VNĐ)");
      return;
    }
    setWithdrawLoading(true);
    try {
      const res = await fetch("/api/withdraw/request/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount: withdrawAmount })
      });
      if (!res.ok) throw new Error("Gửi yêu cầu thất bại");
      message.success("Yêu cầu rút tiền đã được gửi!");
      setWithdrawAmount(undefined);
    } catch (err) {
      message.error(err.message || "Lỗi khi gửi yêu cầu rút tiền");
    } finally {
      setWithdrawLoading(false);
    }
  };

  // Bảng doanh thu theo ngày
  const revenueColumns = [
    { title: "Ngày", dataIndex: "date", key: "date" },
    { title: "Doanh thu (VNĐ)", dataIndex: "amount", key: "amount", render: v => v?.toLocaleString("vi-VN") },
  ];

  return (
    <div style={{ background: "#fafbfc", minHeight: "100vh", padding: 32 }}>
      <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 32, color: '#222' }}>
        Doanh thu & Thanh toán
      </div>
      <Row gutter={32}>
        <Col xs={24} md={8}>
          <Card
            style={{ marginBottom: 32, borderRadius: 16, boxShadow: '0 2px 8px #f0f1f2', border: 'none', textAlign: 'center', minHeight: 220 }}
            bodyStyle={{ padding: 32 }}
          >
            <div style={{ fontWeight: 500, color: "#888", marginBottom: 8, fontSize: 16 }}>Số dư khả dụng</div>
            <div style={{ fontSize: 36, fontWeight: 700, color: '#1abc9c', marginBottom: 16 }}>
              {balance.toLocaleString("vi-VN")} <span style={{ fontSize: 18, color: '#888', fontWeight: 400 }}>VNĐ</span>
            </div>
            <Input
              type="number"
              min={10000}
              step={10000}
              value={withdrawAmount}
              onChange={e => setWithdrawAmount(Number(e.target.value))}
              placeholder="Nhập số tiền muốn rút"
              style={{ marginBottom: 16, width: "100%", fontSize: 16, borderRadius: 8, padding: 8 }}
            />
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              loading={withdrawLoading}
              block
              size="large"
              style={{ fontWeight: 600, borderRadius: 8, background: '#1677ff' }}
              onClick={handleWithdraw}
            >
              Yêu cầu rút tiền
            </Button>
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card
            style={{ marginBottom: 32, borderRadius: 16, boxShadow: '0 2px 8px #f0f1f2', border: 'none' }}
            bodyStyle={{ padding: 24 }}
            title={<span style={{ fontWeight: 600, fontSize: 18 }}>Doanh thu theo ngày/tháng</span>}
            extra={<DatePicker.RangePicker style={{ minWidth: 220 }} />}
          >
            <Table
              columns={revenueColumns}
              dataSource={revenueTable}
              loading={loading}
              pagination={false}
              rowKey="date"
              size="middle"
              style={{ background: 'white', borderRadius: 12 }}
            />
          </Card>
          <Card
            style={{ borderRadius: 16, boxShadow: '0 2px 8px #f0f1f2', border: 'none' }}
            bodyStyle={{ padding: 24 }}
            title={<span style={{ fontWeight: 600, fontSize: 18 }}>Lịch sử thanh toán từ sàn → người bán</span>}
          >
            <Table
              columns={withdrawColumns}
              dataSource={withdrawHistory}
              loading={loading}
              pagination={{ pageSize: 5 }}
              rowKey="id"
              size="middle"
              style={{ background: 'white', borderRadius: 12 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
