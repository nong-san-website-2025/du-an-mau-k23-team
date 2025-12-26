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
      // Safely read flash_items using both numeric and string keys (AntD Form may use string keys)
      const flashsale_products = (values.products || []).map((productId) => {
        const fb = values.flash_items || {};
        const item = fb[productId] ?? fb[String(productId)] ?? {};
        return {
          product: productId,
          flash_price: Number(item.flash_price || 0),
          stock: Number(item.stock || 0),
        };
      });

      console.debug('[FlashSaleModal] form values:', values);
      console.debug('[FlashSaleModal] built flashsale_products:', flashsale_products);

      const payload = {
        flashsale_products,
        start_time: start_time.toISOString(),
        end_time: end_time.toISOString(),
        is_active: values.is_active,
      };

      // Client-side basic validation to avoid obvious 400s
      if (!Array.isArray(flashsale_products) || flashsale_products.length === 0) {
        message.error("Vui lòng chọn ít nhất 1 sản phẩm cho Flash Sale.");
        return;
      }

      for (const item of flashsale_products) {
        if (!item.product) {
          message.error("Một sản phẩm không hợp lệ (thiếu product id).");
          return;
        }
        if (!item.flash_price || Number(item.flash_price) <= 0) {
          message.error("Giá Flash phải lớn hơn 0.");
          return;
        }
        if (!item.stock || Number(item.stock) < 1) {
          message.error("Số lượng Flash phải >= 1.");
          return;
        }
      }

      console.debug("[FlashSaleModal] payload:", payload);

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
      // Show server validation details if any
      const resp = err.response?.data;
      if (resp) {
        console.error('[FlashSaleModal] server response:', resp);
        // If it's an object with field errors, try to extract a helpful message
        if (typeof resp === 'object') {
          // DRF common shapes: {field: ['msg', ...]} or {'non_field_errors': ['msg']}
          // Map non_field_errors (overlap) to the time_range form field for better UX
          if (resp.non_field_errors && Array.isArray(resp.non_field_errors) && resp.non_field_errors.length > 0) {
            const msgText = resp.non_field_errors.join(', ');
            try {
              form.setFields([{ name: ['time_range'], errors: [msgText] }]);
            } catch (e) {
              // ignore if form not mounted
            }
            message.error(msgText);
            return;
          }

          // Otherwise, show first field error in a friendly way
          const firstKey = Object.keys(resp)[0];
          const firstVal = resp[firstKey];
          const pretty = Array.isArray(firstVal) ? firstVal.join(', ') : String(firstVal);
          // If server sent a generic overlap text (string), also try to attach to time_range
          if (typeof pretty === 'string' && pretty.includes('Trùng lịch')) {
            try { form.setFields([{ name: ['time_range'], errors: [pretty] }]); } catch (e) {}
          }
          message.error(`${pretty}`);
        } else {
          message.error(String(resp));
        }
      } else {
        const errorMsg = err.message || "Có lỗi xảy ra!";
        message.error(errorMsg);
      }
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