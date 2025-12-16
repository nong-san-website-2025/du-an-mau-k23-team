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
  rowSelection,
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
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Text
                  strong
                  ellipsis={{ tooltip: record.name }}
                  style={{ fontSize: 14, maxWidth: 280 }}
                >
                  {record.name}
                </Text>
                {isPendingUpdate && (
                  <Tag color="orange" icon={<HistoryOutlined />}>
                    Chờ duyệt cập nhật
                  </Tag>
                )}
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                ID: #{record.id}
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
          <Text style={{ fontSize: 13 }}>{record.category_name || "---"}</Text>
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
    // ── 4. TRẠNG THÁI (ĐÃ SỬA: CHỈ HIỆN TAG, ẨN LÝ DO) ─────────────────────
    {
      title: "Trạng thái",
      key: "status_col",
      width: 140, // Thu nhỏ width lại chút vì đã bỏ text dài
      align: "center",
      render: (_, record) => {
        let showStatus = record.status;
        // Logic ẩn hiển thị approved nhưng hidden
        if (record.status === "approved" && record.is_hidden) {
          showStatus = "hidden";
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
            {/* ĐÃ XÓA PHẦN HIỂN THỊ LÝ DO TỪ CHỐI TẠI ĐÂY */}
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
                {record.season_start
                  ? dayjs(record.season_start).format("DD/MM")
                  : "?"}{" "}
                -{" "}
                {record.season_end
                  ? dayjs(record.season_end).format("DD/MM")
                  : "?"}
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
        const isRejected = record.status === "rejected";
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
            icon: record.is_hidden ? <EyeOutlined /> : <EyeInvisibleOutlined />,
            tooltip: record.is_hidden ? "Hiển thị lại" : "Tạm ẩn",
            onClick: () => onToggleHide(record),
          },
          {
            actionType: "edit",
            show: true,
            icon: <EditOutlined />,
            tooltip: isBanned
              ? "Sản phẩm bị khóa"
              : isRejected
                ? "Sửa lỗi & Gửi duyệt lại"
                : "Chỉnh sửa",
            onClick: onEdit,
            buttonProps: {
              disabled: isBanned,
              // Nút vẫn màu cam để gây chú ý người bán cần sửa
              style: isRejected
                ? { color: "#fa8c16", borderColor: "#fa8c16" }
                : undefined,
            },
          },
          {
            actionType: "delete",
            show: canDelete,
            icon: <DeleteOutlined />,
            tooltip: "Xóa vĩnh viễn",
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
            style={{ display: "flex", justifyContent: "center", width: "100%" }}
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
      onRow={onRow}
      rowSelection={rowSelection}
      rowClassName={(record) =>
        `cursor-pointer hover:bg-slate-50 ${record.is_hidden ? "opacity-60 bg-gray-50" : ""} ${record.status === "rejected" ? "bg-red-50" : ""}`
      }
      size="small"
      bordered
    />
  );
};

export default ProductTable;
