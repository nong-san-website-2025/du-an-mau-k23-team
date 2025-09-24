// src/services/api/ghnApi.js
// Helper wrappers to call backend GHN master-data proxies

import API from "../../features/login_register/services/api";

export async function getProvinces() {
  const res = await API.get("delivery/master/provinces/");
  return res.data?.data || [];
}

export async function getDistricts(provinceId) {
  if (!provinceId) return [];
  const res = await API.get("delivery/master/districts/", {
    params: { province_id: provinceId },
  });
  return res.data?.data || [];
}

export async function getWards(districtId) {
  if (!districtId) return [];
  const res = await API.get("delivery/master/wards/", {
    params: { district_id: districtId },
  });
  return res.data?.data || [];
}