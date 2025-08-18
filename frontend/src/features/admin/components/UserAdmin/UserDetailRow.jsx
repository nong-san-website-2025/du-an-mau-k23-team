import React, { useState, useEffect } from "react";
import UserEditForm from "./UserEditForm";
import { User, Mail, Phone, Shield, Activity } from "lucide-react";
import "./styles/modal-custom.css";

export default function UserDetailModal({ user, onClose, onUserUpdated }) {
  const [isEditing, setIsEditing] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setTimeout(() => setAnimate(true), 10); // Kích hoạt animation sau khi render
  }, []);

  return (
    <div
      className={`modal-backdrop-custom ${animate ? "show" : ""}`}
      onClick={onClose}
    >
      <div
        className={`modal-container-custom ${animate ? "slide-up" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-custom">
          <h5>
            {isEditing ? "Chỉnh sửa người dùng" : "Thông tin người dùng"}
          </h5>
          <button className="btn-close" onClick={onClose}></button>
        </div>

        <div className="modal-body-custom">
          {isEditing ? (
            <UserEditForm
              editUser={user}
              onCancel={() => setIsEditing(false)}
              onSave={(updatedUser) => {
                setIsEditing(false);
                if (onUserUpdated) {
                  onUserUpdated(updatedUser); // báo lên UserTable để cập nhật list
                }
              }}
            />
          ) : (
            <div className="info-list">
              <InfoItem
                icon={<User size={18} />}
                label="Tên đăng nhập"
                value={user.username}
              />
              <InfoItem
                icon={<User size={18} />}
                label="Họ và tên"
                value={user.full_name || "Chưa có"}
              />
              <InfoItem
                icon={<Mail size={18} />}
                label="Email"
                value={user.email}
              />
              <InfoItem
                icon={<Phone size={18} />}
                label="Số điện thoại"
                value={user.phone || "Chưa có"}
              />
              {/* <InfoItem
                icon={<Shield size={18} />}
                label="Vai trò"
                value={user.role ? user.role.name : "Chưa có"}
              />
              <InfoItem
                icon={<Activity size={18} />}
                label="Trạng thái"
                value={
                  user.status === "active"
                    ? "Đang hoạt động"
                    : user.status === "inactive"
                    ? "Ngừng hoạt động"
                    : "Chưa có"
                }
              /> */}
            </div>
          )}
        </div>

        <div className="modal-footer-custom">
          {!isEditing && (
            <button
              className="btn btn-success"
              onClick={() => setIsEditing(true)}
            >
              Chỉnh sửa
            </button>
          )}
          <button
            className={`btn ${
              isEditing ? "btn-outline-secondary" : "btn-light"
            }`}
            onClick={onClose}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <div className="info-item">
      <span className="info-icon">{icon}</span>
      <div>
        <small className="text-muted">{label}</small>
        <div className="fw-medium">{value}</div>
      </div>
    </div>
  );
}
