// src/features/cart/components/AddressSelector.jsx
import React, { useState } from "react";
import { Card, Collapse, Button, Radio, Space } from "antd";
import { EnvironmentOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Panel } = Collapse;

const AddressSelector = ({
  addresses,
  selectedAddressId,
  onSelect,
  onToggleManualEntry,
}) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  return (
    <Card
      title={<span style={{ fontWeight: 600 }}>Thông tin giao hàng</span>}
      bordered={false}
      style={{ marginBottom: 5 }}
    >
      {/* Hiển thị địa chỉ mặc định hoặc đang chọn */}
      {selectedAddress ? (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ margin: 0, fontWeight: 500 }}>
              <EnvironmentOutlined style={{ marginRight: 6 }} />
              {selectedAddress.recipient_name} - {selectedAddress.phone}
            </p>
            <p style={{ margin: "4px 0", color: "#666" }}>
              {selectedAddress.location}
            </p>
          </div>
          <Button type="link" onClick={() => setIsExpanded((prev) => !prev)}>
            {isExpanded ? "Đóng" : "Thay đổi"}
          </Button>
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: 20 }}>
          <p>Bạn chưa có địa chỉ nhận hàng.</p>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/profile?tab=address&redirect=checkout")}
          >
            Thêm địa chỉ
          </Button>
        </div>
      )}

      {/* Collapse danh sách địa chỉ */}
      {isExpanded && (
        <Collapse defaultActiveKey={["1"]} style={{ marginTop: 15 }}>
          <Panel header="Danh sách địa chỉ" key="1">
            <Radio.Group
              value={selectedAddressId}
              onChange={(e) => onSelect(Number(e.target.value))}
              style={{ width: "100%" }}
            >
              <Space direction="vertical" style={{ width: "100%" }}>
                {addresses.map((address) => (
                  <Radio
                    key={address.id}
                    value={address.id}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #f0f0f0", borderRadius: 6 }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>
                          {address.recipient_name} - {address.phone}
                        </div>
                        <div style={{ fontSize: 12, color: "#666" }}>{address.location}</div>
                      </div>
                      {address.is_default && (
                        <span style={{ color: "#52c41a", fontSize: 12 }}>Mặc định</span>
                      )}
                    </div>
                  </Radio>
                ))}
              </Space>
            </Radio.Group>

            <div style={{ marginTop: 16, textAlign: "right" }}>
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => navigate("/profile?tab=address&redirect=checkout")}
              >
                Quản lý địa chỉ
              </Button>
              <Button type="link" onClick={onToggleManualEntry}>
                Nhập địa chỉ mới
              </Button>
            </div>
          </Panel>
        </Collapse>
      )}
    </Card>
  );
};

export default AddressSelector;
