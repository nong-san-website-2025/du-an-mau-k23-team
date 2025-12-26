import React, { useEffect, useState, useMemo } from "react";
import {
  Table,
  Card,
  Tag,
  Modal,
  Button,
  Spin,
  Alert,
  Image,
  Avatar,
  Typography,
} from "antd";
import axios from "axios";
import { UserOutlined } from "@ant-design/icons";

export default function RecentDisputes() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // ✅ Lấy API từ .env - Không hardcode IP
  const API_URL = process.env.REACT_APP_API_URL;

  const BASE_DOMAIN = useMemo(() => {
    try {
      return API_URL ? new URL(API_URL).origin : "";
    } catch {
      return "";
    }
  }, [API_URL]);

  useEffect(() => {
    if (disputes.length > 0) {
      console.log("Dữ liệu khiếu nại đầu tiên:", disputes[0]);
      // Mở F12 -> Console để xem tên trường chứa username là gì
    }
  }, [disputes]);

  // ✅ Bảng mã màu dựa trên logic Backend
  const statusColors = {
    pending: "magenta",
    negotiating: "blue",
    waiting_return: "cyan",
    returning: "processing",
    admin_review: "volcano",
    resolved_refund: "green",
    resolved_reject: "default",
    cancelled: "gray",
  };

  // ✅ Việt hóa trạng thái khớp 100% với Django STATUS_CHOICES
  const statusLabels = {
    pending: "Chờ người bán phản hồi",
    negotiating: "Đang thương lượng",
    waiting_return: "Shop đồng ý - Chờ gửi hàng",
    returning: "Đang trả hàng về",
    admin_review: "Sàn đang xem xét",
    resolved_refund: "Đã hoàn tiền",
    resolved_reject: "Từ chối hoàn tiền",
    cancelled: "Đã hủy khiếu nại",
  };

  useEffect(() => {
    const fetchDisputes = async () => {
      if (!API_URL) return;
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/complaints/recent/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDisputes(res.data);
      } catch (err) {
        setError("Lỗi kết nối máy chủ khi tải danh sách khiếu nại.");
      } finally {
        setLoading(false);
      }
    };
    fetchDisputes();

    const mql = window.matchMedia("(max-width: 480px)");
    const handleChange = (e) => setIsMobile(e.matches);
    mql.addEventListener("change", handleChange);
    setIsMobile(mql.matches);
    return () => mql.removeEventListener("change", handleChange);
  }, [API_URL]);

  // ✅ Cấu hình cột: Giữ nguyên tất cả và thêm cột Người khiếu nại
  const columns = [
    {
      title: "Mã",
      dataIndex: "id",
      key: "id",
      width: 60,
      render: (id) => <span style={{ fontWeight: "bold" }}>#{id}</span>,
    },
    {
      title: "Sản phẩm",
      dataIndex: "product_name",
      key: "product_name",
      ellipsis: true,
      width: 220,
      render: (text, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Image
            src={getFullImageUrl(record.product_image)}
            width={40}
            height={40}
            style={{
              borderRadius: 4,
              objectFit: "cover",
              border: "1px solid #f0f0f0",
            }}
            fallback="https://via.placeholder.com/40?text=Err"
          />
          <span title={text}>{text}</span>
        </div>
      ),
    },
    {
      title: "Người khiếu nại",
      key: "complainant_info",
      width: 220,
      render: (_, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Avatar xử lý fallback icon */}
          <Avatar
            src={
              record.created_by_avatar
                ? getFullImageUrl(record.created_by_avatar)
                : null
            }
            icon={<UserOutlined />}
            style={{
              backgroundColor: record.created_by_avatar
                ? "transparent"
                : "#87d068",
            }}
          />

          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* SỬA LỖI Ở ĐÂY: Dùng Typography.Text */}
            <Typography.Text strong style={{ color: "#1890ff" }}>
              {record.created_by_name || "Khách hàng ẩn"}
            </Typography.Text>

            <Typography.Text type="secondary" style={{ fontSize: "12px" }}>
              {record.created_by_email}
            </Typography.Text>
          </div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 160,
      render: (status, record) => (
        <Tag color={statusColors[status] || "default"}>
          {record.status_display || statusLabels[status] || status}
        </Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      width: 140,
      render: (val) =>
        val ? new Date(val).toLocaleDateString("vi-VN") : "N/A",
    },
  ];

  const getFullImageUrl = (path) => {
    if (!path) return "";
    // Nếu là link online (cloudinary, firebase, s3...) thì giữ nguyên
    if (path.startsWith("http")) return path;

    // Xử lý chuẩn hóa đường dẫn
    let cleanPath = path;

    // Nếu đường dẫn từ API thiếu dấu / ở đầu
    if (!cleanPath.startsWith("/")) {
      cleanPath = `/${cleanPath}`;
    }

    // ✅ FIX QUAN TRỌNG: Kiểm tra nếu thiếu prefix /media/ thì tự động thêm vào
    // (Chỉ áp dụng nếu backend là Django mặc định lưu ảnh trong folder media)
    if (!cleanPath.startsWith("/media/")) {
      cleanPath = `/media${cleanPath}`;
    }

    return `${BASE_DOMAIN}${cleanPath}`;
  };

  return (
    <Card title="">
      {error && (
        <Alert
          type="error"
          message={error}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 30 }}>
          <Spin size="large" />
        </div>
      ) : (
        <Table
          rowKey="id"
          columns={columns}
          dataSource={disputes}
          pagination={{ pageSize: 5 }}
          onRow={(record) => ({
            onClick: () => setSelectedDispute(record),
            style: { cursor: "pointer" },
          })}
          size={isMobile ? "small" : "middle"}
          scroll={isMobile ? { x: 700 } : undefined}
        />
      )}

      <Modal
        open={!!selectedDispute}
        title="CHI TIẾT KHIẾU NẠI"
        onCancel={() => setSelectedDispute(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedDispute(null)}>
            Đóng
          </Button>,
        ]}
        width={650}
      >
        {selectedDispute && (
          <div style={{ lineHeight: "2.2" }}>
            {/* 1. SỬA LẠI THÔNG TIN NGƯỜI KHIẾU NẠI */}
            <div
              style={{
                marginBottom: 15,
                borderBottom: "1px solid #eee",
                paddingBottom: 10,
              }}
            >
              <p style={{ marginBottom: 5 }}>
                <b>Người khiếu nại:</b>
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar
                  src={
                    selectedDispute.created_by_avatar
                      ? getFullImageUrl(selectedDispute.created_by_avatar)
                      : null
                  }
                  icon={<UserOutlined />}
                  style={{
                    backgroundColor: selectedDispute.created_by_avatar
                      ? "transparent"
                      : "#87d068",
                  }}
                />
                <div>
                  <Typography.Text
                    strong
                    style={{ display: "block", lineHeight: 1.2 }}
                  >
                    {selectedDispute.created_by_name || "Khách hàng ẩn"}
                  </Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {selectedDispute.created_by_email}
                  </Typography.Text>
                </div>
              </div>
            </div>

            {/* 2. SỬA MÃ ĐƠN HÀNG VÀ CÁC THÔNG TIN KHÁC */}
            <p>
              <b>Mã đơn hàng:</b> #
              {selectedDispute.order_code || selectedDispute.order_id || "N/A"}
            </p>
            <p>
              <b>Sản phẩm:</b> {selectedDispute.product_name}
            </p>
            <p>
              <b>Lý do:</b> {selectedDispute.reason}
            </p>
            <p>
              <b>Trạng thái:</b>{" "}
              <Tag color={statusColors[selectedDispute.status]}>
                {selectedDispute.status_display ||
                  statusLabels[selectedDispute.status] ||
                  selectedDispute.status}
              </Tag>
            </p>

            <div
              style={{
                background: "#f5f5f5",
                padding: "10px",
                borderRadius: "8px",
                margin: "15px 0",
              }}
            >
              <p style={{ margin: 0 }}>
                <b>Vận chuyển trả hàng:</b>
              </p>
              <p style={{ margin: 0 }}>
                - Hãng: {selectedDispute.return_shipping_carrier || "Chưa có"}
              </p>
              <p style={{ margin: 0 }}>
                - Mã vận đơn:{" "}
                {selectedDispute.return_tracking_code || "Chưa có"}
              </p>
            </div>

            <p>
              <b>Bằng chứng hình ảnh:</b>
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {selectedDispute.media && selectedDispute.media.length > 0 ? (
                selectedDispute.media.map((item, i) => {
                  // 🔍 LOG KIỂM TRA DỮ LIỆU (Xem ở Console F12 khi mở Modal)
                  console.log("Media Item:", item);

                  // 1. Xử lý lấy đường dẫn ảnh thông minh
                  let rawUrl = "";
                  if (typeof item === "string") {
                    rawUrl = item; // Trường hợp mảng chuỗi ["url1", "url2"]
                  } else if (typeof item === "object" && item !== null) {
                    // Trường hợp mảng object: check lần lượt các key phổ biến
                    rawUrl =
                      item.image || item.file || item.url || item.path || "";
                  }

                  // 2. Nếu không tìm thấy link thì bỏ qua
                  if (!rawUrl) return null;

                  return (
                    <Image
                      key={i}
                      // 3. Gọi hàm getFullImageUrl để ghép domain + /media/
                      src={getFullImageUrl(rawUrl)}
                      width={110}
                      height={110}
                      style={{
                        objectFit: "cover",
                        borderRadius: 8,
                        border: "1px solid #ddd",
                      }}
                      fallback="https://via.placeholder.com/110?text=Error" // Ảnh thế chỗ nếu lỗi
                    />
                  );
                })
              ) : (
                <i style={{ color: "#999" }}>Không có hình ảnh đính kèm</i>
              )}
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
}
