// src/features/cart/components/ProvinceDistrictWardSelector.jsx
import React, { useState, useEffect } from "react";
import { Select, Spin } from "antd";
import { getProvinces, getDistricts, getWards } from "../../../services/api/ghnApi";

const { Option } = Select;

const ProvinceDistrictWardSelector = ({ value, onChange }) => {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  // Load provinces on mount
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const data = await getProvinces();
        setProvinces(data);
      } catch (err) {
        console.error("❌ Lỗi tải danh sách tỉnh:", err);
      } finally {
        setLoadingProvinces(false);
      }
    };
    loadProvinces();
  }, []);

  // Load districts when province changes
  useEffect(() => {
    if (!value.provinceId) {
      setDistricts([]);
      setWards([]);
      onChange({ ...value, districtId: undefined, wardCode: undefined });
      return;
    }

    const loadDistricts = async () => {
      setLoadingDistricts(true);
      try {
        const data = await getDistricts(value.provinceId);
        setDistricts(data);
        // Nếu districtId hiện tại không còn tồn tại → reset
        if (value.districtId && !data.some(d => d.DistrictID === value.districtId)) {
          onChange({ ...value, districtId: undefined, wardCode: undefined });
        }
      } catch (err) {
        console.error("❌ Lỗi tải danh sách quận:", err);
        setDistricts([]);
      } finally {
        setLoadingDistricts(false);
      }
    };

    loadDistricts();
  }, [value.provinceId]);

  // Load wards when district changes
  useEffect(() => {
    if (!value.districtId) {
      setWards([]);
      onChange({ ...value, wardCode: undefined });
      return;
    }

    const loadWards = async () => {
      setLoadingWards(true);
      try {
        const data = await getWards(value.districtId);
        setWards(data);
        // Nếu wardCode hiện tại không còn tồn tại → reset
        if (value.wardCode && !data.some(w => w.WardCode === value.wardCode)) {
          onChange({ ...value, wardCode: undefined });
        }
      } catch (err) {
        console.error("❌ Lỗi tải danh sách phường:", err);
        setWards([]);
      } finally {
        setLoadingWards(false);
      }
    };

    loadWards();
  }, [value.districtId]);

  const handleProvinceChange = (provinceId) => {
    onChange({
      provinceId,
      districtId: undefined,
      wardCode: undefined,
    });
  };

  const handleDistrictChange = (districtId) => {
    onChange({
      ...value,
      districtId,
      wardCode: undefined,
    });
  };

  const handleWardChange = (wardCode) => {
    onChange({
      ...value,
      wardCode,
    });
  };

  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      {/* Tỉnh/Thành phố */}
      <Select
        style={{ flex: 1, minWidth: 150 }}
        placeholder="Chọn Tỉnh/Thành phố"
        value={value.provinceId || undefined}
        onChange={handleProvinceChange}
        loading={loadingProvinces}
        allowClear
      >
        {provinces.map((province) => (
          <Option key={province.ProvinceID} value={province.ProvinceID}>
            {province.ProvinceName}
          </Option>
        ))}
      </Select>

      {/* Quận/Huyện */}
      <Select
        style={{ flex: 1, minWidth: 150 }}
        placeholder="Chọn Quận/Huyện"
        value={value.districtId || undefined}
        onChange={handleDistrictChange}
        loading={loadingDistricts}
        disabled={!value.provinceId}
        allowClear
      >
        {districts.map((district) => (
          <Option key={district.DistrictID} value={district.DistrictID}>
            {district.DistrictName}
          </Option>
        ))}
      </Select>

      {/* Phường/Xã */}
      <Select
        style={{ flex: 1, minWidth: 150 }}
        placeholder="Chọn Phường/Xã"
        value={value.wardCode || undefined}
        onChange={handleWardChange}
        loading={loadingWards}
        disabled={!value.districtId}
        allowClear
      >
        {wards.map((ward) => (
          <Option key={ward.WardCode} value={ward.WardCode}>
            {ward.WardName}
          </Option>
        ))}
      </Select>
    </div>
  );
};

export default ProvinceDistrictWardSelector;