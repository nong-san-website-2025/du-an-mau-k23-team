// src/features/admin/pages/Complaint/UserReports.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Table, message, Button, Card, Tooltip, Popconfirm, Space, Select, DatePicker, Input, Row, Col, Tag, Avatar } from "antd";
import {
  ReloadOutlined,
  ThunderboltOutlined,
  DeleteOutlined,
  SendOutlined,
  EyeOutlined,
  SearchOutlined,
  DownloadOutlined,
  UserOutlined,
  FilterOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import * as XLSX from "xlsx";

import ComplaintProcessingModal from "../../components/ComplaintAdmin/ComplaintProcessingModal";
import AdminPageLayout from "../../components/AdminPageLayout";
import ButtonAction from "../../../../components/ButtonAction";

dayjs.extend(isBetween);
const { RangePicker } = DatePicker;
const { Option } = Select;

// --- 1. HÀM LOẠI BỎ DẤU TIẾNG VIỆT (Tìm kiếm thông minh) ---
const removeAccents = (str) => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
};

// --- 2. HÀM LẤY TÊN NGƯỜI DÙNG AN TOÀN (FIX LỖI HIỂN THỊ SAI) ---
const getSafeUserName = (item) => {
  // Ưu tiên 1: Trường phẳng trực tiếp
  if (item.created_by_name) return item.created_by_name;
  if (item.complainant_name) return item.complainant_name;
  
  // Ưu tiên 2: Đối tượng lồng nhau (created_by object)
  if (item.created_by && typeof item.created_by === 'object') {
      return item.created_by.full_name || item.created_by.username || item.created_by.email;
  }
  
  // Ưu tiên 3: Đối tượng lồng nhau (user object)
  if (item.user && typeof item.user === 'object') {
      return item.user.full_name || item.user.username;
  }

  // Fallback
  return "Khách hàng (Ẩn)";
};

// --- 3. DANH SÁCH TRẠNG THÁI ---
const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả trạng thái', color: 'default' },
  { value: 'pending', label: 'Chờ Shop xử lý', color: 'orange' },
  { value: 'negotiating', label: 'Đang thương lượng', color: 'purple' },
  { value: 'waiting_return', label: 'Chờ gửi hàng về', color: 'cyan' },
  { value: 'returning', label: 'Đang trả hàng', color: 'geekblue' },
  { value: 'received', label: 'Shop đã nhận hàng', color: 'blue' },
  { value: 'admin_review', label: 'Sàn đang xử lý', color: 'volcano' },
  { value: 'resolved_refund', label: 'Đã hoàn tiền', color: 'green' },
  { value: 'resolved_reject', label: 'Đã từ chối', color: 'red' },
  { value: 'cancelled', label: 'Đã hủy', color: 'default' },
];

const StatusTag = ({ status }) => {
  const option = STATUS_OPTIONS.find(o => o.value === status);
  return <Tag color={option?.color || 'default'}>{option?.label || status}</Tag>;
};

