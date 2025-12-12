// src/hooks/useShippingFee.js
import { useState } from 'react';
import axios from 'axios';

export const useShippingFee = () => {
  const [result, setResult] = useState({
    fee: 0,
    detail: null,
    loading: false,
    error: null,
  });

  const calculateFee = async (payload) => {
    setResult(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await axios.post('/api/shipping/fee/', payload);
      setResult({
        fee: response.data.fee,
        detail: response.data.detail,
        loading: false,
        error: null,
      });
    } catch (error) {
      const message = error.response?.data?.error || 'Không thể tính phí vận chuyển. Vui lòng thử lại.';
      setResult({
        fee: 0,
        detail: null,
        loading: false,
        error: message,
      });
    }
  };

  return { ...result, calculateFee };
};