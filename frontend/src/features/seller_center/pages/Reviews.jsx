import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Select,
  Input,
  Button,
  Empty,
  Spin,
  message,
  Space,
  Pagination,
  Typography
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  MessageOutlined
} from "@ant-design/icons";
import ReviewCard from "../components/ReviewSeller/ReviewCard";
import ReviewStats from "../components/ReviewSeller/ReviewStats";
import ReviewReplyModal from "../components/ReviewSeller/ReviewReplyModal";
import ReviewDetailModal from "../components/ReviewSeller/ReviewDetailModal";
import reviewService from "../services/api/reviewService";

const { Title, Text } = Typography;
const { Option } = Select;

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    rating: 'all',
    status: 'all',
    search: '',
    product_id: null
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Modal states
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);

  // Load data
  const loadReviews = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        page: pagination.current,
        page_size: pagination.pageSize
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === 'all' || params[key] === null) {
          delete params[key];
        }
      });

      const response = await reviewService.getSellerReviews(params);
      setReviews(response.results || response);
      setPagination(prev => ({
        ...prev,
        total: response.count || response.length
      }));
    } catch (error) {
      console.error('Error loading reviews:', error);
      message.error('Không thể tải danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const summaryData = await reviewService.getSellerReviewsSummary();
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  };

  useEffect(() => {
    loadSummary();
    loadReviews();
  }, [filters, pagination.current, pagination.pageSize]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 })); // Reset to first page
  };

  // Handle reply
  const handleReply = async (reviewId, replyText) => {
    try {
      await reviewService.replyToReview(reviewId, replyText);
      message.success('Trả lời đánh giá thành công!');
      loadReviews(); // Reload reviews to show new reply
      loadSummary(); // Reload summary for updated stats
    } catch (error) {
      console.error('Error replying to review:', error);
      message.error('Không thể trả lời đánh giá');
      throw error;
    }
  };

  // Handle modal actions
  const handleViewDetail = (review) => {
    setSelectedReview(review);
    setDetailModalVisible(true);
  };

  const handleReplyClick = (review) => {
    setSelectedReview(review);
    setReplyModalVisible(true);
  };

  const handleRefresh = () => {
    loadReviews();
    loadSummary();
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ marginBottom: '8px' }}>
          Quản lý đánh giá
        </Title>
        <Text type="secondary">
          Xem và trả lời đánh giá từ khách hàng về sản phẩm của bạn
        </Text>
      </div>

      {/* Statistics */}
      <ReviewStats summary={summary} />

      {/* Filters and Actions */}
      <Card size="small" style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Tìm kiếm theo tên khách hàng hoặc sản phẩm"
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              allowClear
            />
          </Col>

          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="Đánh giá"
              style={{ width: '100%' }}
              value={filters.rating}
              onChange={(value) => handleFilterChange('rating', value)}
            >
              <Option value="all">Tất cả</Option>
              <Option value="5">5 sao</Option>
              <Option value="4">4 sao</Option>
              <Option value="3">3 sao</Option>
              <Option value="2">2 sao</Option>
              <Option value="1">1 sao</Option>
            </Select>
          </Col>

          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="Trạng thái"
              style={{ width: '100%' }}
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
            >
              <Option value="all">Tất cả</Option>
              <Option value="replied">Đã trả lời</Option>
              <Option value="unreplied">Chưa trả lời</Option>
              <Option value="hidden">Đã ẩn</Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={loading}
              >
                Làm mới
              </Button>
              <Button
                type="primary"
                icon={<MessageOutlined />}
                onClick={() => {
                  const unrepliedReviews = reviews.filter(r => !r.replies || r.replies.length === 0);
                  if (unrepliedReviews.length > 0) {
                    handleReplyClick(unrepliedReviews[0]);
                  } else {
                    message.info('Tất cả đánh giá đã được trả lời!');
                  }
                }}
                disabled={reviews.filter(r => !r.replies || r.replies.length === 0).length === 0}
              >
                Trả lời đầu tiên
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Reviews List */}
      <Spin spinning={loading}>
        {reviews.length > 0 ? (
          <>
            <div style={{ marginBottom: '16px' }}>
              <Text type="secondary">
                Hiển thị {reviews.length} đánh giá
                {pagination.total > reviews.length && ` / ${pagination.total} tổng cộng`}
              </Text>
            </div>

            <Space direction="vertical" style={{ width: '100%' }}>
              {reviews.map(review => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onReply={handleReplyClick}
                  onViewDetail={handleViewDetail}
                />
              ))}
            </Space>

            {/* Pagination */}
            {pagination.total > pagination.pageSize && (
              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <Pagination
                  current={pagination.current}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  onChange={(page, pageSize) => {
                    setPagination(prev => ({ ...prev, current: page, pageSize }));
                  }}
                  showSizeChanger
                  showQuickJumper
                  showTotal={(total, range) =>
                    `${range[0]}-${range[1]} của ${total} đánh giá`
                  }
                />
              </div>
            )}
          </>
        ) : (
          <Empty
            description={
              loading ? "Đang tải..." : "Không có đánh giá nào"
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Spin>

      {/* Modals */}
      <ReviewReplyModal
        visible={replyModalVisible}
        review={selectedReview}
        onClose={() => {
          setReplyModalVisible(false);
          setSelectedReview(null);
        }}
        onReply={handleReply}
      />

      <ReviewDetailModal
        visible={detailModalVisible}
        review={selectedReview}
        onClose={() => {
          setDetailModalVisible(false);
          setSelectedReview(null);
        }}
        onReply={handleReplyClick}
      />
    </div>
  );
}
