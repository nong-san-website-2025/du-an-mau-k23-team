// src/layouts/SellerLayout.jsx
import React from "react";
import { Layout } from "antd";
import { Outlet } from "react-router-dom"; // ✅ thay vì children
import SellerSidebar from "./SellerSidebar";
import SellerTopbar from "./SellerTopbar";

const { Content } = Layout;

export default function SellerLayout() {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <SellerSidebar />
      <Layout>
        <SellerTopbar />
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
