import React, { useState, useEffect } from "react";
import { Steps, Row, Col, Spin, message } from "antd";
import { SolutionOutlined, ShopOutlined, CheckCircleOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { useAuth } from "../../login_register/services/AuthContext";

// Import các components con
import { IntroPanel } from "../components/IntroPanel"; // (Giả sử bạn để cùng thư mục)
import TypeSelection from "../components/TypeSelection";
import RegistrationForm from "../components/RegistrationForm";
import StatusResult from "../components/StatusResult";

const { Step } = Steps;

const styles = {
  container: { minHeight: "100vh", backgroundColor: "#f0f2f5", padding: "40px 20px" },
  rightPanel: { background: "#fff", padding: "40px", borderRadius: "0 16px 16px 0", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" },
};

export default function SellerRegisterPage() {
  const [loading, setLoading] = useState(true);
  const [sellerStatus, setSellerStatus] = useState(null);
  const [userType, setUserType] = useState(null);
  
  const token = localStorage.getItem("token");
  const headersAuth = token ? { Authorization: `Bearer ${token}` } : {};
  const { setRole } = useAuth();

  // --- Main Logic: Check Status ---
  const fetchSeller = async () => {
    if (!token) return setLoading(false);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/sellers/me/`, { headers: headersAuth });
      if (!res.ok) throw new Error("Seller not found");
      const data = await res.json();
      setSellerStatus(data.status?.toLowerCase() || null);
      if (data.business_type) setUserType(data.business_type);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeller();
    let intervalId;
    if (sellerStatus === "pending") {
      intervalId = setInterval(fetchSeller, 3000);
    }
    return () => clearInterval(intervalId);
  }, [sellerStatus]);

  const handleOpenShop = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/sellers/activate/`, {
        method: "POST", headers: headersAuth,
      });
      if (!res.ok) throw new Error("Lỗi kích hoạt");
      message.success("Cửa hàng đã mở!");
      setSellerStatus("active");
      setRole("seller");
    } catch (e) {
      message.error(e.message);
    }
  };

  if (loading) return <div style={{ display: "flex", justifyContent: "center", marginTop: 100 }}><Spin size="large" /></div>;

  // Tính toán step hiện tại
  const currentStep = sellerStatus === "pending" ? 1 : sellerStatus === "approved" ? 2 : sellerStatus === "active" ? 3 : 0;

  return (
    <div style={styles.container}>
      <Row justify="center">
        <Col xs={24} xl={20}>
          <Row style={{ boxShadow: "0 10px 40px rgba(0,0,0,0.1)", borderRadius: 16, overflow: "hidden" }}>
            
            {/* 1. Left Panel */}
            <Col xs={0} lg={8}>
              <IntroPanel />
            </Col>

            {/* 2. Right Panel */}
            <Col xs={24} lg={16} style={styles.rightPanel}>
              <Steps current={currentStep} size="small" style={{ marginBottom: 40 }}>
                <Step title="Thông tin" icon={<SolutionOutlined />} />
                <Step title="Xét duyệt" icon={<ClockCircleOutlined />} />
                <Step title="Kết quả" icon={<CheckCircleOutlined />} />
                <Step title="Hoạt động" icon={<ShopOutlined />} />
              </Steps>

              {/* Logic Render Nội Dung */}
              {!sellerStatus && !userType && (
                <TypeSelection setUserType={setUserType} />
              )}

              {!sellerStatus && userType && (
                <RegistrationForm 
                  userType={userType} 
                  setUserType={setUserType} 
                  setSellerStatus={setSellerStatus}
                  token={token}
                />
              )}

              {sellerStatus && (
                <StatusResult status={sellerStatus} onOpenShop={handleOpenShop} />
              )}
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
}