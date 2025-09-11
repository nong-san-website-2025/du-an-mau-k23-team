// src/features/admin/pages/ReportRevenuePage.jsx
import React, { useState } from "react";
import { Card, Table, Button, Tag, DatePicker, Select, Space, message } from "antd";
import { WalletOutlined, ArrowDownOutlined, ArrowUpOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween"; // ✅ thêm plugin

import api from "../../login_register/services/api";

dayjs.extend(isBetween); // ✅ kích hoạt plugin

const { RangePicker } = DatePicker;

export default function ReportRevenuePage() {
  const [data, setData] = useState([]); // transactions
  const [balance, setBalance] = useState(0);
  const [dateRange, setDateRange] = useState([dayjs().subtract(30, "day"), dayjs()]);
  const [flowFilter, setFlowFilter] = useState("all"); // in | out | all
  const [typeFilter, setTypeFilter] = useState("all"); // order | refund | all

  const loadData = async () => {
    try {
      // Get wallet balance
      const walletRes = await api.get("/wallet/my_wallet/");
      setBalance(Number(walletRes.data?.balance || 0));

      // Get orders as revenue source
      const isAdmin = localStorage.getItem("is_admin") === "true";
      const endpoint = isAdmin ? "/orders/admin-list/" : "/orders/";
      const ordersRes = await api.get(endpoint);
      const orders = Array.isArray(ordersRes.data) ? ordersRes.data : [];

      // Transform orders to transactions
      const tx = orders.map((o) => ({
        key: o.id,
        date: dayjs(o.created_at).format("YYYY-MM-DD"),
        type: o.status === "cancelled" ? "Hoàn tiền" : "Doanh Thu Đơn Hàng",
        desc: `Đơn hàng #${o.id}`,
        orderId: `${o.id}`,
        amount: Number(o.total_price || 0) * (o.status === "cancelled" ? -1 : 1),
        status: o.status === "success" ? "Hoàn thành" : o.status,
      }));

      setData(tx);
    } catch (err) {
      console.error(err);
      message.error("Không thể tải dữ liệu doanh thu");
    }
  };

  React.useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = (list) => {
    let filtered = list;

    // Date range filter
    filtered = filtered.filter((t) => {
      const d = dayjs(t.date, "YYYY-MM-DD");
      return d.isBetween(dateRange[0], dateRange[1], null, "[]"); // ✅ dùng plugin
    });

    // Flow filter (in/out)
    if (flowFilter !== "all") {
      filtered = filtered.filter((t) =>
        flowFilter === "in" ? t.amount > 0 : t.amount < 0
      );
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((t) =>
        typeFilter === "order"
          ? t.type === "Doanh Thu Đơn Hàng"
          : t.type === "Hoàn tiền"
      );
    }

    return filtered;
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
      render: (amount) =>
        amount > 0 ? (
          <span className="text-green-600 font-medium">
            <ArrowDownOutlined /> +{amount.toLocaleString()} đ
          </span>
        ) : (
          <span className="text-red-500 font-medium">
            <ArrowUpOutlined /> {amount.toLocaleString()} đ
          </span>
        ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => <Tag color="green">{status}</Tag>,
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      {/* Tổng quan số dư */}
      <Card className="rounded-2xl shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-500">Số dư</p>
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
