import React, { useState, useEffect } from "react";
import { useCart } from "../services/CartContext";
import { Modal, Button } from "antd";
import {
  ExclamationCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import "../styles/QuantityInput.css";

function QuantityInput({ item }) {
  const { updateQuantity, removeFromCart } = useCart();
  const [localQuantity, setLocalQuantity] = useState(item.quantity);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showStockNotice, setShowStockNotice] = useState(false);
  const [maxStock, setMaxStock] = useState(
    item?.product_data?.stock || item?.product?.stock || null
  );

  // Fetch stock if missing
  useEffect(() => {
    const prodId =
      item?.product_data?.id ||
      item?.product?.id ||
      item?.product ||
      item?.product_id;
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
    setLocalQuantity(item.quantity);
  }, [item.quantity]);

  const handleChange = (val) => {
    if (val < 1) {
      setShowConfirm(true);
      return;
    }

    // Enforce stock limit
    if (maxStock != null && val > maxStock) {
      setLocalQuantity(maxStock);
      setShowStockNotice(true);
      const productId =
        item.product_data?.id ||
        item.product?.id ||
        item.product_id ||
        item.product;
      updateQuantity(productId, maxStock);
      return;
    }

    setLocalQuantity(val);
    const productId =
      item.product_data?.id ||
      item.product?.id ||
      item.product_id ||
      item.product;
    updateQuantity(productId, val);
  };

  const handleConfirmRemove = async () => {
    try {
      const productId =
        item.product_data?.id ||
        item.product?.id ||
        item.product_id ||
        item.product;
      await removeFromCart(productId);
    } finally {
      setShowConfirm(false);
    }
  };

  return (
    <div className="quantity-input">
      <button
        className="qty-btn"
        onClick={() => handleChange(localQuantity - 1)}
      >
        -
      </button>
      <input
        type="number"
        min={1}
        max={maxStock ?? undefined}
        value={localQuantity}
        onChange={(e) => handleChange(Number(e.target.value))}
        className="qty-input price-input"
      />
      <button
        className="qty-btn"
        onClick={() => handleChange(localQuantity + 1)}
        disabled={maxStock != null && localQuantity >= maxStock}
      >
        +
      </button>

      {/* ✅ Modal xác nhận xóa sản phẩm */}
      <Modal
        open={showConfirm}
        onCancel={() => setShowConfirm(false)}
        centered
        title={
          <div className="flex items-center gap-2 text-red-600">
            <ExclamationCircleOutlined />
            <span>Xóa sản phẩm</span>
          </div>
        }
        okText="Xóa"
        cancelText="Hủy"
        okType="danger"
        onOk={handleConfirmRemove}
      >
        <p>Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?</p>
      </Modal>

      {/* ✅ Modal cảnh báo vượt tồn kho */}
      <Modal
        open={showStockNotice}
        onCancel={() => setShowStockNotice(false)}
        centered
        footer={[
          <Button
            key="ok"
            type="primary"
            onClick={() => setShowStockNotice(false)}
          >
            Đã hiểu
          </Button>,
        ]}
        title={
          <div className="flex items-center gap-2 text-blue-600">
            <InfoCircleOutlined />
            <span>Vượt quá tồn kho</span>
          </div>
        }
      >
        <p>
          Số lượng yêu cầu vượt quá tồn kho hiện có. Đã điều chỉnh về tối đa là{" "}
          <strong>{maxStock}</strong>.
        </p>
      </Modal>
    </div>
  );
}

export default QuantityInput;
