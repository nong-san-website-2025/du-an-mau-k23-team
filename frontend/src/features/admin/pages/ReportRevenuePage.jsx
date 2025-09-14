// src/features/admin/pages/reports/ReportRevenuePage.jsx
import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Tag,
  DatePicker,
  Select,
  Space,
  message,
} from "antd";
import {
  WalletOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import api from "../../../features/login_register/services/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

dayjs.extend(isBetween);

const { RangePicker } = DatePicker;

export default function ReportRevenuePage() {
  const [data, setData] = useState([]);
  const [balance, setBalance] = useState(0);
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, "day"),
    dayjs(),
  ]);
  const [flowFilter, setFlowFilter] = useState("all"); // "in", "out", "all"
  const [typeFilter, setTypeFilter] = useState("all"); // "order", "refund", "all"

  const loadData = async () => {
    try {
      const isAdmin = localStorage.getItem("is_admin") === "true";
      const endpoint = isAdmin ? "/orders/admin-list/" : "/orders/";
      const ordersRes = await api.get(endpoint);
      const orders = Array.isArray(ordersRes.data) ? ordersRes.data : [];

      const tx = orders.map((o) => ({
        key: o.id,
        date: dayjs(o.created_at).format("YYYY-MM-DD"),
        type: o.status === "cancelled" ? "Hoàn tiền" : "Doanh Thu Đơn Hàng",
        desc: `Đơn hàng #${o.id}`,
        orderId: `${o.id}`,
        amount:
          Number(o.total_price || 0) * (o.status === "cancelled" ? -1 : 1),
        status: o.status,
      }));

      setData(tx);

      const totalBalance = tx.reduce((sum, t) => {
        // chỉ tính đơn thành công (status success)
        if (t.status === "success") {
          return sum + t.amount;
        }
        return sum;
      }, 0);

      setBalance(totalBalance);
    } catch (err) {
      console.error(err);
      message.error("Không thể tải dữ liệu doanh thu");
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = (list) => {
    let filtered = list;

    if (dateRange && dateRange[0] && dateRange[1]) {
      filtered = filtered.filter((t) => {
        const d = dayjs(t.date, "YYYY-MM-DD");
        return d.isBetween(dateRange[0], dateRange[1], null, "[]");
      });
    }

    if (flowFilter !== "all") {
      filtered = filtered.filter((t) =>
        flowFilter === "in" ? t.amount > 0 : t.amount < 0
      );
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((t) =>
        typeFilter === "order"
          ? t.type === "Doanh Thu Đơn Hàng"
          : t.type === "Hoàn tiền"
      );
    }

    return filtered;
  };

  const exportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Báo cáo doanh thu", 14, 20);

    doc.setFontSize(12);
    doc.text(`Số dư (chỉ đơn thành công): ${balance.toLocaleString()} đ`, 14, 30);

    const filtered = applyFilters(data);

    const tableBody = filtered.map((t) => [
      t.date,
      t.type,
      t.desc,
      t.orderId,
      t.amount.toLocaleString() + " đ",
      t.status,
    ]);

    autoTable(doc, {
      head: [["Ngày", "Loại GD", "Mô tả", "Order ID", "Số tiền", "Trạng thái"]],
      body: tableBody,
      startY: 40,
    });

    doc.save("bao_cao_doanh_thu.pdf");
  };

  const columns = [
    { title: "Ngày", dataIndex: "date", key: "date" },
    { title: "Loại Giao Dịch", dataIndex: "type", key: "type" },
    { title: "Mô tả", dataIndex: "desc", key: "desc" },
    { title: "Order ID", dataIndex: "orderId", key: "orderId" },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      render: (amount, record) =>
        record.status === "success" ? (
          amount > 0 ? (
            <span style={{ color: "green", fontWeight: 500 }}>
              <ArrowDownOutlined /> +{amount.toLocaleString()} đ
            </span>
          ) : (
            <span style={{ color: "red", fontWeight: 500 }}>
              <ArrowUpOutlined /> {amount.toLocaleString()} đ
            </span>
          )
        ) : (
          <span style={{ color: "#999" }}>{amount.toLocaleString()} đ</span>
        ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color = "default";
        if (status === "success") color = "green";
        else if (status === "cancelled") color = "red";
        else if (status === "pending") color = "orange";
        else if (status === "shipping") color = "blue";
        return <Tag color={color}>{status}</Tag>;
      },
    },
  ];

        return (
        <div
        className="p-6 bg-gray-50 min-h-screen space-y-6"
        style={{ fontFamily: "Roboto, sans-serif" }}>
        <Card className="rounded-2xl shadow-md">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ color: "#6b7280" }}>Số dư (chỉ tính đơn hàng thành công)</p>
            <h2 style={{ color: "#16a34a", fontWeight: "bold", fontSize: "2rem" }}>
              {balance.toLocaleString()} đ
            </h2>
          </div>
          <Button type="primary" size="large" icon={<WalletOutlined />}>
            Yêu Cầu Thanh Toán
          </Button>
        </div>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <Space wrap>
          <RangePicker
            value={dateRange}
            onChange={(v) => setDateRange(v || [])}
            format="YYYY-MM-DD"
          />
          <Select
            value={flowFilter}
            onChange={setFlowFilter}
            options={[
              { value: "all", label: "Tất cả tiền vào/ra" },
              { value: "in", label: "Tiền vào" },
              { value: "out", label: "Tiền ra" },
            ]}
          />
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { value: "all", label: "Tất cả loại" },
              { value: "order", label: "Doanh Thu Đơn Hàng" },
              { value: "refund", label: "Hoàn tiền" },
            ]}
          />
          <Button type="primary" onClick={loadData}>
            Áp dụng
          </Button>
          <Button type="default" icon={<FilePdfOutlined />} onClick={exportPDF}>
            Xuất PDF
          </Button>
        </Space>
      </Card>

      <Card title="Các giao dịch gần đây" className="rounded-2xl shadow-sm">
        <Table
          columns={columns}
          dataSource={applyFilters(data)}
          pagination={{ pageSize: 5 }}
          rowKey="key"
        />
      </Card>
    </div>
  );
}
