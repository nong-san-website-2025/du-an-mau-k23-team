import React, { useState } from "react";
import { Layout, Drawer, Grid, theme } from "antd";
import { Outlet } from "react-router-dom";
import SellerSidebar from "./SellerSidebar";
import SellerTopbar from "./SellerTopbar";
import "../styles/SellerLayout.css";

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

  const marginLeft = isMobile ? 0 : collapsed ? 80 : 250;

  return (
    <Layout style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      {!isMobile && (
        <SellerSidebar collapsed={collapsed} isMobile={false} />
      )}

      {isMobile && (
        <Drawer
          placement="left"
          onClose={() => setMobileDrawerOpen(false)}
          open={mobileDrawerOpen}
          width={250}
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

      <Layout
        className="seller-main-layout transition-all duration-300 ease-in-out"
        style={{ marginLeft: marginLeft, backgroundColor: "#f8fafc" }}
      >
        <div className="sticky top-0 z-20 w-full">
          <SellerTopbar onToggleSidebar={toggleSidebar} />
        </div>

        <Content style={{ overflow: "visible", backgroundColor: "#f8fafc" }}>
          <div
            className="seller-content-wrapper"
            style={{
              padding: isMobile ? "16px" : "24px",
              minHeight: "calc(100vh - 64px)",
              background: token.colorBgContainer,
              borderRadius: isMobile ? "8px" : "12px",
              margin: isMobile ? "12px 0" : "24px",
              marginLeft: isMobile ? "12px" : "24px",
              marginRight: isMobile ? "12px" : "24px",
              boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}