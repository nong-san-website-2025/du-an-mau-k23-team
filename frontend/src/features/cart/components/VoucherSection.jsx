// src/features/cart/components/VoucherSection.jsx
import React, { useState, useEffect } from "react";
import { Input, Button, Typography, Space, message, Modal, List, Radio } from "antd";
import { getMyVouchers } from "../../admin/services/promotionServices";


const { Text } = Typography;

// Hàm kiểm tra voucher có áp dụng được không
function isVoucherApplicable(v, total) {
  if (!v) return false;
  const now = new Date();
  if (v.min_order_value && total < Number(v.min_order_value)) return false;
  if (new Date(v.start_at) > now || new Date(v.end_at) < now) return false;
  return true;
}

const VoucherSection = ({ total, onApply }) => {
  const [userVouchers, setUserVouchers] = useState([]);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [customizing, setCustomizing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Lấy danh sách mã giảm giá của tôi
  useEffect(() => {
    const fetchVouchers = async () => {
      setLoading(true);
      try {
        const res = await getMyVouchers();
        setUserVouchers(res);
      } catch (err) {
        setUserVouchers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchVouchers();
  }, []);

  // Tự động chọn voucher tốt nhất khi tổng tiền hoặc danh sách voucher thay đổi
  useEffect(() => {
    if (!userVouchers.length) {
      setSelectedVoucher(null);
      onApply("");
      return;
    }
    // Lọc voucher chưa dùng, còn hạn, đủ điều kiện
    const valid = userVouchers.filter(
      (uv) =>
        !uv.is_used &&
        uv.voucher &&
        isVoucherApplicable(uv.voucher, total)
    );
    // Chọn voucher có giá trị giảm cao nhất (ưu tiên freeship > % > amount)
    let best = null;
    let bestValue = 0;
    valid.forEach((uv) => {
      const v = uv.voucher;
      let value = 0;
      if (v.discount_type === "freeship" && v.freeship_amount) value = Number(v.freeship_amount);
      else if (v.discount_type === "percent" && v.discount_percent) value = (total * Number(v.discount_percent)) / 100;
      else if (v.discount_type === "amount" && v.discount_amount) value = Number(v.discount_amount);
      if (value > bestValue) {
        best = uv;
        bestValue = value;
      }
    });
    setSelectedVoucher(best);
    onApply(best?.voucher?.code || "");
  }, [userVouchers, total, onApply]);

  // Khi chọn voucher tuỳ chỉnh
  const handleCustomApply = () => {
    setCustomizing(true);
  };

  const handleSelectVoucher = (uv) => {
    setSelectedVoucher(uv);
    onApply(uv?.voucher?.code || "");
    setCustomizing(false);
  };

  // Hiển thị tên voucher
  const renderVoucherName = (v) => {
    if (!v) return "";
    if (v.discount_type === "freeship" && v.freeship_amount) return `Freeship ${Number(v.freeship_amount).toLocaleString("vi-VN")}₫`;
    if (v.discount_type === "percent" && v.discount_percent) return `${v.discount_percent}%`;
    if (v.discount_type === "amount" && v.discount_amount) return `${Number(v.discount_amount).toLocaleString("vi-VN")}₫`;
    return v.code;
  };

  return (
    <div style={{ marginTop: 20 }}>
      <Space.Compact style={{ width: "100%" }}>
        <Input
          placeholder="Mã giảm giá tự động áp dụng"
          value={selectedVoucher?.voucher?.code || ""}
          disabled
        />
        <Button type="primary" onClick={handleCustomApply} disabled={loading || !userVouchers.length}>
          Tuỳ chỉnh giảm giá
        </Button>
      </Space.Compact>
      <Text type="secondary" style={{ display: "block", marginTop: 4 }}>
        {selectedVoucher?.voucher?.code
          ? `Đã áp dụng: ${selectedVoucher.voucher.code} (${renderVoucherName(selectedVoucher.voucher)})`
          : "Không có mã giảm giá phù hợp sẽ tự động áp dụng."}
      </Text>

      <Modal
        title="Chọn mã giảm giá của bạn"
        open={customizing}
        onCancel={() => setCustomizing(false)}
        footer={null}
      >
        <List
          loading={loading}
          dataSource={userVouchers.filter((uv) => !uv.is_used && uv.voucher)}
          renderItem={(uv) => {
            const v = uv.voucher;
            const applicable = isVoucherApplicable(v, total);
            return (
              <List.Item
                actions={[
                  <Button
                    type={selectedVoucher?.id === uv.id ? "primary" : "default"}
                    disabled={!applicable}
                    onClick={() => applicable && handleSelectVoucher(uv)}
                  >
                    {applicable ? "Chọn" : "Không đủ điều kiện"}
                  </Button>,
                ]}
              >
                <Radio checked={selectedVoucher?.id === uv.id} disabled={!applicable}>
                  <b>{v.code}</b> - {renderVoucherName(v)}
                  <span style={{ marginLeft: 8, color: "#888" }}>
                    (Tối thiểu: {v.min_order_value ? Number(v.min_order_value).toLocaleString("vi-VN") + "₫" : "0₫"})
                  </span>
                </Radio>
              </List.Item>
            );
          }}
        />
      </Modal>
    </div>
  );
};

export default VoucherSection;
