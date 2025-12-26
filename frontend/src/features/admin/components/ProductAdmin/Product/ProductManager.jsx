import React, { useState, useEffect, useRef } from "react";
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
  Avatar,
  notification,
  Badge,
} from "antd";
import {
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  AppstoreOutlined,
  BarsOutlined,
  ThunderboltFilled,
  ReloadOutlined,
  ShopOutlined,
  DiffOutlined,
  LockOutlined,
} from "@ant-design/icons";
import { intcomma } from "../../../../../utils/format";
import ButtonAction from "../../../../../components/ButtonAction";
import ProductStatusTag from "./ProductStatusTag";
import dayjs from "dayjs";

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

const ProductGridItem = ({
  record,
  isSelected,
  onSelect,
  onView,
  onApprove,
  onOpenReject,
  onCompare,
  onOpenLock,
}) => {
  const isPending = ["pending", "pending_update"].includes(
    record.status?.toLowerCase()
  );
  const isUpdate = record.status === "pending_update";

  return (
    <Card
      hoverable
      bordered={false}
      style={{
        height: "100%",
        borderRadius: 12,
        boxShadow: isSelected
          ? "0 0 0 2px #1890ff"
          : "0 2px 8px rgba(0,0,0,0.06)",
        overflow: "hidden",
        position: "relative",
      }}
      bodyStyle={{
        padding: 0,
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
      onClick={() => onSelect(record.id)}
    >
      <div style={{ position: "absolute", top: 12, left: 12, zIndex: 10 }}>
        <Checkbox checked={isSelected} style={{ transform: "scale(1.2)" }} />
      </div>

      <div
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {record.ai_score > 80 && (
          <Tag color="error" icon={<ThunderboltFilled />}>
            {record.ai_score}% Risk
          </Tag>
        )}
        {record.is_reup && (
          <Tag color="#722ed1" icon={<ReloadOutlined />}>
            Re-up
          </Tag>
        )}
        {isUpdate && (
          <Tag color="processing" icon={<DiffOutlined />}>
            Cập nhật
          </Tag>
        )}
      </div>

      <div style={{ height: 180, background: "#f5f5f5" }}>
        <Image
          preview={false}
          src={record.main_image?.image || record.images?.[0]?.image}
          fallback="https://placehold.co/300x300/eee/999?text=No+Image"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      <div style={{ padding: 16, flex: 1 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          <ShopOutlined /> {record.seller?.store_name}
        </Text>
        <Tooltip title={record.name}>
          <Paragraph
            ellipsis={{ rows: 2 }}
            strong
            style={{ marginBottom: 8, height: 44 }}
          >
            {record.name}
          </Paragraph>
        </Tooltip>
        {record.is_new && (
          <Tag color="green" style={{ marginBottom: 6 }}>
            Mới
          </Tag>
        )}
        <Text type="danger" style={{ fontSize: 16, fontWeight: 700 }}>
          {intcomma(record.price)} ₫
        </Text>
      </div>

      <div
        style={{
          borderTop: "1px solid #f0f0f0",
          background: "#fafafa",
          display: "flex",
          height: 40,
        }}
      >
        {isPending ? (
          <>
            <Button
              type="text"
              danger
              style={{ flex: 1 }}
              onClick={(e) => {
                e.stopPropagation();
                onOpenReject(record.id);
              }}
            >
              Từ chối
            </Button>
            {isUpdate ? (
              <Button
                type="text"
                style={{ flex: 1, color: "#1890ff" }}
                onClick={(e) => {
                  e.stopPropagation();
                  onCompare(record);
                }}
              >
                So sánh
              </Button>
            ) : (
              <Button
                type="text"
                style={{ flex: 1, color: "#52c41a" }}
                onClick={(e) => {
                  e.stopPropagation();
                  onApprove(record.id);
                }}
              >
                Duyệt
              </Button>
            )}
          </>
        ) : (
          <Button
            type="text"
            block
            onClick={(e) => {
              e.stopPropagation();
              onView(record);
            }}
          >
            Xem chi tiết
          </Button>
        )}
      </div>
    </Card>
  );
};

const ProductManager = ({
  data: initialData,
  onApprove,
  onReject,
  onLock,
  onUnban,
  onView,
  onViewShop,
  onCompare,
  selectedRowKeys,
  setSelectedRowKeys,
  viewModeProp = "table",
}) => {
  const [productList, setProductList] = useState(initialData);
  const [viewMode, setViewMode] = useState(viewModeProp);
  const [isMobile, setIsMobile] = useState(false);

  // Ref cho WebSocket
  const socketRef = useRef(null);

  const [rejectModal, setRejectModal] = useState({
    open: false,
    ids: [],
    reason: "",
    quickReason: "",
  });
  const [lockModal, setLockModal] = useState({
    open: false,
    ids: [],
    reason: "",
  });

  useEffect(() => {
    setProductList(initialData);
  }, [initialData]);

  // --- REALTIME LOGIC (NATIVE WEBSOCKET) ---


  // Responsive detect
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 480px)");
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Actions logic
  const handleApprove = async (ids) => {
    const idArray = Array.isArray(ids) ? ids : [ids];
    try {
      await onApprove(idArray);
      setProductList((prev) =>
        prev.map((p) =>
          idArray.includes(p.id) ? { ...p, status: "active" } : p
        )
      );
      setSelectedRowKeys([]);
      message.success("Đã duyệt sản phẩm");
    } catch (err) {
      message.error("Lỗi khi duyệt");
    }
  };

  const confirmReject = async () => {
    const reason =
      rejectModal.quickReason === "other"
        ? rejectModal.reason
        : rejectModal.quickReason;
    if (!reason) return message.error("Vui lòng chọn lý do!");
    await onReject(rejectModal.ids, reason);
    setProductList((prev) =>
      prev.map((p) =>
        rejectModal.ids.includes(p.id) ? { ...p, status: "rejected" } : p
      )
    );
    setRejectModal({ ...rejectModal, open: false });
    setSelectedRowKeys([]);
  };

  // --- CẬP NHẬT COLUMNS: THÊM TÍNH NĂNG CLICK-TO-SORT ---
  const columns = [
    {
      title: "Sản phẩm",
      key: "name",
      width: 350,
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (_, r) => (
        <Space size={12}>
          <Badge dot={r.status === "pending_update"} offset={[-2, 60]}>
            <Image
              src={r.main_image?.image}
              width={64}
              height={64}
              style={{ borderRadius: 8, objectFit: "cover" }}
              fallback="https://placehold.co/64"
            />
          </Badge>
          <div style={{ maxWidth: 240 }}>
            <Text strong block ellipsis={{ tooltip: r.name }}>
              {r.name}
            </Text>
            {r.is_new && (
              <Tag color="green" style={{ marginLeft: 6 }}>
                Mới
              </Tag>
            )}
            <Text type="danger" strong>
              {intcomma(r.price)}₫
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Người bán",
      width: 200,
      sorter: (a, b) => (a.seller?.store_name || "").localeCompare(b.seller?.store_name || ""),
      render: (_, r) => (
        <Space
          onClick={() => onViewShop?.(r.seller)}
          style={{ cursor: "pointer" }}
        >
          <Avatar size="small" src={r.seller?.avatar} icon={<ShopOutlined />} />
          <Text>{r.seller?.store_name || "N/A"}</Text>
        </Space>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 140,
      sorter: (a, b) => a.status.localeCompare(b.status),
      render: (st) => <ProductStatusTag status={st} />,
    },
    {
      title: "Ngày đăng",
      dataIndex: "created_at",
      width: 160,
      sorter: (a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0),
      render: (date) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Text>
            {date ? dayjs(date).format("DD/MM/YYYY") : '—'}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {date ? dayjs(date).format("HH:mm") : ''}
          </Text>
        </div>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 150,
      fixed: isMobile ? false : "right",
      render: (_, r) => {
        const actions = [
          {
            actionType: "view",
            icon: <EyeOutlined />,
            tooltip: "Xem chi tiết",
            onClick: () => onView(r),
          },
          {
            actionType: "approve",
            icon: <CheckOutlined />,
            tooltip: "Duyệt",
            show: r.status === "pending",
            onClick: () => handleApprove(r.id),
          },
          {
            actionType: "update",
            icon: <DiffOutlined />,
            tooltip: "So sánh",
            show: r.status === "pending_update",
            onClick: () => onCompare(r),
          },
          {
            actionType: "reject",
            icon: <CloseOutlined />,
            tooltip: "Từ chối",
            show: ["pending", "pending_update"].includes(r.status),
            onClick: () =>
              setRejectModal({
                open: true,
                ids: [r.id],
                reason: "",
                quickReason: "",
              }),
          },
          {
            actionType: "lock",
            icon: <LockOutlined />,
            tooltip: "Khóa",
            show: r.status === "active",
            buttonProps: { style: { color: "#faad14" } },
            onClick: () =>
              setLockModal({ open: true, ids: [r.id], reason: "" }),
          },
        ];
        return <ButtonAction actions={actions} record={r} />;
      },
    },
  ];

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
          alignItems: "center",
        }}
      >
        <Text type="secondary">
          Tổng số: <b>{productList.length}</b> sản phẩm
        </Text>
        <Segmented
          options={[
            { label: "Danh sách", value: "table", icon: <BarsOutlined /> },
            { label: "Lưới ảnh", value: "grid", icon: <AppstoreOutlined /> },
          ]}
          value={viewMode}
          onChange={setViewMode}
        />
      </div>

      {viewMode === "table" ? (
        <Table
          rowKey="id"
          dataSource={productList}
          columns={columns}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1000 }}
          size={isMobile ? "small" : "middle"}
        />
      ) : (
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4, xl: 5 }}
          dataSource={productList}
          renderItem={(item) => (
            <List.Item>
              <ProductGridItem
                record={item}
                isSelected={selectedRowKeys.includes(item.id)}
                onSelect={(id) =>
                  setSelectedRowKeys((prev) =>
                    prev.includes(id)
                      ? prev.filter((k) => k !== id)
                      : [...prev, id]
                  )
                }
                onApprove={handleApprove}
                onOpenReject={(id) =>
                  setRejectModal({
                    open: true,
                    ids: [id],
                    reason: "",
                    quickReason: "",
                  })
                }
                onOpenLock={(id) =>
                  setLockModal({ open: true, ids: [id], reason: "" })
                }
                onView={onView}
                onCompare={onCompare}
              />
            </List.Item>
          )}
        />
      )}

      {selectedRowKeys.length > 0 && (
        <div style={actionBarStyle}>
          <Space size={20}>
            <Text style={{ color: "#fff" }}>
              Đã chọn{" "}
              <b style={{ color: "#40a9ff" }}>{selectedRowKeys.length}</b>
            </Text>
            <Button ghost onClick={() => setSelectedRowKeys([])}>
              Hủy
            </Button>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => handleApprove(selectedRowKeys)}
            >
              Duyệt hàng loạt
            </Button>
            <Button
              danger
              icon={<CloseOutlined />}
              onClick={() =>
                setRejectModal({
                  open: true,
                  ids: selectedRowKeys,
                  reason: "",
                  quickReason: "",
                })
              }
            >
              Từ chối
            </Button>
          </Space>
        </div>
      )}

      {/* --- MODALS --- */}
      <Modal
        title="Lý do từ chối"
        open={rejectModal.open}
        onOk={confirmReject}
        onCancel={() => setRejectModal({ ...rejectModal, open: false })}
        okButtonProps={{ danger: true }}
      >
        <Radio.Group
          value={rejectModal.quickReason}
          onChange={(e) =>
            setRejectModal({ ...rejectModal, quickReason: e.target.value })
          }
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <Radio value="Hàng giả/nhái">Hàng giả/nhái thương hiệu</Radio>
          <Radio value="Nội dung nhạy cảm">Hình ảnh/Nội dung nhạy cảm</Radio>
          <Radio value="Sai danh mục">Sai danh mục ngành hàng</Radio>
          <Radio value="other">Lý do khác...</Radio>
        </Radio.Group>
        {rejectModal.quickReason === "other" && (
          <TextArea
            rows={3}
            style={{ marginTop: 15 }}
            placeholder="Nhập chi tiết..."
            value={rejectModal.reason}
            onChange={(e) =>
              setRejectModal({ ...rejectModal, reason: e.target.value })
            }
          />
        )}
      </Modal>

      <Modal
        title="Khóa sản phẩm"
        open={lockModal.open}
        onOk={() => {
          onLock(lockModal.ids, lockModal.reason);
          setLockModal({ ...lockModal, open: false });
        }}
        onCancel={() => setLockModal({ ...lockModal, open: false })}
      >
        <Text type="secondary">
          Sản phẩm bị khóa sẽ bị gỡ khỏi sàn ngay lập tức.
        </Text>
        <TextArea
          rows={4}
          style={{ marginTop: 15 }}
          placeholder="Nhập lý do khóa..."
          value={lockModal.reason}
          onChange={(e) =>
            setLockModal({ ...lockModal, reason: e.target.value })
          }
        />
      </Modal>
    </div>
  );
};

const actionBarStyle = {
  position: "fixed",
  bottom: 40,
  left: "50%",
  transform: "translateX(-50%)",
  background: "rgba(0, 0, 0, 0.8)",
  padding: "12px 30px",
  borderRadius: "50px",
  zIndex: 1000,
  boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
  backdropFilter: "blur(4px)",
};

export default ProductManager;