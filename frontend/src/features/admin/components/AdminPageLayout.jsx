// src/layouts/AdminPageLayout.jsx
import React from "react";
import { Card, Typography } from "antd";
import "../styles/AdminPageLayout.css";
const { Title } = Typography;

export default function AdminPageLayout({ title, children, extra }) {
  return (
    <div style={{ paddingLeft: 10, borderRadius: "0px" }}>
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
            borderRadius: 0,
          }}
        >
          <Title level={2}>{title}</Title>
          {extra && <div>{extra}</div>}
        </div>
        {children}
      </Card>
    </div>
  );
}
