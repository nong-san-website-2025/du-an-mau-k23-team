// src/services/hooks/useVietnamLocations.js
import { useState, useEffect } from "react";
import { getProvinces, getDistricts, getWards } from "../api/ghnApi";

export default function useVietnamLocations() {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  // Lấy danh sách tỉnh ngay khi component mount
  useEffect(() => {
    async function fetchProvinces() {
      const data = await getProvinces();
      setProvinces(data);
    }
    fetchProvinces();
  }, []);

  // Hàm fetch quận/huyện theo province
  const fetchDistrictsByProvince = async (provinceId) => {
    if (!provinceId) {
      setDistricts([]);
      setWards([]);
      return;
    }
    const data = await getDistricts(provinceId);
    setDistricts(data);
    setWards([]); // reset wards khi đổi tỉnh
  };

  // Hàm fetch phường/xã theo district
  const fetchWardsByDistrict = async (districtId) => {
    if (!districtId) {
      setWards([]);
      return;
    }
    const data = await getWards(districtId);
    setWards(data);
  };

  return {
    provinces,
    districts,
    wards,
    fetchDistrictsByProvince,
    fetchWardsByDistrict,
  };
}
