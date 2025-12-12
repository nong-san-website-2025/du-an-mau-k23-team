// src/features/admin/pages/ReviewsPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Table, message, Button, Input, Select, Space, Card, Typography, Row, Col, Tooltip, Avatar } from "antd";
import { ReloadOutlined, SearchOutlined, EyeOutlined, MessageOutlined, DeleteOutlined, EyeInvisibleOutlined } from "@ant-design/icons";
import axios from "axios";
import AdminPageLayout from "../components/AdminPageLayout";
import ReviewDetailModal from "../components/ReviewAdmin/ReviewDetailModal";
import ReviewReplyModal from "../components/ReviewAdmin/ReviewReplyModal";
import ButtonAction from "../../../components/ButtonAction"; // Component tái sử dụng
import StatusTag from "../../../components/StatusTag";       // Component tái sử dụng

const { Option } = Select;
const { Title, Text } = Typography;

const API_URL = process.env.REACT_APP_API_URL;

const ReviewsPage = () => {
  // --- State ---
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  
  // Filter State
  const [filters, setFilters] = useState({
    search: "",
    rating: "all",
    status: "all",
  });

  // Modal State
  const [detailModal, setDetailModal] = useState({ visible: false, data: null });
  const [replyModal, setReplyModal] = useState({ visible: false, data: null });

  // --- API Actions ---
  const fetchReviews = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.rating !== "all") params.append("rating", filters.rating);
      if (filters.status !== "all") params.append("status", filters.status);

      const res = await axios.get(`${API_URL}/reviews/admin/reviews/?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setReviews(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err) {
      console.error("Lỗi tải đánh giá:", err);
      message.error("Không thể tải danh sách đánh giá");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [filters]); // Auto fetch khi filter thay đổi (debounce nếu cần thiết với search)

  const handleReply = async (reviewId, replyText) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_URL}/reviews/admin/reviews/${reviewId}/reply/`, 
        { reply_text: replyText }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success("Đã gửi trả lời thành công");
      fetchReviews();
    } catch (err) {
      message.error("Lỗi khi trả lời đánh giá");
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/reviews/admin/reviews/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success("Xóa đánh giá thành công");
      fetchReviews();
    } catch (err) {
      message.error("Không thể xóa đánh giá");
    }
  };

  const handleToggleVisibility = async (record) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.patch(`${API_URL}/reviews/admin/reviews/${record.id}/toggle_visibility/`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const isHidden = response.data.is_hidden;
      message.success(isHidden ? "Đã ẩn đánh giá" : "Đã hiển thị đánh giá");
      fetchReviews();
    } catch (err) {
      message.error("Lỗi thay đổi trạng thái");
    }
  };

  // --- Helper để map status sang StatusTag ---
  const getStatusForTag = (record) => {
    if (record.is_hidden) return { status: "locked", label: "Đã ẩn" };
    if (record.replies && record.replies.length > 0) return { status: "approved", label: "Đã trả lời" };
    return { status: "pending", label: "Chưa trả lời" };
  };

  // --- Table Configuration ---
  const columns = [
    {
      title: "Khách hàng",
      dataIndex: "user_name",
      key: "user_name",
      width: 200,
      render: (name, record) => (
        <Space>
          <Avatar src={record.user_avatar} style={{ backgroundColor: '#1890ff' }}>
            {name?.charAt(0)?.toUpperCase()}
          </Avatar>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Text strong>{name}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>{new Date(record.created_at).toLocaleDateString('vi-VN')}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Sản phẩm & Đánh giá",
      key: "product_rating",
      width: 300,
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Text strong style={{ fontSize: 13 }}>{record.product_name}</Text>
          <Space size={4}>
             <span style={{ color: '#faad14' }}>★</span> 
             <Text strong>{record.rating}/5</Text>
             <Text type="secondary" style={{fontSize: 12}}>| {record.seller_store_name}</Text>
          </Space>
          <Tooltip title={record.comment}>
            <Text ellipsis style={{ width: 280, color: '#595959' }}>
               <MessageOutlined style={{ marginRight: 5 }} /> 
               {record.comment || "Không có lời bình"}
            </Text>
          </Tooltip>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 150,
      align: "center",
      render: (_, record) => {
        const { status, label } = getStatusForTag(record);
        return <StatusTag status={status} label={label} />;
      },
    },
    {
      title: "Hành động",
      key: "action",
      width: 150,
      align: "right",
      render: (_, record) => {
        // Cấu hình Action Button bằng ButtonAction component
        const actions = [
          {
            actionType: "view",
            tooltip: "Xem chi tiết",
            icon: <EyeOutlined />,
            onClick: () => setDetailModal({ visible: true, data: record }),
          },
          {
            actionType: "edit", // Dùng màu edit (Cyan) cho reply
            tooltip: "Trả lời",
            icon: <MessageOutlined />,
            show: !record.is_hidden, // Không trả lời nếu đang ẩn
            onClick: () => setReplyModal({ visible: true, data: record }),
          },
          {
            actionType: record.is_hidden ? "unlock" : "lock",
            tooltip: record.is_hidden ? "Hiển thị lại" : "Ẩn đánh giá",
            icon: record.is_hidden ? <ReloadOutlined /> : <EyeInvisibleOutlined />,
            confirm: {
              title: record.is_hidden ? "Hiển thị đánh giá này?" : "Ẩn đánh giá này?",
              description: record.is_hidden ? "Đánh giá sẽ xuất hiện công khai." : "Người dùng khác sẽ không thấy đánh giá này.",
            },
            onClick: () => handleToggleVisibility(record),
          },
          {
            actionType: "delete",
            tooltip: "Xóa vĩnh viễn",
            icon: <DeleteOutlined />,
            confirm: {
              title: "Xóa đánh giá này?",
              description: "Hành động này không thể hoàn tác.",
              okText: "Xóa ngay",
            },
            onClick: () => handleDelete(record.id),
          },
        ];
        return <ButtonAction actions={actions} record={record} />;
      },
    },
  ];

  return (
    <AdminPageLayout title="QUẢN LÝ ĐÁNH GIÁ">
      <Card bordered={false} className="mb-4" style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col xs={24} md={16}>
             <Space wrap>
                <Input 
                  placeholder="Tìm tên khách, sản phẩm..." 
                  prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />} 
                  style={{ width: 250 }}
                  allowClear
                  onChange={(e) => setFilters(prev => ({...prev, search: e.target.value}))}
                />
                <Select 
                  defaultValue="all" 
                  style={{ width: 140 }} 
                  onChange={(val) => setFilters(prev => ({...prev, rating: val}))}
                >
                  <Option value="all">⭐ Tất cả sao</Option>
                  <Option value="5">5 sao</Option>
                  <Option value="4">4 sao</Option>
                  <Option value="3">3 sao (TB)</Option>
                  <Option value="2">2 sao (Tệ)</Option>
                  <Option value="1">1 sao (Rất tệ)</Option>
                </Select>
                <Select 
                  defaultValue="all" 
                  style={{ width: 160 }}
                  onChange={(val) => setFilters(prev => ({...prev, status: val}))}
                >
                  <Option value="all">Tất cả trạng thái</Option>
                  <Option value="replied">Đã trả lời</Option>
                  <Option value="unreplied">Chưa trả lời</Option>
                  <Option value="hidden">Đã ẩn</Option>
                </Select>
             </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
             <Space>
                {selectedRowKeys.length > 0 && (
                   <Button danger icon={<DeleteOutlined />}>Xóa ({selectedRowKeys.length})</Button>
                )}
                <Button icon={<ReloadOutlined />} onClick={fetchReviews} loading={loading}>Làm mới</Button>
             </Space>
          </Col>
        </Row>
      </Card>

      <Card bordered={false} style={{ borderRadius: 8 }} bodyStyle={{ padding: 0 }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={reviews}
          loading={loading}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} đánh giá`,
          }}
        />
      </Card>

      {/* Modals */}
      <ReviewDetailModal
        visible={detailModal.visible}
        review={detailModal.data}
        onClose={() => setDetailModal({ visible: false, data: null })}
      />
      
      <ReviewReplyModal
        visible={replyModal.visible}
        review={replyModal.data}
        onClose={() => setReplyModal({ visible: false, data: null })}
        onReply={handleReply}
      />
    </AdminPageLayout>
  );
};

export default ReviewsPage;