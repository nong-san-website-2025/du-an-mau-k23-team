import React, { useEffect } from "react";
import { Modal, Form, Select, InputNumber, Input, message } from "antd";

const API_URL = process.env.REACT_APP_API_URL;

const ComplaintResolveModal = ({ visible, complaint, onClose, refreshReports }) => {
  const [form] = Form.useForm();
  
  // Watch giá trị resolution_type để ẩn/hiện field nhập tiền
  const resolutionType = Form.useWatch('resolution_type', form);

  useEffect(() => {
    if (visible && complaint) {
      // Tính toán giá trị mặc định
      const unit = Number(complaint.unit_price ?? complaint.product_price ?? 0);
      const qty = Number(complaint.quantity ?? 1);
      const totalAmount = unit * qty;

      form.setFieldsValue({
        resolution_type: null,
        refund_amount: totalAmount, // Mặc định fill full tiền
        voucher_code: null
      });
    }
  }, [visible, complaint, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const token = localStorage.getItem("token");
      
      await fetch(`${API_URL}${complaint.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "resolved",
          resolution_type: values.resolution_type,
          refund_amount: values.resolution_type.includes('refund') ? values.refund_amount : null,
          voucher_code: values.resolution_type === 'voucher' ? values.voucher_code : null,
        }),
      });

      message.success("Đã giải quyết khiếu nại thành công!");
      onClose();
      refreshReports();
    } catch (error) {
      console.error(error);
      // Nếu là lỗi validate form thì không hiện message lỗi server
      if (!error.errorFields) {
        message.error("Lỗi khi cập nhật dữ liệu!");
      }
    }
  };

  return (
    <Modal
      open={visible}
      title="Xử lý khiếu nại"
      onCancel={onClose}
      onOk={handleOk}
      okText="Xác nhận xử lý"
      cancelText="Hủy"
      width={500}
      forceRender
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="resolution_type"
          label="Hình thức xử lý"
          rules={[{ required: true, message: "Vui lòng chọn hình thức xử lý!" }]}
        >
          <Select placeholder="Chọn hướng giải quyết">
            <Select.Option value="refund_full">Hoàn tiền toàn bộ</Select.Option>
            <Select.Option value="refund_partial">Hoàn tiền một phần</Select.Option>
            <Select.Option value="replace">Đổi sản phẩm mới</Select.Option>
            <Select.Option value="voucher">Tặng Voucher/Điểm thưởng</Select.Option>
            <Select.Option value="reject">Từ chối khiếu nại (Giải quyết xong)</Select.Option>
          </Select>
        </Form.Item>

        {/* Logic hiển thị field nhập tiền */}
        {(resolutionType === "refund_partial" || resolutionType === "refund_full") && (
          <Form.Item
            name="refund_amount"
            label="Số tiền hoàn (VNĐ)"
            rules={[{ required: true, message: "Vui lòng nhập số tiền!" }]}
            help={resolutionType === "refund_full" ? "Mặc định là tổng giá trị đơn hàng" : ""}
          >
            <InputNumber
              style={{ width: "100%" }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(value) => value?.replace(/\$\s?|(,*)/g, "")}
              disabled={resolutionType === "refund_full"} // Full thì không cho sửa
              min={0}
            />
          </Form.Item>
        )}

        {/* Logic hiển thị field nhập voucher */}
        {resolutionType === "voucher" && (
          <Form.Item
            name="voucher_code"
            label="Mã Voucher / Ghi chú điểm thưởng"
            rules={[{ required: true, message: "Vui lòng nhập thông tin voucher!" }]}
          >
            <Input placeholder="VD: VOUCHER50K hoặc +500 điểm" />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default ComplaintResolveModal;