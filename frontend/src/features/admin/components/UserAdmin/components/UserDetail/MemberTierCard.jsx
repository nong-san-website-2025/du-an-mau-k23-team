// components/UserAdmin/UserDetailRow/MemberTierCard.jsx
import React, { useMemo } from "react";
import { Card, Typography, Progress } from "antd";
import { Crown, Star, TrendingUp } from "lucide-react";
import { intcomma } from "../../../../../../utils/format";

const { Text, Title } = Typography;

// --- CẤU HÌNH MỐC CHI TIÊU (ĐÚNG YÊU CẦU CỦA BẠN) ---
export const TIER_CONFIG = [
  {
    key: "member",
    name: "Thành viên",
    min: 0,
    color: "#595959",
    bg: "linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)",
    textColor: "#333",
  },
  {
    key: "silver",
    name: "Bạc",
    min: 2000000, // 2 Triệu
    color: "#78909c",
    bg: "linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)",
    textColor: "#2c3e50",
  },
  {
    key: "gold",
    name: "Vàng",
    min: 5000000, // 5 Triệu
    color: "#faad14",
    bg: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
    textColor: "#d35400",
  },
  {
    key: "diamond",
    name: "Kim Cương",
    min: 10000000, // 10 Triệu
    color: "#1890ff",
    bg: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
    textColor: "#fff",
  },
];

const MemberTierCard = ({ totalSpent = 0 }) => {
  const { displayTier, nextTier, percent, moneyNeeded, isMaxLevel } =
    useMemo(() => {
      // Logic tìm hạng dựa trên tổng tiền
      const calculatedTier =
        [...TIER_CONFIG].reverse().find((t) => totalSpent >= t.min) ||
        TIER_CONFIG[0];

      const currentIndex = TIER_CONFIG.findIndex(
        (t) => t.key === calculatedTier.key
      );
      const next = TIER_CONFIG[currentIndex + 1];
      const maxLevel = !next;

      let calculatedPercent = 100;
      let needed = 0;

      if (!maxLevel) {
        const range = next.min - calculatedTier.min;
        const currentProgress = totalSpent - calculatedTier.min;

        if (range > 0) calculatedPercent = (currentProgress / range) * 100;
        else calculatedPercent = 0;

        calculatedPercent = Math.max(0, Math.min(100, calculatedPercent));
        needed = next.min - totalSpent;
      }

      return {
        displayTier: calculatedTier,
        nextTier: next,
        percent: calculatedPercent,
        moneyNeeded: needed,
        isMaxLevel: maxLevel,
      };
    }, [totalSpent]);

  return (
    <Card
      bordered={false}
      style={{
        background: displayTier.bg,
        borderRadius: 12,
        height: "100%",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        border: "1px solid rgba(255,255,255,0.3)",
      }}
      bodyStyle={{ padding: "16px" }}
    >
      <Crown
        size={140}
        style={{
          position: "absolute",
          right: -30,
          top: -30,
          opacity: 0.15,
          color: displayTier.textColor,
          transform: "rotate(15deg)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 12,
          }}
        >
          <div>
            <Text
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                fontWeight: 700,
                letterSpacing: 0.5,
                color: displayTier.textColor,
                opacity: 0.7,
              }}
            >
              Hạng thành viên
            </Text>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 4,
              }}
            >
              <Title
                level={4}
                style={{
                  margin: 0,
                  color: displayTier.textColor,
                  fontWeight: 800,
                }}
              >
                {displayTier.name.toUpperCase()}
              </Title>
              {displayTier.key === "diamond" && (
                <Star size={18} fill="#fff" stroke="none" />
              )}
              {displayTier.key === "gold" && (
                <Crown size={18} fill="#d35400" stroke="none" />
              )}
            </div>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.6)",
              padding: "4px 12px",
              borderRadius: 20,
              backdropFilter: "blur(4px)",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 700, color: "#333" }}>
              {intcomma(totalSpent)}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "#666",
                marginLeft: 2,
              }}
            >
              đ
            </span>
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <Progress
            percent={percent}
            showInfo={false}
            strokeColor={{
              "0%": displayTier.textColor,
              "100%": displayTier.textColor,
            }}
            trailColor="rgba(255,255,255,0.5)"
            strokeWidth={8}
            style={{ marginBottom: 4 }}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 12,
            color: displayTier.textColor,
          }}
        >
          {!isMaxLevel ? (
            <>
              <TrendingUp size={14} style={{ marginRight: 6 }} />
              <span style={{ fontWeight: 500 }}>
                Mua thêm <b>{intcomma(moneyNeeded)}đ</b> để lên{" "}
                <b>{nextTier.name}</b>
              </span>
            </>
          ) : (
            <>
              <Star size={14} style={{ marginRight: 6 }} />
              <span style={{ fontWeight: 600 }}>Khách hàng VIP nhất!</span>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

export default MemberTierCard;
