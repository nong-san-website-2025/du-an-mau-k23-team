export const formatLocationName = (address, provinces = [], districts = [], wards = []) => {
  const province = provinces.find(p => p.code === address.province_code);
  const district = districts.find(d => d.code === address.district_code);
  const ward = wards.find(w => w.code === address.ward_code);

  const parts = [];
  if (ward) parts.push(ward.name);
  if (district) parts.push(district.name);
  if (province) parts.push(province.name);
  if (address.location) parts.push(address.location);

  return parts.join(", ");
};
