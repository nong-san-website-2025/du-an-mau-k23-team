import { api } from '../../login_register/services/AuthContext';

export const createOrder = async (orderData) => {
  const response = await api.post('orders/', orderData);
  return response.data;
};
