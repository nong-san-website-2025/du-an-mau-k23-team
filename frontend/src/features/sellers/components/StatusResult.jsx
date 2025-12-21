// StatusResult.jsx
import React from "react";
import { Result, Button } from "antd";
import { useNavigate } from "react-router-dom";

export default function StatusResult({ status, onOpenShop }) {
  const navigate = useNavigate();

  if (status === "pending") {
    return (
      <Result
        status="info"
        title="Hồ sơ đang được xét duyệt"
        subTitle="Chúng tôi đã nhận được thông tin. Vui lòng quay lại sau 24-48h."
        extra={[<Button key="home" onClick={() => navigate("/")}>Về trang chủ</Button>]}
      />
    );
  }
  if (status === "approved") {
    return (
      <Result
        status="success"
        title="Hồ sơ đã được duyệt!"
        subTitle="Bạn đã sẵn sàng để bắt đầu bán hàng."
        extra={[
          <Button type="primary" size="large" onClick={onOpenShop} key="activate">
            Kích hoạt ngay
          </Button>,
        ]}
      />
    );
  }
  if (status === "active") {
    return (
      <Result
        status="success"
        title="Cửa hàng đang hoạt động"
        extra={[
          <Button type="primary" size="large" onClick={() => navigate("/seller-center/dashboard")} key="dash">
            Vào trang quản lý
          </Button>,
        ]}
      />
    );
  }
  return null;
}