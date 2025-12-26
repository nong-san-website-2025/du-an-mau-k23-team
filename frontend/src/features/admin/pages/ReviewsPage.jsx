// src/features/admin/pages/Review/ReviewsPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  message,
  Button,
  Input,
  Select,
  Space,
  Card,
  Typography,
  Row,
  Col,
  Tooltip,
  Avatar,
  DatePicker,
  Tag, // Từ TriThuc
  Popconfirm // Từ HEAD
} from "antd";
import {
  ReloadOutlined,
  SearchOutlined,
  EyeOutlined,
  MessageOutlined,
  DeleteOutlined,
  EyeInvisibleOutlined,
  DownloadOutlined, // Từ HEAD
  PictureOutlined, // Từ TriThuc
  FilterOutlined
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import * as XLSX from "xlsx";

import AdminPageLayout from "../components/AdminPageLayout";
import ReviewDetailModal from "../components/ReviewAdmin/ReviewDetailModal";
import ReviewReplyModal from "../components/ReviewAdmin/ReviewReplyModal";
import ButtonAction from "../../../components/ButtonAction";
import StatusTag from "../../../components/StatusTag";

dayjs.extend(isBetween);
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text } = Typography;
const API_URL = process.env.REACT_APP_API_URL;

// --- HÀM LOẠI BỎ DẤU TIẾNG VIỆT ---
const removeAccents = (str) => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
};

