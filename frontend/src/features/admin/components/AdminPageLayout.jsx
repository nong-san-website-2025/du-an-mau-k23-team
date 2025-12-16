import React from "react";
import { Card, Breadcrumb, Typography, Space } from "antd";
import { HomeOutlined } from "@ant-design/icons";

const { Title } = Typography;

export default function AdminPageLayout({ title, breadcrumbs, children, extra, topContent, icon }) {
  // Nếu title là một object/component (không phải chuỗi), ta cố gắng lấy text hoặc hiển thị mặc định
  const breadcrumbTitle = typeof title === 'string' ? title : 'Chi tiết';

  return (
    <div className="admin-page-wrapper">
      {/* 1. Breadcrumb Navigation - Chỉ hiển thị Text đơn giản */}
      <div className="mb-3">
        <Breadcrumb
            items={[
                { href: '/admin', title: <HomeOutlined /> },
                ...(breadcrumbs || []).map(b => ({ title: b })),
                { title: breadcrumbTitle } 
            ]}
        />
      </div>

      {/* 2. Page Header Area - Hiển thị Icon + Title đẹp */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
            {/* Hiển thị Icon nếu có */}
            {icon && <div style={{ fontSize: '24px', color: '#2563eb' }}>{icon}</div>}
            
            {/* Nếu title là string thì bọc trong Title, nếu là Node thì render trực tiếp */}
            {typeof title === 'string' ? (
                <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#1f2937' }}>{title}</Title>
            ) : (
                title
            )}
        </div>
        {extra && <div>{extra}</div>}
      </div>

      {/* 3. Top Content (Stats, Filter...) */}
      {topContent && <div className="mb-4">{topContent}</div>}

      {/* 4. Main Content wrapped in Card */}
      {/* Nếu children tự có Card rồi (như trang ReportRevenue) thì render trực tiếp */}
      {/* Còn nếu trang thường thì bọc Card. Ở đây mình render trực tiếp để linh hoạt */}
      <div>
        {children}
      </div>
    </div>
  );
}