// Tab 7: Hạng thành viên
import React from "react";
import { Card, Row, Col, Statistic, Tag, Progress, List, Avatar } from "antd";
import { Crown, TrendingUp } from "lucide-react";
import {
  getMembershipBadge,
  getNextMembershipLevel,
  getMembershipBenefits,
} from "../utils/membershipTier.js";

export default function MembershipTab({ user }) {
  if (!user) return <div>Không có dữ liệu</div>;

  const totalSpent = user.total_spent || 0;
  const membership = getMembershipBadge(totalSpent);
  const nextLevel = getNextMembershipLevel(totalSpent);
  const benefits = getMembershipBenefits(membership.level);

  const thresholds = {
    Member: 0,
    Bronze: 500000,
    Silver: 2000000,
    Gold: 5000000,
    Platinum: 10000000,
  };

  const currentThreshold = thresholds[membership.level];
  const nextThreshold = thresholds[nextLevel.level === "Platinum" ? "Platinum" : membership.level === "Member" ? "Bronze" : membership.level === "Bronze" ? "Silver" : membership.level === "Silver" ? "Gold" : "Platinum"];

  const progressPercent = Math.round(
    ((totalSpent - currentThreshold) / (nextThreshold - currentThreshold)) * 100
  );

  return (
    <div style={{ padding: "20px" }}>
      {/* Current Membership */}
      <Card
        style={{
          background: `linear-gradient(135deg, ${membership.color}20 0%, ${membership.color}40 100%)`,
          border: `2px solid ${membership.color}`,
          marginBottom: "20px",
        }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8} style={{ textAlign: "center" }}>
            <Avatar size={80} style={{ backgroundColor: membership.color, fontSize: "40px" }}>
              <Crown size={40} />
            </Avatar>
            <div style={{ marginTop: "12px", fontSize: "18px", fontWeight: "bold" }}>
              {membership.label}
            </div>
            <Tag color={membership.color} style={{ marginTop: "8px" }}>
              {membership.level}
            </Tag>
          </Col>
          <Col xs={24} sm={12} md={16}>
            <Statistic
              title="Tổng chi tiêu"
              value={totalSpent}
              suffix="₫"
              formatter={(value) => value.toLocaleString("vi-VN")}
              style={{ marginBottom: "16px" }}
            />
            <div style={{ marginBottom: "8px" }}>
              <span style={{ fontSize: "12px", color: "#999" }}>
                Còn {(nextThreshold - totalSpent).toLocaleString("vi-VN")} ₫ để lên hạng tiếp theo
              </span>
            </div>
            <Progress percent={Math.min(progressPercent, 100)} strokeColor={membership.color} />
          </Col>
        </Row>
      </Card>

      {/* Benefits */}
      <Card title={<><TrendingUp size={16} style={{ marginRight: "8px" }} /> Quyền lợi thành viên</>}>
        <List
          dataSource={benefits}
          renderItem={(benefit) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar style={{ backgroundColor: membership.color }}>✓</Avatar>}
                title={benefit}
              />
            </List.Item>
          )}
        />
      </Card>

      {/* Membership Tiers */}
      <Card title="Các hạng thành viên" style={{ marginTop: "16px" }}>
        <Row gutter={[12, 12]}>
          {[
            { level: "Member", threshold: 0, label: "Thành viên" },
            { level: "Bronze", threshold: 500000, label: "Hạng Đồng" },
            { level: "Silver", threshold: 2000000, label: "Hạng Bạc" },
            { level: "Gold", threshold: 5000000, label: "Hạng Vàng" },
            { level: "Platinum", threshold: 10000000, label: "Hạng Kim Cương" },
          ].map((tier, idx) => (
            <Col xs={24} sm={12} md={4.8} key={idx}>
              <Card
                hoverable
                style={{
                  background:
                    membership.level === tier.level
                      ? `${membership.color}30`
                      : "#f5f5f5",
                  border:
                    membership.level === tier.level
                      ? `2px solid ${membership.color}`
                      : "1px solid #ddd",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "12px", color: "#999" }}>{tier.label}</div>
                  <div style={{ fontSize: "12px", marginTop: "4px" }}>
                    {tier.threshold > 0
                      ? `${(tier.threshold / 1000000).toFixed(1)}M₫`
                      : "Bắt đầu"}
                  </div>
                  {membership.level === tier.level && (
                    <Tag color={membership.color} style={{ marginTop: "8px" }}>
                      Hiện tại
                    </Tag>
                  )}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
}
