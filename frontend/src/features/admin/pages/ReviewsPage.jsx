// src/features/admin/pages/ReviewsPage.jsx
import React, { useState, useEffect } from "react";
import { Table, message, Button, Input, Select, Space, Tag, Rate, Avatar, Tooltip } from "antd";
import { ReloadOutlined, SearchOutlined, FilterOutlined, MessageOutlined, EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import axios from "axios";
import AdminPageLayout from "../components/AdminPageLayout";
import ReviewDetailModal from "../components/ReviewAdmin/ReviewDetailModal";
import ReviewReplyModal from "../components/ReviewAdmin/ReviewReplyModal";
import ReviewToolbar from "../components/ReviewAdmin/ReviewToolbar";

const { Option } = Select;
const { Search } = Input;

const API_URL = process.env.REACT_APP_API_URL;

const ReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailReview, setDetailReview] = useState(null);

  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [replyReview, setReplyReview] = useState(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();

      if (searchTerm) params.append("search", searchTerm);
      if (ratingFilter !== "all") params.append("rating", ratingFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await axios.get(`${API_URL}/reviews/admin/reviews/?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setReviews(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err) {
      console.error("Lỗi tải đánh giá:", err);
      message.error("Không thể tải danh sách đánh giá");
      setReviews([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, [searchTerm, ratingFilter, statusFilter]);

  const handleReply = async (reviewId, replyText) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_URL}/reviews/admin/reviews/${reviewId}/reply/`, {
        reply_text: replyText
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success("Trả lời đánh giá thành công");
      fetchReviews();
    } catch (err) {
      console.error("Lỗi trả lời:", err);
      message.error("Không thể trả lời đánh giá");
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/reviews/admin/reviews/${reviewId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success("Xóa đánh giá thành công");
      fetchReviews();
    } catch (err) {
      console.error("Lỗi xóa đánh giá:", err);
      message.error("Không thể xóa đánh giá");
    }
  };

  const columns = [
    {
      title: "Người dùng",
      dataIndex: "user_name",
      key: "user_name",
      render: (userName, record) => (
        <Space>
          <Avatar size="small">{userName?.charAt(0)?.toUpperCase()}</Avatar>
          <span>{userName}</span>
        </Space>
      ),
    },
    {
      title: "Sản phẩm",
      key: "product",
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.product_name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Cửa hàng: {record.seller_store_name}
          </div>
        </div>
      ),
    },
    {
      title: "Đánh giá",
      dataIndex: "rating",
      key: "rating",
      render: (rating) => <Rate disabled value={rating} style={{ fontSize: '14px' }} />,
    },
    {
      title: "Nội dung",
      dataIndex: "comment",
      key: "comment",
      render: (comment) => (
        <div style={{
          maxWidth: '300px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {comment}
        </div>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (_, record) => {
        const hasReplies = record.replies && record.replies.length > 0;
        return (
          <Space>
            <Tag color={hasReplies ? "green" : "orange"}>
              {hasReplies ? "Đã trả lời" : "Chưa trả lời"}
            </Tag>
            {record.is_hidden && <Tag color="red">Ẩn</Tag>}
          </Space>
        );
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => new Date(date).toLocaleString('vi-VN'),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <ReviewToolbar
          record={record}
          onViewDetail={() => {
            setDetailReview(record);
            setDetailModalVisible(true);
          }}
          onReply={() => {
            setReplyReview(record);
            setReplyModalVisible(true);
          }}
          onDelete={() => handleDeleteReview(record.id)}
          onToggleVisibility={async () => {
            try {
              const token = localStorage.getItem("token");
              const response = await axios.patch(`${API_URL}/reviews/admin/reviews/${record.id}/toggle_visibility/`, {}, {
                headers: { Authorization: `Bearer ${token}` },
              });
              const newHiddenState = response.data.is_hidden;
              message.success(newHiddenState ? "Đã ẩn đánh giá" : "Đã hiển thị đánh giá");
              fetchReviews();
            } catch (err) {
              message.error("Không thể thay đổi trạng thái");
            }
          }}
        />
      ),
    },
  ];

  const extra = (
    <Space>
      <Button
        icon={<ReloadOutlined />}
        onClick={fetchReviews}
        loading={loading}
      >
        Tải lại
      </Button>
    </Space>
  );

  return (
    <AdminPageLayout title="QUẢN LÝ ĐÁNH GIÁ" extra={extra}>
      {/* Bộ lọc và tìm kiếm */}
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Space>
          <Search
            placeholder="Tìm kiếm theo người dùng, sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />

          <Select
            value={ratingFilter}
            onChange={setRatingFilter}
            style={{ width: 120 }}
            suffixIcon={<FilterOutlined />}
          >
            <Option value="all">Tất cả sao</Option>
            <Option value="5">5 sao</Option>
            <Option value="4">4 sao</Option>
            <Option value="3">3 sao</Option>
            <Option value="2">2 sao</Option>
            <Option value="1">1 sao</Option>
          </Select>

          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 140 }}
            suffixIcon={<FilterOutlined />}
          >
            <Option value="all">Tất cả trạng thái</Option>
            <Option value="replied">Đã trả lời</Option>
            <Option value="unreplied">Chưa trả lời</Option>
            <Option value="hidden">Đã ẩn</Option>
          </Select>
        </Space>
      </Space>

      {/* Bảng danh sách đánh giá */}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={reviews}
        loading={loading}
        bordered
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys
        }}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} đánh giá`,
        }}
      />

      {/* Modal chi tiết đánh giá */}
      <ReviewDetailModal
        visible={detailModalVisible}
        review={detailReview}
        onClose={() => setDetailModalVisible(false)}
      />

      {/* Modal trả lời đánh giá */}
      <ReviewReplyModal
        visible={replyModalVisible}
        review={replyReview}
        onClose={() => setReplyModalVisible(false)}
        onReply={handleReply}
      />
    </AdminPageLayout>
  );
};

export default ReviewsPage;