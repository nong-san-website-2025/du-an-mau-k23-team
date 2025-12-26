import React, { useState, useEffect, useCallback } from "react";
import { debounce } from "lodash";
import {
  Row,
  Col,
  Card,
  Select,
  Input,
  Button,
  Empty,
  message,
  Space,
  Pagination,
  Typography,
  Skeleton,
  theme,
  Tag,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  MessageOutlined,
  FilterFilled,
} from "@ant-design/icons";

// Import Components
import ReviewCard from "../components/ReviewSeller/ReviewCard";
import ReviewStats from "../components/ReviewSeller/ReviewStats";
import ReviewReplyModal from "../components/ReviewSeller/ReviewReplyModal";
import ReviewDetailModal from "../components/ReviewSeller/ReviewDetailModal";

// Import Service
import reviewService from "../services/api/reviewService";

const { Title, Text } = Typography;
const { Option } = Select;

export default function Reviews() {
  const { token } = theme.useToken();

  // --- States ---
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  // Bộ lọc
  const [filters, setFilters] = useState({
    rating: "all",
    status: "all",
    search: "",
  });

  // State riêng cho input search để UI mượt mà (không bị delay khi gõ)
  const [searchTerm, setSearchTerm] = useState("");

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Modal States
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);

  // --- Logic Fetch Data ---

  const buildCacheKey = (f, pg) => {
    const parts = [
      f.rating || "all",
      f.status || "all",
      pg.current || 1,
      pg.pageSize || 10,
      f.search || "",
    ];
    return `REVIEWS_CACHE_${parts.join("_")}`;
  };

  const SUMMARY_CACHE_KEY = "REVIEWS_SUMMARY_CACHE";

  const loadSummary = async () => {
    try {
      // Try to show cached summary first to avoid waiting
      try {
        const cached = localStorage.getItem(SUMMARY_CACHE_KEY);
        if (cached) setSummary(JSON.parse(cached));
      } catch (e) {}

      const data = await reviewService.getSellerReviewsSummary();
      setSummary(data);
      try {
        localStorage.setItem(SUMMARY_CACHE_KEY, JSON.stringify(data));
      } catch (e) {}
    } catch (error) {
      console.error("Lỗi tải thống kê:", error);
    }
  };

  const loadReviews = useCallback(
    async (opts = { suppressLoading: false }) => {
      if (!opts.suppressLoading) setLoading(true);
      try {
        // 1. Chuẩn bị params sạch sẽ
        const params = {
          page: pagination.current,
          page_size: pagination.pageSize,
          rating: filters.rating !== "all" ? filters.rating : undefined,
          status: filters.status !== "all" ? filters.status : undefined,
          search: filters.search || undefined,
        };

        // 2. Gọi API
        const response = await reviewService.getSellerReviews(params);

        // 3. Update state (XỬ LÝ CẢ 2 TRƯỜNG HỢP)
        if (Array.isArray(response)) {
          // TRƯỜNG HỢP 1: Backend trả về mảng trực tiếp [ {...}, {...} ]
          setReviews(response);
          setPagination((prev) => ({
            ...prev,
            total: response.length, // Tổng số chính là độ dài mảng
          }));
          try {
            const key = buildCacheKey(filters, pagination);
            localStorage.setItem(
              key,
              JSON.stringify({ items: response, total: response.length })
            );
          } catch (e) {}
        } else if (response.results) {
          // TRƯỜNG HỢP 2: Backend có phân trang { count: 10, results: [...] }
          setReviews(response.results);
          setPagination((prev) => ({
            ...prev,
            total: response.count || 0,
          }));
          try {
            const key = buildCacheKey(filters, pagination);
            localStorage.setItem(
              key,
              JSON.stringify({
                items: response.results,
                total: response.count || 0,
              })
            );
          } catch (e) {}
        } else {
          // Trường hợp lạ khác
          setReviews([]);
        }
      } catch (error) {
        console.error("Lỗi tải đánh giá:", error);
        message.error("Không thể tải danh sách đánh giá.");
      } finally {
        if (!opts.suppressLoading) setLoading(false);
      }
    },
    [filters, pagination.current, pagination.pageSize]
  );

  // Gọi API khi filter hoặc pagination thay đổi
  useEffect(() => {
    // On filters/pagination change: try to show cached data immediately
    const key = buildCacheKey(filters, pagination);
    let hadCache = false;
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && Array.isArray(parsed.items)) {
          setReviews(parsed.items);
          setPagination((prev) => ({
            ...prev,
            total: parsed.total || prev.total,
          }));
          hadCache = true;
        }
      }
    } catch (e) {
      // ignore cache parse errors
    }

    // Fetch fresh data in background. If we had cache, suppress loading to avoid flicker.
    loadReviews({ suppressLoading: hadCache });
  }, [filters, pagination.current, pagination.pageSize, loadReviews]);

  // Gọi Summary 1 lần khi mount
  useEffect(() => {
    loadSummary();
  }, []);

  // --- Handlers ---

  // Xử lý Debounce cho Search (Chờ 600ms sau khi ngừng gõ mới gọi API)
  const debouncedSearch = useCallback(
    debounce((value) => {
      setFilters((prev) => ({ ...prev, search: value }));
      setPagination((prev) => ({ ...prev, current: 1 })); // Reset về trang 1
    }, 600),
    []
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value); // Update UI ngay lập tức
    debouncedSearch(value); // Update filter sau 600ms
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, current: 1 })); // Reset về trang 1
  };

  const handleReplySubmit = async (reviewId, replyText) => {
    try {
      await reviewService.replyToReview(reviewId, replyText);
      message.success("Phản hồi thành công! 🎉");

      // Reload dữ liệu để cập nhật UI
      loadReviews();
      loadSummary();

      // Đóng modal sẽ được xử lý trong component con hoặc tại đây
    } catch (error) {
      // Lỗi đã được catch ở service hoặc hiển thị tại đây
      message.error("Gửi phản hồi thất bại. Vui lòng thử lại.");
    }
  };

  const handlePageChange = (page, pageSize) => {
    setPagination((prev) => ({ ...prev, current: page, pageSize }));
    window.scrollTo({ top: 0, behavior: "smooth" }); // Scroll lên đầu trang
  };

  // --- Actions Modal ---
  const openReplyModal = (review) => {
    setSelectedReview(review);
    setReplyModalVisible(true);
  };

  const openDetailModal = (review) => {
    setSelectedReview(review);
    setDetailModalVisible(true);
  };

  const handleQuickReply = () => {
    const unreplied = reviews.find((r) => !r.replies || r.replies.length === 0);
    if (unreplied) {
      openReplyModal(unreplied);
    } else {
      message.info(
        "Tuyệt vời! Bạn đã trả lời hết các đánh giá trong trang này."
      );
    }
  };

  return (
    <div
      style={{
        padding: "24px",
        maxWidth: 1200,
        margin: "0 auto",
        minHeight: "100vh",
      }}
    >
      {/* 1. Header Area */}
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "end",
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0, color: token.colorTextHeading }}>
            Quản Lý Đánh Giá
          </Title>
          <Text type="secondary">
            Theo dõi và phản hồi ý kiến khách hàng để nâng cao uy tín cửa hàng.
          </Text>
        </div>
        <Space>
          <Tooltip title="Tải lại dữ liệu">
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                loadReviews();
                loadSummary();
              }}
            />
          </Tooltip>
        </Space>
      </div>

      {/* 2. Statistics Area */}
      <div style={{ marginBottom: 24 }}>
        <ReviewStats summary={summary} />
      </div>

      {/* 3. Filter Area */}
      <Card
        bordered={false}
        bodyStyle={{ padding: "16px 24px" }}
        style={{
          marginBottom: 24,
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <Row gutter={[16, 16]} align="middle">
          {/* Search Input */}
          <Col xs={24} md={10}>
            <Input
              placeholder="Tìm theo tên khách, sản phẩm hoặc nội dung..."
              prefix={
                <SearchOutlined style={{ color: token.colorTextPlaceholder }} />
              }
              value={searchTerm}
              onChange={handleSearchChange}
              allowClear
              size="large"
            />
          </Col>

          {/* Rating Filter */}
          <Col xs={12} md={5}>
            <Select
              placeholder="Lọc theo sao"
              style={{ width: "100%" }}
              size="large"
              value={filters.rating}
              onChange={(val) => handleFilterChange("rating", val)}
              suffixIcon={
                <FilterFilled style={{ color: token.colorTextDescription }} />
              }
            >
              <Option value="all">Tất cả sao</Option>
              <Option value="5">⭐⭐⭐⭐⭐ (5 sao)</Option>
              <Option value="4">⭐⭐⭐⭐ (4 sao)</Option>
              <Option value="3">⭐⭐⭐ (3 sao)</Option>
              <Option value="2">⭐⭐ (2 sao)</Option>
              <Option value="1">⭐ (1 sao)</Option>
            </Select>
          </Col>

          {/* Status Filter */}
          <Col xs={12} md={5}>
            <Select
              placeholder="Trạng thái"
              style={{ width: "100%" }}
              size="large"
              value={filters.status}
              onChange={(val) => handleFilterChange("status", val)}
            >
              <Option value="all">Tất cả trạng thái</Option>
              <Option value="unreplied">Chưa trả lời</Option>
              <Option value="replied">Đã trả lời</Option>
              <Option value="hidden">Đã ẩn</Option>
            </Select>
          </Col>

          {/* Quick Action */}
          <Col xs={24} md={4} style={{ textAlign: "right" }}>
            <Button
              type="primary"
              size="large"
              ghost
              block
              icon={<MessageOutlined />}
              onClick={handleQuickReply}
            >
              Trả lời nhanh
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 4. Review List Area */}
      <div>
        {loading ? (
          // Skeleton Loading State
          <Row gutter={[16, 16]}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Col span={24} key={i}>
                <Card bordered={false} style={{ borderRadius: 8 }}>
                  <Skeleton avatar paragraph={{ rows: 2 }} active />
                </Card>
              </Col>
            ))}
          </Row>
        ) : reviews.length > 0 ? (
          <>
            <div
              style={{
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text type="secondary">
                Hiển thị <Text strong>{reviews.length}</Text> trên tổng số{" "}
                <Text strong>{pagination.total}</Text> đánh giá
              </Text>
            </div>

            <Space direction="vertical" style={{ width: "100%" }} size={16}>
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onReply={openReplyModal}
                  onViewDetail={openDetailModal}
                />
              ))}
            </Space>

            <div
              style={{ textAlign: "center", marginTop: 32, paddingBottom: 24 }}
            >
              <Pagination
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={pagination.total}
                onChange={handlePageChange}
                showSizeChanger
                showTotal={(total) => `Tổng ${total} mục`}
                pageSizeOptions={["5", "10", "20", "50"]}
              />
            </div>
          </>
        ) : (
          // Empty State
          <div
            style={{
              background: "#fff",
              padding: 48,
              borderRadius: 8,
              textAlign: "center",
            }}
          >
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span>
                  Không tìm thấy đánh giá nào phù hợp.
                  <br />
                  <Text type="secondary">
                    Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.
                  </Text>
                </span>
              }
            >
              <Button
                onClick={() => {
                  setFilters({ rating: "all", status: "all", search: "" });
                  setSearchTerm("");
                  setPagination((prev) => ({ ...prev, current: 1 }));
                }}
              >
                Xóa bộ lọc
              </Button>
            </Empty>
          </div>
        )}
      </div>

      {/* 5. Modals */}
      <ReviewReplyModal
        visible={replyModalVisible}
        review={selectedReview}
        onClose={() => {
          setReplyModalVisible(false);
          setSelectedReview(null);
        }}
        onReply={handleReplySubmit}
      />

      <ReviewDetailModal
        visible={detailModalVisible}
        review={selectedReview}
        onClose={() => {
          setDetailModalVisible(false);
          setSelectedReview(null);
        }}
        onReply={(review) => {
          // Chuyển từ Detail Modal sang Reply Modal
          setDetailModalVisible(false);
          // Timeout nhỏ để UI không bị giật
          setTimeout(() => openReplyModal(review), 100);
        }}
      />
    </div>
  );
}
