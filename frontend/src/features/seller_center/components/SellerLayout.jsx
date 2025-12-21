import React, { useState } from "react";
import { Layout, Drawer, Grid, theme } from "antd";
import { Outlet } from "react-router-dom";
import SellerSidebar from "./SellerSidebar"; // Check path
import SellerTopbar from "./SellerTopbar";   // Check path
import "../styles/SellerLayout.css"; // Check path

const { Content } = Layout;
const { useBreakpoint } = Grid;

export default function SellerLayout() {
  const screens = useBreakpoint();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const { token } = theme.useToken();
  const isMobile = !screens.md;

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileDrawerOpen(!mobileDrawerOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <SellerSidebar collapsed={collapsed} isMobile={false} />
      )}

      {/* Mobile Drawer Sidebar */}
      {isMobile && (
        <Drawer
          placement="left"
          onClose={() => setMobileDrawerOpen(false)}
          open={mobileDrawerOpen}
          width={260}
          bodyStyle={{ padding: 0 }}
          closable={false}
        >
          <SellerSidebar
            collapsed={false}
            isMobile={true}
            onItemClick={() => setMobileDrawerOpen(false)}
          />
        </Drawer>
      )}

      {/* Main Layout Area */}
      <Layout
        style={{
          // Logic margin giống Admin
          marginLeft: isMobile ? 0 : (collapsed ? 80 : 260),
          transition: "all 0.2s ease",
          minHeight: "100vh",
          background: '#f5f5f5' // Nền xám nhạt đồng bộ
        }}
      >
        <SellerTopbar collapsed={collapsed} onToggleSidebar={toggleSidebar} />

        <Content style={{ margin: "24px 24px 0", overflow: "initial" }}>
          <Outlet />
          <div style={{ textAlign: "center", padding: "24px 0", color: "#9ca3af", fontSize: "13px" }}>
            GreenFarm Seller ©2025. Phát triển bởi <span style={{ color: '#52c41a', fontWeight: 'bold' }}>GreenFarm Dev Team</span>.
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}