import React, { useState } from "react";
import { Modal, Button, Tag, Space, Radio, Typography, Divider } from "antd";
import { EnvironmentOutlined, PlusOutlined } from "@ant-design/icons";

const { Text } = Typography;

const AddressSelector = ({
  addresses,
  selectedAddressId,
  onSelect,
  manualEntry,
  onToggleManual,
  onAddNew, // <--- Prop mới nhận hàm mở modal thêm
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Tìm địa chỉ đang được chọn
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
  
  // Kiểm tra xem user có địa chỉ nào trong list chưa
  const hasAddress = addresses && addresses.length > 0;

  // Xử lý khi bấm vào khung chọn địa chỉ
  const handleBoxClick = () => {
    if (hasAddress) {
      setIsModalOpen(true); // Nếu có list rồi thì mở modal chọn
    } else {
      onAddNew(); // Nếu chưa có gì thì mở form thêm mới luôn
    }
  };

  // 1. Render view khi chưa chọn địa chỉ hoặc đang không nhập tay
  if (!selectedAddress && !manualEntry) {
    return (
      <div 
        className="checkout-card" 
        onClick={handleBoxClick} 
        style={{cursor: 'pointer', border: '1px dashed #1890ff', textAlign: 'center'}}
      >
        <Space direction="vertical">
          <EnvironmentOutlined style={{ fontSize: 24, color: "#1890ff" }} />
          <Text type="secondary">
            {hasAddress ? "Bạn chưa chọn địa chỉ giao hàng" : "Bạn chưa có địa chỉ nào"}
          </Text>
          <Button type="primary" ghost>
            {hasAddress ? "Chọn địa chỉ" : "Thêm địa chỉ mới"}
          </Button>
        </Space>
      </div>
    );
  }

  // 2. Render view Card địa chỉ đã chọn
  return (
    <>
      <div className="checkout-card">
        <div className="card-header">
          <EnvironmentOutlined /> Địa chỉ nhận hàng
        </div>
        
        {manualEntry ? (
            <div style={{padding: '10px 0'}}>
                <Text strong>Đang sử dụng địa chỉ nhập tay</Text>
                <Button type="link" onClick={onToggleManual}>Chọn từ danh sách</Button>
            </div>
        ) : (
             <div className="address-preview">
                <div>
                    <div style={{ marginBottom: 4 }}>
                    <Text strong style={{ fontSize: 16 }}>{selectedAddress?.recipient_name}</Text>
                    <span style={{ margin: "0 8px", color: "#d9d9d9" }}>|</span>
                    <Text type="secondary">{selectedAddress?.phone}</Text>
                    {selectedAddress?.is_default && <Tag color="green" style={{marginLeft: 8}}>Mặc định</Tag>}
                    </div>
                    <Text>{selectedAddress?.location}</Text>
                </div>
                <Button type="link" onClick={() => setIsModalOpen(true)}>
                    Thay đổi
                </Button>
            </div>
        )}
      </div>

      {/* Modal Chọn địa chỉ từ danh sách */}
      <Modal
        title="Chọn địa chỉ giao hàng"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
             <Button key="back" onClick={() => setIsModalOpen(false)}>Hủy</Button>,
             // Nút thêm mới ngay trong Modal chọn
             <Button 
                key="add-new" 
                icon={<PlusOutlined />} 
                onClick={() => { setIsModalOpen(false); onAddNew(); }}
             >
                Thêm địa chỉ khác
             </Button>,
             <Button 
                key="manual" 
                type="dashed"
                onClick={() => { onToggleManual(); setIsModalOpen(false); }}
             >
                Nhập tay tạm thời
             </Button>
        ]}
      >
        <Radio.Group 
            onChange={(e) => { onSelect(e.target.value); setIsModalOpen(false); }} 
            value={selectedAddressId}
            style={{width: '100%'}}
        >
          <Space direction="vertical" style={{width: '100%'}}>
            {addresses.map(addr => (
                <Radio key={addr.id} value={addr.id} style={{padding: '12px', border: '1px solid #f0f0f0', borderRadius: 8, width: '100%'}}>
                    <Space direction="vertical" size={2}>
                        <Text strong>{addr.recipient_name} - {addr.phone}</Text>
                        <Text type="secondary" style={{fontSize: 13}}>{addr.location}</Text>
                        {addr.is_default && <Tag color="green">Mặc định</Tag>}
                    </Space>
                </Radio>
            ))}
          </Space>
        </Radio.Group>
      </Modal>
    </>
  );
};
export default AddressSelector;