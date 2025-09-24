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
import AddressEditForm from "./AddressEditForm";
import { formatLocationName } from "./utils";

const { Text } = Typography;

const AddressCard = ({
  address,
  isEditing,
  setEditingAddress,
  onEdit,
  onDelete,
  setDefaultAddress,
  provinces = [],
  fetchDistrictsByProvince,
  fetchWardsByDistrict,
}) => {
  const locationName = formatLocationName(address, provinces);
  const [showActions, setShowActions] = useState(false);

  if (isEditing) {
    return (
      <Card style={{ marginBottom: 16 }}>
        <AddressEditForm
          address={address}
          onEdit={onEdit}
          setEditingAddress={setEditingAddress}
          provinces={provinces}
          fetchDistrictsByProvince={fetchDistrictsByProvince}
          fetchWardsByDistrict={fetchWardsByDistrict}
        />
      </Card>
    );
  }

  return (
    <Card
      style={{ marginBottom: 16, cursor: "pointer" }}
      type={address.is_default ? "inner" : "default"}
      onClick={() => setShowActions(!showActions)}
    >
      <Space style={{ width: "100%" }} align="center" size={16} wrap>
        {/* Thông tin địa chỉ */}
        <Space size={12} style={{ flex: 1 }}>
          <UserOutlined />
          <Text strong>{address.recipient_name}</Text>
          {address.is_default && <Tag color="gold" icon={<StarOutlined />}>Mặc định</Tag>}
          <PhoneOutlined /> <Text>{address.phone}</Text>
          <EnvironmentOutlined /> <Text>{locationName || address.location}</Text>
        </Space>

        {/* Nút hành động (ẩn/trải khi click) */}
        {(showActions || address.is_default) && (
          <Space>
            {!address.is_default && (
              <Button
                type="primary"
                shape="circle"
                icon={<StarOutlined />}
                size="small"
                title="Đặt làm mặc định"
                onClick={(e) => {
                  e.stopPropagation(); // tránh toggle showActions
                  setDefaultAddress(address.id);
                }}
              />
            )}
            <Button
              shape="circle"
              icon={<EditOutlined />}
              size="small"
              title="Chỉnh sửa"
              onClick={(e) => {
                e.stopPropagation();
                setEditingAddress(address.id);
              }}
            />
            <Button
              danger
              shape="circle"
              icon={<DeleteOutlined />}
              size="small"
              title="Xóa địa chỉ"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(address);
              }}
            />
          </Space>
        )}
      </Space>
    </Card>
  );
};

export default AddressCard;
