// src/types/Address.ts

export interface Address {
  id: number;
  user?: number;
  recipient_name: string;
  phone: string;
  location: string; // Địa chỉ hiển thị (text)
  is_default: boolean;

  // GHN Fields (Snake_case để map với DB backend Django/Laravel thường dùng)
  province_id: number | null;
  district_id: number | null;
  ward_code: string | null;

  // Helper fields (Optional)
  province_name?: string;
  district_name?: string;
  ward_name?: string;
  address_detail?: string;
}

export interface Province {
  ProvinceID: number;
  ProvinceName: string;
}

export interface District {
  DistrictID: number;
  DistrictName: string;
}

export interface Ward {
  WardCode: string;
  WardName: string;
}