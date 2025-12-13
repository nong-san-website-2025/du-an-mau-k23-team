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
  PictureOutlined,
  LockOutlined, // Icon Khóa
} from "@ant-design/icons";
import dayjs from "dayjs";
import ProductStatusTag from "./ProductStatusTag"; // Giả định component này
import { intcomma } from "../../../../../utils/format"; // Giả định utils này

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

// --- Helper Functions ---
const checkIsPending = (status) => ["pending", "pending_update"].includes(status?.toLowerCase());
const checkIsApproved = (status) => status?.toLowerCase() === "active" || status?.toLowerCase() === "approved"; // Điều chỉnh tùy theo value status thật của bạn

// --- SUB-COMPONENT: Product Card (Grid View) ---
const ProductGridItem = ({ record, isSelected, onSelect, onView, onApprove, onOpenReject, onCompare, onOpenLock }) => {
  const isPending = checkIsPending(record.status);
  const isApproved = checkIsApproved(record.status);
  const isUpdate = record.status === "pending_update";
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
      <div style={{ borderTop: '1px solid #f0f0f0', background: '#fafafa', display: 'flex', height: 40 }}>
        {isPending ? (
          <>
            <Button type="text" style={{ flex: 1, color: '#ff4d4f', height: '100%' }} onClick={(e) => { e.stopPropagation(); onOpenReject(record.id); }}>
              Từ chối
            </Button>
            <div style={{ width: 1, background: '#f0f0f0' }} />
            {isUpdate ? (
              <Button type="text" style={{ flex: 1, color: '#1890ff', height: '100%' }} onClick={(e) => { e.stopPropagation(); onCompare(record); }}>
                <DiffOutlined /> So sánh
              </Button>
            ) : (
              <Button type="text" style={{ flex: 1, color: '#52c41a', height: '100%' }} onClick={(e) => { e.stopPropagation(); onApprove(record.id); }}>
                <CheckOutlined /> Duyệt
              </Button>
            )}
            <div style={{ width: 1, background: '#f0f0f0' }} />
            <Tooltip title="Xem chi tiết">
                <Button type="text" style={{ width: 40, height: '100%' }} icon={<EyeOutlined />} onClick={(e) => { e.stopPropagation(); onView(record); }} />
            </Tooltip>
          </>
        ) : isApproved ? (
            // Footer cho sản phẩm ĐÃ DUYỆT (Lock + Detail)
            <>
                 <Button type="text" style={{ flex: 1, color: '#faad14', height: '100%' }} onClick={(e) => { e.stopPropagation(); onOpenLock(record.id); }}>
                    <LockOutlined /> Khóa
                </Button>
                <div style={{ width: 1, background: '#f0f0f0' }} />
                <Button type="text" style={{ flex: 1, height: '100%' }} onClick={(e) => { e.stopPropagation(); onView(record); }}>
                    <EyeOutlined /> Chi tiết
                </Button>
            </>
        ) : (
            // Footer cho sản phẩm ĐÃ TỪ CHỐI / KHÓA (Chỉ hiện View Detail)
            <Button type="text" block style={{ height: '100%' }} onClick={(e) => { e.stopPropagation(); onView(record); }}>
                <EyeOutlined /> Xem chi tiết
            </Button>
        )}
      </div>
    </Card>
  );
};

