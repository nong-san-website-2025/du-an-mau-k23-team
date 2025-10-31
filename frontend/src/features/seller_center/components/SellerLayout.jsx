// src/layouts/SellerLayout.jsx
import React from "react";
import { Layout } from "antd";
import { Outlet } from "react-router-dom"; // ✅ thay vì children
import SellerSidebar from "./SellerSidebar";
import SellerTopbar from "./SellerTopbar";
import "../styles/SellerLayout.css"

const { Content } = Layout;

export default function SellerLayout() {
  return (
    <Layout style={{ minHeight: "100vh" }} className="seller-shell">
      <SellerSidebar />
      <Layout>
        <div >
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
        </div>
      </Layout>
    </Layout>
  );
}
