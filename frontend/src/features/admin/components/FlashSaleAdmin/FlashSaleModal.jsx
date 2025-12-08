import React, { useEffect, useState } from "react";
import { Modal, Form, message } from "antd";
import FlashSaleForm from "./FlashSaleForm";
import { createFlashSale, updateFlashSale } from "../../services/flashsaleApi";
import moment from "moment";

const FlashSaleModal = ({ visible, onCancel, onSuccess, record, existingSales }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Reset form khi mở/đóng modal
  useEffect(() => {
    if (visible) {
      if (record) {
        // Prepare data for Edit
        const productIds = record.flashsale_products.map((p) => p.product);
        const flashItems = {};
        record.flashsale_products.forEach((p) => {
          flashItems[p.product] = {
            flash_price: p.flash_price,
            stock: p.stock,
          };
        });

        form.setFieldsValue({
          products: productIds,
          flash_items: flashItems,
          is_active: record.is_active,
          time_range: [
            record.start_time ? moment(record.start_time) : null,
            record.end_time ? moment(record.end_time) : null,
          ],
        });
      } else {
        // Reset for Create
        form.resetFields();
        form.setFieldsValue({ is_active: true });
      }
    }
  }, [visible, record, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const [start_time, end_time] = values.time_range;

      // Transform data for API
      const flashsale_products = values.products.map((productId) => {
        return {
          product: productId,
          flash_price: Number(values.flash_items?.[productId]?.flash_price || 0),
          stock: Number(values.flash_items?.[productId]?.stock || 0),
        };
      });

      const payload = {
        flashsale_products,
        start_time: start_time.toISOString(),
        end_time: end_time.toISOString(),
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
      console.error(err);
      if (err.errorFields) {
        // Lỗi validate form
        return;
      }
      const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : "Có lỗi xảy ra!";
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={record ? "CHỈNH SỬA FLASH SALE" : "TẠO FLASH SALE MỚI"}
      open={visible}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      width={1000} // Tăng chiều rộng để hiển thị bảng rõ hơn
      centered
      okText={record ? "Lưu thay đổi" : "Tạo chương trình"}
      cancelText="Đóng"
      destroyOnClose
      maskClosable={false}
      style={{ top: 20 }}
    >
      <FlashSaleForm form={form} isEdit={!!record} currentId={record?.id} // <--- Truyền ID để biết đường trừ nó ra khi check trùng
        existingSales={existingSales} />
    </Modal>
  );
};

export default FlashSaleModal;