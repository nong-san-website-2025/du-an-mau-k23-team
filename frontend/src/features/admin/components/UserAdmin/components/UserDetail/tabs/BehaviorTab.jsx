// Tab 2: Thống kê hành vi + Trust Score
import React, { useEffect } from "react";
import { Card, Row, Col, Statistic, Progress, Tag, Skeleton, Empty } from "antd";
import {
  ShoppingCart,
  RotateCcw,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { getTrustScore, getTrustScoreColor, getTrustScoreLabel } from "../utils/trustScore.js";

export default function BehaviorTab({ userId, onLoad, loading, data }) {
  useEffect(() => {
    if (onLoad && userId) {
      onLoad();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (!data && loading) return <Skeleton active />;

  if (loading) return <Skeleton active />;
  if (!data) return <Empty description="Không có dữ liệu hành vi" image={Empty.PRESENTED_IMAGE_SIMPLE} />;

  const trustScore = getTrustScore(data);
  const trustColor = getTrustScoreColor(trustScore);
  const trustLabel = getTrustScoreLabel(trustScore);

  return (
    <div style={{ padding: "20px" }}>
      {/* Trust Score Card */}
      <Card
        style={{
          background: `linear-gradient(135deg, ${trustColor}20 0%, ${trustColor}40 100%)`,
          border: `2px solid ${trustColor}`,
          marginBottom: "20px",
        }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8} style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "48px",
                fontWeight: "bold",
                color: trustColor,
              }}
            >
              {trustScore}/100
            </div>
            <div style={{ fontSize: "14px", color: "#666" }}>Điểm Uy Tín</div>
          </Col>
          <Col xs={24} sm={12} md={16}>
            <div style={{ marginBottom: "8px" }}>
              <Tag color={trustColor}>
                {trustLabel}
              </Tag>
            </div>
            <Progress percent={trustScore} strokeColor={trustColor} />
            <div style={{ marginTop: "8px", fontSize: "12px", color: "#999" }}>
              Dựa trên: tỷ lệ hoàn, khiếu nại, huỷ đơn, tỷ lệ thanh toán
            </div>
          </Col>
        </Row>
      </Card>

      {/* Statistics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tổng đơn hàng"
              value={data.total_orders || 0}
              prefix={<ShoppingCart size={16} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Hoàn trả (%)"
              value={data.return_rate || 0}
              suffix="%"
              prefix={<RotateCcw size={16} />}
              valueStyle={{ color: data.return_rate > 10 ? "#ff4d4f" : "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Khiếu nại (%)"
              value={data.complaint_rate || 0}
              suffix="%"
              prefix={<AlertCircle size={16} />}
              valueStyle={{ color: data.complaint_rate > 5 ? "#ff4d4f" : "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Thanh toán (%)"
              value={data.payment_success_rate || 100}
              suffix="%"
              prefix={<TrendingUp size={16} />}
              valueStyle={{ color: data.payment_success_rate > 95 ? "#52c41a" : "#faad14" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Details */}
      <Card style={{ marginTop: "16px" }} title="Chi tiết">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <div style={{ padding: "12px" }}>
              <div style={{ color: "#999", fontSize: "12px" }}>Huỷ đơn (%)</div>
              <div style={{ fontSize: "20px", fontWeight: "bold", marginTop: "4px" }}>
                {data.cancel_rate || 0}%
              </div>
            </div>
          </Col>
          <Col xs={24} sm={12}>
            <div style={{ padding: "12px" }}>
              <div style={{ color: "#999", fontSize: "12px" }}>Khiếu nại chung</div>
              <div style={{ fontSize: "20px", fontWeight: "bold", marginTop: "4px" }}>
                {data.total_complaints || 0}
              </div>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
