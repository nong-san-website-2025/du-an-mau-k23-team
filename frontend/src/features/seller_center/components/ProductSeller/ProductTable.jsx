import React from "react";
import { Table, Typography, Image, Avatar, Tag, Tooltip, Grid, Space } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  FileImageOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
  BarcodeOutlined,
  HistoryOutlined // Icon thêm cho trạng thái pending update
} from "@ant-design/icons";
import dayjs from "dayjs";
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
  // Ưu tiên dùng Hook của Antd: Chuẩn hơn và reactive tốt hơn matchMedia thủ công
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  // --- Helper lấy lý do từ chối (Giữ từ HEAD) ---
  const getRejectReason = (record) => {
    return record.reject_reason || record.admin_note || record.reason || record.message;
  };

  const columns = [
    // ── 1. SẢN PHẨM (Định danh) ──
    {
      title: "Sản phẩm",
      key: "name",
      width: 280,
      fixed: isMobile ? undefined : "left",
      render: (_, record) => {
        let imageUrl = null;
        if (Array.isArray(record.images) && record.images.length > 0) {
          imageUrl = record.images.find((img) => img.is_primary)?.image || record.images[0]?.image;
        }
        // Logic từ MinhKhanh: Check trạng thái chờ update
        const isPendingUpdate = record.status === "pending_update";

        return (
          <div className="flex gap-3 items-center">
            {/* Ảnh Thumbnail */}
            <div onClick={(e) => e.stopPropagation()} className="shrink-0">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  width={52}
                  height={52}
                  className="rounded border border-gray-200 object-cover"
                  fallback="/no-image.png"
                />
              ) : (
                <Avatar shape="square" size={52} icon={<FileImageOutlined />} className="bg-gray-100 text-gray-400 rounded" />
              )}
            </div>

            {/* Tên & ID */}
            <div className="flex flex-col gap-0.5">
              <Tooltip title={record.name} placement="topLeft" mouseEnterDelay={0.8}>
                <Text strong className="text-[14px] leading-tight line-clamp-2 text-gray-800 hover:text-green-600 transition-colors">
                  {record.name}
                </Text>
              </Tooltip>
              
              <div className="flex items-center gap-2 flex-wrap">
                <Text type="secondary" className="text-[11px] flex items-center gap-1">
                  <BarcodeOutlined /> #{record.id}
                </Text>
                
                {/* Logic hiển thị Tag Pending Update (Merge từ MinhKhanh) */}
                {isPendingUpdate && (
                  <Tag color="orange" icon={<HistoryOutlined />} className="text-[10px] m-0 border-0 bg-orange-50 text-orange-600 px-1 py-0 leading-tight">
                    Chờ duyệt cập nhật
                  </Tag>
                )}
              </div>
            </div>
          </div>
        );
      },
    },

    // ── 2. DANH MỤC ──
    {
      title: "Danh mục",
      key: "category",
      width: 150,
      render: (_, record) => (
        <div className="flex flex-col justify-center">
          <span className="text-[13px] font-medium text-gray-700">{record.category_name || "---"}</span>
          {record.subcategory_name && (
            <span className="text-[11px] text-gray-400">{record.subcategory_name}</span>
          )}
        </div>
      ),
    },

    // ── 3. GIÁ BÁN (Tách riêng theo UI HEAD cho thoáng) ──
    {
      title: "Giá bán",
      key: "price",
      width: 140,
      align: "right",
      render: (_, record) => {
        const isDiscounted = record.discounted_price && record.discounted_price < record.original_price;
        return (
          <div className="flex flex-col items-end">
            <Text className={`text-[14px] font-semibold ${isDiscounted ? "text-rose-600" : "text-gray-800"}`}>
              {intcomma(record.discounted_price || record.original_price)} đ
            </Text>
            {isDiscounted && (
              <Text delete className="text-[11px] text-gray-400">
                {intcomma(record.original_price)} đ
              </Text>
            )}
          </div>
        );
      },
    },

    // ── 4. KHO & ĐÃ BÁN (Tách riêng - Có cảnh báo màu sắc từ HEAD) ──
    {
      title: "Kho & Đã bán",
      key: "stock",
      width: 140,
      align: "center",
      render: (_, record) => {
        // Logic màu sắc: Hết hàng (Đỏ), Sắp hết < 10 (Cam), Còn nhiều (Xanh)
        let colorClass = "text-green-600 bg-green-50 border-green-200";
        if (record.stock === 0) colorClass = "text-red-600 bg-red-50 border-red-200";
        else if (record.stock <= 10) colorClass = "text-orange-600 bg-orange-50 border-orange-200";

        return (
          <div className="flex flex-col items-center gap-1">
            {/* Badge Tồn kho */}
            <div className={`px-2 py-0.5 rounded text-[12px] font-bold border ${colorClass}`}>
              Kho: {intcomma(record.stock)}
            </div>

            {/* Text Đã bán */}
            {record.sold > 0 ? (
              <span className="text-[11px] text-gray-500">Đã bán: {intcomma(record.sold)}</span>
            ) : (
              <span className="text-[11px] text-gray-300 italic">Chưa bán</span>
            )}
          </div>
        );
      },
    },

    // ── 5. TRẠNG THÁI ──
    {
      title: "Trạng thái",
      key: "status",
      width: 140,
      align: "center",
      render: (_, record) => {
        let showStatus = record.status;
        if (record.status === "approved" && record.is_hidden) showStatus = "hidden";

        const isRejected = ["rejected", "banned"].includes(record.status);
        const rejectReason = getRejectReason(record);

        return (
          <div className="flex flex-col items-center gap-1.5">
            <StatusTag status={showStatus} type="status" />

            {/* Chỉ hiện tag phụ nếu khác 'in_stock' để đỡ rối */}
            {record.availability_status !== 'in_stock' && record.availability_status !== 'coming_soon' && (
              <div className="scale-90"><StatusTag status={record.availability_status} type="availability" /></div>
            )}

            {/* Nút xem lý do từ chối (UX quan trọng) */}
            {isRejected && rejectReason && (
              <Tooltip title={rejectReason} color="#f5222d" overlayStyle={{ maxWidth: 300 }}>
                <div className="flex items-center gap-1 text-red-500 text-[11px] cursor-pointer hover:underline">
                  <InfoCircleOutlined /> Chi tiết
                </div>
              </Tooltip>
            )}
          </div>
        );
      },
    },

    // ── 6. THỜI GIAN MÙA VỤ ──
    {
      title: "Thời gian mùa vụ",
      key: "season",
      width: 190,
      render: (_, record) => {
        if (record.availability_status !== "coming_soon") return <span className="text-gray-300 text-xs">—</span>;

        const start = record.season_start ? dayjs(record.season_start).format("DD/MM") : "?";
        const end = record.season_end ? dayjs(record.season_end).format("DD/MM") : "?";

        return (
          <div className="text-xs">
            <div className="flex items-center gap-1.5 text-gray-700 mb-1">
              <CalendarOutlined className="text-purple-500" />
              <span className="font-medium">{start} - {end}</span>
            </div>
            <div className="flex gap-2 text-gray-500 text-[10px]">
              <span title="Dự kiến thu hoạch">DK: <b>{intcomma(record.estimated_quantity)}</b></span>
              {record.ordered_quantity > 0 && (
                <span title="Đã được đặt trước" className="text-blue-600">
                  Đặt: <b>{intcomma(record.ordered_quantity)}</b>
                </span>
              )}
            </div>
          </div>
        );
      },
    },

    // ── 7. THAO TÁC (Merge Logic kiểm tra quyền xóa từ cả 2) ──
    {
      title: "Xử lý",
      key: "action",
      width: 80,
      fixed: isMobile ? undefined : "right",
      align: "center",
      render: (_, record) => {
        const isBanned = record.status === "banned";
        const isRejected = record.status === "rejected";
        const isApproved = record.status === "approved";
        
        // Logic xóa an toàn: Kết hợp điều kiện chặt chẽ
        const canDelete =
          (record.sold === 0 || !record.sold) &&
          (record.ordered_quantity === 0 || !record.ordered_quantity) &&
          !isBanned;

        const actions = [
          {
            actionType: "view",
            show: true,
            icon: <EyeOutlined />,
            tooltip: "Chi tiết",
            onClick: onView,
          },
          {
            actionType: "toggle_hide",
            show: isApproved, // Chỉ hiện khi đã duyệt
            icon: record.is_hidden ? <EyeOutlined /> : <EyeInvisibleOutlined />,
            tooltip: record.is_hidden ? "Hiển thị lại" : "Tạm ẩn", // Text tooltip rõ nghĩa từ MinhKhanh
            onClick: () => onToggleHide(record),
          },
          {
            actionType: "edit",
            show: true,
            icon: <EditOutlined />,
            // Tooltip chi tiết theo ngữ cảnh từ MinhKhanh
            tooltip: isBanned
              ? "Sản phẩm bị khóa"
              : isRejected
                ? "Sửa lỗi & Gửi duyệt lại"
                : "Chỉnh sửa",
            onClick: onEdit,
            buttonProps: {
              disabled: isBanned,
              style: isRejected
                ? { color: "#fa8c16", borderColor: "#fa8c16" } // Highlight màu cam nếu cần sửa lỗi
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
              title: "Xóa vĩnh viễn?",
              okText: "Xóa",
              okButtonProps: { danger: true }
            },
            buttonProps: { danger: true },
          },
        ];

        return <ButtonAction actions={actions} record={record} maxCount={2} />;
      },
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data || []}
      loading={loading}
      rowKey="id"

      // Pagination chuẩn UI Dashboard
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50'],
        showTotal: (total, range) => (
          <span className="text-gray-500 text-xs">
            {range[0]}-{range[1]} / {total}
          </span>
        ),
      }}

      // Scroll responsive tốt (Lấy từ HEAD)
      scroll={{ x: 1300, y: 'calc(100vh - 260px)' }}
      sticky
      onRow={onRow}
      rowSelection={rowSelection}

      // Row Styling: Merge logic highlight màu đỏ khi rejected
      rowClassName={(record) => {
        let classes = "align-middle text-[13px] transition-colors ";
        if (record.is_hidden) classes += "opacity-60 bg-gray-50 ";
        else if (record.status === "rejected") classes += "bg-red-50 hover:bg-red-100 "; // Highlight rejected
        else classes += "bg-white hover:bg-slate-50 ";
        
        return classes;
      }}
      size="middle"
    />
  );
};

export default ProductTable;