// src/layouts/AdminPageLayout.jsx
import React from "react";
import { Card, Typography } from "antd";
import AdminSidebar from "./AdminSidebar";
import "../styles/AdminPageLayout.css";
const { Title } = Typography;

export default function AdminPageLayout({ title, children, extra, sidebar }) {
  if (sidebar === null) {
    // No sidebar layout - used for pages like SellersPage
    return (
      <div className="admin-shell bg-light">
        <div className="admin-main" style={{ marginLeft: 0 }}>
          <main className="admin-content" style={{ marginLeft: 0 }}>
            {children}
          </main>
        </div>
      </div>
    );
  }

  // Default layout with sidebar
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
