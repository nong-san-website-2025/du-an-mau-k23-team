import React from "react";
import { Card, Typography } from "antd";
import "../styles/AdminPageLayout.css";
const { Title } = Typography;

export default function AdminPageLayout({ title, children, extra, sidebar, topContent }) {
  
  if (sidebar === null) {
    return (
      <div className="admin-shell bg-light">
        <div className="admin-main" style={{ marginLeft: 0 }}>
          <main className="admin-content" style={{ marginLeft: 0, padding: "12px 16px" }}>
            {topContent && <div style={{ marginBottom: 20 }}>{topContent}</div>}
            {children}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "0px 12px", borderRadius: "0px" }}>
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
        
        {topContent && (
          <div style={{ marginBottom: 24 }}>
            {topContent}
          </div>
        )}
        
        {children}
      </Card>
    </div>
  );
}
