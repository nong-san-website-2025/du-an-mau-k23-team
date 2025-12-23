import React from "react";
import { Table, Typography, Image, Tag, Tooltip, Grid, Space, message } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  InfoCircleOutlined,
  CopyOutlined, // Icon để copy mã SKU
} from "@ant-design/icons";
import { intcomma } from "../../../../utils/format";
import ButtonAction from "../../../../components/ButtonAction";
import StatusTag from "../../../../components/StatusTag";

const { Text } = Typography;
const { useBreakpoint } = Grid;

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
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  // --- Helper: Copy mã SKU ---
  const handleCopyId = (e, id) => {
    e.stopPropagation(); // Chặn click vào row
    navigator.clipboard.writeText(id.toString());
    message.success(`Đã copy mã: #${id}`);
  };

  // --- Helper: Lấy lý do từ chối ---
  const getRejectReason = (record) => {
    return record.reject_reason || record.admin_note || record.reason || record.message;
  };

  const columns = [
    // ── 1. SẢN PHẨM (Định danh) ──
    {
      title: "Sản phẩm",
      dataIndex: "name",
      key: "name",
      width: 300,
      fixed: isMobile ? undefined : "left",
      sorter: (a, b) => {
        const av = (a.name || "").toString().toLowerCase();
        const bv = (b.name || "").toString().toLowerCase();
        return av.localeCompare(bv);
      },
      sortDirections: ["ascend", "descend"],
      render: (_, record) => {
        // Logic lấy ảnh: Ưu tiên ảnh chính -> ảnh đầu tiên -> ảnh fallback
        let imageUrl = null;
        if (Array.isArray(record.images) && record.images.length > 0) {
          imageUrl = record.images.find((img) => img.is_primary)?.image || record.images[0]?.image;
        }
        if (!imageUrl && record.image) imageUrl = record.image;

        const isPendingUpdate = record.status === "pending_update";

        return (
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            {/* Ảnh: Cho phép Click để xem preview */}
            <div style={{ flexShrink: 0, position: "relative" }}>
              <Image
                src={imageUrl}
                width={56}
                height={56}
                style={{ borderRadius: 6, objectFit: "cover", border: "1px solid #f0f0f0" }}
                fallback="/no-image.png"
                // preview={{ mask: <EyeOutlined /> }} // Bật tính năng xem ảnh lớn
                onClick={(e) => e.stopPropagation()} // Chặn click row khi bấm vào ảnh
              />
              {record.is_hidden && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(255,255,255,0.7)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 6,
                  }}
                >
                  <EyeInvisibleOutlined style={{ color: "#888" }} />
                </div>
              )}
            </div>

            {/* Thông tin Text */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Text
                strong
                style={{
                  fontSize: 14,
                  lineHeight: "1.3",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
                title={record.name} // Tooltip native khi hover
              >
                {record.name}
              </Text>

              <Space size={6} align="center">
                {/* Mã SKU có nút copy */}
                <Tag
                  style={{
                    margin: 0,
                    fontSize: 11,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    border: "none",
                    background: "#f5f5f5"
                  }}
                  onClick={(e) => handleCopyId(e, record.id)}
                  title="Nhấn để copy mã"
                >
                  #{record.id} <CopyOutlined style={{ fontSize: 10, color: "#999" }} />
                </Tag>

                {isPendingUpdate && (
                  <Tag color="orange" style={{ margin: 0, fontSize: 10, border: "none" }}>
                    Chờ cập nhật
                  </Tag>
                )}
              </Space>
            </div>
          </div>
        );
      },
    },

    // ── 2. DANH MỤC (Cải thiện hiển thị phân cấp) ──
    {
      title: "Danh mục",
      dataIndex: "category_name",
      key: "category",
      width: 180,
      sorter: (a, b) => {
        const ac = (a.category_name || "").toString().toLowerCase();
        const bc = (b.category_name || "").toString().toLowerCase();
        if (ac === bc) {
          const as = (a.subcategory_name || "").toString().toLowerCase();
          const bs = (b.subcategory_name || "").toString().toLowerCase();
          return as.localeCompare(bs);
        }
        return ac.localeCompare(bc);
      },
      sortDirections: ["ascend", "descend"],
      render: (_, record) => (
        <div className="flex flex-col">
          {/* Breadcrumb danh mục cha - Nhạt màu */}
          {record.subcategory_name && record.category_name && (
            <span className="text-[11px] text-gray-400 mt-0.5">
              {record.category_name} &rsaquo; {record.subcategory_name}
            </span>
          )}
        </div>
      ),
    },

    // ── 3. GIÁ BÁN (Căn phải chuẩn tiền tệ) ──
    {
      title: "Giá bán",
      dataIndex: "discounted_price",
      key: "price",
      width: 130,
      align: "right", // Quan trọng cho cột số tiền
      sorter: (a, b) => {
        const ap = a.discounted_price ?? a.original_price ?? 0;
        const bp = b.discounted_price ?? b.original_price ?? 0;
        return ap - bp;
      },
      sortDirections: ["ascend", "descend"],
      render: (_, record) => {
        const isDiscounted = record.discounted_price && record.discounted_price < record.original_price;
        return (
          <div className="d-flex flex-column align-items-end justify-content-center h-100">
            {/* Giá hiện tại */}
            <span
              className={`fw-semibold ${isDiscounted ? "text-danger" : "text-dark"}`}
              style={{ fontSize: "14px" }}
            >
              {intcomma(record.discounted_price || record.original_price)} ₫
            </span>

            {/* Giá gốc (gạch ngang) */}
            {isDiscounted && (
              <span
                className="text-muted text-decoration-line-through"
                style={{ fontSize: "11px" }}
              >
                {intcomma(record.original_price)} ₫
              </span>
            )}
          </div>
        );
      },
    },

    // ── 4. KHO & ĐÃ BÁN (Bỏ border, dùng màu cảnh báo) ──
    {
      title: "Kho & Đã bán",
      dataIndex: "stock",
      key: "stock",
      width: 130,
      sorter: (a, b) => {
        const s = (a.stock ?? 0) - (b.stock ?? 0);
        return s !== 0 ? s : (a.sold ?? 0) - (b.sold ?? 0);
      },
      sortDirections: ["ascend", "descend"],
      render: (_, record) => {
        // Logic cảnh báo tồn kho
        const isOutOfStock = record.stock === 0;
        const isLowStock = record.stock > 0 && record.stock <= 10;

        // Màu sắc số lượng kho
        let stockColor = "text-gray-700"; // Bình thường
        if (isOutOfStock) stockColor = "text-red-600 font-bold"; // Hết hàng
        if (isLowStock) stockColor = "text-orange-600 font-bold"; // Sắp hết

        return (
          <div className="text-[13px]">
            {/* Dòng Kho */}
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-gray-500 text-[12px]">Kho:</span>
              <span className={stockColor}>
                {intcomma(record.stock)}
              </span>
            </div>

            {/* Dòng Đã bán */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-500 text-[12px]">Đã bán:</span>
              <span className="text-gray-700 font-medium">
                {intcomma(record.sold || 0)}
              </span>
            </div>
          </div>
        );
      },
    },

    // ── 5. TRẠNG THÁI (Dùng StatusTag mới) ──
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 150,
      align: "left", // Căn trái cho status nhìn thẳng hàng hơn
      sorter: (a, b) => {
        const av = (a.status || "").toString().toLowerCase();
        const bv = (b.status || "").toString().toLowerCase();
        return av.localeCompare(bv);
      },
      sortDirections: ["ascend", "descend"],
      render: (_, record) => {
        let showStatus = record.status;
        if (record.status === "approved" && record.is_hidden) showStatus = "hidden";

        const isRejected = ["rejected", "banned"].includes(record.status);
        const rejectReason = getRejectReason(record);

        return (
          <div className="flex flex-col items-start gap-2">
            {/* Tag trạng thái chính */}
            <StatusTag status={showStatus} type="status" />

            {/* Tag trạng thái hàng hóa (chỉ hiện nếu đặc biệt) */}
            {record.availability_status !== 'in_stock' && record.availability_status !== 'coming_soon' && (
              <StatusTag status={record.availability_status} type="availability" />
            )}

            {/* Link xem lý do từ chối */}
            {isRejected && rejectReason && (
              <Tooltip title={rejectReason} color="#f5222d" overlayStyle={{ maxWidth: 300 }}>
                <div className="flex items-center gap-1 text-red-500 text-[11px] cursor-pointer hover:underline pl-1">
                  <InfoCircleOutlined /> Xem lỗi
                </div>
              </Tooltip>
            )}
          </div>
        );
      },
    },

    // ── 6. THAO TÁC ──
    {
      title: "Thao tác",
      key: "action",
      width: 90,
      fixed: isMobile ? undefined : "right",
      align: "center",
      render: (_, record) => {
        const isBanned = record.status === "banned";
        const isRejected = record.status === "rejected";
        const isApproved = record.status === "approved";

        // Logic xóa an toàn
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
            tooltip: record.is_hidden ? "Hiển thị lại sản phẩm" : "Tạm ẩn sản phẩm",
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
                : "Chỉnh sửa thông tin",
            onClick: onEdit,
            buttonProps: {
              disabled: isBanned,
              style: isRejected
                ? { color: "#fa8c16", background: "#fff7e6" } // Highlight nút sửa nếu bị từ chối
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
              title: "Xóa sản phẩm này?",
              description: "Hành động này không thể hoàn tác.",
              okText: "Xóa ngay",
              okButtonProps: { danger: true },
              isDanger: true,
            },
          },
        ];

        return <ButtonAction actions={actions} record={record} />;
      },
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data || []}
      loading={loading}
      rowKey="id"


      // Pagination chuẩn Dashboard
      pagination={{
        current: data?.current_page, // Nếu data từ API có pagination
        pageSize: 10,
        showSizeChanger: true,
        pageSizeOptions: ["10", "20", "50", "100"],
        showTotal: (total, range) => (
          <span className="text-gray-500 text-xs">
            Hiển thị {range[0]}-{range[1]} trên tổng {total}
          </span>
        ),
      }}

      // Scroll & Sticky
      scroll={{ x: 1200 }} // Tinh chỉnh chiều cao cho vừa màn hình laptop
      sticky={{ offsetHeader: 0 }}

      onRow={onRow}
      rowSelection={{
        type: 'checkbox', // Kiểu chọn (checkbox hoặc radio)
        ...rowSelection,  // Kế thừa các config từ cha (selectedRowKeys, onChange...)
      }}

      // Row styling: Highlight nhẹ các dòng đặc biệt
      rowClassName={(record) => {
        let classes = "cursor-pointer transition-colors ";
        if (record.is_hidden) classes += "bg-gray-50 opacity-70 "; // Ẩn thì làm mờ
        else if (record.status === "rejected") classes += "bg-red-50 hover:bg-red-100 "; // Lỗi thì nền đỏ nhạt
        else classes += "bg-white hover:bg-blue-50 "; // Hover bình thường màu xanh nhạt
        return classes;
      }}
      size="middle"
    />
  );
};

export default ProductTable;