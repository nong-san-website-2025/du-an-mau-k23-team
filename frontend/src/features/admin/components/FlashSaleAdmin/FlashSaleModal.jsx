// components/flashsale/FlashSaleModal.jsx
import React from "react";
import { Modal, Form, Button, message } from "antd";
import FlashSaleForm from "./FlashSaleForm";
import { createFlashSale, updateFlashSale } from "../../services/flashsaleApi";
import moment from "moment";

const FlashSaleModal = ({ visible, onCancel, onSuccess, record }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (visible) {
      if (record) {
        // Edit mode
        form.setFieldsValue({
          product: record.product.id,
          flash_price: record.flash_price,
          stock: record.stock,
          is_active: record.is_active,
          time_range: [moment(record.start_time), moment(record.end_time)],
        });
      } else {
        form.resetFields();
      }
    }
  }, [visible, record, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const [start_time, end_time] = values.time_range;

      const payload = {
        product: values.product,
        flash_price: Number(values.flash_price), // ← chuyển sang số
        stock: Number(values.stock),
        start_time: start_time.format("YYYY-MM-DDTHH:mm"),
        end_time: end_time.format("YYYY-MM-DDTHH:mm"),
        is_active: values.is_active,
      };

      setLoading(true);

      if (record) {
        await updateFlashSale(record.id, payload);
        message.success("Cập nhật Flash Sale thành công!");
      } else {
        await createFlashSale(payload);
        message.success("Tạo Flash Sale thành công!");
      }

      onSuccess();
    } catch (err) {
      if (err.response?.data) {
        message.error(JSON.stringify(err.response.data));
      } else {
        message.error("Có lỗi xảy ra, vui lòng thử lại!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={record ? "Chỉnh sửa Flash Sale" : "Tạo Flash Sale Mới"}
      open={visible}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      width={800}
      okText={record ? "Cập nhật" : "Tạo"}
      cancelText="Hủy"
    >
      <FlashSaleForm form={form} isEdit={!!record} />
    </Modal>
  );
};

export default FlashSaleModal;
