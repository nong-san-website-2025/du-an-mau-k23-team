import React from "react";
import { Modal, Typography, Space } from "antd";
import { UserOutlined, PhoneOutlined, EnvironmentOutlined, DeleteOutlined } from "@ant-design/icons";

const { Text } = Typography;

const AddressDeleteModal = ({ show, onClose, onConfirm, address, formatLocationName }) => {
  if (!address) return null;

  return (
    <Modal
      open={show}
      onCancel={onClose}
      onOk={onConfirm}
      okText="Xóa địa chỉ"
      okButtonProps={{ danger: true, icon: <DeleteOutlined /> }}
      cancelText="Hủy"
      centered
      title="Xác nhận xóa địa chỉ"
    >
      <Text>Bạn có chắc chắn muốn xóa địa chỉ này không?</Text>
      <div style={{ marginTop: 12 }}>
        <Space direction="vertical">
          <Text><UserOutlined /> {address.recipient_name}</Text>
          <Text><PhoneOutlined /> {address.phone}</Text>
          <Text><EnvironmentOutlined /> {formatLocationName(address)}</Text>
        </Space>
      </div>
    </Modal>
  );
};

export default AddressDeleteModal;
