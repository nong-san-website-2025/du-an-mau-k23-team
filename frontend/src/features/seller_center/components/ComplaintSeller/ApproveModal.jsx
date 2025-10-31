import React from "react";
import { Modal, Radio, Space, InputNumber, Input, Typography } from "antd";
import { formatVND, computeFullRefundAmount } from "../../../../utils/complaintHelpers";

const { Text } = Typography;

const ApproveModal = ({ open, onCancel, onOk, approveModal, setApproveModal }) => {
  const { method, amount, record, note } = approveModal;

  return (
    <Modal
      title={`Duyệt khiếu nại #${record?.id || ""}`}
      open={open}
      onCancel={onCancel}
      onOk={onOk}
      okText="Xác nhận"
      cancelText="Hủy"
    >
      <div style={{ display: "grid", gap: 12 }}>
        <div>
          <div className="mb-2">Hình thức xử lý</div>
          <Radio.Group
            value={method}
            onChange={(e) =>
              setApproveModal((s) => ({ ...s, method: e.target.value }))
            }
          >
            <Space direction="vertical">
              <Radio value="refund_full">Hoàn tiền đầy đủ</Radio>
              <Radio value="refund_partial">Hoàn tiền một phần</Radio>
              <Radio value="replace">Đổi sản phẩm</Radio>
              <Radio value="reject">Từ chối khiếu nại</Radio>
            </Space>
          </Radio.Group>
        </div>

        {method === "refund_partial" && (
          <div>
            <div className="mb-2">Số tiền hoàn (VNĐ)</div>
            <InputNumber
              min={1000}
              step={1000}
              style={{ width: "100%" }}
              value={amount}
              onChange={(v) => setApproveModal((s) => ({ ...s, amount: v || 0 }))}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(value) => String(value ?? "").replace(/\s|,/g, "")}
            />
          </div>
        )}

        {method === "refund_full" && (
          <div>
            <div className="mb-2">Số tiền hoàn (đầy đủ)</div>
            <div>
              <Text strong>
                {formatVND(computeFullRefundAmount(record))}
              </Text>
            </div>
          </div>
        )}

        <div className="mt-3">Ghi chú</div>
        <Input.TextArea
          rows={3}
          placeholder="Nhập ghi chú cho quyết định xử lý"
          value={note}
          onChange={(e) => setApproveModal((s) => ({ ...s, note: e.target.value }))}
        />
      </div>
    </Modal>
  );
};

export default ApproveModal;