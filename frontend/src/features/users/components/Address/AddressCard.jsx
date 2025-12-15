// src/components/Address/AddressCard.jsx
import React, { useState } from "react";
import { Card, Button, Space, Typography, Tag } from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  StarOutlined,
  EditOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { formatLocationName } from "./utils";

const { Text } = Typography;

const AddressCard = ({
  address,
  onEdit, // Hàm mở modal từ cha
  onDelete,
  setDefaultAddress,
  provinces = [],
}) => {
  const locationName = formatLocationName(address, provinces);
  const [showActions, setShowActions] = useState(false);

  return (
    <Card
      style={{ marginBottom: 16, cursor: "pointer" }}
      type={address.is_default ? "inner" : "default"}
      // Viền xanh nếu là mặc định
      className={address.is_default ? "address-card-default" : ""}
      bodyStyle={address.is_default ? { background: "#f6ffed", border: "1px solid #b7eb8f" } : {}}
      onClick={() => setShowActions(!showActions)}
      hoverable
    >
      <Space style={{ width: "100%" }} align="start" size={16} wrap>
        
        {/* Thông tin hiển thị */}
        <div style={{ flex: 1 }}>
            <Space direction="vertical" size={4}>
                <Space>
                    <UserOutlined style={{ color: '#8c8c8c'}} />
                    <Text strong style={{ fontSize: 16 }}>{address.recipient_name}</Text>
                    {address.is_default && <Tag color="green" icon={<StarOutlined />}>Mặc định</Tag>}
                </Space>
                
                <Space>
                    <PhoneOutlined style={{ color: '#8c8c8c'}} />
                    <Text type="secondary">{address.phone}</Text>
                </Space>
                
                <Space align="start">
                    <EnvironmentOutlined style={{ color: '#8c8c8c', marginTop: 4}} />
                    <Text>{locationName || address.location}</Text>
                </Space>
            </Space>
        </div>

        {/* Nút hành động (Sửa / Xóa / Mặc định) */}
        {(showActions || address.is_default) && (
          <Space direction="vertical" align="end">
            <Space>
                {!address.is_default && (
                <Button
                    type="text"
                    style={{ color: '#faad14' }}
                    icon={<StarOutlined />}
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        setDefaultAddress(address.id);
                    }}
                >
                    Thiết lập mặc định
                </Button>
                )}
            </Space>
            
            <Space>
                <Button
                    icon={<EditOutlined />}
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(); // Gọi hàm mở Modal
                    }}
                >
                    Sửa
                </Button>
                <Button
                    danger
                    icon={<DeleteOutlined />}
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                >
                    Xóa
                </Button>
            </Space>
          </Space>
        )}
      </Space>
    </Card>
  );
};

export default AddressCard;