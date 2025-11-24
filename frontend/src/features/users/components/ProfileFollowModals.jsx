// src/components/ProfileFollowModals.jsx
import React from "react";
import { Modal, ListGroup, Button } from "react-bootstrap";

export const FollowingModal = ({
  show,
  onHide,
  followingList,
  handleUnfollow,
}) => (
  <Modal show={show} onHide={onHide} centered size="md">
    <Modal.Header closeButton>
      <Modal.Title>Đang theo dõi</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <ListGroup>
        {followingList.map((s) => (
          <ListGroup.Item
            key={s.id}
            className="d-flex align-items-center"
            style={{ padding: "8px 12px", gap: 8 }}
          >
            <div
              className="d-flex align-items-center flex-grow-1 min-w-0"
              style={{ gap: 10 }}
            >
              {s.image ? (
                <img
                  src={s.image}
                  alt={s.store_name}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : null}
              <div
                className="fw-semibold text-truncate"
                style={{ maxWidth: "100%" }}
              >
                {s.store_name || s.owner_username || s.user_username || `Shop #${s.id}`}
              </div>
            </div>
            <Button
              variant="outline-danger"
              size="sm"
              className="ms-2 px-2 py-1"
              title="Hủy theo dõi"
              onClick={() => handleUnfollow(s.id)}
            >
              ✕
            </Button>
          </ListGroup.Item>
        ))}
        {followingList.length === 0 && (
          <div className="text-muted p-2">Bạn chưa theo dõi cửa hàng nào.</div>
        )}
      </ListGroup>
    </Modal.Body>
  </Modal>
);

export const FollowersModal = ({ show, onHide, followersList }) => (
  <Modal show={show} onHide={onHide} centered size="md">
    <Modal.Header closeButton>
      <Modal.Title>Người theo dõi</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <ListGroup>
        {followersList.map((u) => (
          <ListGroup.Item key={u.id} className="d-flex align-items-center">
            {u.avatar ? (
              <img
                src={u.avatar}
                alt={u.full_name || u.username}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  objectFit: "cover",
                  marginRight: 8,
                }}
              />
            ) : null}
            <strong>{u.full_name || u.username}</strong>
          </ListGroup.Item>
        ))}
        {followersList.length === 0 && (
          <div className="text-muted p-2">Chưa có ai theo dõi bạn.</div>
        )}
      </ListGroup>
    </Modal.Body>
  </Modal>
);