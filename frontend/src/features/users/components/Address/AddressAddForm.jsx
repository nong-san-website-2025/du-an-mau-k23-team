import React, { useState, useEffect } from "react";
import { Form, Input, Select, Checkbox, Button, Space } from "antd";
import { getProvinces, getDistricts, getWards } from "../../../../services/api/ghnApi";

const { Option } = Select;

const isValidProvinceName = (name) => {
  if (!name || typeof name !== 'string') return false;
  if (/[0-9!@#$%^&*()_+=\[\]{};:'"\\|,.<>?/`~]/.test(name)) return false;
  if (/test/i.test(name)) return false;
  return true;
};

const AddressAddForm = ({ onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(false);

  const selectedProvince = Form.useWatch("province_id", form);
  const selectedDistrict = Form.useWatch("district_id", form);

  useEffect(() => {
    getProvinces()
      .then(data => {
        const filteredProvinces = data.filter(p => isValidProvinceName(p.ProvinceName));
        setProvinces(filteredProvinces);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedProvince) {
      getDistricts(selectedProvince)
        .then(data => {
          setDistricts(data);
          form.setFieldsValue({ district_id: undefined, ward_code: undefined });
          setWards([]);
        })
        .catch(console.error);
    } else {
      setDistricts([]);
      setWards([]);
      form.setFieldsValue({ district_id: undefined, ward_code: undefined });
    }
  }, [selectedProvince, form]);

  useEffect(() => {
    if (selectedDistrict) {
      getWards(selectedDistrict)
        .then(data => {
          setWards(data);
          form.setFieldsValue({ ward_code: undefined });
        })
        .catch(console.error);
    } else {
      setWards([]);
      form.setFieldsValue({ ward_code: undefined });
    }
  }, [selectedDistrict, form]);

  const handleFinish = (values) => {
    setLoading(true);

    // Tìm tên tỉnh, huyện, xã từ dữ liệu đã load
    const selectedProvince = provinces.find(p => p.ProvinceID === parseInt(values.province_id, 10));
    const selectedDistrict = districts.find(d => d.DistrictID === parseInt(values.district_id, 10));
    const selectedWard = wards.find(w => w.WardCode === values.ward_code);

    // Ghép địa chỉ đầy đủ: địa chỉ cụ thể + xã/phường + quận/huyện + tỉnh/thành phố
    const fullAddress = [
      values.address_detail.trim(),
      selectedWard?.WardName || '',
      selectedDistrict?.DistrictName || '',
      selectedProvince?.ProvinceName || ''
    ].filter(Boolean).join(', ');

    onSuccess({
      recipient_name: values.full_name.trim(),
      phone: values.phone.trim(),
      province_id: parseInt(values.province_id, 10),
      district_id: parseInt(values.district_id, 10),
      ward_code: values.ward_code,
      location: fullAddress,
      is_default: Boolean(values.is_default),
    });
  };

  return (
    <Form
        form={form}
        layout="vertical"
        
        onFinish={handleFinish}
        initialValues={{ is_default: false }}
      >
        <Form.Item
          label="Tên người nhận"
          name="full_name"
          rules={[{ required: true, message: "Tên là bắt buộc" }]}
        >
          <Input placeholder="Nhập tên người nhận" />
        </Form.Item>

        <Form.Item
          label="Số điện thoại"
          name="phone"
          rules={[
            { required: true, message: "Số điện thoại là bắt buộc" },
            { pattern: /^[0-9]{10,11}$/, message: "Số điện thoại không hợp lệ" },
          ]}
        >
          <Input placeholder="Nhập số điện thoại" />
        </Form.Item>

        <Form.Item
          label="Tỉnh/Thành phố"
          name="province_id"
          rules={[{ required: true, message: "Vui lòng chọn tỉnh/thành phố" }]}
        >
          <Select placeholder="-- Chọn tỉnh/thành phố --">
            {provinces.map(p => (
              <Option key={p.ProvinceID} value={p.ProvinceID}>{p.ProvinceName}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Quận/Huyện"
          name="district_id"
          rules={[{ required: true, message: "Vui lòng chọn quận/huyện" }]}
        >
          <Select placeholder="-- Chọn quận/huyện --" disabled={!selectedProvince}>
            {districts.map(d => (
              <Option key={d.DistrictID} value={d.DistrictID}>{d.DistrictName}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Phường/Xã"
          name="ward_code"
          rules={[{ required: true, message: "Vui lòng chọn phường/xã" }]}
        >
          <Select placeholder="-- Chọn phường/xã --" disabled={!selectedDistrict}>
            {wards.map(w => (
              <Option key={w.WardCode} value={w.WardCode}>{w.WardName}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Địa chỉ cụ thể"
          name="address_detail"
          rules={[{ required: true, message: "Vui lòng nhập địa chỉ cụ thể" }]}
        >
          <Input.TextArea placeholder="Số nhà, tên đường, thôn, xã..." rows={3} />
        </Form.Item>

        <Form.Item name="is_default" valuePropName="checked">
          <Checkbox>Đặt làm địa chỉ mặc định</Checkbox>
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              Lưu địa chỉ
            </Button>
            <Button onClick={onCancel}>Hủy</Button>
          </Space>
        </Form.Item>
      </Form>
  );
};

export default AddressAddForm;
