import React from "react";
import { Card, Breadcrumb } from "antd";
import { HomeOutlined, FundOutlined } from "@ant-design/icons";
import AdminPageLayout from "../../components/AdminPageLayout";
import BannerManager from "../../components/MarketingAdmin/BannerManager";

export default function MarketingAdminPage() {
  return (
    <AdminPageLayout title="QUẢN LÝ BANNER">
      <Card bordered={false} className="shadow-sm" style={{ borderRadius: 8 }}>
        <BannerManager />
      </Card>
    </AdminPageLayout>
  );
}
