import API from '../../login_register/services/api';


export const createOrder = async (orderData) => {
  const response = await API.post('orders/', orderData);
  return response.data;
};
