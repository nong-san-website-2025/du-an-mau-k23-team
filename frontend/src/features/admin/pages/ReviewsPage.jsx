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
  Tag,
  Modal,
  Empty
} from "antd";
import {
  ReloadOutlined,
  SearchOutlined,
  EyeOutlined,
  MessageOutlined,
  EyeInvisibleOutlined,
  DownloadOutlined,
  WarningOutlined,
  SafetyCertificateOutlined,
  PlusOutlined,
  CheckOutlined,
  StopOutlined,
  FilterOutlined,
  ClearOutlined,
  StarFilled,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
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
const { Text, Paragraph } = Typography;
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
  const isMobile =
    typeof window !== "undefined" && window.matchMedia("(max-width: 480px)").matches;

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

  // --- STATE CHO TỪ KHÓA CẤM ---
  const [isKeywordModalOpen, setIsKeywordModalOpen] = useState(false);
  const [bannedKeywords, setBannedKeywords] = useState([
    "lừa đảo", "vô học", "chết tiệt", "ngu", "rác", "tệ hại"
  ]); 
  const [newKeyword, setNewKeyword] = useState("");

  // --- LOGIC XỬ LÝ TỪ KHÓA CẤM ---
  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;
    const keywordToAdd = newKeyword.trim().toLowerCase();
    
    if (bannedKeywords.includes(keywordToAdd)) {
      message.warning("Từ khóa này đã tồn tại!");
      return;
    }
    
    setBannedKeywords([...bannedKeywords, keywordToAdd]);
    setNewKeyword("");
    message.success("Đã thêm từ khóa chặn");
  };

  const handleRemoveKeyword = (removedTag) => {
    const newTags = bannedKeywords.filter((tag) => tag !== removedTag);
    setBannedKeywords(newTags);
    message.success("Đã xóa từ khóa");
  };

  // --- HÀM KIỂM TRA SPAM CHÍNH XÁC ---
  const checkIsSpam = (comment) => {
    if (!comment) return false;
    const content = comment.trim().toLowerCase();

    // 1. Quá ngắn
    if (content.length < 5) return true;

    // 2. Chuỗi dài không có khoảng trắng
    if (!content.includes(" ") && content.length > 15) return true;

    // 3. Ký tự lặp lại quá nhiều
    const repeatPattern = /(.)\1{4,}/; 
    if (repeatPattern.test(content)) return true;

    // 4. Chứa từ khóa cấm (BẮT CHÍNH XÁC TỪ)
    return bannedKeywords.some(keyword => {
        const regex = new RegExp(`(^|[\\s.,;!?()"'])` + keyword + `($|[\\s.,;!?()"'])`, 'i');
        return regex.test(content);
    });
  };

  // --- FETCH DATA ---
  const fetchReviews = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/reviews/admin/reviews/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = Array.isArray(res.data) ? res.data : res.data.results || [];

      const mappedData = data.map((item) => ({
        ...item,
        user_name: item.user_name || "Khách ẩn danh",
        product_name: item.product_name || "Sản phẩm ẩn",
        comment: item.comment || "",
        // Đảm bảo mảng ảnh tồn tại để check hiển thị Tag
        images: item.images || [],
        review_images: item.review_images || []
      }));

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
      case "all":
        setDateRange(null);
        break;
      case "today":
        setDateRange([today.startOf("day"), today.endOf("day")]);
        break;
      case "7d":
        setDateRange([today.subtract(6, "day").startOf("day"), today.endOf("day")]);
        break;
      case "30d":
        setDateRange([today.subtract(29, "day").startOf("day"), today.endOf("day")]);
        break;
      default:
        break;
    }
  };

  const handleRangePickerChange = (dates) => {
    if (dates) {
      setDateRange([dates[0].startOf("day"), dates[1].endOf("day")]);
      setTimeFilter("custom");
    } else {
      setDateRange(null);
      setTimeFilter("all");
    }
  };

  // --- LOGIC RESET BỘ LỌC (MỚI - UX) ---
  const handleResetFilters = () => {
    setSearchText("");
    setRatingFilter("all");
    setStatusFilter("all");
    handleTimeChange("all");
    message.info("Đã đặt lại bộ lọc");
  };

  // --- LOGIC LỌC TỔNG HỢP ---
  const filteredReviews = useMemo(() => {
    return reviews.filter((item) => {
      // 1. Lọc Rating
      if (ratingFilter !== "all" && String(item.rating) !== ratingFilter) return false;

      // 2. Lọc Trạng thái
      if (statusFilter !== "all") {
        if (statusFilter === "hidden" && !item.is_hidden) return false;
        if (statusFilter === "replied" && (!item.replies || item.replies.length === 0))
          return false;
        if (statusFilter === "pending" && item.replies && item.replies.length > 0)
          return false;
      }

      // 3. Lọc Ngày
      if (dateRange && dateRange[0] && dateRange[1]) {
        const itemDate = dayjs(item.created_at);
        if (!itemDate.isValid()) return false;
        if (!itemDate.isBetween(dateRange[0], dateRange[1], null, "[]")) return false;
      }

      // 4. Tìm kiếm
      if (searchText) {
        const keyword = removeAccents(searchText.trim());
        const nameMatch = removeAccents(item.user_name).includes(keyword);
        const productMatch = removeAccents(item.product_name).includes(keyword);
        const commentMatch = removeAccents(item.comment).includes(keyword);

        if (!nameMatch && !productMatch && !commentMatch) return false;
      }

      return true;
    });
  }, [reviews, searchText, ratingFilter, statusFilter, dateRange, bannedKeywords]);

  // --- EXPORT EXCEL ---
  const handleExportExcel = () => {
    if (filteredReviews.length === 0) {
      message.warning("Không có dữ liệu để xuất");
      return;
    }
    const exportData = filteredReviews.map((item) => ({
      "Khách hàng": item.user_name,
      "Sản phẩm": item.product_name,
      "Đánh giá": `${item.rating} sao`,
      "Nội dung": item.comment,
      "Trạng thái": item.is_hidden
        ? "Chờ duyệt/Ẩn"
        : item.replies?.length
        ? "Đã trả lời"
        : "Đã duyệt/Chưa trả lời",
      "Ngày tạo": dayjs(item.created_at).format("DD/MM/YYYY HH:mm"),
      "Nghi vấn Spam": checkIsSpam(item.comment) ? "Có" : "Không",
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
      if (record.is_hidden) {
        message.success("Đã DUYỆT bài viết (Khách hàng sẽ thấy)");
      } else {
        message.warning("Đã ẨN bài viết (Khách hàng sẽ không thấy)");
      }
      fetchReviews();
    } catch (err) {
      message.error("Lỗi thay đổi trạng thái");
    }
  };

  const getStatusForTag = (record) => {
    if (checkIsSpam(record.comment)) return { status: "locked", label: "Vi phạm / Spam" };
    if (record.is_hidden) return { status: "locked", label: "Chờ duyệt / Ẩn" };
    if (record.replies && record.replies.length > 0)
      return { status: "approved", label: "Đã trả lời" };
    return { status: "pending", label: "Đã duyệt" };
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
      width: isMobile ? 260 : 350,
      render: (_, record) => {
        const isSpam = checkIsSpam(record.comment);
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Text strong style={{ fontSize: 13 }}>
              {record.product_name}
            </Text>
            <Space size={4}>
              <span style={{ color: "#faad14" }}>★</span>
              <Text strong>{record.rating}/5</Text>
              {isSpam && (
                <Tag color="error" icon={<WarningOutlined />}>
                  Nghi vấn Spam
                </Tag>
              )}
            </Space>
            <Text ellipsis type="secondary" style={{ maxWidth: 280 }}>
              <MessageOutlined /> {record.comment || "Không lời bình"}
            </Text>
          </div>
        );
      },
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 140,
      align: "center",
      render: (_, record) => {
        const { status, label } = getStatusForTag(record);
        return <StatusTag status={status} label={label} />;
      },
    },
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
      render: (_, record) => {
        const isSpam = checkIsSpam(record.comment);
        return (
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
                tooltip: isSpam ? "Spam - Không thể duyệt" : (record.is_hidden ? "Duyệt & Hiển thị" : "Ẩn bài viết"),
                icon: record.is_hidden ? <CheckOutlined style={{color: isSpam ? '#bfbfbf' : '#52c41a'}} /> : <StopOutlined style={{color: '#ff4d4f'}} />,
                // Disable nút duyệt nếu là Spam và đang ẩn
                disabled: isSpam && record.is_hidden,
                confirm: { title: record.is_hidden ? "Duyệt đánh giá này?" : "Ẩn đánh giá này?" },
                onClick: () => handleToggleVisibility(record),
              },
            ]}
            record={record}
          />
        );
      },
    },
  ];

  return (
    <AdminPageLayout title="QUẢN LÝ ĐÁNH GIÁ (KIỂM DUYỆT)">
      {/* --- CSS CHO DÒNG SPAM --- */}
      <style>{`
        .spam-row td {
          background-color: #fff1f0 !important; 
          opacity: 0.6; 
          pointer-events: none;
        }
        .spam-row td:last-child {
          pointer-events: auto;
        }
        .spam-row:hover td {
          background-color: #ffccc7 !important;
          opacity: 0.8;
        }
        .keyword-tag {
          margin-bottom: 8px;
          padding: 5px 10px;
          font-size: 14px;
        }
      `}</style>

      {/* --- THANH CÔNG CỤ (BỘ LỌC CHUẨN UI/UX) --- */}
      <Card
        bordered={false}
        bodyStyle={{ padding: "20px 24px" }}
        style={{ marginBottom: 24, borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          
          {/* Hàng 1: Tìm kiếm & Các nút hành động chính */}
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <Input
              placeholder="Tìm kiếm khách hàng, sản phẩm, nội dung..."
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 425, maxWidth: "100%" }}
              allowClear
              size="middle"
            />
            
            <Space>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={fetchReviews} 
                loading={loading}
              >
                Làm mới
              </Button>
              <Button 
                icon={<DownloadOutlined />} 
                onClick={handleExportExcel}
              >
                Xuất Excel
              </Button>
              <Button 
                danger
                icon={<SafetyCertificateOutlined />} 
                onClick={() => setIsKeywordModalOpen(true)}
              >
                Cấu hình từ cấm
              </Button>
            </Space>
          </div>

          {/* Hàng 2: Các bộ lọc chi tiết */}
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 80, paddingTop: 5 }}>
                <FilterOutlined style={{ color: "#8c8c8c" }} />
                <Text strong style={{ color: "#595959" }}>Bộ lọc:</Text>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
              {/* Hàng 1: Sao & Trạng thái */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
                {/* Lọc Sao (Visual tốt hơn) */}
                <Select
                  value={ratingFilter}
                  onChange={setRatingFilter}
                  style={{ width: 140 }}
                  placeholder="Đánh giá"
                >
                  <Option value="all">⭐ Tất cả sao</Option>
                  {[5, 4, 3, 2, 1].map((s) => (
                    <Option key={s} value={s.toString()}>
                      <Space>
                        <StarFilled style={{ color: "#faad14" }} /> {s} sao
                      </Space>
                    </Option>
                  ))}
                </Select>

                {/* Lọc Trạng thái (Thêm icon màu sắc) */}
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: 180 }}
                  placeholder="Trạng thái"
                >
                  <Option value="all">Tất cả trạng thái</Option>
                  <Option value="replied">
                    <Space><CheckCircleOutlined style={{ color: "#52c41a" }} /> Đã trả lời</Space>
                  </Option>
                  <Option value="pending">
                    <Space><ClockCircleOutlined style={{ color: "#1890ff" }} /> Đã duyệt (Chờ TL)</Space>
                  </Option>
                  <Option value="hidden">
                    <Space><CloseCircleOutlined style={{ color: "#ff4d4f" }} /> Chờ duyệt / Ẩn</Space>
                  </Option>
                </Select>
              </div>

              {/* Hàng 2: Thời gian & Xóa lọc */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
                {/* Lọc Thời gian */}
                <Space.Compact>
                  <Select
                    value={timeFilter}
                    onChange={handleTimeChange}
                    style={{ width: 102 }}
                  >
                    <Option value="all">Toàn bộ TG</Option>
                    <Option value="today">Hôm nay</Option>
                    <Option value="7d">7 ngày qua</Option>
                    <Option value="30d">30 ngày qua</Option>
                    <Option value="custom">Tùy chọn...</Option>
                  </Select>
                  <RangePicker
                    value={dateRange}
                    onChange={handleRangePickerChange}
                    format="DD/MM/YYYY"
                    placeholder={["Từ ngày", "Đến ngày"]}
                    style={{ width: 230 }}
                    disabled={timeFilter !== 'custom'}
                  />
                </Space.Compact>

                {(searchText || ratingFilter !== 'all' || statusFilter !== 'all' || timeFilter !== 'all') && (
                  <Button 
                    type="link" 
                    icon={<ClearOutlined />} 
                    onClick={handleResetFilters}
                    style={{ color: "#8c8c8c", padding: 0 }}
                  >
                    Xóa lọc
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* --- BẢNG DỮ LIỆU --- */}
      <Card bordered={false} bodyStyle={{ padding: 0 }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredReviews}
          loading={loading}
          rowClassName={(record) => (checkIsSpam(record.comment) ? "spam-row" : "")}
          pagination={{
            total: filteredReviews.length,
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} đánh giá`,
          }}
          scroll={{ x: 1100 }}
        />
      </Card>

      {/* --- MODAL QUẢN LÝ TỪ KHÓA CẤM --- */}
      <Modal
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: "#ff4d4f" }} />
            <span>Quản lý Từ Khóa Cấm & Spam</span>
          </Space>
        }
        open={isKeywordModalOpen}
        onCancel={() => setIsKeywordModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsKeywordModalOpen(false)}>
            Đóng
          </Button>
        ]}
        width={500}
      >
        <Paragraph type="secondary">
          Các đánh giá chứa từ khóa bên dưới sẽ tự động bị đánh dấu là 
          <Text type="danger" strong> "Nghi vấn Spam" </Text>
          và được tô đỏ trên bảng danh sách.
        </Paragraph>

        {/* Khu vực nhập liệu */}
        <Space.Compact style={{ width: '100%', marginBottom: 20 }}>
          <Input 
            placeholder="Nhập từ khóa cấm (ví dụ: lừa đảo, f*ck...)" 
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onPressEnter={handleAddKeyword}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddKeyword}>
            Thêm
          </Button>
        </Space.Compact>

        {/* Danh sách từ khóa */}
        <div 
          style={{ 
            border: "1px solid #f0f0f0", 
            padding: 16, 
            borderRadius: 8, 
            background: "#fafafa",
            minHeight: 150
          }}
        >
          {bannedKeywords.length > 0 ? (
            bannedKeywords.map((tag) => (
              <Tag
                className="keyword-tag"
                key={tag}
                closable
                onClose={(e) => {
                  e.preventDefault();
                  handleRemoveKeyword(tag);
                }}
                color="red"
              >
                {tag}
              </Tag>
            ))
          ) : (
            <Empty description="Chưa có từ khóa cấm nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </div>
      </Modal>

      {/* --- CÁC MODAL KHÁC --- */}
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