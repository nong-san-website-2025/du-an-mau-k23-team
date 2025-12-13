import React, { useState, useMemo } from "react";
import {
  Table,
  Tooltip,
  Image,
  Tag,
  Space,
  Typography,
  Card,
  List,
  Checkbox,
  Segmented,
  Button,
  message,
  Modal,
  Input,
  Radio,
  Popover, // Thêm Popover
} from "antd";
import {
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  AppstoreOutlined,
  BarsOutlined,
  ThunderboltFilled,
  HistoryOutlined, // Icon lịch sử
  WarningOutlined, // Icon cảnh báo
  ReloadOutlined, // Icon Re-up
} from "@ant-design/icons";
import dayjs from "dayjs"; // Cần import dayjs để format ngày
import ProductStatusTag from "./ProductStatusTag";
import { intcomma } from "../../../../../utils/format";

const { Text } = Typography;
const { TextArea } = Input;

// --- Helper ---
const checkIsPending = (status) => {
  if (!status) return false;
  const s = status.toLowerCase();
  return s === "pending" || s === "pending_update";
};

// --- Sub-component: Grid Item ---
const ProductGridItem = ({
  record,
  isSelected,
  onSelect,
  onView,
  onApprove,
  onOpenReject,
}) => {
  const isPending = checkIsPending(record.status);
  const aiScore = record.ai_score || 0;
  const isHighRisk = aiScore > 80;
  const isReup = record.is_reup; // Check cờ Re-up

  const cardActions = isPending
    ? [
        <Tooltip title="Duyệt ngay" key="approve">
          <CheckOutlined
            style={{ color: "#52c41a", fontSize: 20 }}
            onClick={(e) => {
              e.stopPropagation();
              onApprove(record.id);
            }}
          />
        </Tooltip>,
        <Tooltip title="Từ chối" key="reject">
          <CloseOutlined
            style={{ color: "#ff4d4f", fontSize: 20 }}
            onClick={(e) => {
              e.stopPropagation();
              onOpenReject(record.id);
            }}
          />
        </Tooltip>,
      ]
    : [
        <Tooltip title="Xem chi tiết" key="view">
          <EyeOutlined
            onClick={(e) => {
              e.stopPropagation();
              onView(record);
            }}
          />
        </Tooltip>,
        <Text key="status" type="secondary" style={{ fontSize: 12 }}>
          {record.status === "approved" ? "Đã duyệt" : "Đã dừng"}
        </Text>,
      ];

  return (
    <Card
      hoverable
      bordered={isSelected || isReup} // Viền đỏ nếu là Spam
      actions={cardActions}
      style={{
        position: "relative",
        borderColor: isSelected ? "#1890ff" : isReup ? "#ff4d4f" : "#f0f0f0",
        backgroundColor: isSelected ? "#e6f7ff" : "#fff",
      }}
      bodyStyle={{ padding: 8 }}
      onClick={() => onSelect(record.id)}
    >
      {/* Risk Tag */}
      <div
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          gap: 4,
          alignItems: "flex-end",
        }}
      >
        {isHighRisk && (
          <Tag color="error" icon={<ThunderboltFilled />}>
            {aiScore}%
          </Tag>
        )}
        {/* Re-up Tag cho Grid View */}
        {isReup && (
          <Tag color="#722ed1" style={{ marginRight: 0 }}>
            <ReloadOutlined /> Spam
          </Tag>
        )}
      </div>

      <div style={{ position: "absolute", top: 8, left: 8, zIndex: 2 }}>
        <Checkbox checked={isSelected} />
      </div>

      <div
        style={{
          height: 160,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f5f5",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <Image
          preview={false}
          src={record.main_image?.image || record.images?.[0]?.image}
          fallback="https://placehold.co/150x150?text=No+Image"
          style={{ objectFit: "cover", width: "100%", height: 160 }}
        />
      </div>
      <div style={{ marginTop: 8 }}>
        <Tooltip title={record.name}>
          <Text strong style={{ fontSize: 13 }} ellipsis={{ rows: 2 }}>
            {record.name}
          </Text>
        </Tooltip>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 4,
          }}
        >
          <Text type="danger" strong>
            {intcomma(record.discounted_price || record.price)} ₫
          </Text>
          {isPending && (
            <Tag color="warning" style={{ fontSize: 10, marginRight: 0 }}>
              Chờ duyệt
            </Tag>
          )}
        </div>
        <Text type="secondary" style={{ fontSize: 11 }}>
          {record.seller?.store_name ||
            record.seller_name ||
            record.store_name ||
            "Không có tên shop"}
        </Text>
      </div>
    </Card>
  );
};

