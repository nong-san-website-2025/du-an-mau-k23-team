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
        // record là flash sale đầy đủ: { id, start_time, ..., flashsale_products: [...] }
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
            record.start_time ? moment(record.start_time).local() : null,
            record.end_time ? moment(record.end_time).local() : null,
          ],
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

      // ✅ Build flashsale_products
      const flashsale_products = values.products.map((productId) => {
        return {
          product: productId,
          flash_price: Number(
            values.flash_items?.[productId]?.flash_price || 0
          ),
          stock: Number(values.flash_items?.[productId]?.stock || 0),
        };
      });

      // Gửi payload đầy đủ cho backend
      const payload = {
        flashsale_products,
        start_time: start_time.toDate().toISOString(),
        end_time: end_time.toDate().toISOString(),
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
      width={1200}
      okText={record ? "Cập nhật" : "Tạo"}
      cancelText="Hủy"
      style={{ top: '60px' }}
      // 👇 Thêm bodyStyle để kiểm soát cuộn
      bodyStyle={{
        maxHeight: "70vh", // Giới hạn chiều cao body
        overflowY: "auto", // Cho phép cuộn dọc
        paddingRight: "12px", // Đảm bảo thanh cuộn không che nội dung
      }}
    >
      <FlashSaleForm form={form} isEdit={!!record} />
    </Modal>
  );
};

export default FlashSaleModal;
