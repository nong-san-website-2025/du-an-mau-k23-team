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
  Popover,
  Timeline,
  Avatar,
} from "antd";
import {
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  AppstoreOutlined,
  BarsOutlined,
  ThunderboltFilled,
  WarningOutlined,
  ReloadOutlined,
  ShopOutlined,
  CloseCircleOutlined,
  DiffOutlined,
  PictureOutlined, // Icon cho nút So sánh
} from "@ant-design/icons";
import dayjs from "dayjs";
// Giả định các components con và utils đã tồn tại trong dự án của bạn
import ProductStatusTag from "./ProductStatusTag";
import { intcomma } from "../../../../../utils/format";

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

// --- Helper Functions ---
// Kiểm tra xem sản phẩm có đang chờ xử lý không
const checkIsPending = (status) => ["pending", "pending_update"].includes(status?.toLowerCase());

// --- SUB-COMPONENT: Product Card (Grid View) ---
const ProductGridItem = ({ record, isSelected, onSelect, onView, onApprove, onOpenReject, onCompare }) => {
  const isPending = checkIsPending(record.status);
  const isUpdate = record.status === "pending_update"; // Flag kiểm tra cập nhật
  const isReup = record.is_reup;

  return (
    <Card
      hoverable
      bordered={false}
      style={{
        height: '100%',
        borderRadius: 12,
        boxShadow: isSelected
          ? "0 0 0 2px #1890ff, 0 8px 16px rgba(24,144,255,0.2)"
          : "0 2px 8px rgba(0,0,0,0.06)",
        transition: "all 0.3s ease",
        overflow: 'hidden',
        position: 'relative'
      }}
      bodyStyle={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%' }}
      onClick={() => onSelect(record.id)}
    >
      {/* Checkbox Overlay */}
      <div style={{ position: "absolute", top: 12, left: 12, zIndex: 10 }}>
        <Checkbox checked={isSelected} style={{ transform: 'scale(1.2)' }} />
      </div>

      {/* Status & Risk Badges */}
      <div style={{ position: "absolute", top: 12, right: 12, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
        {record.ai_score > 80 && <Tag color="error" icon={<ThunderboltFilled />}>{record.ai_score}% Risk</Tag>}
        {isReup && <Tag color="#722ed1" icon={<ReloadOutlined />}>Re-up</Tag>}
        {isUpdate && <Tag color="processing" icon={<DiffOutlined />}>Cập nhật</Tag>}
      </div>

      {/* Image Area */}
      <div style={{ height: 180, overflow: 'hidden', position: 'relative', background: '#f5f5f5' }}>
        <Image
          preview={false}
          src={record.main_image?.image || record.images?.[0]?.image}
          fallback="https://placehold.co/300x300/eee/999?text=No+Image"
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
          className="product-img-hover"
        />
      </div>

      {/* Content Area */}
      <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: 4 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <ShopOutlined /> {record.seller?.store_name || "Unknown Shop"}
          </Text>
        </div>
        <Tooltip title={record.name}>
          <Paragraph ellipsis={{ rows: 2 }} strong style={{ marginBottom: 8, flex: 1, minHeight: 44 }}>
            {record.name}
          </Paragraph>
        </Tooltip>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
          <Text type="danger" style={{ fontSize: 16, fontWeight: 700 }}>{intcomma(record.price)} ₫</Text>
        </div>
      </div>

      {/* Action Footer */}
      {isPending ? (
        <div style={{ display: 'flex', borderTop: '1px solid #f0f0f0', background: '#fafafa' }}>
          <Button type="text" block style={{ color: '#ff4d4f', height: 40 }} onClick={(e) => { e.stopPropagation(); onOpenReject(record.id); }}>
            Từ chối
          </Button>
          <div style={{ width: 1, background: '#f0f0f0' }} />
          {/* Logic hiển thị nút: Nếu là update -> So sánh, Nếu là mới -> Duyệt */}
          {isUpdate ? (
            <Button type="text" block style={{ color: '#1890ff', height: 40 }} onClick={(e) => { e.stopPropagation(); onCompare(record); }}>
              <DiffOutlined /> So sánh
            </Button>
          ) : (
            <Button type="text" block style={{ color: '#52c41a', height: 40 }} onClick={(e) => { e.stopPropagation(); onApprove(record.id); }}>
              <CheckOutlined /> Duyệt
            </Button>
          )}
        </div>
      ) : (
        <div style={{ padding: 12, borderTop: '1px solid #f0f0f0', textAlign: 'center' }}>
          <Button size="small" onClick={(e) => { e.stopPropagation(); onView(record); }}>Xem chi tiết</Button>
        </div>
      )}
    </Card>
  );
};

// --- MAIN COMPONENT ---
const ProductManager = ({
  data,
  onApprove,
  onReject,
  onView,
  onViewShop,
  onCompare, // <--- Props nhận hàm mở modal so sánh
  selectedRowKeys,
  setSelectedRowKeys,
  viewModeProp = "table"
}) => {
  const [viewMode, setViewMode] = useState(viewModeProp);
  const [rejectModal, setRejectModal] = useState({ open: false, ids: [], reason: "", quickReason: "" });

  React.useEffect(() => { setViewMode(viewModeProp) }, [viewModeProp]);

  // Handle Select
  const handleGridSelect = (id) => {
    setSelectedRowKeys(prev => prev.includes(id) ? prev.filter(k => k !== id) : [...prev, id]);
  };

  const pendingSelectedItems = useMemo(() =>
    data.filter(item => selectedRowKeys.includes(item.id) && checkIsPending(item.status)),
    [data, selectedRowKeys]);

  // Reject Logic
  const openReject = (ids) => setRejectModal({ open: true, ids: Array.isArray(ids) ? ids : [ids], reason: "", quickReason: "" });
  const confirmReject = () => {
    const reason = rejectModal.quickReason === "other" || !rejectModal.quickReason ? rejectModal.reason : rejectModal.quickReason;
    if (!reason.trim()) return message.error("Vui lòng nhập lý do!");
    onReject(rejectModal.ids, reason);
    setRejectModal({ ...rejectModal, open: false });
  };

  // Re-up History Popover Content
  const renderReupHistory = (history) => (
    <div style={{ width: 320, maxHeight: 400, overflowY: 'auto', padding: 8 }}>
      <div style={{ marginBottom: 16, padding: '8px 12px', background: '#fff2f0', border: '1px solid #ffccc7', borderRadius: 6 }}>
        <Text type="danger" strong><WarningOutlined /> Cảnh báo:</Text> Sản phẩm này có tên trùng với {history.length} sản phẩm đã bị xóa/cấm trước đó.
      </div>
      <Timeline>
        {history.map((item, idx) => (
          <Timeline.Item key={idx} color="red">
            <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(item.updated_at).format("DD/MM/YYYY HH:mm")}</Text>
            <br />
            <Text strong>{item.name}</Text>
            <br />
            <Tag color="error">{item.status.toUpperCase()}</Tag>
            <Text delete>{intcomma(item.price)}đ</Text>
          </Timeline.Item>
        ))}
        <Timeline.Item dot={<ReloadOutlined style={{ fontSize: 16, color: '#1890ff' }} />}>
          <Text strong style={{ color: '#1890ff' }}>Hiện tại (Đang chờ duyệt)</Text>
        </Timeline.Item>
      </Timeline>
    </div>
  );

  const columns = [
    {
      title: "Sản phẩm",
      key: "name",
      width: 350,
      render: (_, r) => {
        // Lấy link ảnh an toàn
        const imageUrl = r.main_image?.image || r.images?.[0]?.image;

        return (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {/* Image Container - Fixed Size & Relative for Badge */}
            <div style={{
              position: 'relative',
              width: 64,
              height: 64,
              flexShrink: 0 // Chống bị co khi tên dài
            }}>
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  width={64}
                  height={64}
                  style={{
                    borderRadius: 8,
                    objectFit: 'cover',
                    border: '1px solid #f0f0f0'
                  }}
                  // Fallback của Antd phòng khi link ảnh chết (404)
                  fallback="https://placehold.co/64x64/f5f5f5/bfbfbf?text=IMG"
                />
              ) : (
                // UI Placeholder khi không có dữ liệu ảnh
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: '#fafafa', // Màu nền rất nhạt, sạch sẽ
                  border: '1px solid #f0f0f0',
                  borderRadius: 8,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: '#d9d9d9' // Màu icon chìm, không gây chú ý
                }}>
                  <PictureOutlined style={{ fontSize: 24 }} />
                </div>
              )}

              {/* Badge cảnh báo vi phạm (Reup) */}
              {r.is_reup && (
                <div style={{ position: 'absolute', bottom: -6, right: -6, zIndex: 10 }}>
                  <Popover title="Lịch sử vi phạm" content={renderReupHistory(r.reupHistory)}>
                    <div style={{
                      background: '#ff4d4f',
                      color: '#fff',
                      borderRadius: '50%',
                      width: 20,
                      height: 20,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      fontSize: 12,
                      cursor: 'help',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)' // Thêm bóng nhẹ cho nổi
                    }}>!</div>
                  </Popover>
                </div>
              )}
            </div>

            {/* Info Text */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <Text
                strong
                style={{ color: '#262626', fontSize: 14, cursor: 'pointer', display: 'block' }}
                onClick={() => onView(r)}
                ellipsis={{ tooltip: r.name }} // Tự động cắt chữ nếu tên quá dài
              >
                {r.name}
              </Text>
              <div style={{ marginTop: 4, display: 'flex', alignItems: 'center' }}>
                <Text type="danger" strong>{intcomma(r.price)}đ</Text>
                {r.status === "pending_update" && (
                  <Tag color="processing" style={{ marginLeft: 8, fontSize: 10, border: 'none' }}>
                    Cập nhật
                  </Tag>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Người bán",
      key: "seller",
      width: 200,
      render: (_, r) => (
        <Space>
          <Avatar size="small" icon={<ShopOutlined />} src={r.seller?.avatar} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Text style={{ fontSize: 13, cursor: 'pointer' }} onClick={() => onViewShop && onViewShop(r.seller)}>
              {r.seller?.store_name || "Shop ẩn danh"}
            </Text>
            {(() => {
              const days = r.seller?.created_at ? (new Date() - new Date(r.seller.created_at)) / (86400000) : 99;
              return days <= 7 && <Tag color="green" style={{ fontSize: 10, lineHeight: '14px', width: 'fit-content', marginTop: 2 }}>Mới tạo {Math.ceil(days)} ngày</Tag>
            })()}
          </div>
        </Space>
      )
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 150,
      render: (st) => <ProductStatusTag status={st} />
    },
    {
      title: "",
      key: "action",
      width: 140,
      fixed: 'right',
      render: (_, r) => checkIsPending(r.status) && (
        <Space>
          {r.status === "pending_update" ? (
            // Nút So sánh cho Update
            <Tooltip title="So sánh thay đổi">
              <Button type="text" shape="circle" icon={<DiffOutlined style={{ color: '#1890ff' }} />} onClick={() => onCompare(r)} />
            </Tooltip>
          ) : (
            // Nút Duyệt thường cho SP mới
            <Tooltip title="Duyệt nhanh">
              <Button type="text" shape="circle" icon={<CheckOutlined style={{ color: '#52c41a' }} />} onClick={() => onApprove(r.id)} />
            </Tooltip>
          )}

          <Tooltip title="Từ chối">
            <Button type="text" shape="circle" icon={<CloseOutlined style={{ color: '#ff4d4f' }} />} onClick={() => openReject(r.id)} />
          </Tooltip>

          <Tooltip title="Chi tiết">
            <Button type="text" shape="circle" icon={<EyeOutlined />} onClick={() => onView(r)} />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div style={{ position: "relative", minHeight: 400 }}>
      {/* View Switcher */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
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
          dataSource={data}
          columns={columns}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 900 }}
          size="middle"
        />
      ) : (
        <List
          grid={{ gutter: 24, xs: 1, sm: 2, md: 3, lg: 4, xl: 4, xxl: 5 }}
          dataSource={data}
          pagination={{ pageSize: 20 }}
          renderItem={(item) => (
            <List.Item>
              <ProductGridItem
                record={item}
                isSelected={selectedRowKeys.includes(item.id)}
                onSelect={handleGridSelect}
                onView={onView}
                onApprove={onApprove}
                onCompare={onCompare} // Truyền prop Compare
                onOpenReject={openReject}
              />
            </List.Item>
          )}
        />
      )}

      {/* --- STICKY ACTION BAR --- */}
      {selectedRowKeys.length > 0 && (
        <div style={{
          position: "fixed", bottom: 30, left: "50%", transform: "translateX(-50%)",
          background: "rgba(38, 38, 38, 0.85)", backdropFilter: "blur(12px)",
          padding: "12px 24px", borderRadius: 100,
          boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
          display: "flex", alignItems: "center", gap: 16, zIndex: 1000,
          border: "1px solid rgba(255,255,255,0.1)"
        }}>
          <Space size={16}>
            <Text style={{ color: "#fff", fontWeight: 500 }}>Đã chọn <span style={{ color: '#40a9ff', fontSize: 16 }}>{selectedRowKeys.length}</span></Text>
            <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.2)' }} />
            <Button ghost size="middle" onClick={() => setSelectedRowKeys([])}>Hủy chọn</Button>

            {pendingSelectedItems.length > 0 ? (
              <>
                <Button type="primary" shape="round" icon={<CheckOutlined />} onClick={() => onApprove(pendingSelectedItems.map(i => i.id))}>
                  Duyệt ({pendingSelectedItems.length})
                </Button>
                <Button type="primary" danger shape="round" icon={<CloseOutlined />} onClick={() => openReject(pendingSelectedItems.map(i => i.id))}>
                  Từ chối ({pendingSelectedItems.length})
                </Button>
              </>
            ) : (
              <Text style={{ color: '#aaa', fontSize: 12 }}>Không có mục nào cần xử lý</Text>
            )}
          </Space>
        </div>
      )}

      {/* --- REJECT MODAL --- */}
      <Modal
        title={<Space><CloseCircleOutlined style={{ color: '#ff4d4f' }} /> Xác nhận từ chối</Space>}
        open={rejectModal.open}
        onOk={confirmReject}
        onCancel={() => setRejectModal({ ...rejectModal, open: false })}
        okText="Xác nhận" okButtonProps={{ danger: true }}
        cancelText="Hủy"
      >
        <div style={{ marginBottom: 12 }}>Bạn đang từ chối <b>{rejectModal.ids.length}</b> sản phẩm. Vui lòng chọn lý do:</div>
        <Radio.Group style={{ display: 'flex', flexDirection: 'column', gap: 10 }} value={rejectModal.quickReason} onChange={e => setRejectModal({ ...rejectModal, quickReason: e.target.value })}>
          <Radio value="Hàng giả/Nhái thương hiệu">Hàng giả / Nhái thương hiệu</Radio>
          <Radio value="Hình ảnh/Nội dung không phù hợp">Hình ảnh / Nội dung không phù hợp</Radio>
          <Radio value="Sai danh mục ngành hàng">Sai danh mục ngành hàng</Radio>
          <Radio value="Spam/Đăng lặp lại">Spam / Đăng lặp lại (Re-up)</Radio>
          <Radio value="other">Lý do khác...</Radio>
        </Radio.Group>
        {rejectModal.quickReason === "other" && (
          <TextArea
            style={{ marginTop: 12 }} rows={3} placeholder="Nhập lý do chi tiết gửi đến người bán..."
            value={rejectModal.reason} onChange={e => setRejectModal({ ...rejectModal, reason: e.target.value })}
          />
        )}
      </Modal>
    </div>
  );
};

export default ProductManager;