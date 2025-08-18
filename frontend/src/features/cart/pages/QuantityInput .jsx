import React, { useState } from "react";
import { useCart } from "../services/CartContext";
import "../styles/QuantityInput.css"; // import CSS

function QuantityInput({ item }) {
  const { updateQuantity } = useCart();
  const [localQuantity, setLocalQuantity] = useState(item.quantity);

  const handleChange = (val) => {
    if (val < 1) return;
    setLocalQuantity(val);
    updateQuantity(item.id, val);
  };

  return (
    <div className="quantity-input">
      <button className="qty-btn" onClick={() => handleChange(localQuantity - 1)}>-</button>
      <input
        type="number"
        min={1}
        value={localQuantity}
        onChange={(e) => handleChange(Number(e.target.value))}
        className="qty-input"
      />
      <button className="qty-btn" onClick={() => handleChange(localQuantity + 1)}>+</button>
    </div>
  );
}

export default QuantityInput;
