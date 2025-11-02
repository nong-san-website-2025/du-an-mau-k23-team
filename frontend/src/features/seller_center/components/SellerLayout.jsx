// src/layouts/SellerLayout.jsx
import React, { useState, useEffect } from "react";
import { Layout } from "antd";
import { Outlet } from "react-router-dom"; // ✅ thay vì children
import SellerSidebar from "./SellerSidebar";
import SellerTopbar from "./SellerTopbar";

const { Content } = Layout;

export default function SellerLayout() {
  const [collapsed, setCollapsed] = useState(false);

  // Auto collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <SellerSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <Layout>
        <SellerTopbar collapsed={collapsed} setCollapsed={setCollapsed} />
        <Content
          style={{
            margin: "0px",
            background: "#f5f5f5",
            padding: "0px",
            borderRadius: "8px",
          }}
        >
          <Outlet /> {/* ✅ router tự render trang con ở đây */}
        </Content>
      </Layout>
    </Layout>
  );
}