const ReviewsPage = () => {
  const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 480px)").matches;
  
  // --- STATE ---
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter States
  const [searchText, setSearchText] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [dateRange, setDateRange] = useState(null);

  // Modal States
  const [detailModal, setDetailModal] = useState({ visible: false, data: null });
  const [replyModal, setReplyModal] = useState({ visible: false, data: null });

  // --- FETCH DATA ---
  const fetchReviews = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      // Gọi API lấy toàn bộ danh sách
      const res = await axios.get(`${API_URL}/reviews/admin/reviews/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      
      // Map dữ liệu để đảm bảo an toàn
      const mappedData = data.map(item => ({
        ...item,
        user_name: item.user_name || "Khách ẩn danh",
        product_name: item.product_name || "Sản phẩm ẩn",
        comment: item.comment || "",
        // Đảm bảo mảng ảnh tồn tại để check hiển thị Tag
        images: item.images || [],
        review_images: item.review_images || []
      }));

      // Sắp xếp mới nhất (Logic từ HEAD - chuẩn Admin)
      mappedData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setReviews(mappedData);
    } catch (err) {
      console.error(err);
      message.error("Không thể tải danh sách đánh giá");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // --- LOGIC LỌC THỜI GIAN ---
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

  // --- LOGIC LỌC TỔNG HỢP ---
  const filteredReviews = useMemo(() => {
    return reviews.filter((item) => {
      // 1. Lọc Rating
      if (ratingFilter !== 'all' && String(item.rating) !== ratingFilter) return false;

      // 2. Lọc Trạng thái (Ẩn / Đã trả lời / Chưa trả lời)
      if (statusFilter !== 'all') {
        if (statusFilter === 'hidden' && !item.is_hidden) return false;
        if (statusFilter === 'replied' && (!item.replies || item.replies.length === 0)) return false;
        if (statusFilter === 'pending' && item.replies && item.replies.length > 0) return false;
      }

      // 3. Lọc Ngày
      if (dateRange && dateRange[0] && dateRange[1]) {
        const itemDate = dayjs(item.created_at);
        if (!itemDate.isValid()) return false;
        if (!itemDate.isBetween(dateRange[0], dateRange[1], null, '[]')) return false;
      }

      // 4. Tìm kiếm (Tên Khách, Tên SP, Nội dung)
      if (searchText) {
        const keyword = removeAccents(searchText.trim());
        const nameMatch = removeAccents(item.user_name).includes(keyword);
        const productMatch = removeAccents(item.product_name).includes(keyword);
        const commentMatch = removeAccents(item.comment).includes(keyword);

        if (!nameMatch && !productMatch && !commentMatch) return false;
      }

      return true;
    });
  }, [reviews, searchText, ratingFilter, statusFilter, dateRange]);

  // --- EXPORT EXCEL ---
  const handleExportExcel = () => {
    if (filteredReviews.length === 0) {
      message.warning("Không có dữ liệu để xuất");
      return;
    }
    const exportData = filteredReviews.map(item => ({
      "Khách hàng": item.user_name,
      "Sản phẩm": item.product_name,
      "Đánh giá": `${item.rating} sao`,
      "Nội dung": item.comment,
      "Trạng thái": item.is_hidden ? "Đã ẩn" : (item.replies?.length ? "Đã trả lời" : "Chưa trả lời"),
      "Ngày tạo": dayjs(item.created_at).format("DD/MM/YYYY HH:mm"),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DanhGia");
    XLSX.writeFile(wb, `DS_DanhGia_${dayjs().format("DDMMYYYY")}.xlsx`);
    message.success("Xuất Excel thành công!");
  };

  // --- ACTIONS ---
  const handleToggleVisibility = async (record) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${API_URL}/reviews/admin/reviews/${record.id}/toggle_visibility/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success("Đã cập nhật trạng thái");
      fetchReviews();
    } catch (err) {
      message.error("Lỗi thay đổi trạng thái");
    }
  };

  const getStatusForTag = (record) => {
    if (record.is_hidden) return { status: "locked", label: "Đã ẩn" };
    if (record.replies && record.replies.length > 0)
      return { status: "approved", label: "Đã trả lời" };
    return { status: "pending", label: "Chưa trả lời" };
  };

  const columns = [
    {
      title: "Khách hàng",
      dataIndex: "user_name",
      key: "user_name",
      width: isMobile ? 160 : 200,
      sorter: (a, b) => a.user_name.localeCompare(b.user_name),
      render: (name, record) => (
        <Space>
          <Avatar src={record.user_avatar}>{name?.charAt(0)}</Avatar>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <Text strong>{name}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Sản phẩm & Đánh giá",
      key: "product_rating",
      width: isMobile ? 260 : 300,
      render: (_, record) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <Text strong style={{ fontSize: 13 }}>{record.product_name}</Text>
          <Space size={4}>
            <span style={{ color: "#faad14" }}>★</span>
            <Text strong>{record.rating}/5</Text>
            {/* Logic hiển thị Tag từ TriThuc */}
            {(record.images?.length > 0 || record.review_images?.length > 0) && (
              <Tag icon={<PictureOutlined />} color="processing" style={{ marginLeft: 8 }}>
                Có ảnh
              </Tag>
            )}
          </Space>
          <Text ellipsis type="secondary" style={{maxWidth: 250}}>
            <MessageOutlined /> {record.comment || "Không lời bình"}
          </Text>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 120,
      align: "center",
      render: (_, record) => {
        const { status, label } = getStatusForTag(record);
        return <StatusTag status={status} label={label} />;
      },
    },
    // Cột Ngày đánh giá từ HEAD
    {
      title: "Ngày đánh giá",
      dataIndex: "created_at",
      key: "created_at",
      width: 140,
      align: "center",
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      render: (date) => dayjs(date).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Hành động",
      key: "action",
      width: 140,
      align: "right",
      render: (_, record) => (
        <ButtonAction
          actions={[
            {
              actionType: "view",
              tooltip: "Xem",
              icon: <EyeOutlined />,
              onClick: () => setDetailModal({ visible: true, data: record }),
            },
            {
              actionType: "edit",
              tooltip: "Trả lời",
              icon: <MessageOutlined />,
              show: !record.is_hidden,
              onClick: () => setReplyModal({ visible: true, data: record }),
            },
            {
              actionType: record.is_hidden ? "unlock" : "lock",
              tooltip: record.is_hidden ? "Hiện lại" : "Ẩn đi",
              icon: record.is_hidden ? <ReloadOutlined /> : <EyeInvisibleOutlined />,
              confirm: { title: "Thay đổi hiển thị?" },
              onClick: () => handleToggleVisibility(record),
            },
          ]}
          record={record}
        />
      ),
    },
  ];

  return (
    <AdminPageLayout title="QUẢN LÝ ĐÁNH GIÁ">
      {/* --- THANH CÔNG CỤ --- */}
      <Card bordered={false} bodyStyle={{ padding: "16px 24px" }} style={{ marginBottom: 24, borderRadius: 8 }}>
        <Row gutter={[16, 16]} justify="space-between" align="middle">
          {/* Cụm Bộ Lọc Trái */}
          <Col xs={24} xl={20}>
            <Space wrap size={12}>
              {/* 1. Tìm kiếm */}
              <Input
                placeholder="Tìm Khách, SP, Nội dung..."
                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 220 }}
                allowClear
              />

              {/* 2. Lọc Sao */}
              <Select
                value={ratingFilter}
                onChange={setRatingFilter}
                style={{ width: 110 }}
              >
                <Option value="all">⭐ Tất cả</Option>
                {[5, 4, 3, 2, 1].map((s) => (
                  <Option key={s} value={s.toString()}>{s} sao</Option>
                ))}
              </Select>

              {/* 3. Lọc Trạng Thái */}
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 140 }}
                placeholder="Trạng thái"
              >
                <Option value="all">Tất cả TT</Option>
                <Option value="replied">Đã trả lời</Option>
                <Option value="pending">Chưa trả lời</Option>
                <Option value="hidden">Đã ẩn</Option>
              </Select>

              {/* 4. Lọc Thời Gian */}
              <Space.Compact>
                <Select
                  value={timeFilter}
                  onChange={handleTimeChange}
                  style={{ width: 120 }}
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

          {/* Cụm Nút Phải */}
          <Col xs={24} xl={4} style={{ textAlign: "right" }}>
            <Space>
              <Tooltip title="Làm mới dữ liệu">
                <Button 
                    icon={<ReloadOutlined />} 
                    onClick={() => {
                        setSearchText("");
                        setRatingFilter("all");
                        setStatusFilter("all");
                        handleTimeChange("all");
                        fetchReviews();
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

      {/* --- BẢNG DỮ LIỆU --- */}
      <Card bordered={false} bodyStyle={{ padding: 0 }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredReviews}
          loading={loading}
          pagination={{ 
            total: filteredReviews.length,
            pageSize: 10, 
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} đánh giá` 
          }}
          scroll={{ x: 1100 }}
        />
      </Card>

      {/* --- MODALS --- */}
      <ReviewDetailModal
        visible={detailModal.visible}
        review={detailModal.data}
        onClose={() => setDetailModal({ visible: false, data: null })}
      />
      <ReviewReplyModal
        visible={replyModal.visible}
        review={replyModal.data}
        onClose={() => setReplyModal({ visible: false, data: null })}
        onReply={fetchReviews}
      />
    </AdminPageLayout>
  );
};

export default ReviewsPage;