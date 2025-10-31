import React, { useState, useEffect } from "react";
import { Modal, message } from "antd";

const API_URL = "http://localhost:8000/api/complaints/";

const ComplaintResolveModal = ({
  visible,
  complaint,
  onClose,
  refreshReports,
}) => {
  const [resolutionType, setResolutionType] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [voucherCode, setVoucherCode] = useState("");

  useEffect(() => {
    if (complaint) {
      const unit = complaint.unit_price ?? complaint.product_price ?? "";
      const qty = complaint.quantity ?? 1;
      setRefundAmount(unit !== "" ? String(Number(unit) * Number(qty)) : "");
      setResolutionType("");
      setVoucherCode("");
    }
  }, [complaint]);

  const handleConfirmResolve = async () => {
    if (!resolutionType) {
      message.error("Chọn hình thức xử lý!");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}${complaint.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "resolved",
          resolution_type: resolutionType,
          refund_amount: refundAmount || null,
          voucher_code: voucherCode || null,
        }),
      });

      message.success("Đã xử lý khiếu nại!");
      onClose();
      refreshReports();
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi cập nhật!");
    }
  };

  return (
    <Modal
      open={visible}
      title="Xử lý khiếu nại"
      onCancel={onClose}
      onOk={handleConfirmResolve}
      okText="Duyệt"
      width={500}
    >
      <div>
        <div style={{ marginBottom: 12 }}>
          <b>Hình thức xử lý:</b>
          <select
            value={resolutionType}
            onChange={(e) => {
              const val = e.target.value;
              setResolutionType(val);
              if (val === "refund_full" && complaint) {
                const unit =
                  complaint.unit_price ?? complaint.product_price ?? "";
                const qty = complaint.quantity ?? 1;
                setRefundAmount(
                  unit !== "" ? String(Number(unit) * Number(qty)) : ""
                );
              } else if (val === "refund_partial") {
                setRefundAmount("");
              }
            }}
            style={{
              width: "100%",
              marginTop: 6,
              padding: 6,
              borderRadius: 4,
            }}
          >
            <option value="">-- Chọn --</option>
            <option value="refund_full">Hoàn tiền toàn bộ</option>
            <option value="refund_partial">Hoàn tiền một phần</option>
            <option value="replace">Đổi sản phẩm</option>
            <option value="voucher">Voucher/Điểm thưởng</option>
            <option value="reject">Từ chối khiếu nại</option>
          </select>
        </div>

        {(resolutionType === "refund_partial" ||
          resolutionType === "refund_full") && (
          <div style={{ marginBottom: 12 }}>
            <b>Số tiền hoàn:</b>
            <input
              type="number"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              disabled={resolutionType === "refund_full"}
              style={{
                width: "100%",
                marginTop: 6,
                padding: 6,
                borderRadius: 4,
                background:
                  resolutionType === "refund_full" ? "#f5f5f5" : "white",
              }}
            />
          </div>
        )}

        {resolutionType === "voucher" && (
          <div style={{ marginBottom: 12 }}>
            <b>Mã voucher/Điểm thưởng:</b>
            <input
              type="text"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value)}
              placeholder="Nhập mã voucher hoặc điểm thưởng"
              style={{
                width: "100%",
                marginTop: 6,
                padding: 6,
                borderRadius: 4,
              }}
            />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ComplaintResolveModal;
