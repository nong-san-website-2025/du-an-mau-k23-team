import React, { useState, useEffect } from "react";
import { Button, Typography, message, Modal, Radio, Tag, Empty } from "antd";
import { RightOutlined, TagOutlined, CheckCircleFilled } from "@ant-design/icons";
import { getMyVouchers } from "../../admin/services/promotionServices";
import "../styles/VoucherSection.css"; // Nhớ import CSS

const { Text } = Typography;

// Hàm kiểm tra voucher (giữ nguyên logic của bạn)
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

  // 1. Fetch dữ liệu
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

  // 2. Tự động chọn voucher tốt nhất (Giữ nguyên logic cực tốt này của bạn)
  useEffect(() => {
    if (!userVouchers.length) {
      setSelectedVoucher(null);
      onApply("");
      return;
    }
    
    // Nếu người dùng ĐANG mở modal tự chọn thì KHÔNG tự động đè lại, 
    // trừ khi chưa có gì được chọn.
    if (customizing && selectedVoucher) return; 

    const valid = userVouchers.filter(
      (uv) => !uv.is_used && uv.voucher && isVoucherApplicable(uv.voucher, total)
    );

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

    // Chỉ update nếu tìm thấy cái tốt hơn hoặc chưa chọn gì
    if(best && (!selectedVoucher || best.id !== selectedVoucher.id)){
        setSelectedVoucher(best);
        onApply(best?.voucher?.code || "");
    }
  }, [userVouchers, total, onApply]); // Bỏ customizing ra khỏi đây để tránh loop

  const handleSelectVoucher = (uv) => {
    setSelectedVoucher(uv);
    onApply(uv?.voucher?.code || "");
    setCustomizing(false);
    message.success("Đã áp dụng mã giảm giá");
  };

  // Helper: Hiển thị tên đẹp
  const getVoucherLabel = (v) => {
    if (v.discount_type === "freeship") return "Miễn phí vận chuyển";
    if (v.discount_type === "percent") return `Giảm ${v.discount_percent}%`;
    return `Giảm ${Number(v.discount_amount).toLocaleString("vi-VN")}₫`;
  }

  return (
    <div style={{ marginTop: 20 }}>
      {/* --- PHẦN THANH CHỌN (TRIGGER) --- */}
      <div style={{display: 'flex', alignItems: 'center', marginBottom: 8}}>
         <TagOutlined style={{color: '#ff5722', marginRight: 8}} /> 
         <Text strong>GreenFarm Voucher</Text>
      </div>

      <div className="voucher-bar-trigger" onClick={() => setCustomizing(true)}>
        <div className="voucher-icon-wrapper">
            {selectedVoucher ? (
                // Đã chọn
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
                    <Text strong style={{color: '#2E7D32'}}>{getVoucherLabel(selectedVoucher.voucher)}</Text>
                    <Text type="secondary" style={{fontSize: 12}}>Đã áp dụng: {selectedVoucher.voucher.code}</Text>
                </div>
            ) : (
                // Chưa chọn
                <Text style={{color: '#888'}}>Chọn hoặc nhập mã giảm giá</Text>
            )}
        </div>
        <RightOutlined style={{ color: "#999", fontSize: 12 }} />
      </div>

      {selectedVoucher && (
         <Text type="success" style={{fontSize: 12, marginTop: 4, display: 'block'}}>
             <CheckCircleFilled /> Bạn đã chọn được mã ưu đãi tốt nhất
         </Text>
      )}

      {/* --- MODAL CHỌN VOUCHER --- */}
      <Modal
        title="Chọn GreenFarm Voucher"
        open={customizing}
        onCancel={() => setCustomizing(false)}
        footer={null}
        width={500}
        style={{top: 20}}
      >
        <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '4px' }}>
            {userVouchers.length === 0 && <Empty description="Bạn chưa có voucher nào" />}
            
            {userVouchers
                .filter(uv => !uv.is_used && uv.voucher)
                .map((uv) => {
                const v = uv.voucher;
                const applicable = isVoucherApplicable(v, total);
                const isSelected = selectedVoucher?.id === uv.id;

                return (
                    <div 
                        key={uv.id} 
                        className={`voucher-ticket ${!applicable ? 'disabled' : ''}`}
                        onClick={() => applicable && handleSelectVoucher(uv)}
                    >
                        {/* Cột trái */}
                        <div className="ticket-left">
                            <div className="voucher-tag">{v.discount_type === 'freeship' ? 'FREESHIP' : 'DISCOUNT'}</div>
                            <b style={{fontSize: 16}}>
                                {v.discount_type === 'percent' ? `${v.discount_percent}%` : 'GIẢM'}
                            </b>
                        </div>

                        {/* Cột phải */}
                        <div className="ticket-right">
                            <Text strong style={{fontSize: 15}}>{v.code}</Text>
                            <Text type="secondary" style={{fontSize: 13}}>{getVoucherLabel(v)}</Text>
                            
                            <Text type="secondary" style={{fontSize: 12, marginTop: 4}}>
                                Đơn tối thiểu: {Number(v.min_order_value).toLocaleString("vi-VN")}₫
                            </Text>
                            
                            {!applicable && (
                                <Text type="danger" style={{fontSize: 11, marginTop: 4}}>
                                    Chưa đủ điều kiện đơn hàng
                                </Text>
                            )}
                        </div>

                        {/* Nút radio */}
                        <div className="ticket-radio">
                             <Radio checked={isSelected} disabled={!applicable} />
                        </div>
                    </div>
                );
            })}
        </div>
      </Modal>
    </div>
  );
};

export default VoucherSection;