// --- Component Chính ---
const ProductManager = ({
  data,
  onApprove,
  onReject,
  onView,
  selectedRowKeys,
  setSelectedRowKeys,
}) => {
  const [viewMode, setViewMode] = useState("table");

  // --- State cho Modal Từ Chối ---
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectIds, setRejectIds] = useState([]);
  const [rejectReason, setRejectReason] = useState("");
  const [quickReason, setQuickReason] = useState("");

  const quickReasons = [
    { label: "Hàng giả/Nhái thương hiệu", value: "Hàng giả/Nhái thương hiệu" },
    {
      label: "Nội dung/Hình ảnh nhạy cảm",
      value: "Nội dung/Hình ảnh nhạy cảm",
    },
    { label: "Spam/Trùng lặp sản phẩm", value: "Spam/Trùng lặp sản phẩm" },
    { label: "Sai danh mục ngành hàng", value: "Sai danh mục ngành hàng" },
    { label: "Khác", value: "other" },
  ];

  // --- Logic Grid ---
  const handleGridSelect = (id) => {
    const newSelected = selectedRowKeys.includes(id)
      ? selectedRowKeys.filter((key) => key !== id)
      : [...selectedRowKeys, id];
    setSelectedRowKeys(newSelected);
  };

  const pendingSelectedItems = useMemo(() => {
    return data.filter(
      (item) => selectedRowKeys.includes(item.id) && checkIsPending(item.status)
    );
  }, [data, selectedRowKeys]);

  const hasPendingItems = pendingSelectedItems.length > 0;

  // --- Handlers ---
  const handleOpenRejectModal = (ids) => {
    const idArray = Array.isArray(ids) ? ids : [ids];
    if (idArray.length === 0) return;
    setRejectIds(idArray);
    setRejectReason("");
    setQuickReason("");
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = () => {
    const finalReason =
      quickReason === "other" || !quickReason ? rejectReason : quickReason;
    if (!finalReason.trim()) {
      message.error("Vui lòng nhập hoặc chọn lý do từ chối!");
      return;
    }
    onReject(rejectIds, finalReason);
    setIsRejectModalOpen(false);
  };

  const handleBulkApprove = () => {
    if (!hasPendingItems) return;
    const ids = pendingSelectedItems.map((i) => i.id);
    onApprove(ids);
  };

  // --- Columns cho Table ---
  const tableColumns = [
    {
      title: "Ảnh",
      key: "image",
      width: 80,
      align: "center",
      render: (_, r) => (
        <Image
          src={r.main_image?.image || r.images?.[0]?.image}
          width={60}
          height={40}
          style={{ objectFit: "cover", borderRadius: 4 }}
        />
      ),
    },
    {
      title: "Tên sản phẩm",
      key: "name",
      width: 300,
      render: (_, record) => (
        <Space direction="vertical" size={2} style={{ width: "100%" }}>
          <Text
            strong
            style={{ cursor: "pointer", color: "#1890ff" }}
            onClick={() => onView(record)}
          >
            {record.name}
          </Text>

          {/* --- CẢNH BÁO RE-UP (SPAM) --- */}
          {record.is_reup &&
            record.reupHistory &&
            record.reupHistory.length > 0 && (
              <Popover
                title={
                  <span style={{ color: "red" }}>
                    <WarningOutlined /> Lịch sử vi phạm cũ
                  </span>
                }
                content={
                  <div
                    style={{ maxWidth: 350, maxHeight: 300, overflowY: "auto" }}
                  >
                    <p>
                      Sản phẩm này có tên trùng với{" "}
                      <b>{record.reupHistory.length}</b> sản phẩm đã xóa:
                    </p>
                    <ul style={{ paddingLeft: 20, margin: 0 }}>
                      {record.reupHistory.map((item, idx) => (
                        <li
                          key={idx}
                          style={{
                            marginBottom: 8,
                            borderBottom: "1px dashed #eee",
                            paddingBottom: 4,
                          }}
                        >
                          <div style={{ fontSize: 12, color: "#888" }}>
                            {dayjs(item.updated_at).format("DD/MM/YYYY HH:mm")}
                          </div>
                          <div>
                            <Tag color="error">{item.status}</Tag>
                            Giá: <b>{intcomma(item.price)}đ</b>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                }
              >
                <Tag
                  icon={<HistoryOutlined />}
                  color="#fff1f0"
                  style={{
                    color: "#cf1322",
                    border: "1px solid #ffa39e",
                    cursor: "help",
                    width: "fit-content",
                  }}
                >
                  ⚠️ Trùng {record.reupHistory.length} lần cũ
                </Tag>
              </Popover>
            )}
        </Space>
      ),
    },
    {
      title: "Giá",
      dataIndex: "price",
      width: 120,
      render: (v) => intcomma(v),
    },
    {
      title: "Shop",
      width: 150,
      render: (_, r) =>
        r.seller?.store_name ||
        r.seller_name ||
        r.store_name || <Text type="secondary">Không có tên</Text>,
    },
    {
      title: "Trạng thái",
      width: 140,
      render: (_, r) => <ProductStatusTag status={r.status} />,
    },
    {
      title: "Hành động",
      key: "action",
      width: 120,
      align: "center",
      render: (_, record) => {
        const isPending = checkIsPending(record.status);
        return (
          <Space>
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => onView(record)}
            />
            {isPending && (
              <>
                <Button
                  size="small"
                  type="primary"
                  icon={<CheckOutlined />}
                  style={{ background: "#52c41a", borderColor: "#52c41a" }}
                  onClick={() => onApprove(record.id)}
                />
                <Button
                  size="small"
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => handleOpenRejectModal(record.id)}
                />
              </>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ position: "relative", paddingBottom: 60 }}>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Segmented
          options={[
            { label: "List", value: "table", icon: <BarsOutlined /> },
            { label: "Grid (Spam)", value: "grid", icon: <AppstoreOutlined /> },
          ]}
          value={viewMode}
          onChange={setViewMode}
        />
      </div>

      {viewMode === "table" ? (
        <Table
          rowKey="id"
          bordered
          size="small"
          dataSource={data}
          columns={tableColumns}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          pagination={{ pageSize: 20 }}
          scroll={{ x: 1000 }}
        />
      ) : (
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, lg: 4, xl: 5 }}
          dataSource={data}
          pagination={{ pageSize: 24 }}
          renderItem={(item) => (
            <List.Item style={{ marginBottom: 16 }}>
              <ProductGridItem
                record={item}
                isSelected={selectedRowKeys.includes(item.id)}
                onSelect={handleGridSelect}
                onView={onView}
                onApprove={onApprove}
                onOpenReject={handleOpenRejectModal}
              />
            </List.Item>
          )}
        />
      )}

      {/* STICKY FOOTER */}
      {selectedRowKeys.length > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#262626",
            padding: "12px 24px",
            borderRadius: 30,
            boxShadow: "0 6px 16px rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            gap: 16,
            zIndex: 1000,
            color: "#fff",
          }}
        >
          <Text style={{ color: "#fff" }}>
            Đã chọn{" "}
            <strong style={{ color: "#1890ff", fontSize: 16 }}>
              {selectedRowKeys.length}
            </strong>{" "}
            sản phẩm
          </Text>
          {selectedRowKeys.length > pendingSelectedItems.length && (
            <Text type="secondary" style={{ fontSize: 11, color: "#aaa" }}>
              (Chỉ {pendingSelectedItems.length} chờ duyệt)
            </Text>
          )}
          <div style={{ width: 1, height: 20, background: "#555" }}></div>
          <Space>
            <Button ghost size="small" onClick={() => setSelectedRowKeys([])}>
              Bỏ chọn
            </Button>
            <Button
              type="primary"
              shape="round"
              icon={<CheckOutlined />}
              onClick={handleBulkApprove}
              disabled={!hasPendingItems}
              style={{
                backgroundColor: hasPendingItems ? "#52c41a" : "#555",
                borderColor: hasPendingItems ? "#52c41a" : "#555",
                opacity: hasPendingItems ? 1 : 0.5,
              }}
            >
              Duyệt ({pendingSelectedItems.length})
            </Button>
            <Button
              type="primary"
              danger
              shape="round"
              icon={<CloseOutlined />}
              disabled={!hasPendingItems}
              style={{ opacity: hasPendingItems ? 1 : 0.5 }}
              onClick={() =>
                handleOpenRejectModal(pendingSelectedItems.map((i) => i.id))
              }
            >
              Từ chối ({pendingSelectedItems.length})
            </Button>
          </Space>
        </div>
      )}

      {/* --- MODAL NHẬP LÝ DO TỪ CHỐI --- */}
      <Modal
        title={
          <span>
            <CloseOutlined style={{ color: "red" }} /> Xác nhận từ chối{" "}
            {rejectIds.length} sản phẩm
          </span>
        }
        open={isRejectModalOpen}
        onOk={handleConfirmReject}
        onCancel={() => setIsRejectModalOpen(false)}
        okText="Xác nhận từ chối"
        okButtonProps={{ danger: true }}
        cancelText="Hủy"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Text strong>Chọn lý do nhanh:</Text>
          <Radio.Group
            onChange={(e) => setQuickReason(e.target.value)}
            value={quickReason}
            style={{ display: "flex", flexDirection: "column", gap: 8 }}
          >
            {quickReasons.map((r) => (
              <Radio key={r.value} value={r.value}>
                {r.label}
              </Radio>
            ))}
          </Radio.Group>

          {(quickReason === "other" || !quickReason) && (
            <>
              <Text strong style={{ marginTop: 8 }}>
                Chi tiết lý do (Bắt buộc):
              </Text>
              <TextArea
                rows={4}
                placeholder="Nhập lý do chi tiết gửi đến người bán..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ProductManager;
