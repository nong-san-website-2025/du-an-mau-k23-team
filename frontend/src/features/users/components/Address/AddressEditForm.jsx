// src/components/Address/AddressEditForm.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Form, Input, Select, Button, Row, Col, Spin, Alert } from "antd";
import { getProvinces, getDistricts, getWards } from "../../../../services/api/ghnApi";

const { Option } = Select;

const isValidProvinceName = (name) => {
  if (!name || typeof name !== 'string') return false;
  if (/[0-9!@#$%^&*()_+=\[\]{};:'"\\|,.<>?/`~]/.test(name)) return false;
  if (/test/i.test(name)) return false;
  return true;
};

const AddressEditForm = ({
  address,
  onSave,
  onCancel,
  provinces = [],
  fetchDistrictsByProvince,
  fetchWardsByDistrict,
}) => {
  const [form] = Form.useForm();
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [pendingFormValues, setPendingFormValues] = useState(null);

  const selectedProvince = Form.useWatch("province_id", form);
  const selectedDistrict = Form.useWatch("district_id", form);

  const filteredProvinces = useMemo(() => {
    return provinces.filter(p => isValidProvinceName(p.ProvinceName));
  }, [provinces]);

  // --- 1. LOGIC KHỞI TẠO DỮ LIỆU ---
  useEffect(() => {
    const initForm = async () => {
      if (!address) return;
      setIsReady(false);

      let pId = address.province_id || address.province_code;
      const dId = address.district_id || address.district_code;
      const wCode = address.ward_code || address.ward_id;

      // Fallback: Lấy province_id từ tên tỉnh trong location
      if (!pId && address.location) {
        try {
          const locationParts = (address.location || '').split(',').map(p => p.trim());
          if (locationParts && locationParts.length > 0) {
            const provinceName = locationParts[locationParts.length - 1];
            const matchingProvince = filteredProvinces.find(p => p.ProvinceName === provinceName);
            if (matchingProvince) {
              pId = matchingProvince.ProvinceID;
            }
          }
        } catch (e) {
          console.error("Error parsing location:", e);
        }
      }

      const provinceID = pId ? Number(pId) : null;
      const districtID = dId ? Number(dId) : null;
      const wardCode = wCode ? String(wCode) : null;

      try {
        // A. Tải danh sách Huyện
        let districtsList = [];
        if (provinceID) {
          const distData = await getDistricts(provinceID);
          districtsList = distData || [];
        }

        // B. Tải danh sách Xã
        let wardsList = [];
        if (districtID) {
          const wardData = await getWards(districtID);
          wardsList = wardData || [];
        }

        // C. Update state với dữ liệu lấy được
        setDistricts(districtsList);
        setWards(wardsList);

        // D. Store form values để set sau (đợi state update)
        setPendingFormValues({
          recipient_name: address.recipient_name,
          phone: address.phone,
          address_detail: address.location ? address.location.split(',')[0] : '', 
          province_id: provinceID, 
          district_id: districtID,
          ward_code: wardCode,
        });

      } catch (error) {
        console.error("Lỗi init form:", error);
        setDistricts([]);
        setWards([]);
      } finally {
        setIsReady(true);
      }
    };

    initForm();
  }, [address, form, filteredProvinces]);

  // --- 1B. SET FORM VALUES AFTER DISTRICTS/WARDS LOADED ---
  useEffect(() => {
    if (pendingFormValues && isReady) {
      form.setFieldsValue(pendingFormValues);
      setPendingFormValues(null);
    }
  }, [pendingFormValues, isReady, form]);

  // --- 2. LOGIC KHI NGƯỜI DÙNG CHỌN LẠI TỈNH ---
  useEffect(() => {
    if (!isReady || !selectedProvince) return;
    
    const oldProvId = address?.province_id || address?.province_code;
    const hasChanged = selectedProvince && Number(selectedProvince) !== Number(oldProvId);

    if (hasChanged) {
      getDistricts(selectedProvince)
        .then(data => {
          setDistricts(data || []);
          form.setFieldsValue({ district_id: null, ward_code: null });
          setWards([]);
        })
        .catch(err => {
          console.error("Lỗi load huyện:", err);
          setDistricts([]);
        });
    }
  }, [selectedProvince, isReady, address]);

  // --- 3. LOGIC KHI NGƯỜI DÙNG CHỌN LẠI HUYỆN ---
  useEffect(() => {
    if (!isReady || !selectedDistrict) return;
    
    const oldDistId = address?.district_id || address?.district_code;
    const hasChanged = selectedDistrict && Number(selectedDistrict) !== Number(oldDistId);

    if (hasChanged) {
      getWards(selectedDistrict)
        .then(data => {
          setWards(data || []);
          form.setFieldsValue({ ward_code: null });
        })
        .catch(err => {
          console.error("Lỗi load xã:", err);
          setWards([]);
        });
    }
  }, [selectedDistrict, isReady, address]);


  // --- 4. SUBMIT FORM ---
  const onFinish = (values) => {
    // Tìm tên để ghép chuỗi location hiển thị
    const p = filteredProvinces.find(x => x.ProvinceID === values.province_id);
    const d = districts.find(x => x.DistrictID === values.district_id);
    const w = wards.find(x => String(x.WardCode) === String(values.ward_code));

    // Ghép chuỗi địa chỉ
    const fullLocation = [
        values.address_detail.trim(),
        w?.WardName,
        d?.DistrictName,
        p?.ProvinceName
    ].filter(Boolean).join(", ");

    const payload = {
        ...values,
        location: fullLocation,
        // Đảm bảo gửi đủ 3 trường ID
        province_id: values.province_id,
        district_id: values.district_id, 
        ward_code: values.ward_code
    };

    onSave(payload);
  };

  return (
    <Spin spinning={!isReady} tip="Đang tải dữ liệu...">
        {/* Thông báo nhắc nhở nếu data cũ bị lỗi */}
        {isReady && !form.getFieldValue("province_id") && (
            <Alert 
                message="Dữ liệu Tỉnh/Thành cũ bị thiếu. Vui lòng chọn lại!" 
                type="warning" 
                showIcon 
                style={{marginBottom: 16}}
            />
        )}

        <Form form={form} layout="vertical" onFinish={onFinish}>
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item name="recipient_name" label="Họ tên" rules={[{ required: true }]}>
                        <Input placeholder="Tên người nhận" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true }]}>
                        <Input placeholder="Số điện thoại" />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={16}>
                <Col span={8}>
                    <Form.Item name="province_id" label="Tỉnh/Thành" rules={[{ required: true, message: "Vui lòng chọn Tỉnh" }]}>
                        <Select placeholder="Chọn Tỉnh" showSearch optionFilterProp="children">
                            {filteredProvinces.map(p => (
                                <Option key={p.ProvinceID} value={p.ProvinceID}>{p.ProvinceName}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item name="district_id" label="Quận/Huyện" rules={[{ required: true, message: "Vui lòng chọn Huyện" }]}>
                        <Select 
                            placeholder="Chọn Quận" 
                            disabled={!districts.length}
                            showSearch optionFilterProp="children"
                        >
                            {districts.map(d => (
                                <Option key={d.DistrictID} value={d.DistrictID}>{d.DistrictName}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item name="ward_code" label="Phường/Xã" rules={[{ required: true, message: "Vui lòng chọn Xã" }]}>
                        <Select 
                            placeholder="Chọn Xã" 
                            disabled={!wards.length}
                            showSearch optionFilterProp="children"
                        >
                            {wards.map(w => (
                                <Option key={w.WardCode} value={w.WardCode}>{w.WardName}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item name="address_detail" label="Địa chỉ chi tiết" rules={[{ required: true }]}>
                <Input.TextArea rows={2} placeholder="Số nhà, tên đường..." />
            </Form.Item>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <Button onClick={onCancel}>Hủy bỏ</Button>
                <Button type="primary" htmlType="submit">Lưu thay đổi</Button>
            </div>
        </Form>
    </Spin>
  );
};

export default AddressEditForm;