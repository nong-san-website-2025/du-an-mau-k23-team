import React, { useState } from "react";
import { Modal, Button, Tag, Space, Radio, Typography } from "antd";
import { EnvironmentOutlined, PlusOutlined } from "@ant-design/icons";
import "../styles/AddressSelector.css"; // Nhớ import file CSS vừa tạo

const { Text } = Typography;

const AddressSelector = ({
  addresses,
  selectedAddressId,
  onSelect,
  manualEntry,
  onToggleManual,
  onAddNew,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
  const hasAddress = addresses && addresses.length > 0;

  const handleBoxClick = () => {
    if (hasAddress) {
      setIsModalOpen(true);
    } else {
      onAddNew();
    }
  };

  // --- TRƯỜNG HỢP 1: CHƯA CÓ ĐỊA CHỈ (HIỂN THỊ HỘP NÉT ĐỨT) ---
  if (!selectedAddress && !manualEntry) {
    return (
      <div className="empty-address-box" onClick={handleBoxClick}>
        <Space direction="vertical">
          <EnvironmentOutlined style={{ fontSize: 28, color: "#2E7D32" }} />
          <Text style={{ fontSize: 15, color: "#555" }}>
            {hasAddress
              ? "Bạn chưa chọn địa chỉ giao hàng"
              : "Thiết lập địa chỉ nhận hàng của bạn"}
          </Text>
          <Button type="primary" style={{ background: "#2E7D32", borderColor: "#2E7D32" }}>
            {hasAddress ? "Chọn địa chỉ" : "Thêm địa chỉ mới"}
          </Button>
        </Space>
      </div>
    );
  }

  // --- TRƯỜNG HỢP 2: ĐÃ CÓ ĐỊA CHỈ (HIỂN THỊ CARD CHUYÊN NGHIỆP) ---
  return (
    <>
      <div className="checkout-address-card">
        {/* Header với Icon địa điểm */}
        <div className="address-header-row">
          <EnvironmentOutlined className="address-header-icon" />
          <span>Địa chỉ nhận hàng</span>
        </div>

        {manualEntry ? (
          // View khi nhập tay
          <div className="address-details">
            <div>
              <Text strong style={{ color: "#ff9800" }}>Đang sử dụng địa chỉ nhập tay</Text>
              <div className="location-text">Dữ liệu từ form nhập liệu bên dưới</div>
            </div>
            <Button type="link" onClick={onToggleManual}>
              Chọn từ danh sách
            </Button>
          </div>
        ) : (
          // View chuẩn: Hiển thị thông tin
          <div className="address-details">
            <div style={{ flex: 1 }}>
              <div>
                <Text strong className="user-info-text">
                  {selectedAddress?.recipient_name}
                </Text>
                <span className="phone-divider">|</span>
                <Text className="user-info-text">{selectedAddress?.phone}</Text>
                
                {selectedAddress?.is_default && (
                  <Tag color="#2E7D32" style={{ marginLeft: 8, borderRadius: 2 }}>
                    Mặc định
                  </Tag>
                )}
              </div>
              <span className="location-text">{selectedAddress?.location}</span>
            </div>

            {/* Nút thay đổi */}
            <Button 
                type="link" 
                onClick={() => setIsModalOpen(true)}
                style={{ fontWeight: 500, paddingRight: 0 }}
            >
              THAY ĐỔI
            </Button>
          </div>
        )}
      </div>

      {/* --- MODAL GIỮ NGUYÊN LOGIC CŨ, CHỈ CHỈNH UI NHẸ --- */}
      <Modal
        title="Địa chỉ của tôi"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        width={600}
        footer={[
          <Button key="back" onClick={() => setIsModalOpen(false)}>
            Hủy
          </Button>,
          <Button
            key="add-new"
            icon={<PlusOutlined />}
            onClick={() => {
              setIsModalOpen(false);
              onAddNew();
            }}
          >
            Thêm địa chỉ mới
          </Button>,
          <Button
            key="manual"
            type="dashed"
            onClick={() => {
              onToggleManual();
              setIsModalOpen(false);
            }}
          >
            Nhập tay
          </Button>,
        ]}
      >
        <Radio.Group
          onChange={(e) => {
            onSelect(e.target.value);
            setIsModalOpen(false);
          }}
          value={selectedAddressId}
          style={{ width: "100%" }}
        >
          <Space direction="vertical" style={{ width: "100%" }} size={12}>
            {addresses.map((addr) => (
              <Radio
                key={addr.id}
                value={addr.id}
                className={`address-radio-item ${selectedAddressId === addr.id ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  padding: "16px",
                  border: selectedAddressId === addr.id ? "1px solid #2E7D32" : "1px solid #eee",
                  borderRadius: 6,
                  width: "100%",
                  alignItems: 'flex-start'
                }}
              >
                <div style={{ marginLeft: 8 }}>
                  <Text strong>{addr.recipient_name} | {addr.phone}</Text>
                  {addr.is_default && <Tag color="green" style={{ marginLeft: 8 }}>Mặc định</Tag>}
                  <div style={{ marginTop: 4, color: '#666' }}>{addr.location}</div>
                </div>
              </Radio>
            ))}
          </Space>
        </Radio.Group>
      </Modal>
    </>
  );
};

export default AddressSelector;