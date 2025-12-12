// services/flashSaleService.js
import axios from './axiosInstance';

const API_BASE_URL = process.env.REACT_APP_API_URL;
const API_URL = `${API_BASE_URL}/promotions/flashsale-admin/`;
const PRODUCT_API_URL = `${API_BASE_URL}/products/`;


export const getFlashSales = () => axios.get(API_URL);
export const createFlashSale = (data) => axios.post(API_URL, data);
export const updateFlashSale = (id, data) => axios.patch(`${API_URL}${id}/`, data);
export const deleteFlashSale = (id) => axios.delete(`${API_URL}${id}/`);
export const getProducts = () => axios.get(PRODUCT_API_URL);