import React, { useState, useEffect } from "react";

const AddressEditForm = ({
  address,
  onEdit,
  setEditingAddress,
  provinces = [],
  fetchDistrictsByProvince,
  fetchWardsByDistrict,
}) => {
  const [formData, setFormData] = useState({
    recipient_name: "",
    phone: "",
    location: "",
    province_id: "",
    district_id: "",
    ward_id: "",
  });

  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  // Load dữ liệu khi address thay đổi
  useEffect(() => {
    if (!address) return;
    setFormData({
      recipient_name: address.recipient_name || "",
      phone: address.phone || "",
      location: address.location || "",
      province_id: address.province_id || "",
      district_id: address.district_id || "",
      ward_id: address.ward_id || "",
    });
  }, [address]);

  useEffect(() => {
    const loadDistricts = async () => {
      if (!formData.province_id) {
        setDistricts([]);
        setFormData((prev) => ({ ...prev, district_id: "", ward_id: "" }));
        return;
      }
      try {
        const data = await fetchDistrictsByProvince(formData.province_id);
        setDistricts(data || []);

        // Nếu đang edit, giữ district_id cũ nếu có trong list
        if (formData.district_id) {
          const exists = data.find(
            (d) => d.DistrictID === formData.district_id
          );
          if (!exists)
            setFormData((prev) => ({ ...prev, district_id: "", ward_id: "" }));
        }
      } catch (err) {
        console.error(err);
        setDistricts([]);
      }
    };
    loadDistricts();
  }, [formData.province_id, fetchDistrictsByProvince]);

  // Load wards
  useEffect(() => {
    const loadWards = async () => {
      if (!formData.district_id) {
        setWards([]);
        setFormData((prev) => ({ ...prev, ward_id: "" }));
        return;
      }
      try {
        const data = await fetchWardsByDistrict(formData.district_id);
        setWards(data || []);

        // Nếu đang edit, giữ ward_id cũ nếu có trong list
        if (formData.ward_id) {
          const exists = data.find((w) => w.WardCode === formData.ward_id);
          if (!exists) setFormData((prev) => ({ ...prev, ward_id: "" }));
        }
      } catch (err) {
        console.error(err);
        setWards([]);
      }
    };
    loadWards();
  }, [formData.district_id, fetchWardsByDistrict]); 

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onEdit(formData);
    setEditingAddress(null);
  };

  return (
    <form onSubmit={handleSubmit} className="address-edit-form">
      <input
        type="text"
        name="recipient_name"
        value={formData.recipient_name}
        onChange={handleChange}
        placeholder="Họ và tên người nhận"
        required
      />
      <input
        type="text"
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        placeholder="Số điện thoại"
        required
      />
      <input
        type="text"
        name="location"
        value={formData.location}
        onChange={handleChange}
        placeholder="Địa chỉ chi tiết"
        required
      />

      <select
        name="province_id"
        value={formData.province_id}
        onChange={handleChange}
      >
        <option value="">Chọn tỉnh/thành</option>
        {provinces.map((p) => (
          <option key={p.ProvinceID} value={p.ProvinceID}>
            {p.ProvinceName}
          </option>
        ))}
      </select>

      <select
        name="district_id"
        value={formData.district_id}
        onChange={handleChange}
        disabled={!districts.length}
      >
        <option value="">Chọn quận/huyện</option>
        {districts.map((d) => (
          <option key={d.DistrictID} value={d.DistrictID}>
            {d.DistrictName}
          </option>
        ))}
      </select>

      <select
        name="ward_id"
        value={formData.ward_id}
        onChange={handleChange}
        disabled={!wards.length}
      >
        <option value="">Chọn phường/xã</option>
        {wards.map((w) => (
          <option key={w.WardCode} value={w.WardCode}>
            {w.WardName}
          </option>
        ))}
      </select>

      <div className="form-actions">
        <button type="submit" className="save-btn">
          Lưu
        </button>
        <button
          type="button"
          className="cancel-btn"
          onClick={() => setEditingAddress(null)}
        >
          Hủy
        </button>
      </div>
    </form>
  );
};

export default AddressEditForm;
