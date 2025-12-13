import React, { useEffect, useState } from "react";
import { Table, Typography, Space, Image, Avatar, Tag } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  FileImageOutlined,
  EyeOutlined,
  HistoryOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import { intcomma } from "../../../../utils/format";
import ButtonAction from "../../../../components/ButtonAction";
import StatusTag from "../../../../components/StatusTag";
import dayjs from "dayjs";

const { Text } = Typography;

const ProductTable = ({
  data,
  loading,
  onView,
  onEdit,
  onDelete,
  onToggleHide,
  onRow,
  rowSelection
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 768px)");
    const handler = (e) => setIsMobile(e.matches);
    handler(mql);
    return () => {
      mql.removeEventListener
        ? mql.removeEventListener("change", handler)
        : mql.removeListener(handler);
    };
  }, []);

  // --- HÀM LẤY LÝ DO TỪ CHỐI (CẬP NHẬT MẠNH HƠN) ---
  const getRejectReason = (record) => {
    // 1. Kiểm tra ưu tiên các trường văn bản từ Admin
    // Bạn hãy check xem backend trả về tên biến nào trong các tên dưới đây:
    const reasonText =
      record.reject_reason || // Tên phổ biến 1
      record.admin_note ||    // Tên phổ biến 2
      record.reason ||        // Tên phổ biến 3
      record.note ||          // Tên phổ biến 4
      record.message;         // Tên phổ biến 5

    // Nếu tìm thấy nội dung text, trả về ngay lập tức
    if (reasonText && reasonText.trim() !== "") {
      return reasonText;
    }

    // 2. Nếu Admin KHÔNG ghi gì cả, mới dùng lý do mặc định
    if (record.status === "rejected") {
      return "Vi phạm chính sách (Admin không để lại ghi chú cụ thể)";
    }

    return null;
  };

  const columns = [
    // ── 1. CỘT SẢN PHẨM ─────────────────────
    {
      title: "Sản phẩm",
      key: "product_info",
      width: 260,
      fixed: isMobile ? undefined : "left",
      render: (_, record) => {
        let imageUrl = null;
        if (Array.isArray(record.images) && record.images.length > 0) {
          const primary = record.images.find((img) => img.is_primary);
          imageUrl = primary?.image || record.images[0]?.image;
        }
        const isPendingUpdate = record.status === "pending_update";
        
        return (
          <div style={{ display: "flex", gap: 12 }}>
            <div onClick={(e) => e.stopPropagation()}>
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  width={56}
                  height={56}
                  style={{
                    borderRadius: 6,
                    objectFit: "cover",
                    border: "1px solid #f0f0f0",
                  }}
                  preview={{ mask: <EyeOutlined /> }}
                  fallback="/no-image.png"
                />
              ) : (
                <Avatar
                  shape="square"
                  size={56}
                  icon={<FileImageOutlined />}
                  style={{ backgroundColor: "#f5f5f5", color: "#bfbfbf" }}
                />
              )}
            </div>
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <Text
                  strong
                  ellipsis={{ tooltip: record.name }}
                  style={{ fontSize: 14, maxWidth: 280 }}
                >
                  {record.name}
                </Text>
                {isPendingUpdate && (
                  <Tag
                    color="orange"
                    icon={<HistoryOutlined />}
                    style={{ margin: 0, fontSize: 11 }}
                  >
                    Chờ duyệt cập nhật
                  </Tag>
                )}
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                ID: #{record.id}{" "}
                {isPendingUpdate && " • Đã gửi yêu cầu cập nhật"}
              </Text>
            </div>
          </div>
        );
      },
    },
    // ── 2. PHÂN LOẠI ─────────────────────
    {
      title: "Phân loại",
      key: "category",
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: 13 }}>
            {record.category_name || "---"}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.subcategory_name || "---"}
          </Text>
        </Space>
      ),
    },
    // ── 3. GIÁ & KHO ─────────────────────
    {
      title: "Giá bán & Tồn kho",
      key: "price_stock",
      width: 180,
      align: "right",
      render: (_, record) => (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
          }}
        >
          <Space align="baseline" size={4}>
            <Text type="secondary" delete style={{ fontSize: 12 }}>
              {intcomma(record.original_price)}đ
            </Text>
            <Text type="danger" strong style={{ fontSize: 14 }}>
              {intcomma(record.discounted_price || record.original_price)}đ
            </Text>
          </Space>
          <Text style={{ fontSize: 12, marginTop: 2 }}>
            Kho:{" "}
            <span
              style={{
                color: record.stock > 0 ? "#52c41a" : "#ff4d4f",
                fontWeight: 500,
              }}
            >
              {intcomma(record.stock)}
            </span>
          </Text>
        </div>
      ),
    },
    // ── 4. TRẠNG THÁI (Đã chỉnh sửa để hiện đúng lý do Admin nhập) ─────────────────────
    {
      title: "Trạng thái",
      key: "status_col",
      width: 170,
      align: "center",
      render: (_, record) => {
        let showStatus = record.status;
        if (record.status === "approved" && record.is_hidden) {
          showStatus = "hidden";
        }

        const isRejected =
          record.status === "rejected" || record.status === "banned";
        
        // Gọi hàm lấy lý do
        const rejectReasonText = getRejectReason(record);

        // LOG DỮ LIỆU ĐỂ KIỂM TRA (DEBUG)
        // Nếu bạn vẫn không thấy hiện lý do, hãy mở F12 -> Console 
        // và xem dòng "Check Record Rejected" này có chứa trường nào không.
        if (isRejected) {
           console.log(`Debug Record ID ${record.id}:`, record);
        }

        return (
          <Space
            direction="vertical"
            size={4}
            style={{ width: "100%", alignItems: "center" }}
          >
            <StatusTag status={showStatus} type="status" />
            <StatusTag
              status={record.availability_status}
              type="availability"
            />

            {/* HIỂN THỊ LÝ DO TỪ CHỐI */}
            {isRejected && rejectReasonText && (
              <div
                style={{
                  marginTop: 6,
                  padding: "6px 8px",
                  background: "#fff1f0",
                  border: "1px dashed #ffccc7",
                  borderRadius: 4,
                  width: "100%",
                  textAlign: "left",
                }}
              >
                <Text
                  type="danger"
                  style={{
                    fontSize: 11,
                    display: "block",
                    lineHeight: 1.3,
                  }}
                >
                  <span style={{ fontWeight: 700 }}>Admin: </span>
                  {rejectReasonText}
                </Text>
              </div>
            )}
          </Space>
        );
      },
    },
    // ── 5. MÙA VỤ ─────────────────────
    {
      title: "Thông tin mùa vụ",
      key: "season",
      width: 250,
      render: (_, record) => {
        if (record.availability_status !== "coming_soon")
          return (
            <Text type="secondary" italic>
              —
            </Text>
          );
        const start = record.season_start
          ? dayjs(record.season_start).format("DD/MM/YYYY")
          : "?";
        const end = record.season_end
          ? dayjs(record.season_end).format("DD/MM/YYYY")
          : "?";
        return (
          <div
            style={{
              fontSize: 13,
              background: "#f9f0ff",
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px dashed #d3adf7",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <Text strong style={{ color: "#722ed1" }}>
                Mùa vụ
              </Text>
              <Text style={{ fontSize: 12 }}>
                {start} - {end}
              </Text>
            </div>
            <Space
              size={10}
              style={{ fontSize: 12 }}
              split={<span style={{ color: "#d9d9d9" }}>|</span>}
            >
              <span>
                Dự kiến: <b>{intcomma(record.estimated_quantity)}</b>
              </span>
              <span>
                Đặt trước: <b>{intcomma(record.ordered_quantity || 0)}</b>
              </span>
            </Space>
          </div>
        );
      },
    },
    // ── 6. CỘT HÀNH ĐỘNG ─────────────────────
    {
      title: <div style={{ textAlign: "center", width: "100%" }}>Thao tác</div>,
      key: "action",
      fixed: isMobile ? undefined : "right",
      width: 120,
      align: "center",
      render: (_, record) => {
        const isBanned = record.status === "banned";
        const isApproved = record.status === "approved";

        const canDelete =
          (record.sold === 0 || !record.sold) &&
          (record.ordered_quantity === 0 || !record.ordered_quantity) &&
          !isBanned;

        const actions = [
          {
            actionType: "view",
            show: true,
            icon: <EyeOutlined />,
            tooltip: "Xem chi tiết",
            onClick: onView,
          },
          {
            actionType: "toggle_hide",
            show: isApproved,
            icon: record.is_hidden ? (
              <EyeOutlined />
            ) : (
              <EyeInvisibleOutlined />
            ),
            tooltip: record.is_hidden
              ? "Hiển thị lại sản phẩm"
              : "Tạm ẩn sản phẩm",
            onClick: () => onToggleHide(record),
          },
          {
            actionType: "edit",
            show: true,
            icon: <EditOutlined />,
            tooltip: isBanned ? "Sản phẩm bị khóa" : "Chỉnh sửa",
            onClick: onEdit,
            buttonProps: { disabled: isBanned },
          },
          {
            actionType: "delete",
            show: canDelete,
            icon: <DeleteOutlined />,
            tooltip: "Xóa vĩnh viễn (Chưa có đơn hàng)",
            onClick: () => onDelete(record.id),
            confirm: {
              title: "Xóa vĩnh viễn sản phẩm?",
              description: "Hành động này không thể hoàn tác.",
              okText: "Xóa ngay",
              isDanger: true,
            },
            buttonProps: { danger: true, ghost: true },
          },
        ];

        return (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              width: "100%",
            }}
          >
            <ButtonAction actions={actions} record={record} />
          </div>
        );
      },
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data || []}
      loading={{ spinning: loading, tip: "Đang tải..." }}
      rowKey="id"
      pagination={{
        pageSize: 7,
        showTotal: (total) => `Tổng ${total} sản phẩm`,
      }}
      scroll={{ x: 1160, y: 480 }}
      sticky={{ offsetHeader: 0 }}
      onRow={onRow}
      rowSelection={rowSelection}
      rowClassName={(record) =>
        `cursor-pointer hover:bg-slate-50 ${
          record.is_hidden ? "opacity-60 bg-gray-50" : ""
        } ${
          record.status === "pending_update"
            ? "ant-table-row-pending-update"
            : ""
        }`
      }
      size="small"
      bordered
    />
  );
};

export default ProductTable;