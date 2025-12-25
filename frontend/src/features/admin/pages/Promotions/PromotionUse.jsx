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
  Radio,
  Typography,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  UserOutlined,
  ShoppingOutlined,
  DollarOutlined,
  HistoryOutlined,
  FileExcelOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import * as XLSX from "xlsx";

// Import hàm API (Đảm bảo đường dẫn đúng với dự án của bạn)
import { getVoucherUsageHistory } from "../../services/promotionServices";

import "../../styles/PromotionUse.css";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const PromotionUse = () => {
  // --- 1. STATE QUẢN LÝ ---
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]); // Dữ liệu gốc (Chi tiết log)

  // State bộ lọc toàn cục (Global Filter)
  const [searchText, setSearchText] = useState("");
  // Mặc định chọn 30 ngày gần nhất
  const [dateRange, setDateRange] = useState([dayjs().subtract(29, 'day'), dayjs()]);
  const [presetType, setPresetType] = useState('30'); // Để highlight nút đang chọn

  // State thống kê (KPIs)
  const [stats, setStats] = useState({
    totalDiscount: 0,
    totalUsage: 0,
    todayUsage: 0,
  });

  // State thống kê tổng hợp theo Voucher
  const [voucherStats, setVoucherStats] = useState([]);

  // --- 2. XỬ LÝ LOGIC CHỌN NGÀY NHANH ---
  const handlePresetChange = (e) => {
    const key = e.target.value;
    setPresetType(key);

    const today = dayjs();
    let start = null;
    let end = today;

    switch (key) {
      case 'today':
        start = today;
        break;
      case '7':
        start = today.subtract(6, 'day');
        break;
      case '30':
        start = today.subtract(29, 'day');
        break;
      case '90':
        start = today.subtract(89, 'day');
        break;
      case 'year':
        start = today.startOf('year');
        break;
      case 'custom':
        // Giữ nguyên ngày hiện tại, chỉ đổi highlight nút
        return;
      default:
        return;
    }

    if (start && end) {
      setDateRange([start, end]);
    }
  };

  // Khi người dùng chọn tay trên lịch
  const handleManualDateChange = (dates) => {
    setPresetType('custom');
    setDateRange(dates);
  };

  // --- 3. GỌI API & TÍNH TOÁN ---
  const fetchData = async () => {
    setLoading(true);
    try {
      // Gọi API với tham số lọc
      const res = await getVoucherUsageHistory({
        search: searchText || undefined,
        startDate: dateRange?.[0]?.toISOString(),
        endDate: dateRange?.[1]?.toISOString(),
      });

      setData(res);
      calculateStats(res);
      calculateVoucherStats(res);

    } catch (error) {
      console.error("Lỗi khi tải dữ liệu voucher:", error);
    } finally {
      setLoading(false);
    }
  };

  // Debounce: Tự động gọi API khi search hoặc date thay đổi (sau 0.5s)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchText, dateRange]);

  // Logic tính toán số liệu tổng (KPI Cards)
  const calculateStats = (dataset) => {
    if (!Array.isArray(dataset)) return;

    const totalDisc = dataset.reduce((acc, curr) => acc + Number(curr.discount_amount || 0), 0);
    const todayStr = dayjs().format("YYYY-MM-DD");
    const todayCount = dataset.filter(item => dayjs(item.used_at).format("YYYY-MM-DD") === todayStr).length;

    setStats({
      totalDiscount: totalDisc,
      totalUsage: dataset.length,
      todayUsage: todayCount,
    });
  };

  // Logic tính toán bảng Thống kê theo Voucher (Group by Code)
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

    // Chuyển map thành mảng
    const statsArray = Object.values(voucherMap).map(v => ({
      ...v,
      users_count: v.users.size, // Đếm số lượng user unique
    }));

    setVoucherStats(statsArray);
  };

  // --- 4. XUẤT EXCEL ---
  const exportToExcel = (type) => {
    // Type: 'stats' (Thống kê) hoặc 'detail' (Chi tiết)
    const isStats = type === 'stats';
    const fileName = isStats ? "Thong_Ke_Voucher.xlsx" : "Chi_Tiet_Su_Dung_Voucher.xlsx";
    const sheetName = isStats ? "TongHop" : "ChiTiet";

    let sourceData = [];

    if (isStats) {
      sourceData = voucherStats.map(item => ({
        "Mã Voucher": item.voucher_code,
        "Tên Voucher": item.voucher_title,
        "Số người dùng": item.users_count,
        "Tổng lượt dùng": item.usageCount,
        "Tổng tiền giảm": item.totalDiscount
      }));
    } else {
      sourceData = data.map(item => ({
        "ID": item.id,
        "Khách hàng": item.user_name,
        "Email": item.user_email,
        "Mã Voucher": item.voucher_code,
        "Đơn hàng": item.order_id,
        "Số tiền giảm": item.discount_amount,
        "Thời gian": dayjs(item.used_at).format("DD/MM/YYYY HH:mm")
      }));
    }

    const worksheet = XLSX.utils.json_to_sheet(sourceData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, fileName);
  };

  // --- 5. CẤU HÌNH CỘT BẢNG ---

  // Cột bảng Thống kê (Trên)
  const columnsStats = [
    {
      title: "Mã Voucher",
      dataIndex: "voucher_code",
      key: "voucher_code",
      render: code => <Tag color="geekblue" style={{ fontWeight: 600, fontSize: 13 }}>{code}</Tag>
    },
    { title: "Tên Voucher", dataIndex: "voucher_title", key: "voucher_title" },
    {
      title: "Độ phủ (Users)",
      dataIndex: "users_count",
      key: "users_count",
      sorter: (a, b) => a.users_count - b.users_count,
      render: val => <Text strong style={{ color: '#1890ff' }}>{val} người</Text>
    },
    {
      title: "Tổng lượt dùng",
      dataIndex: "usageCount",
      key: "usageCount",
      sorter: (a, b) => a.usageCount - b.usageCount,
      render: val => <Text type="success" strong>{val} lượt</Text>
    },
    {
      title: "Tổng chi phí (Burn)",
      dataIndex: "totalDiscount",
      key: "totalDiscount",
      sorter: (a, b) => a.totalDiscount - b.totalDiscount,
      render: val => <Text type="danger" strong>-{new Intl.NumberFormat('vi-VN').format(val)} ₫</Text>
    },
  ];

  // Cột bảng Chi tiết (Dưới)
  const columnsDetail = [
    {
      title: "Khách hàng",
      dataIndex: "user_name",
      key: "user_name",
      render: (text, record) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} src={record.user_avatar} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Text style={{ fontSize: 13, fontWeight: 500 }}>{text || 'Khách vãng lai'}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>{record.user_email}</Text>
          </div>
        </Space>
      )
    },
    {
      title: "Mã áp dụng",
      dataIndex: "voucher_code",
      render: code => <Tag>{code}</Tag>
    },
    {
      title: "Đơn hàng",
      dataIndex: "order_id",
      render: id => id ? <a href={`/admin/orders/${id}`} style={{ color: '#faad14', fontWeight: 600 }}>#{id}</a> : '-'
    },
    {
      title: "Giá trị giảm",
      dataIndex: "discount_amount",
      render: val => <span style={{ color: '#52c41a', fontWeight: 600 }}>-{new Intl.NumberFormat('vi-VN').format(val)}</span>
    },
    {
      title: "Thời gian dùng",
      dataIndex: "used_at",
      render: date => <Text type="secondary" style={{ fontSize: 13 }}>{dayjs(date).format("DD/MM/YYYY HH:mm")}</Text>
    },
  ];

  return (
    <div style={{ padding: "0 24px 24px 24px", background: "#f0f2f5", minHeight: "100vh" }}>
      {/* HEADER TRANG */}
      <div style={{ marginBottom: 16 }}>
        <Breadcrumb items={[{ title: 'Trang chủ' }, { title: 'Marketing' }, { title: 'Lịch sử Voucher' }]} />
        <div style={{ marginTop: 8 }}>
          <Title level={3} style={{ margin: 0 }}>Báo cáo hiệu quả Voucher</Title>
        </div>
      </div>

      {/* --- PHẦN 1: BỘ LỌC TOÀN CỤC (GLOBAL FILTER) --- */}
      <Card bordered={false} className="mb-4 shadow-sm" style={{ marginBottom: 24, borderRadius: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Hàng 1: Tiêu đề bộ lọc */}
          <div style={{ display: 'flex', alignItems: 'center', fontWeight: 600, color: '#595959' }}>
            <FilterOutlined style={{ marginRight: 8 }} /> BỘ LỌC DỮ LIỆU
          </div>

          {/* Hàng 2: Các input lọc */}
          <Row gutter={[16, 16]} align="middle">
  {/* 1. Cột Tìm kiếm: Giảm xuống 6 */}
  <Col xs={24} md={6}>
    <Input
      placeholder="Tìm User, Mã Voucher..."
      prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
      value={searchText}
      onChange={(e) => setSearchText(e.target.value)}
      allowClear
      size="large"
    />
  </Col>

  {/* 2. Cột Bộ lọc ngày: Giữ nguyên 16 (ưu tiên diện tích lớn nhất) */}
  <Col xs={24} md={16}>
    <Space style={{ width: '100%' }} size={12} align="center">
      <Radio.Group
        value={presetType}
        onChange={handlePresetChange}
        buttonStyle="solid"
        size="middle"
        style={{ flexShrink: 0 }} // Giúp nút không bị co lại khi màn hình nhỏ
      >
        <Radio.Button value="today">Hôm nay</Radio.Button>
        <Radio.Button value="7">7 ngày</Radio.Button>
        <Radio.Button value="30">30 ngày</Radio.Button>
        <Radio.Button value="90">Quý này</Radio.Button>
        <Radio.Button value="year">Năm nay</Radio.Button>
      </Radio.Group>

      <RangePicker
        style={{ flex: 1, minWidth: 200 }} // flex: 1 để tự co giãn
        value={dateRange}
        onChange={handleManualDateChange}
        format="DD/MM/YYYY"
        size="large"
        placeholder={['Từ ngày', 'Đến ngày']}
      />
    </Space>
  </Col>

  {/* 3. Nút Làm mới: Giảm xuống 2 cho vừa khớp hàng */}
  <Col xs={24} md={2} style={{ textAlign: 'right' }}>
    {/* Bỏ width 30% đi vì cột đã nhỏ rồi, để tự nhiên hoặc 100% */}
    <Button 
      type="default" 
      icon={<ReloadOutlined />} 
      onClick={fetchData} 
      size="large" 
      style={{ width: '100%' }} // Đầy cột span 2
    />
  </Col>
</Row>
        </div>
      </Card>

      {/* --- PHẦN 2: THỐNG KÊ KPI (CARDS) --- */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card bordered={false} hoverable style={{ borderRadius: 8 }}>
            <Statistic
              title={<Text type="secondary">Tổng lượt sử dụng</Text>}
              value={stats.totalUsage}
              prefix={<ShoppingOutlined style={{ color: "#52c41a" }} />}
              valueStyle={{ fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} hoverable style={{ borderRadius: 8 }}>
            <Statistic
              title={<Text type="secondary">Tổng tiền đã giảm (Burn Rate)</Text>}
              value={stats.totalDiscount}
              precision={0}
              valueStyle={{ color: "#cf1322", fontWeight: 'bold' }}
              prefix={<DollarOutlined />}
              suffix="₫"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} hoverable style={{ borderRadius: 8 }}>
            <Statistic
              title={<Text type="secondary">Lượt dùng hôm nay</Text>}
              value={stats.todayUsage}
              prefix={<HistoryOutlined style={{ color: "#1890ff" }} />}
              valueStyle={{ fontWeight: 'bold' }}
            />
          </Card>
        </Col>
      </Row>

      {/* --- PHẦN 3: BẢNG DỮ LIỆU CHÍNH --- */}
      <Row gutter={24}>
        {/* Bảng Thống Kê (Aggregate) */}
        <Col span={24} style={{ marginBottom: 24 }}>
          <Card
            title="Thống kê hiệu quả theo Mã Voucher"
            bordered={false}
            style={{ borderRadius: 8 }}
            extra={
              <Button className="btn-export" ghost icon={<FileExcelOutlined />} onClick={() => exportToExcel('stats')} size="small">
                Xuất Thống Kê
              </Button>
            }
          >
            <Table
              columns={columnsStats}
              dataSource={voucherStats}
              rowKey="voucher_code"
              loading={loading}
              pagination={{ pageSize: 5 }}
              size="small"
              bordered
            />
          </Card>
        </Col>

        {/* Bảng Chi Tiết (Transaction Log) */}
        <Col span={24}>
          <Card
            title="Nhật ký giao dịch chi tiết (Log)"
            bordered={false}
            style={{ borderRadius: 8 }}
            extra={
              <Button className="btn-export" ghost icon={<FileExcelOutlined />} onClick={() => exportToExcel('detail')} size="small">
                Xuất Giao Dịch
              </Button>
            }
          >
            <Table
              columns={columnsDetail}
              dataSource={data}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10, showSizeChanger: true }}
              bordered
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PromotionUse;