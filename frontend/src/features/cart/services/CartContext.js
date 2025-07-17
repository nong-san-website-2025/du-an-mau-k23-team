import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

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
      const res = await axios.get('/api/cartitems/');
      setCartItems(res.data);
    } catch (err) {
      setCartItems([]);
    }
    setLoading(false);
  };

  const addToCart = async (productId, quantity = 1) => {
    setLoading(true);
    try {
      await axios.post('/api/cartitems/add/', { product: productId, quantity });
      await fetchCart();
    } catch (err) {}
    setLoading(false);
  };

  const updateQuantity = async (itemId, quantity) => {
    setLoading(true);
    try {
      await axios.put(`/api/cartitems/${itemId}/update_quantity/`, { quantity });
      await fetchCart();
    } catch (err) {}
    setLoading(false);
  };

  const removeFromCart = async (itemId) => {
    setLoading(true);
    try {
      await axios.delete(`/api/cartitems/${itemId}/delete/`);
      await fetchCart();
    } catch (err) {}
    setLoading(false);
  };

  return (
    <CartContext.Provider value={{ cartItems, loading, addToCart, updateQuantity, removeFromCart }}>
      {children}
    </CartContext.Provider>
  );
};
