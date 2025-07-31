import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../../login_register/services/api';
import { toast } from 'react-toastify';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch cart items on mount
  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await API.get('cartitems/');
      setCartItems(res.data);
    } catch (err) {
      setCartItems([]);
    }
    setLoading(false);
  };

  // Cho phép truyền callback để hiển thị toast khi thêm thành công
  const addToCart = async (productId, quantity = 1, onSuccess, onError) => {
    setLoading(true);
    try {
      await API.post('cartitems/add/', { product: productId, quantity });
      await fetchCart();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error adding to cart:', err);
      if (onError) {
        onError(err);
      } else {
        // Default error handling
        if (err.response?.status === 401) {
          toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng');
        } else if (err.response?.data?.error) {
          toast.error(err.response.data.error);
        } else {
          toast.error('Không thể thêm vào giỏ hàng. Vui lòng thử lại.');
        }
      }
    }
    setLoading(false);
  };

  const updateQuantity = async (itemId, quantity) => {
    setLoading(true);
    try {
      await API.put(`cartitems/${itemId}/update_quantity/`, { quantity });
      await fetchCart();
    } catch (err) {}
    setLoading(false);
  };

  const removeFromCart = async (itemId) => {
    setLoading(true);
    try {
      await API.delete(`cartitems/${itemId}/delete/`);
      await fetchCart();
    } catch (err) {}
    setLoading(false);
  };

  // Thêm function để xóa toàn bộ giỏ hàng sau khi đặt hàng thành công
  const clearCart = async () => {
    setLoading(true);
    try {
      // Xóa từng item trong giỏ hàng
      for (const item of cartItems) {
        await API.delete(`cartitems/${item.id}/delete/`);
      }
      await fetchCart();
    } catch (err) {
      console.error('Error clearing cart:', err);
    }
    setLoading(false);
  };

  return (
    <CartContext.Provider value={{ cartItems, loading, addToCart, updateQuantity, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};
