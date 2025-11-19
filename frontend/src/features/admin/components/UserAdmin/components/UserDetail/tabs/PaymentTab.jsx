// Tab 6: Thông tin thanh toán
import React, { useEffect } from "react";
import { Card, Row, Col, Statistic, Empty, Skeleton, Progress } from "antd";
import { CreditCard, TrendingUp } from "lucide-react";

export default function PaymentTab({ userId, onLoad, loading, data }) {
  useEffect(() => {
    if (onLoad && userId) {
      onLoad();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (!data && loading) return <Skeleton active />;

  if (loading) return <Skeleton active />;
  if (!data) return <div>Không có dữ liệu</div>;

  const successRate = data.successful_payments_count
    ? Math.round(
        (data.successful_payments_count / (data.successful_payments_count + data.failed_payments_count || 1)) * 100
      )
    : 100;

  return (
    <div style={{ padding: "20px" }}>
      {/* Success Rate */}
      <Card style={{ marginBottom: "20px" }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} style={{ textAlign: "center" }}>
            <div style={{ fontSize: "48px", fontWeight: "bold", color: "#52c41a" }}>
              {successRate}%
            </div>
            <div style={{ fontSize: "14px", color: "#666" }}>Tỷ lệ thành công</div>
          </Col>
          <Col xs={24} sm={12} md={16}>
            <Progress percent={successRate} strokeColor="#52c41a" />
          </Col>
        </Row>
      </Card>

      {/* Payment Statistics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Thanh toán thành công"
              value={data.successful_payments_count || 0}
              prefix={<CreditCard size={16} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Thanh toán thất bại"
              value={data.failed_payments_count || 0}
              prefix={<TrendingUp size={16} />}
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tổng thanh toán"
              value={data.total_payment_amount || 0}
              suffix="₫"
              formatter={(value) => value.toLocaleString("vi-VN")}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Còn nợ"
              value={data.outstanding_amount || 0}
              suffix="₫"
              formatter={(value) => value.toLocaleString("vi-VN")}
              valueStyle={{ color: data.outstanding_amount > 0 ? "#faad14" : "#52c41a" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Payment Methods */}
      <Card title="Phương thức thanh toán" style={{ marginTop: "16px" }}>
        <Row gutter={[16, 16]}>
          {data.payment_methods && data.payment_methods.length > 0 ? (
            data.payment_methods.map((method, idx) => (
              <Col xs={24} sm={12} md={8} key={idx}>
                <div style={{ padding: "12px", border: "1px solid #eee", borderRadius: "4px" }}>
                  <div style={{ color: "#999", fontSize: "12px" }}>{method.name}</div>
                  <div style={{ fontSize: "18px", fontWeight: "bold", marginTop: "4px" }}>
                    {method.count} lần
                  </div>
                </div>
              </Col>
            ))
          ) : (
            <Col xs={24}>
              <Empty description="Không có dữ liệu" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </Col>
          )}
        </Row>
      </Card>
    </div>
  );
}
