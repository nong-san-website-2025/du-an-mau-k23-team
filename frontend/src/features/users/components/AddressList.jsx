// src/components/Address/AddressList.jsx
import React, { useState } from "react";
import { Button, Empty, List, Modal, Typography, message } from "antd";
import { EnvironmentOutlined, PlusOutlined } from "@ant-design/icons";
import useVietnamLocations from "../../../services/hooks/useVietnamLocations";
import AddressCard from "./Address/AddressCard";
import AddressAddForm from "./Address/AddressAddForm";
import AddressEditForm from "./Address/AddressEditForm"; // Import form sửa
import AddressDeleteModal from "./Address/AddressDeleteModal";
import { formatLocationName } from "../../../utils/formatLocationName";

const { Text, Title } = Typography;

const AddressList = ({
  addresses = [],
  addAddress,
  editAddress,
  deleteAddress,
  setDefaultAddress,
}) => {
  // State cho Modal Thêm
  const [showAddForm, setShowAddForm] = useState(false);
  
  // State cho Modal Sửa (Lưu object địa chỉ đang sửa, nếu null tức là không sửa)
  const [editingAddress, setEditingAddress] = useState(null);

  // State cho Modal Xóa
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState(null);

  const { provinces, fetchDistrictsByProvince, fetchWardsByDistrict } =
    useVietnamLocations();

  // --- XỬ LÝ THÊM ---
  const handleAddAddress = async (addressData) => {
    await addAddress(addressData);
    setShowAddForm(false);
  };

  // --- XỬ LÝ SỬA ---
  const handleEditClick = (address) => {
    setEditingAddress(address); // Mở modal sửa với data của địa chỉ này
  };

  const handleEditSubmit = async (values) => {
    try {
      if (editAddress && editingAddress) {
        await editAddress(editingAddress.id, values);
        setEditingAddress(null); // Đóng modal
        message.success("Cập nhật địa chỉ thành công!");
      }
    } catch (error) {
      console.error(error);
      message.error("Cập nhật thất bại");
    }
  };

  // --- XỬ LÝ XÓA ---
  const handleDeleteClick = (address) => {
    setAddressToDelete(address);
    setShowDeleteModal(true);
  };

  return (
    <div style={{ maxWidth: 1000, padding: 6 }}>
      <Title level={4}>
        <EnvironmentOutlined /> Địa Chỉ Của Tôi
      </Title>

      {addresses.length === 0 ? (
        <Empty
          description={
            <div>
              <Text>Bạn chưa có địa chỉ nào</Text>
              <br />
              <Text type="secondary">Thêm địa chỉ đầu tiên để bắt đầu</Text>
            </div>
          }
        />
      ) : (
        <List
          grid={{ gutter: 16, column: 1 }}
          dataSource={addresses}
          renderItem={(addr) => (
            <List.Item>
              <AddressCard
                address={addr}
                onEdit={() => handleEditClick(addr)} // Truyền hàm mở modal
                onDelete={() => handleDeleteClick(addr)}
                setDefaultAddress={setDefaultAddress}
                provinces={provinces} // Chỉ để hiển thị tên địa điểm
              />
            </List.Item>
          )}
        />
      )}

      {/* Nút mở Modal Thêm */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setShowAddForm(true)}
        >
          Thêm địa chỉ mới
        </Button>
      </div>

      {/* --- MODAL THÊM --- */}
      <Modal
        title="Thêm địa chỉ mới"
        open={showAddForm}
        onCancel={() => setShowAddForm(false)}
        footer={null}
        width={800}
        destroyOnClose // Reset form khi đóng
      >
        <AddressAddForm
          onSuccess={handleAddAddress}
          onCancel={() => setShowAddForm(false)}
        />
      </Modal>

      {/* --- MODAL SỬA (MỚI) --- */}
      <Modal
        title="Cập nhật địa chỉ"
        open={!!editingAddress} // Mở khi có địa chỉ đang sửa
        onCancel={() => setEditingAddress(null)}
        footer={null}
        width={800}
        destroyOnClose // Quan trọng: Reset form khi đổi địa chỉ khác
      >
        {/* Chỉ render form khi có data editingAddress */}
        {editingAddress && (
          <AddressEditForm
            address={editingAddress}
            onSave={handleEditSubmit}
            onCancel={() => setEditingAddress(null)}
            provinces={provinces}
            fetchDistrictsByProvince={fetchDistrictsByProvince}
            fetchWardsByDistrict={fetchWardsByDistrict}
          />
        )}
      </Modal>

      {/* --- MODAL XÓA --- */}
      <AddressDeleteModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          if (addressToDelete) deleteAddress(addressToDelete.id);
          setShowDeleteModal(false);
          setAddressToDelete(null);
        }}
        address={addressToDelete}
        formatLocationName={formatLocationName}
      />
    </div>
  );
};

export default AddressList;