// --- MAIN COMPONENT ---
const ProductManager = ({
  data,
  onApprove,
  onReject,
  onLock, // <--- Props hàm xử lý khóa sản phẩm
  onView,
  onViewShop,
  onCompare,
  selectedRowKeys,
  setSelectedRowKeys,
  viewModeProp = "table"
}) => {
  const [viewMode, setViewMode] = useState(viewModeProp);
  // Modal states
  const [rejectModal, setRejectModal] = useState({ open: false, ids: [], reason: "", quickReason: "" });
  const [lockModal, setLockModal] = useState({ open: false, ids: [], reason: "" }); // <--- State cho Modal Khóa

  React.useEffect(() => { setViewMode(viewModeProp) }, [viewModeProp]);

  // Handle Select
  const handleGridSelect = (id) => {
    setSelectedRowKeys(prev => prev.includes(id) ? prev.filter(k => k !== id) : [...prev, id]);
  };

  const pendingSelectedItems = useMemo(() =>
    data.filter(item => selectedRowKeys.includes(item.id) && checkIsPending(item.status)),
    [data, selectedRowKeys]);

  // --- Reject Logic ---
  const openReject = (ids) => setRejectModal({ open: true, ids: Array.isArray(ids) ? ids : [ids], reason: "", quickReason: "" });
  const confirmReject = () => {
    const reason = rejectModal.quickReason === "other" || !rejectModal.quickReason ? rejectModal.reason : rejectModal.quickReason;
    if (!reason.trim()) return message.error("Vui lòng nhập lý do từ chối!");
    onReject(rejectModal.ids, reason);
    setRejectModal({ ...rejectModal, open: false });
  };

  // --- Lock Logic (Mới) ---
  const openLock = (ids) => setLockModal({ open: true, ids: Array.isArray(ids) ? ids : [ids], reason: "" });
  const confirmLock = () => {
      if (!lockModal.reason.trim()) return message.error("Vui lòng nhập lý do khóa sản phẩm!");
      onLock && onLock(lockModal.ids, lockModal.reason);
      setLockModal({ ...lockModal, open: false });
  };

  // Re-up History Popover Content (Giữ nguyên)
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
        const imageUrl = r.main_image?.image || r.images?.[0]?.image;
        return (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {/* Image Container */}
            <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
              {imageUrl ? (
                <Image
                  src={imageUrl} width={64} height={64}
                  style={{ borderRadius: 8, objectFit: 'cover', border: '1px solid #f0f0f0' }}
                  fallback="https://placehold.co/64x64/f5f5f5/bfbfbf?text=IMG"
                />
              ) : (
                <div style={{ width: '100%', height: '100%', background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#d9d9d9' }}>
                  <PictureOutlined style={{ fontSize: 24 }} />
                </div>
              )}
              {r.is_reup && (
                <div style={{ position: 'absolute', bottom: -6, right: -6, zIndex: 10 }}>
                  <Popover title="Lịch sử vi phạm" content={renderReupHistory(r.reupHistory)}>
                    <div style={{ background: '#ff4d4f', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 12, cursor: 'help', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>!</div>
                  </Popover>
                </div>
              )}
            </div>
            {/* Info Text */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <Text strong style={{ color: '#262626', fontSize: 14, cursor: 'pointer', display: 'block' }} onClick={() => onView(r)} ellipsis={{ tooltip: r.name }}>
                {r.name}
              </Text>
              <div style={{ marginTop: 4, display: 'flex', alignItems: 'center' }}>
                <Text type="danger" strong>{intcomma(r.price)}đ</Text>
                {r.status === "pending_update" && <Tag color="processing" style={{ marginLeft: 8, fontSize: 10, border: 'none' }}>Cập nhật</Tag>}
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
      title: "Thao tác", // Đổi tên cột
      key: "action",
      width: 140,
      fixed: 'right',
      render: (_, r) => {
          const isPending = checkIsPending(r.status);
          const isApproved = checkIsApproved(r.status);

          return (
            <Space>
              {/* Nút Xem chi tiết - Luôn hiển thị */}
              <Tooltip title="Chi tiết">
                <Button type="text" shape="circle" icon={<EyeOutlined />} onClick={() => onView(r)} />
              </Tooltip>

              {/* Nút cho trạng thái Chờ duyệt */}
              {isPending && (
                  <>
                     {r.status === "pending_update" ? (
                        <Tooltip title="So sánh">
                          <Button type="text" shape="circle" icon={<DiffOutlined style={{ color: '#1890ff' }} />} onClick={() => onCompare(r)} />
                        </Tooltip>
                      ) : (
                        <Tooltip title="Duyệt">
                          <Button type="text" shape="circle" icon={<CheckOutlined style={{ color: '#52c41a' }} />} onClick={() => onApprove(r.id)} />
                        </Tooltip>
                      )}
                      <Tooltip title="Từ chối">
                        <Button type="text" shape="circle" icon={<CloseOutlined style={{ color: '#ff4d4f' }} />} onClick={() => openReject(r.id)} />
                      </Tooltip>
                  </>
              )}

              {/* Nút cho trạng thái Đã duyệt (Khóa) */}
              {isApproved && (
                  <Tooltip title="Khóa sản phẩm">
                      <Button type="text" shape="circle" icon={<LockOutlined style={{ color: '#faad14' }} />} onClick={() => openLock(r.id)} />
                  </Tooltip>
              )}
            </Space>
          );
      }
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
                onCompare={onCompare}
                onOpenReject={openReject}
                onOpenLock={openLock} // Truyền prop mở modal khóa
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
                // Nếu chọn các item đã duyệt, có thể hiện nút Khóa hàng loạt (tùy chọn)
               <Button type="default" shape="round" icon={<LockOutlined />} style={{color: '#faad14', borderColor: '#faad14'}} onClick={() => openLock(selectedRowKeys)}>
                  Khóa ({selectedRowKeys.length})
               </Button>
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

      {/* --- LOCK MODAL (MỚI) --- */}
      <Modal
        title={<Space><LockOutlined style={{ color: '#faad14' }} /> Xác nhận khóa sản phẩm</Space>}
        open={lockModal.open}
        onOk={confirmLock}
        onCancel={() => setLockModal({ ...lockModal, open: false })}
        okText="Khóa ngay"
        okButtonProps={{ style: { background: '#faad14', borderColor: '#faad14' } }} // Màu vàng warning
        cancelText="Hủy"
      >
         <div style={{ marginBottom: 12 }}>
            Bạn đang khóa <b>{lockModal.ids.length}</b> sản phẩm đang hoạt động. <br/>
            <Text type="secondary" style={{fontSize: 12}}>Sản phẩm bị khóa sẽ không hiển thị trên sàn TMĐT.</Text>
         </div>
         <div style={{ marginBottom: 8 }}>Lý do khóa:</div>
         <TextArea
            rows={4}
            placeholder="Ví dụ: Hết hàng, vi phạm chính sách sau kiểm duyệt, yêu cầu từ cơ quan chức năng..."
            value={lockModal.reason}
            onChange={e => setLockModal({ ...lockModal, reason: e.target.value })}
          />
      </Modal>
    </div>
  );
};

export default ProductManager;