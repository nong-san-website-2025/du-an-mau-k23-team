import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Tag,
  Space,
  Input,
  Button,
  DatePicker,
  Breadcrumb,
  Statistic,
  Row,
  Col,
  Avatar,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  ExportOutlined,
  UserOutlined,
  ShoppingOutlined,
  DollarOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import * as XLSX from "xlsx"; // Cần cài thư viện này: npm install xlsx

// Import hàm API (Đảm bảo đường dẫn này đúng với cấu trúc thư mục của bạn)
import { getVoucherUsageHistory, getVoucherUsageDetail } from "../../services/promotionServices"; 

const { RangePicker } = DatePicker;

const PromotionUse = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]); // Dữ liệu bảng
  const [searchText, setSearchText] = useState("");
  const [dateRange, setDateRange] = useState([]);
  
  // Stats state
  const [stats, setStats] = useState({
    totalDiscount: 0,
    totalUsage: 0,
    todayUsage: 0,
  });

  // Voucher Stats - thống kê theo từng voucher
  const [voucherStats, setVoucherStats] = useState([]);

  // --- 1. CALL API ---
  const fetchData = async (searchVal = "", dateRangeVal = []) => {
    setLoading(true);
    try {
      // Gọi hàm API đã đóng gói
      const res = await getVoucherUsageHistory({
        search: searchVal || undefined,
        startDate: dateRangeVal[0] ? dateRangeVal[0].toISOString() : undefined,
        endDate: dateRangeVal[1] ? dateRangeVal[1].toISOString() : undefined,
      });

      setData(res);
      calculateStats(res);
      calculateVoucherStats(res);

    } catch (error) {
      console.error("Failed to fetch usage data", error);
    } finally {
      setLoading(false);
    }
  };

  // Load dữ liệu lần đầu
  useEffect(() => {
    fetchData("", []);
  }, []);

  // Khi ô tìm kiếm hoặc ngày thay đổi thì reload
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(searchText, dateRange);
    }, 500); // Delay 500ms để tránh gọi API quá nhiều lần

    return () => clearTimeout(timer);
  }, [searchText, dateRange]);

  // --- 2. LOGIC TÍNH TOÁN STATS ---
  const calculateStats = (dataset) => {
    if (!Array.isArray(dataset)) return; // Bảo vệ nếu data trả về lỗi

    const totalDisc = dataset.reduce((acc, curr) => acc + Number(curr.discount_amount || 0), 0);
    const today = dayjs().format("YYYY-MM-DD");
    const todayCount = dataset.filter(item => dayjs(item.used_at).format("YYYY-MM-DD") === today).length;

    // [FIX] Đã sửa lỗi cú pháp tại đây (xóa chữ 'pro' thừa)
    setStats({
      totalDiscount: totalDisc,
      totalUsage: dataset.length,
      todayUsage: todayCount,
    });
  };

  // Tính toán thống kê theo từng voucher
  const calculateVoucherStats = (dataset) => {
    if (!Array.isArray(dataset)) return;

    const voucherMap = {};
    
    dataset.forEach(item => {
      const code = item.voucher_code;
      if (!voucherMap[code]) {
        voucherMap[code] = {
          voucher_code: code,
          voucher_title: item.voucher_title,
          users: new Set(),
          usageCount: 0,
          totalDiscount: 0,
        };
      }
      
      voucherMap[code].users.add(item.user_name);
      voucherMap[code].usageCount += 1;
      voucherMap[code].totalDiscount += Number(item.discount_amount || 0);
    });

    const stats = Object.values(voucherMap).map(v => ({
      ...v,
      users_count: v.users.size,
      users: undefined,
    }));

    setVoucherStats(stats);
  };

  // --- 3. EXPORT EXCEL ---
  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(data.map(item => ({
      "ID": item.id,
      "Khách hàng": item.user_name || "N/A",
      "Mã Voucher": item.voucher_code,
      "Đơn hàng": item.order_id,
      "Số tiền giảm": item.discount_amount,
      "Ngày dùng": dayjs(item.used_at).format("DD/MM/YYYY HH:mm")
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "VoucherUsage");
    XLSX.writeFile(workbook, "Lich_Su_Dung_Voucher.xlsx");
  };

  // --- 4. CẤU HÌNH CỘT BẢNG ---
  const columns = [
    {
      title: "Khách hàng",
      dataIndex: "user_name",
      key: "user_name",
      render: (text, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} src={record.user_avatar} />
          <div>
            <div style={{ fontWeight: 500 }}>{text || "Khách vãng lai"}</div>
            {/* Nếu API trả về email thì hiện, không thì ẩn */}
            {record.user_email && <div style={{ fontSize: "12px", color: "#888" }}>{record.user_email}</div>}
          </div>
        </Space>
      ),
    },
    {
      title: "Mã Voucher",
      dataIndex: "voucher_code",
      key: "voucher_code",
      render: (code) => (
        <Tag color="geekblue" style={{ fontSize: "14px", padding: "4px 10px" }}>
          {code}
        </Tag>
      ),
    },
    {
      title: "Đơn hàng",
      dataIndex: "order_id",
      key: "order_id",
      render: (id) => (
        <Tooltip title="Xem chi tiết đơn hàng">
           {/* Link tới trang chi tiết đơn hàng admin */}
           {id ? (
             <a href={`/admin/orders/${id}`} style={{ fontWeight: "bold", color: "#faad14" }}>
              #{id}
            </a>
           ) : <span style={{color: '#ccc'}}>Chưa có</span>}
        </Tooltip>
      ),
    },
    {
      title: "Số tiền giảm",
      dataIndex: "discount_amount",
      key: "discount_amount",
      sorter: (a, b) => a.discount_amount - b.discount_amount,
      render: (amount) => (
        <span style={{ color: "#52c41a", fontWeight: "bold" }}>
          -{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount)}
        </span>
      ),
    },
    {
      title: "Thời gian dùng",
      dataIndex: "used_at",
      key: "used_at",
      sorter: (a, b) => new Date(a.used_at) - new Date(b.used_at),
      render: (date) => (
        <Space>
          <HistoryOutlined />
          {dayjs(date).format("DD/MM/YYYY - HH:mm")}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "0 20px 20px 20px" }}>
      {/* Breadcrumb */}
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item href="/admin">Trang chủ</Breadcrumb.Item>
        <Breadcrumb.Item>Khuyến mãi</Breadcrumb.Item>
        <Breadcrumb.Item>Lịch sử sử dụng</Breadcrumb.Item>
      </Breadcrumb>

      {/* Stats Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card bordered={false} hoverable>
            <Statistic
              title="Tổng lượt sử dụng"
              value={stats.totalUsage}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} hoverable>
            <Statistic
              title="Tổng tiền đã giảm (Burn Rate)"
              value={stats.totalDiscount}
              precision={0}
              valueStyle={{ color: "#cf1322" }}
              prefix={<DollarOutlined />}
              suffix="₫"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} hoverable>
            <Statistic
              title="Lượt dùng hôm nay"
              value={stats.todayUsage}
              prefix={<HistoryOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Thống kê theo Voucher */}
      <Card
        title="Thống kê theo Voucher"
        style={{ marginBottom: 24 }}
      >
        <Table
          columns={[
            {
              title: "Mã Voucher",
              dataIndex: "voucher_code",
              key: "voucher_code",
              render: (code) => (
                <Tag color="geekblue" style={{ fontSize: "14px", padding: "4px 10px" }}>
                  {code}
                </Tag>
              ),
            },
            {
              title: "Tên Voucher",
              dataIndex: "voucher_title",
              key: "voucher_title",
            },
            {
              title: "Số người dùng",
              dataIndex: "users_count",
              key: "users_count",
              sorter: (a, b) => a.users_count - b.users_count,
              render: (count) => (
                <span style={{ fontWeight: 500, color: "#1890ff" }}>
                  {count} người
                </span>
              ),
            },
            {
              title: "Tổng lượt sử dụng",
              dataIndex: "usageCount",
              key: "usageCount",
              sorter: (a, b) => a.usageCount - b.usageCount,
              render: (count) => (
                <span style={{ fontWeight: 500, color: "#3f8600" }}>
                  {count} lượt
                </span>
              ),
            },
            {
              title: "Tổng tiền giảm",
              dataIndex: "totalDiscount",
              key: "totalDiscount",
              sorter: (a, b) => a.totalDiscount - b.totalDiscount,
              render: (amount) => (
                <span style={{ color: "#cf1322", fontWeight: "bold" }}>
                  -{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount)}
                </span>
              ),
            },
          ]}
          dataSource={voucherStats}
          rowKey="voucher_code"
          loading={loading}
          pagination={{ defaultPageSize: 10, showSizeChanger: true }}
          bordered
        />
      </Card>

      {/* Main Content */}
      <Card
        title="Danh sách sử dụng Voucher (Chi tiết)"
        extra={
          <Button 
            type="primary" 
            icon={<ExportOutlined />} 
            onClick={handleExport}
            disabled={data.length === 0}
          >
            Xuất Excel
          </Button>
        }
      >
        {/* Filters */}
        <Row gutter={16} style={{ marginBottom: 20 }}>
          <Col span={8}>
            <Input
              placeholder="Tìm theo User, Mã Voucher, ID Đơn..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={8}>
            <RangePicker 
              style={{ width: "100%" }} 
              onChange={(dates) => setDateRange(dates)}
              format="DD/MM/YYYY"
            />
          </Col>
          <Col span={8} style={{ textAlign: "right" }}>
            <Button icon={<ReloadOutlined />} onClick={fetchData}>
              Làm mới
            </Button>
          </Col>
        </Row>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{ 
            defaultPageSize: 10, 
            showSizeChanger: true, 
            pageSizeOptions: ["10", "20", "50"] 
          }}
          bordered
        />
      </Card>
    </div>
  );
};

export default PromotionUse;