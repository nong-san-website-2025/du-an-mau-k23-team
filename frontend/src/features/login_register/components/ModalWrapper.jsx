// src/features/auth/components/ModalWrapper.jsx
import "../styles/ModalWrapper.css";

export default function ModalWrapper({ title, children, onClose }) {
  return (
    <div
      className="modal-overlay"
      onClick={onClose} // click ngoài modal sẽ đóng
    >
      <div
        className="modal-content w-50 bg-white p-4 rounded"
        onClick={(e) => e.stopPropagation()} // chặn click bên trong modal
      >
        <div className="modal-header d-flex justify-content-between align-items-center mb-3">
          {title && <h3>{title}</h3>}
          <button
            className="modal-close-btn"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.2rem",
              cursor: "pointer",
            }}
          >
            &times;
          </button>
        </div>

        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
