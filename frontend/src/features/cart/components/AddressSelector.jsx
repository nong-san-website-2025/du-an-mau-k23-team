import React, { useState } from "react";
import { Modal, Button, Tag, Space, Radio, Typography } from "antd";
import { EnvironmentOutlined, RightOutlined, PlusOutlined } from "@ant-design/icons";

const { Text, Title } = Typography;

const AddressSelector = ({
  addresses,
  selectedAddressId,
  onSelect,
  manualEntry,
  onToggleManual,
  // ...props khác
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  // Render view khi chưa có địa chỉ hoặc chọn Manual
  if (!selectedAddress && !manualEntry) {
    return (
      <div className="checkout-card" onClick={() => setIsModalOpen(true)} style={{cursor: 'pointer', border: '1px dashed #1890ff', textAlign: 'center'}}>
        <Space direction="vertical">
          <EnvironmentOutlined style={{ fontSize: 24, color: "#1890ff" }} />
          <Text type="secondary">Bạn chưa chọn địa chỉ giao hàng</Text>
          <Button type="primary" ghost>Chọn địa chỉ</Button>
        </Space>
         {/* Modal Logic Here if needed */}
      </div>
    );
  }

  // Render Address Card đã chọn
  return (
    <>
      <div className="checkout-card">
        <div className="card-header">
          <EnvironmentOutlined /> Địa chỉ nhận hàng
        </div>
        
        {manualEntry ? (
            // Form nhập tay giữ nguyên hoặc tách ra, ở đây tôi giả định hiển thị nút chuyển đổi
            <div style={{padding: '10px 0'}}>
                <Text strong>Đang sử dụng địa chỉ nhập tay</Text>
                <Button type="link" onClick={onToggleManual}>Chọn từ danh sách</Button>
            </div>
        ) : (
             <div className="address-preview">
                <div>
                    <div style={{ marginBottom: 4 }}>
                    <Text strong style={{ fontSize: 16 }}>{selectedAddress.recipient_name}</Text>
                    <span style={{ margin: "0 8px", color: "#d9d9d9" }}>|</span>
                    <Text type="secondary">{selectedAddress.phone}</Text>
                    {selectedAddress.is_default && <Tag color="green" style={{marginLeft: 8}}>Mặc định</Tag>}
                    </div>
                    <Text>{selectedAddress.location}</Text>
                </div>
                <Button type="link" onClick={() => setIsModalOpen(true)}>
                    Thay đổi
                </Button>
            </div>
        )}
      </div>

      <Modal
        title="Chọn địa chỉ giao hàng"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
             <Button key="back" onClick={() => setIsModalOpen(false)}>Hủy</Button>,
             <Button key="manual" onClick={() => { onToggleManual(); setIsModalOpen(false); }}>Nhập địa chỉ mới</Button>
        ]}
      >
        <Radio.Group 
            onChange={(e) => { onSelect(e.target.value); setIsModalOpen(false); }} 
            value={selectedAddressId}
            style={{width: '100%'}}
        >
          <Space direction="vertical" style={{width: '100%'}}>
            {addresses.map(addr => (
                <Radio key={addr.id} value={addr.id} className="w-full" style={{padding: '12px', border: '1px solid #f0f0f0', borderRadius: 8, width: '100%'}}>
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