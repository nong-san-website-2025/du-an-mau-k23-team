import React, { useState } from "react";
import { Button } from "react-bootstrap";
import { FaUser } from "react-icons/fa";

const mainColor = "#2E8B57";
const accentColor = "#F57C00";

const AddressList = ({
  addresses,
  setDefaultAddress,
  showAddressForm,
  setShowAddressForm,
  newAddress,
  setNewAddress,
  addAddress,
}) => {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <>
      <div
        className=""
        style={{
          fontWeight: 700,
          fontSize: 22,
          marginBottom: 18,
          color: mainColor,
        }}
      >
        Địa Chỉ Của Tôi
      </div>
      {addresses.map((addr) => (
        <div
          key={addr.id}
          className="mb-0 p-2 border rounded"
          style={{
            background: addr.is_default ? "#e0ffe0" : "#f9f9f9",
            border: addr.is_default
              ? `2px solid ${mainColor}`
              : "1px solid #eee",
          }}
          onMouseEnter={() => setHoveredId(addr.id)}
          onMouseLeave={() => setHoveredId(null)}
        >
          <div className="d-flex align-items-center justify-content-between">
            <div style={{ fontWeight: 500, color: mainColor }}>
              <FaUser style={{ marginRight: 6 }} /> {addr.recipient_name} -{" "}
              {addr.phone}
            </div>
            <div style={{ color: "#555" }}>{addr.location}</div>
            {!addr.is_default && hoveredId === addr.id && (
              <Button
                size="sm"
                style={{
                  background: mainColor,
                  color: "#fff",
                  borderRadius: 8 ,
                  fontWeight: 700,
                  border: "none",
                  marginTop: 0,
                }}
                onClick={() => setDefaultAddress(addr.id)}
              >
                Chọn làm mặc định
              </Button>
            )}
          </div>
        </div>
      ))}
      <Button
        style={{
          background: accentColor,
          color: "#fff",
          borderRadius: 8,
          fontWeight: 700,
          border: "none",
          marginTop: 8,
        }}
        onClick={() => setShowAddressForm(!showAddressForm)}
      >
        {showAddressForm ? "Huỷ" : "Thêm địa chỉ mới"}
      </Button>
      {showAddressForm && (
        <div className="mt-3">
          <input
            className="form-control mb-2"
            placeholder="Họ tên người nhận"
            value={newAddress.recipient_name}
            onChange={(e) =>
              setNewAddress({ ...newAddress, recipient_name: e.target.value })
            }
            style={{
              border: `1px solid ${mainColor}`,
              borderRadius: 8,
              padding: 8,
            }}
          />
          <input
            className="form-control mb-2"
            placeholder="Số điện thoại"
            value={newAddress.phone}
            onChange={(e) =>
              setNewAddress({ ...newAddress, phone: e.target.value })
            }
            style={{
              border: `1px solid ${mainColor}`,
              borderRadius: 8,
              padding: 8,
            }}
          />
          <textarea
            className="form-control mb-2"
            placeholder="Địa chỉ"
            value={newAddress.location}
            onChange={(e) =>
              setNewAddress({ ...newAddress, location: e.target.value })
            }
            style={{
              border: `1px solid ${mainColor}`,
              borderRadius: 8,
              padding: 8,
            }}
          />
          <Button
            style={{
              background: mainColor,
              color: "#fff",
              borderRadius: 8,
              fontWeight: 700,
              border: "none",
              marginTop: 4,
            }}
            onClick={addAddress}
          >
            Lưu địa chỉ
          </Button>
        </div>
      )}
    </>
  );
};

export default AddressList;
