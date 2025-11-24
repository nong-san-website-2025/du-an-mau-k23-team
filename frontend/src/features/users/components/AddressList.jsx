// AddressList.jsx
import React, { useState } from "react";
import { Button, Empty, List, Modal, Typography } from "antd";
import { EnvironmentOutlined, PlusOutlined } from "@ant-design/icons";
import useVietnamLocations from "../../../services/hooks/useVietnamLocations.js";
import AddressCard from "../components/Address/AddressCard";
import AddressAddForm from "../components/Address/AddressAddForm";
import AddressDeleteModal from "../components/Address/AddressDeleteModal.jsx";
import { formatLocationName } from "../../../utils/formatLocationName.js";

const { Text, Title } = Typography;

const AddressList = ({
  addresses = [],
  addAddress,
  deleteAddress,
  setDefaultAddress,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState(null);

  const { provinces, fetchDistrictsByProvince, fetchWardsByDistrict } =
    useVietnamLocations();

  const handleDeleteClick = (address) => {
    setAddressToDelete(address);
    setShowDeleteModal(true);
  };

  const handleAddAddress = (addressData) => {
    addAddress(addressData);
    setShowAddForm(false);
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
                provinces={provinces || []}
                fetchDistrictsByProvince={fetchDistrictsByProvince}
                fetchWardsByDistrict={fetchWardsByDistrict}
                onDelete={handleDeleteClick}
                setDefaultAddress={setDefaultAddress}
              />
            </List.Item>
          )}
        />
      )}

      <Button
        type="primary"
        icon={<PlusOutlined />}
        style={{ marginTop: 16 }}
        onClick={() => setShowAddForm(true)}
      >
        Thêm địa chỉ mới
      </Button>

      <Modal
        title="Thêm địa chỉ mới"
        open={showAddForm}
        onCancel={() => setShowAddForm(false)}
        footer={null}
        width={800}
        bodyStyle={{
          maxHeight: "60vh", // Giới hạn chiều cao modal
          overflowY: "auto",
          padding: 10 // Cuộn khi nội dung vượt quá
        }}
        style={{ top: 80,  }}
      >
        <AddressAddForm
          onSuccess={handleAddAddress}
          onCancel={() => setShowAddForm(false)}
        />
      </Modal>

      <AddressDeleteModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          if (addressToDelete) {
            deleteAddress(addressToDelete.id);
          }
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
