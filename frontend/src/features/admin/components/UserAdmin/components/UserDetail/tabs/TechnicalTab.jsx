// Tab 8: Thông tin kỹ thuật
import React, { useState, useEffect } from "react";
import { Card, Row, Col, Descriptions, Tag, Skeleton, Empty } from "antd";
import { Smartphone, Eye, Heart } from "lucide-react";
import { fetchUserTechnicalInfo } from "../../../api/userApi.js";

export default function TechnicalTab({ userId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    
    const fetchTechnicalInfo = async () => {
      try {
        setLoading(true);
        const technicalData = await fetchUserTechnicalInfo(userId);
        setData(technicalData);
      } catch (error) {
        console.error("Error fetching technical info:", error);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTechnicalInfo();
  }, [userId]);

  if (loading) return <Skeleton active />;
  if (!data) {
    return (
      <div style={{ padding: "20px" }}>
        <Card>
          <Empty description="Không có dữ liệu" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      {/* Device Info */}
      <Card
        title={<><Smartphone size={16} style={{ marginRight: "8px" }} /> Thông tin thiết bị</>}
        style={{ marginBottom: "20px" }}
      >
        <Descriptions column={1} size="small">
          <Descriptions.Item label="Trình duyệt">
            {data.browser || "Không xác định"}
          </Descriptions.Item>
          <Descriptions.Item label="Hệ điều hành">
            {data.os || "Không xác định"}
          </Descriptions.Item>
          <Descriptions.Item label="Thiết bị">
            {data.device_type || "Không xác định"}
          </Descriptions.Item>
          <Descriptions.Item label="IP Address">
            <code>{data.ip_address || "Không xác định"}</code>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Access Info */}
      <Card title="Thông tin truy cập">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <div style={{ padding: "12px", background: "#f5f5f5", borderRadius: "4px" }}>
              <div style={{ color: "#999", fontSize: "12px", marginBottom: "4px" }}>
                Lần truy cập cuối
              </div>
              <div style={{ fontSize: "14px", fontWeight: "bold" }}>
                {data.last_login
                  ? new Date(data.last_login).toLocaleString("vi-VN")
                  : "Chưa có"}
              </div>
            </div>
          </Col>
          <Col xs={24} sm={12}>
            <div style={{ padding: "12px", background: "#f5f5f5", borderRadius: "4px" }}>
              <div style={{ color: "#999", fontSize: "12px", marginBottom: "4px" }}>
                Tất cả lần truy cập
              </div>
              <div style={{ fontSize: "14px", fontWeight: "bold" }}>
                {data.total_logins || 0} lần
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Security */}
      <Card title="Bảo mật" style={{ marginTop: "16px" }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <div style={{ padding: "12px" }}>
              <div style={{ color: "#999", fontSize: "12px", marginBottom: "8px" }}>
                <Eye size={14} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                2FA Status
              </div>
              <Tag color={data.two_factor_enabled ? "green" : "red"}>
                {data.two_factor_enabled ? "Đã bật" : "Chưa bật"}
              </Tag>
            </div>
          </Col>
          <Col xs={24} sm={12}>
            <div style={{ padding: "12px" }}>
              <div style={{ color: "#999", fontSize: "12px", marginBottom: "8px" }}>
                <Heart size={14} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                Email xác minh
              </div>
              <Tag color={data.email_verified ? "green" : "red"}>
                {data.email_verified ? "Đã xác minh" : "Chưa xác minh"}
              </Tag>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
