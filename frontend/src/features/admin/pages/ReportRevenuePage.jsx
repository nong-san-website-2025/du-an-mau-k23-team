// src/features/admin/pages/ReportRevenuePage.jsx
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
import api from "../../login_register/services/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // ✅ import đúng

dayjs.extend(isBetween);

const { RangePicker } = DatePicker;

export default function ReportRevenuePage() {
  const [data, setData] = useState([]);
  const [balance, setBalance] = useState(0);
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, "day"),
    dayjs(),
  ]);
  const [flowFilter, setFlowFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // 🔹 Load dữ liệu từ API
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
        if (t.status === "success") return sum + t.amount;
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
    filtered = filtered.filter((t) => {
      const d = dayjs(t.date, "YYYY-MM-DD");
      return d.isBetween(dateRange[0], dateRange[1], null, "[]");
    });
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

  // 🔹 Xuất PDF
  const exportPDF = () => {
    const doc = new jsPDF();

    // Tiêu đề
    doc.setFontSize(16);
    doc.text("Báo cáo doanh thu", 14, 20);

    // Số dư
    doc.setFontSize(12);
    doc.text(`Số dư: ${balance.toLocaleString()} đ`, 14, 30);

    // Chuẩn bị dữ liệu bảng
    const tableData = applyFilters(data).map((t) => [
      t.date,
      t.type,
      t.desc,
      t.orderId,
      t.amount.toLocaleString() + " đ",
      t.status,
    ]);

    // Xuất bảng bằng autoTable
    autoTable(doc, {
      head: [["Ngày", "Loại GD", "Mô tả", "Order ID", "Số tiền", "Trạng thái"]],
      body: tableData,
      startY: 40,
    });

    // Lưu file
    doc.save("bao_cao_doanh_thu.pdf");
  };

  const columns = [
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Loại Giao Dịch",
      dataIndex: "type",
      key: "type",
    },
    {
      title: "Mô Tả",
      dataIndex: "desc",
      key: "desc",
    },
    {
      title: "Order ID",
      dataIndex: "orderId",
      key: "orderId",
    },
    {
      title: "Số Tiền",
      dataIndex: "amount",
      key: "amount",
      render: (amount, record) =>
        record.status === "success" ? (
          amount > 0 ? (
            <span className="text-green-600 font-medium">
              <ArrowDownOutlined /> +{amount.toLocaleString()} đ
            </span>
          ) : (
            <span className="text-red-500 font-medium">
              <ArrowUpOutlined /> {amount.toLocaleString()} đ
            </span>
          )
        ) : (
          <span className="text-gray-400">{amount.toLocaleString()} đ</span>
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
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      {/* Tổng quan số dư */}
      <Card className="rounded-2xl shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-500">Số dư (chỉ tính đơn hàng thành công)</p>
            <h2 className="text-2xl font-bold text-green-600">
              {balance.toLocaleString()} đ
            </h2>
          </div>
          <Button type="primary" size="large" icon={<WalletOutlined />}>
            Yêu Cầu Thanh Toán
          </Button>
        </div>
      </Card>

      {/* Bộ lọc giao dịch */}
      <Card className="rounded-2xl shadow-sm">
        <Space wrap>
          <RangePicker value={dateRange} onChange={(v) => setDateRange(v)} />
          <Select
            value={flowFilter}
            onChange={setFlowFilter}
            options={[
              { value: "all", label: "Tất cả" },
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
          <Button
            type="default"
            icon={<FilePdfOutlined />}
            onClick={exportPDF}
          >
            Xuất PDF
          </Button>
        </Space>
      </Card>

      {/* Bảng giao dịch gần đây */}
      <Card title="Các giao dịch gần đây" className="rounded-2xl shadow-sm">
        <Table
          columns={columns}
          dataSource={applyFilters(data)}
          pagination={{ pageSize: 5 }}
        />
      </Card>
    </div>
  );
}
