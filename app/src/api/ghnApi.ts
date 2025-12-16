// src/api/ghnApi.ts
import { API } from './api'; 
import { Province, District, Ward } from '../types/Address';

interface GHNResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 1. Lấy danh sách Tỉnh/Thành
export const getProvinces = async (): Promise<Province[]> => {
  try {
    const res = await API.get<GHNResponse<Province[]>>('delivery/master/provinces/');
    return res.data || [];
  } catch (error) {
    console.error("Lỗi lấy danh sách tỉnh:", error);
    return [];
  }
};

// 2. Lấy danh sách Quận/Huyện
export const getDistricts = async (provinceId: number): Promise<District[]> => {
  if (!provinceId) return [];
  
  try {
    // ✅ SỬA Ở ĐÂY: Truyền { province_id: provinceId } trực tiếp, không bọc trong { params: ... }
    const res = await API.get<GHNResponse<District[]>>('delivery/master/districts/', {
       province_id: provinceId 
    });
    return res.data || [];
  } catch (error) {
    console.error("Lỗi lấy danh sách quận/huyện:", error);
    return [];
  }
};

// 3. Lấy danh sách Phường/Xã
export const getWards = async (districtId: number): Promise<Ward[]> => {
  if (!districtId) return [];

  try {
    // ✅ SỬA Ở ĐÂY: Truyền { district_id: districtId } trực tiếp
    const res = await API.get<GHNResponse<Ward[]>>('delivery/master/wards/', {
       district_id: districtId 
    });
    return res.data || [];
  } catch (error) {
    console.error("Lỗi lấy danh sách phường/xã:", error);
    return [];
  }
};