import React, { useState, useEffect } from "react";
import { useCart } from "../services/CartContext";
import { Modal, Button } from "react-bootstrap";
import "../styles/QuantityInput.css"; // import CSS

function QuantityInput({ item }) {
  const { updateQuantity, removeFromCart } = useCart();
  const [localQuantity, setLocalQuantity] = useState(item.quantity);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showStockNotice, setShowStockNotice] = useState(false);
  const [maxStock, setMaxStock] = useState(
    item?.product_data?.stock || item?.product?.stock || null
  );

  // Ensure we have stock info; fetch if missing (works for both guest/server carts)
  useEffect(() => {
    const prodId =
      item?.product_data?.id || item?.product?.id || item?.product || item?.product_id;
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

    // Enforce stock upper bound if known
    if (maxStock != null && val > maxStock) {
      setLocalQuantity(maxStock);
      setShowStockNotice(true);
      if (item.id) updateQuantity(item.id, maxStock); // only server items have id
      return;
    }

    setLocalQuantity(val);
    if (item.id) updateQuantity(item.id, val); // avoid guest issue
  };

  const handleConfirmRemove = async () => {
    try {
      const stableId = item.id || item.product; // server expects id; guest expects product id
      await removeFromCart(stableId);
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
        className="qty-input"
      />
      <button
        className="qty-btn"
        onClick={() => handleChange(localQuantity + 1)}
        disabled={maxStock != null && localQuantity >= maxStock}
      >
        +
      </button>

      {/* Confirm remove when going below 1 */}
      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Xóa sản phẩm</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirm(false)}>
            Hủy
          </Button>
          <Button variant="danger" onClick={handleConfirmRemove}>
            Xóa
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Notice when exceeding stock */}
      <Modal
        show={showStockNotice}
        onHide={() => setShowStockNotice(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Vượt quá tồn kho</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Số lượng yêu cầu vượt quá tồn kho hiện có. Đã điều chỉnh về tối đa là {maxStock}.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowStockNotice(false)}>
            Đã hiểu
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default QuantityInput;