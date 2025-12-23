// src/pages/Orders/components/DisputeActionZone.jsx
import React, { useState } from "react";
import { Steps, Button, Input, Card, Tag, Alert, message, Modal } from "antd";
import { CarOutlined, SolutionOutlined, CheckCircleOutlined, InfoCircleOutlined } from "@ant-design/icons";
import API from "../../login_register/services/api";

const { Step } = Steps;

// Map trạng thái backend sang UI frontend
const STATUS_CONFIG = {
  pending: { step: 0, status: 'process', label: 'Chờ Shop duyệt', color: 'orange' },
  negotiating: { step: 0, status: 'error', label: 'Đang thương lượng', color: 'red' },
  waiting_return: { step: 1, status: 'process', label: 'Chờ gửi hàng', color: 'blue' }, // Shop đồng ý, chờ khách gửi
  returning: { step: 2, status: 'process', label: 'Đang trả hàng', color: 'purple' },   // Khách đã gửi
  resolved_refund: { step: 3, status: 'finish', label: 'Hoàn tiền thành công', color: 'green' },
  resolved_reject: { step: 3, status: 'error', label: 'Từ chối hoàn tiền', color: 'default' },
  cancelled: { step: 3, status: 'wait', label: 'Đã hủy yêu cầu', color: 'default' },
};

const DisputeActionZone = ({ complaint, isMobile }) => {
  const config = STATUS_CONFIG[complaint.status] || STATUS_CONFIG.pending;
  
  // State nhập mã vận đơn
  const [shippingCode, setShippingCode] = useState("");
  const [carrier, setCarrier] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Hàm Buyer xác nhận đã gửi hàng
  const handleBuyerShip = async () => {
    if (!shippingCode.trim() || !carrier.trim()) {
        return message.error("Vui lòng nhập tên nhà vận chuyển và mã vận đơn");
    }
    
    setSubmitting(true);
    try {
        await API.post(`complaints/${complaint.id}/buyer-ship/`, {
            carrier: carrier,
            tracking_code: shippingCode
        });
        message.success("Đã cập nhật thông tin vận chuyển!");
        // Refresh page hoặc trigger callback để reload data
        window.location.reload(); 
    } catch (error) {
        message.error("Lỗi cập nhật: " + (error.response?.data?.error || "Không xác định"));
    } finally {
        setSubmitting(false);
    }
  };

  return (
    <Card 
        size="small" 
        style={{ background: "#f9f0ff", borderColor: "#d3adf7" }} 
        title={<span style={{ color: "#531dab" }}><InfoCircleOutlined /> Tiến trình Hoàn tiền</span>}
    >
      {/* 1. Timeline */}
      <Steps 
        current={config.step} 
        status={config.status} 
        size="small" 
        direction={isMobile ? "vertical" : "horizontal"}
        style={{ marginBottom: 16 }}
      >
        <Step title="Yêu cầu" description="Chờ duyệt" />
        <Step title="Gửi hàng" description="Đóng gói" />
        <Step title="Shop nhận" description="Shop kiểm tra" />
        <Step title="Hoàn tiền" description="Kết thúc" />
      </Steps>

      {/* 2. Thông báo trạng thái hiện tại */}
      <div style={{ marginBottom: 12 }}>
          <Tag color={config.color} style={{ fontSize: 14, padding: "4px 10px" }}>
             TRẠNG THÁI: {config.label.toUpperCase()}
          </Tag>
          {complaint.seller_response && (
              <Alert 
                message="Phản hồi của Shop:" 
                description={complaint.seller_response} 
                type="info" 
                showIcon 
                style={{ marginTop: 8 }} 
              />
          )}
      </div>

      {/* 3. Action Zone: Chỉ hiện khi trạng thái là 'waiting_return' (Shop đã OK, chờ khách nhập mã) */}
      {complaint.status === 'waiting_return' && (
          <div style={{ background: '#fff', padding: 12, borderRadius: 4, border: '1px solid #d9d9d9' }}>
              <p style={{ fontWeight: 600, color: '#1890ff' }}>
                  <CarOutlined /> Shop đã đồng ý trả hàng. Vui lòng gửi hàng và nhập mã vận đơn:
              </p>
              <Input 
                placeholder="Đơn vị vận chuyển (VD: GHN, Viettel Post...)" 
                style={{ marginBottom: 8 }}
                value={carrier}
                onChange={e => setCarrier(e.target.value)}
              />
              <Input 
                placeholder="Mã vận đơn (Tracking Code)" 
                style={{ marginBottom: 8 }}
                value={shippingCode}
                onChange={e => setShippingCode(e.target.value)}
              />
              <Button type="primary" onClick={handleBuyerShip} loading={submitting} block>
                  Xác nhận đã gửi hàng
              </Button>
          </div>
      )}

      {/* 4. Hiển thị thông tin vận chuyển khi đã gửi */}
      {complaint.status === 'returning' && (
          <Alert
            message="Thông tin trả hàng"
            description={`ĐVVC: ${complaint.return_shipping_carrier || 'N/A'} - Mã: ${complaint.return_tracking_code || 'N/A'}`}
            type="warning"
            showIcon
          />
      )}
    </Card>
  );
};

export default DisputeActionZone;