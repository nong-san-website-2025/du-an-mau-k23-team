// src/layouts/SellerLayout.jsx
import React, { useState, useEffect } from "react";
import { Layout, Drawer } from "antd";
import { Outlet } from "react-router-dom"; // ✅ thay vì children
import SellerSidebar from "./SellerSidebar";
import SellerTopbar from "./SellerTopbar";
import "../styles/SellerLayout.css"

const { Content } = Layout;

export default function SellerLayout() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 576;

  const toggleSidebar = () => setSidebarVisible(!sidebarVisible);

  return (
    <Layout style={{ minHeight: "100vh" }} className="seller-shell">
      {!isMobile && <SellerSidebar />}
      {isMobile && (
        <Drawer
          title="Menu"
          placement="left"
          onClose={toggleSidebar}
          open={sidebarVisible}
          width={250}
          bodyStyle={{ padding: 0 }}
        >
          <SellerSidebar onItemClick={toggleSidebar} />
        </Drawer>
      )}
      <Layout>
        <div >
          <SellerTopbar onToggleSidebar={isMobile ? toggleSidebar : undefined} />
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
