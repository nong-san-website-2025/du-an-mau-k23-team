// src/features/cart/pages/QuantityInput.jsx
import React, { useState, useEffect, useRef } from "react";
import { useCart } from "../services/CartContext";
import { Modal, Tooltip, message } from "antd";
import {
  ExclamationCircleOutlined,
  MinusOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

function QuantityInput({ item, itemId }) {
  const { updateQuantity, removeFromCart } = useCart();
  const [localQuantity, setLocalQuantity] = useState(item.quantity);
  const [maxStock, setMaxStock] = useState(
    item?.product_data?.stock || item?.product?.stock || null
  );
  const debounceTimerRef = useRef(null);
  const lastApiCallRef = useRef(null);

  // Logic fetch stock (Giữ nguyên)
  useEffect(() => {
    const prodId = item?.product_data?.id || item?.product?.id;
    if (maxStock == null && prodId) {
      import("../../products/services/productApi").then(({ productApi }) => {
        productApi
          .getProduct(prodId)
          .then((prod) => setMaxStock(prod?.stock ?? null))
          .catch(() => {});
      });
    }
  }, [item, maxStock]);

  useEffect(() => {
    if (lastApiCallRef.current !== item.quantity) {
      setLocalQuantity(item.quantity);
      lastApiCallRef.current = item.quantity;
    }
  }, [item.quantity]);

  const handleChange = (val) => {
    if (val < 1) {
      Modal.confirm({
        title: "Xóa sản phẩm?",
        icon: <ExclamationCircleOutlined />,
        content: "Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?",
        okText: "Xóa",
        okType: "danger",
        cancelText: "Hủy",
        onOk: () => removeFromCart(itemId),
      });
      return;
    }

    if (maxStock != null && val > maxStock) {
      setLocalQuantity(maxStock);
      lastApiCallRef.current = maxStock;
      updateQuantity(itemId, maxStock);
      message.warning(`Số lượng tối đa của sản phẩm này là ${maxStock}`);
      return;
    }

    setLocalQuantity(val);
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      lastApiCallRef.current = val;
      updateQuantity(itemId, val);
      debounceTimerRef.current = null;
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div className="qty-wrapper">
        <button
          className="qty-btn"
          onClick={() => handleChange(localQuantity - 1)}
          disabled={localQuantity <= 1} // Disable nút - nếu = 1 để tránh popup xoá khi click nhầm (UX better)
        >
          <MinusOutlined style={{ fontSize: 10 }} />
        </button>
        <input
          type="number"
          className="qty-input-field"
          value={localQuantity}
          onChange={(e) => handleChange(Number(e.target.value))}
        />
        <button
          className="qty-btn"
          onClick={() => handleChange(localQuantity + 1)}
          disabled={maxStock != null && localQuantity >= maxStock}
        >
          <PlusOutlined style={{ fontSize: 10 }} />
        </button>
      </div>

      {/* Nút xóa tách riêng */}
      <Tooltip title="Xóa">
        <DeleteOutlined 
            className="delete-icon" 
            onClick={() => {
                Modal.confirm({
                    title: "Xóa sản phẩm?",
                    icon: <ExclamationCircleOutlined />,
                    content: "Bạn muốn bỏ sản phẩm này?",
                    okText: "Xóa",
                    okType: "danger",
                    cancelText: "Hủy",
                    onOk: () => removeFromCart(itemId),
                });
            }}
        />
      </Tooltip>
    </div>
  );
}

export default QuantityInput;