const UserReports = () => {
  const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 480px)").matches;
  const API_URL = process.env.REACT_APP_API_URL;

  // --- STATE ---
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter States
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [dateRange, setDateRange] = useState(null);

  // Action States
  const [selectedDeleteKeys, setSelectedDeleteKeys] = useState([]);
  const [selectedResolveKeys, setSelectedResolveKeys] = useState([]);
  const [processingModalVisible, setProcessingModalVisible] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // --- 4. FETCH DATA & MAP DỮ LIỆU ---
  const refreshReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/complaints/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      let listData = Array.isArray(data) ? data : data.results || [];

      // [QUAN TRỌNG] Map dữ liệu qua hàm an toàn
      listData = listData.map((item) => ({
        ...item,
        key: item.id, // Antd yêu cầu key duy nhất
        
        // Xử lý tên người dùng kỹ càng
        display_name: getSafeUserName(item), 
        
        // Xử lý tên sản phẩm
        display_product: item.product_name || (item.product && item.product.name) || "Sản phẩm ẩn",
        
        // Xử lý tên Shop
        display_seller: item.seller_name || (item.seller && item.seller.store_name) || "Shop ẩn",
      }));

      // Sắp xếp mới nhất
      listData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setReports(listData);
    } catch (err) {
      console.error(err);
      message.error("Không tải được dữ liệu!");
    }
    setLoading(false);
    setSelectedDeleteKeys([]);
    setSelectedResolveKeys([]);
  };

  useEffect(() => {
    refreshReports();
  }, []);

  // --- 5. LOGIC LỌC THỜI GIAN ---
  const handleTimeChange = (val) => {
    setTimeFilter(val);
    const today = dayjs();
    switch (val) {
      case "all": setDateRange(null); break;
      case "today": setDateRange([today.startOf('day'), today.endOf('day')]); break;
      case "7d": setDateRange([today.subtract(6, "day").startOf('day'), today.endOf('day')]); break;
      case "30d": setDateRange([today.subtract(29, "day").startOf('day'), today.endOf('day')]); break;
      default: break;
    }
  };

  const handleRangePickerChange = (dates) => {
    if (dates) {
      setDateRange([dates[0].startOf('day'), dates[1].endOf('day')]);
      setTimeFilter("custom");
    } else {
      setDateRange(null);
      setTimeFilter("all");
    }
  };

  // --- 6. LOGIC LỌC TỔNG HỢP (FIXED) ---
  const filteredReports = useMemo(() => {
    return reports.filter((item) => {
      // A. Lọc Trạng thái (Chính xác tuyệt đối)
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }

      // B. Lọc Ngày (Nếu có chọn)
      if (dateRange && dateRange[0] && dateRange[1]) {
        const itemDate = dayjs(item.created_at);
        if (!itemDate.isValid()) return false;
        // So sánh bao gồm cả đầu và cuối ngày
        if (!itemDate.isBetween(dateRange[0], dateRange[1], null, '[]')) {
          return false;
        }
      }

      // C. Tìm kiếm (ID, Tên Khách, Tên SP) - Thông minh
      if (searchText) {
        const keyword = removeAccents(searchText.trim());
        
        const idMatch = String(item.id).toLowerCase().includes(keyword);
        const nameMatch = removeAccents(item.display_name).includes(keyword);
        const productMatch = removeAccents(item.display_product).includes(keyword);

        // Nếu không khớp trường nào -> Loại
        if (!idMatch && !nameMatch && !productMatch) {
          return false;
        }
      }

      return true; // Giữ lại nếu qua hết các bộ lọc
    });
  }, [reports, searchText, statusFilter, dateRange]);

  // --- 7. EXPORT EXCEL ---
  const handleExportExcel = () => {
    if (filteredReports.length === 0) {
      message.warning("Không có dữ liệu để xuất");
      return;
    }
    const exportData = filteredReports.map(item => ({
      "Mã": item.id,
      "Khách hàng": item.display_name,
      "Sản phẩm": item.display_product,
      "Shop bán": item.display_seller,
      "Giá trị": Number((item.purchase_price||0) * (item.purchase_quantity||1)).toLocaleString('vi-VN'),
      "Lý do": item.reason,
      "Trạng thái": STATUS_OPTIONS.find(o => o.value === item.status)?.label || item.status,
      "Ngày tạo": dayjs(item.created_at).format("DD/MM/YYYY HH:mm"),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "KhieuNai");
    XLSX.writeFile(wb, `DS_KhieuNai_${dayjs().format("DDMMYYYY")}.xlsx`);
    message.success("Xuất Excel thành công!");
  };

  // --- ACTIONS ---
  const handleOpenProcess = (record) => {
    setSelectedComplaint(record);
    setProcessingModalVisible(true);
  };

  const handleDeleteBatch = async () => {
    // ... (Giữ nguyên logic xóa)
    const safeDeleteKeys = selectedDeleteKeys.filter((id) => {
      const item = reports.find((r) => r.id === id);
      return item && item.status !== "pending";
    });
    if (!safeDeleteKeys.length) return message.warning("Chỉ xóa đơn đã xong/hủy.");
    
    setLoading(true);
    const token = localStorage.getItem("token");
    for (const id of safeDeleteKeys) {
        try {
            await fetch(`${API_URL}/complaints/${id}/`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
        } catch {}
    }
    setLoading(false);
    message.success("Đã xóa.");
    refreshReports();
  };

  const handleResolveBatch = async () => {
    // ... (Giữ nguyên logic duyệt)
    if (!selectedResolveKeys.length) return;
    setLoading(true);
    const token = localStorage.getItem("token");
    for (const id of selectedResolveKeys) {
        try {
            await fetch(`${API_URL}/complaints/${id}/`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status: "resolved" }),
            });
        } catch {}
    }
    setLoading(false);
    message.success("Đã duyệt nhanh.");
    refreshReports();
  };

  const rowSelection = {
    selectedRowKeys: [...selectedDeleteKeys, ...selectedResolveKeys],
    onChange: (keys, rows) => {
      setSelectedDeleteKeys(rows.filter(r => r.status !== 'pending').map(r => r.id));
      setSelectedResolveKeys(rows.filter(r => r.status === 'pending').map(r => r.id));
    },
  };

  // --- COLUMNS ---
  const columns = [
    {
      title: "Mã", dataIndex: "id", key: "id", width: 70, align: "center",
      render: (id) => <span style={{color: '#888'}}>#{id}</span>,
    },
    {
      title: "Người dùng", dataIndex: "display_name", ellipsis: true, width: 180,
      render: (text) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#87d068' }} />
          <span style={{ fontWeight: 500 }}>{text}</span>
        </Space>
      ),
    },
    {
      title: "Sản phẩm", dataIndex: "display_product", ellipsis: true,
      render: (name) => <Tooltip title={name}><span>{name}</span></Tooltip>,
    },
    {
      title: "Giá trị", key: "value", width: 140,
      render: (_, r) => {
         const val = Number((r.purchase_price||0) * (r.purchase_quantity||1));
         return <span>{val.toLocaleString('vi-VN')} đ</span>;
      },
    },
    {
      title: "Ngày tạo", dataIndex: "created_at", width: 150,
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      render: (t) => t ? dayjs(t).format("DD/MM/YYYY HH:mm") : "",
    },
    {
      title: "Trạng thái", dataIndex: "status", width: 160, align: "center",
      render: (status) => <StatusTag status={status} />,
    },
    {
      title: "Thao tác", key: "action", width: 100, align: "center",
      render: (_, record) => (
        <Tooltip title="Xem chi tiết">
          <Button 
            type="text" 
            icon={<EyeOutlined />} 
            style={{ color: '#1890ff' }}
            onClick={() => handleOpenProcess(record)} 
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <AdminPageLayout title="QUẢN LÝ TRẢ HÀNG">
      {/* --- FILTER BAR --- */}
      <Card bordered={false} bodyStyle={{ padding: "16px 24px" }} style={{ marginBottom: 24, borderRadius: 8 }}>
        <Row gutter={[16, 16]} justify="space-between" align="middle">
          {/* Cụm Lọc */}
          <Col xs={24} xl={20}>
            <Space wrap size={12}>
              {/* 1. Tìm kiếm */}
              <Input 
                placeholder="Tìm Tên, ID, Sản phẩm..." 
                prefix={<SearchOutlined style={{color: '#bfbfbf'}}/>}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{ width: 220 }}
                allowClear
              />
              
              {/* 2. Lọc Trạng Thái */}
              <Select 
                value={statusFilter} 
                onChange={setStatusFilter} 
                style={{ width: 180 }}
                suffixIcon={<FilterOutlined />}
              >
                {STATUS_OPTIONS.map(opt => (
                  <Option key={opt.value} value={opt.value}>
                    <Space>
                      {opt.value !== 'all' && <Tag color={opt.color} style={{marginRight:0, width: 10, height: 10, borderRadius:'50%', padding:0}} />} 
                      {opt.label}
                    </Space>
                  </Option>
                ))}
              </Select>

              {/* 3. Lọc Thời Gian */}
              <Space.Compact>
                <Select 
                  value={timeFilter} 
                  onChange={handleTimeChange} 
                  style={{ width: 130 }}
                >
                  <Option value="all">Toàn bộ</Option>
                  <Option value="today">Hôm nay</Option>
                  <Option value="7d">7 ngày qua</Option>
                  <Option value="30d">30 ngày qua</Option>
                  <Option value="custom">Tùy chọn</Option>
                </Select>
                <RangePicker 
                  value={dateRange} 
                  onChange={handleRangePickerChange} 
                  format="DD/MM/YYYY" 
                  placeholder={['Từ ngày', 'Đến ngày']} 
                  style={{ width: 240 }} 
                />
              </Space.Compact>
            </Space>
          </Col>

          {/* Cụm Hành Động */}
          <Col xs={24} xl={4} style={{ textAlign: 'right' }}>
            <Space>
              <Tooltip title="Làm mới dữ liệu">
                <Button 
                    icon={<ReloadOutlined />} 
                    onClick={() => {
                        setSearchText("");
                        setStatusFilter("all");
                        handleTimeChange("all");
                        refreshReports();
                        message.success("Đã làm mới");
                    }} 
                    loading={loading}
                />
              </Tooltip>
              <Button 
                icon={<DownloadOutlined />} 
                onClick={handleExportExcel}
              >
                Xuất Excel
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* --- TABLE --- */}
      <Card bordered={false} bodyStyle={{ padding: 0 }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredReports} // Sử dụng dữ liệu đã map và lọc
          loading={loading}
          rowSelection={rowSelection}
          pagination={{ 
            total: filteredReports.length,
            pageSize: 10, 
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} yêu cầu` 
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* --- MODAL --- */}
      <ComplaintProcessingModal
        visible={processingModalVisible}
        complaint={selectedComplaint}
        onClose={() => setProcessingModalVisible(false)}
        onRefresh={refreshReports}
      />
    </AdminPageLayout>
  );
};

export default UserReports;