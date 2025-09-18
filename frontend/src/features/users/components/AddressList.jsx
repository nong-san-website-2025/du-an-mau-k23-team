
import React, { useState } from "react";
import { } from "react-icons/fa";
import { Modal } from "react-bootstrap";
import  {FaUser, FaEdit, FaTrash, FaMapMarkerAlt, FaPhone, FaStar } from "react-icons/fa";
import '../styles/css/AddressList.css';


const AddressList = ({ 
  addresses, 
  setDefaultAddress, 
  showAddressForm, 
  setShowAddressForm, 
  newAddress, 
  setNewAddress, 
  addAddress,
  editAddress,
  deleteAddress 
}) => {
  const [editingAddress, setEditingAddress] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState(null);
  const [editForm, setEditForm] = useState({
    recipient_name: '',
    phone: '',
    location: ''
  });

  const handleEditClick = (address) => {
    setEditingAddress(address.id);
    setEditForm({
      recipient_name: address.recipient_name,
      phone: address.phone,
      location: address.location
    });
    setShowAddressForm(false); // Close add form if open
  };

  const handleEditSave = async () => {
    try {
      await editAddress(editingAddress, editForm);
      setEditingAddress(null);
      setEditForm({ recipient_name: '', phone: '', location: '' });
    } catch (error) {
      console.error('Error editing address:', error);
    }
  };

  const handleEditCancel = () => {
    setEditingAddress(null);
    setEditForm({ recipient_name: '', phone: '', location: '' });
  };

  const handleDeleteClick = (address) => {
    setAddressToDelete(address);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteAddress(addressToDelete.id);
      setShowDeleteModal(false);
      setAddressToDelete(null);
    } catch (error) {
      console.error('Error deleting address:', error);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setAddressToDelete(null);
  };

  return (
    <div className="address-list-container">
      <div className="address-list-title">
        <FaMapMarkerAlt />
        Địa Chỉ Của Tôi
      </div>
      
      {addresses.length === 0 ? (
        <div className="empty-address-state">
          <FaMapMarkerAlt size={32} className="empty-address-icon" />
          <p style={{ margin: 0, fontSize: 16 }}>Bạn chưa có địa chỉ nào</p>
          <p style={{ margin: 0, fontSize: 14, opacity: 0.8 }}>Thêm địa chỉ đầu tiên để bắt đầu</p>
        </div>
      ) : (
        addresses.map((addr) => (
          <div
            key={addr.id}
            className={`address-card ${addr.is_default ? 'default' : 'regular'}`}
          >
            {/* Default Badge */}
            {addr.is_default && (
              <div className="default-badge">
                <FaStar size={10} />
                Mặc định
              </div>
            )}

            {editingAddress === addr.id ? (
              // Edit Form
              <div className="edit-form">
                <div className="edit-form-title">
                  <FaEdit />
                  Chỉnh sửa địa chỉ
                </div>
                <input
                  className="form-control edit-form-input"
                  placeholder="Họ tên người nhận"
                  value={editForm.recipient_name}
                  onChange={e => setEditForm({ ...editForm, recipient_name: e.target.value })}
                />
                <input
                  className="form-control edit-form-input"
                  placeholder="Số điện thoại"
                  value={editForm.phone}
                  onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                />
                <textarea
                  className="form-control edit-form-textarea"
                  placeholder="Địa chỉ chi tiết"
                  value={editForm.location}
                  onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                />
                <div className="edit-form-actions">
                  <button
                    className="action-btn primary"
                    onClick={handleEditSave}
                  >
                    Lưu thay đổi
                  </button>
                  <button
                    className="action-btn cancel-btn"
                    onClick={handleEditCancel}
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              // Display Mode
              <div className="address-info">
                <div className="address-name">
                  <FaUser />
                  {addr.recipient_name}
                </div>
                <div className="address-phone">
                  <FaPhone />
                  {addr.phone}
                </div>
                <div className="address-location">
                  <FaMapMarkerAlt />
                  {addr.location}
                </div>
                
                {/* Action Buttons */}
                <div className="address-actions">
                  {!addr.is_default && (
                    <button
                      className="action-btn primary"
                      onClick={() => setDefaultAddress(addr.id)}
                    >
                      <FaStar />
                      Đặt làm mặc định
                    </button>
                  )}
                  
                  <button
                    className="action-btn outline-primary"
                    onClick={() => handleEditClick(addr)}
                  >
                    <FaEdit />
                    Chỉnh sửa
                  </button>
                  
                  <button
                    className="action-btn outline-danger"
                    onClick={() => handleDeleteClick(addr)}
                  >
                    <FaTrash />
                    Xóa
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
      
      {/* Add New Address Button */}
      <button
        className="add-address-btn"
        onClick={() => {
          setShowAddressForm(!showAddressForm);
          setEditingAddress(null); // Close edit form if open
        }}
      >
        {showAddressForm ? "✕ Hủy" : "+ Thêm địa chỉ mới"}
      </button>
      
      {/* Add Address Form */}
      {showAddressForm && (
        <div className="add-address-form">
          <div className="add-form-title">
            ➕ Thêm địa chỉ mới
          </div>
          <input
            className="form-control add-form-input"
            placeholder="Họ tên người nhận"
            value={newAddress.recipient_name}
            onChange={e => setNewAddress({ ...newAddress, recipient_name: e.target.value })}
          />
          <input
            className="form-control add-form-input"
            placeholder="Số điện thoại"
            value={newAddress.phone}
            onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })}
          />
          
           <input
            className="form-control add-form-input"
            placeholder="email"
            value={newAddress.phone}
            onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })}
          />
          <textarea
            className="form-control add-form-textarea"
            placeholder="Địa chỉ chi tiết"
            value={newAddress.location}
            onChange={e => setNewAddress({ ...newAddress, location: e.target.value })}
          />
          <div className="add-form-actions">
            <button
              className="action-btn primary"
              onClick={addAddress}
            >
              Lưu địa chỉ
            </button>
            <button
              className="action-btn cancel-btn"
              onClick={() => setShowAddressForm(false)}
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={handleDeleteCancel} centered>
        <Modal.Header closeButton className="delete-modal-header">
          <Modal.Title className="delete-modal-title">
            <FaTrash />
            Xác nhận xóa địa chỉ
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="delete-modal-body">
          {addressToDelete && (
            <div>
              <p style={{ marginBottom: 16, fontSize: 16 }}>
                Bạn có chắc chắn muốn xóa địa chỉ này không?
              </p>
              <div className="delete-address-preview">
                <div className="address-name">
                  <FaUser />
                  {addressToDelete.recipient_name}
                </div>
                <div className="address-phone">
                  <FaPhone />
                  {addressToDelete.phone}
                </div>
                <div className="address-location">
                  <FaMapMarkerAlt />
                  {addressToDelete.location}
                </div>
              </div>
              <p className="delete-warning">
                ⚠️ Hành động này không thể hoàn tác.
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="delete-modal-footer">
          <button
            className="action-btn cancel-btn"
            onClick={handleDeleteCancel}
          >
            Hủy
          </button>
          <button
            className="delete-btn"
            onClick={handleDeleteConfirm}
          >
            <FaTrash />
            Xóa địa chỉ
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AddressList;
