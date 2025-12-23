import React, { useState, useEffect } from "react";
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
} from "antd";
import {
  ReloadOutlined,
  SearchOutlined,
  EyeOutlined,
  MessageOutlined,
  DeleteOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import axios from "axios";
import AdminPageLayout from "../components/AdminPageLayout";
import ReviewDetailModal from "../components/ReviewAdmin/ReviewDetailModal";
import ReviewReplyModal from "../components/ReviewAdmin/ReviewReplyModal";
import ButtonAction from "../../../components/ButtonAction";
import StatusTag from "../../../components/StatusTag";

const { Option } = Select;
const { Text } = Typography;
const API_URL = process.env.REACT_APP_API_URL;

const ReviewsPage = () => {
  const isMobile =
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 480px)").matches;
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    rating: "all",
    status: "all",
  });
  const [detailModal, setDetailModal] = useState({
    visible: false,
    data: null,
  });
  const [replyModal, setReplyModal] = useState({ visible: false, data: null });

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.rating !== "all") params.append("rating", filters.rating);
      if (filters.status !== "all") params.append("status", filters.status);

      const res = await axios.get(
        `${API_URL}/reviews/admin/reviews/?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setReviews(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err) {
      message.error("Không thể tải danh sách đánh giá");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [filters]);

  const handleToggleVisibility = async (record) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${API_URL}/reviews/admin/reviews/${record.id}/toggle_visibility/`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      message.success("Đã cập nhật trạng thái hiển thị");
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
            <Text type="secondary" style={{ fontSize: 12 }}>
              {new Date(record.created_at).toLocaleDateString("vi-VN")}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Sản phẩm & Đánh giá",
      key: "product_rating",
      width: isMobile ? 260 : 300,
      sorter: (a, b) => a.rating - b.rating,
      render: (_, record) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <Text strong style={{ fontSize: 13 }}>
            {record.product_name}
          </Text>
          <Space size={4}>
            <span style={{ color: "#faad14" }}>★</span>
            <Text strong>{record.rating}/5</Text>
          </Space>
          <Text ellipsis type="secondary">
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
      sorter: (a, b) => {
        const statusA = a.is_hidden ? 2 : a.replies?.length ? 1 : 0;
        const statusB = b.is_hidden ? 2 : b.replies?.length ? 1 : 0;
        return statusA - statusB;
      },
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
              tooltip: "Ẩn/Hiện",
              icon: record.is_hidden ? (
                <ReloadOutlined />
              ) : (
                <EyeInvisibleOutlined />
              ),
              confirm: { title: "Thay đổi hiển thị?" },
              onClick: () => handleToggleVisibility(record),
            },
            {
              actionType: "delete",
              tooltip: "Xóa",
              icon: <DeleteOutlined />,
              confirm: { title: "Xóa vĩnh viễn?" },
              onClick: () => {},
            },
          ]}
          record={record}
        />
      ),
    },
  ];

  return (
    <AdminPageLayout title="QUẢN LÝ ĐÁNH GIÁ">
      <Card bordered={false} className="mb-4">
        <Row gutter={[12, 12]} justify="space-between">
          <Col md={16} xs={24}>
            <Space wrap>
              <Input
                placeholder="Tìm kiếm..."
                style={{ width: 220 }}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                allowClear
              />
              <Select
                defaultValue="all"
                style={{ width: 130 }}
                onChange={(val) =>
                  setFilters((prev) => ({ ...prev, rating: val }))
                }
              >
                <Option value="all">⭐ Tất cả</Option>
                {[5, 4, 3, 2, 1].map((s) => (
                  <Option key={s} value={s.toString()}>
                    {s} sao
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>
          <Col md={8} style={{ textAlign: "right" }}>
            <Button icon={<ReloadOutlined />} onClick={fetchReviews}>
              Làm mới
            </Button>
          </Col>
        </Row>
      </Card>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={reviews}
        loading={loading}
        scroll={{ x: 900 }}
      />
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
