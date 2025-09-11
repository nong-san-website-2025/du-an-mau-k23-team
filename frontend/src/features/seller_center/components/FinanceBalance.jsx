import React from "react";
import { Card, Statistic } from "antd";

export default function FinanceBalance({ balance }) {
  return (
    <Card bordered={false} style={{ marginBottom: 16 }}>
      <Statistic
        title="Số dư khả dụng"
        value={balance}
        precision={0}
        valueStyle={{ color: '#1890ff', fontWeight: 600 }}
        suffix="₫"
        formatter={val => Number(val).toLocaleString("vi-VN")}
      />
    </Card>
  );
}
