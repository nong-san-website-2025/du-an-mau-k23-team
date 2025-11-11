// src/pages/Admin/Marketing/MarketingAdminPage.jsx
import { Tabs } from "antd";
import AdminPageLayout from "../../components/AdminPageLayout";
import AdSlotManager from "../../components/MarketingAdmin/AdSlotManager";
import BannerManager from "../../components/MarketingAdmin/BannerManager";

const { TabPane } = Tabs;

export default function MarketingAdminPage() {
  return (
    <AdminPageLayout title="🎯 Quản lý Quảng cáo & Banner">
      <Tabs
        defaultActiveKey="slots"
        size="large"
        tabBarGutter={40}
        style={{ marginTop: 16 }}
      >
        <TabPane tab="🧩 Khu vực hiển thị (Slot)" key="slots">
          <AdSlotManager />
        </TabPane>
        <TabPane tab="🖼️ Banner trong Slot" key="banners">
          <BannerManager />
        </TabPane>
      </Tabs>
    </AdminPageLayout>
  );
}
