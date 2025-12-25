// src/components/layout/Footer.jsx
import React, { useState } from "react";
import { Row, Col, Typography, Input, Button, Space, Divider, message } from "antd";
import {
  FacebookFilled,
  TikTokFilled,
  PhoneOutlined,
  MailOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  SendOutlined,
  CheckCircleOutlined
} from "@ant-design/icons";
import styles from "../styles/Footer.module.css";
import logo from "../assets/logo/defaultLogo.png"; // Đảm bảo đường dẫn đúng

const { Title, Text, Link } = Typography;

export default function Footer() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = () => {
    if (!email) return;
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      message.error("Vui lòng nhập đúng định dạng email!");
      return;
    }

    setLoading(true);
    // Giả lập API call
    setTimeout(() => {
      setLoading(false);
      message.success("Đăng ký nhận tin thành công!");
      setEmail("");
    }, 1500);
  };

  return (
    <footer className={styles.footerWrapper}>
      {/* --- PHẦN 1: NEWSLETTER & BRANDING --- */}
      <div className={styles.topSection}>
        <div className={styles.container}>
          <Row gutter={[32, 32]} align="middle" justify="space-between">
            <Col xs={24} md={12}>
              <div className={styles.brandBox}>
                <img src={logo} alt="GreenFarm Logo" className={styles.logo} />
                <div>
                  <Title level={4} className={styles.brandTitle}>GreenFarm Organic</Title>
                  <Text className={styles.brandDesc}>
                    Hành trình xanh – Vì sức khỏe cộng đồng. Cung cấp nông sản sạch,
                    an toàn từ nông trại chuẩn VietGAP đến bàn ăn của bạn. 🌿
                  </Text>
                </div>
              </div>
            </Col>
            <Col xs={24} md={10}>
              <div className={styles.newsletterBox}>
                <Text strong style={{ color: '#fff', display: 'block', marginBottom: 8 }}>
                  Đăng ký nhận khuyến mãi & mẹo vặt nông sản:
                </Text>
                <Space.Compact style={{ width: '100%' }}>
                  <Input
                    placeholder="Nhập email của bạn..."
                    size="large"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
                  />
                  <Button
                    type="primary"
                    size="large"
                    icon={loading ? <CheckCircleOutlined /> : <SendOutlined />}
                    onClick={handleSubscribe}
                    loading={loading}
                    style={{ backgroundColor: '#389e0d', borderColor: '#389e0d' }}
                  >
                    Đăng ký
                  </Button>
                </Space.Compact>
              </div>
            </Col>
          </Row>
        </div>
      </div>

      <Divider style={{ borderColor: 'rgba(255,255,255,0.1)', margin: 0 }} />

      {/* --- PHẦN 2: MAIN LINKS & INFO --- */}
      <div className={styles.mainSection}>
        <div className={styles.container}>
          <Row gutter={[24, 40]}>
            {/* Cột 1: Về chúng tôi */}
            <Col xs={24} sm={12} md={6}>
              <Title level={5} className={styles.colTitle}>VỀ GREENFARM</Title>
              <ul className={styles.linkList}>
                <li><Link href="/abouts" className={styles.link}>Câu chuyện thương hiệu</Link></li>
                <li><Link href="/portal?tab=recruitment" className={styles.link}>Tuyển dụng nhân tài</Link></li>
                <li><Link href="/blog" className={styles.link}>Góc chia sẻ & Blog</Link></li>
                <li><Link href="/store" className={styles.link}>Hệ thống cửa hàng</Link></li>
              </ul>

              <div className={styles.socialGroup}>
                <Text className={styles.socialLabel}>Kết nối:</Text>
                <Space size="middle">
                  <a href="https://www.facebook.com/profile.php?id=61579026964994" target="_blank" rel="noreferrer" className={`${styles.socialIcon} ${styles.fb}`}>
                    <FacebookFilled />
                  </a>
                  <a href="https://tiktok.com" target="_blank" rel="noreferrer" className={`${styles.socialIcon} ${styles.tt}`}>
                    <TikTokFilled />
                  </a>
                </Space>
              </div>
            </Col>

            {/* Cột 2: Hỗ trợ khách hàng */}
            <Col xs={24} sm={12} md={6}>
              <Title level={5} className={styles.colTitle}>HỖ TRỢ KHÁCH HÀNG</Title>
              <ul className={styles.linkList}>
                <li><Link href="/portal?tab=buying-guide" className={styles.link}>Hướng dẫn mua hàng</Link></li>
                <li><Link href="/portal?tab=return-policy" className={styles.link}>Chính sách đổi trả</Link></li>
                <li><Link href="/portal?tab=privacy" className={styles.link}>Chính sách bảo mật</Link></li>
                <li><Link href="/portal?tab=shipping" className={styles.link}>Chính sách vận chuyển</Link></li>
                <li><Link href="/portal?tab=faq" className={styles.link}>Câu hỏi thường gặp (FAQ)</Link></li>
              </ul>
            </Col>

            {/* Cột 3: Liên hệ */}
            <Col xs={24} sm={12} md={6}>
              <Title level={5} className={styles.colTitle}>LIÊN HỆ</Title>
              <ul className={styles.contactList}>
                <li>
                  <PhoneOutlined className={styles.icon} />
                  <span>
                    Hotline: <b style={{ color: '#52c41a' }}>0328.002.213</b>
                  </span>
                </li>
                <li>
                  <MailOutlined className={styles.icon} />
                  <span>greenfarm@gmail.com</span>
                </li>
                <li>
                  <ClockCircleOutlined className={styles.icon} />
                  <span>8:00 - 20:00 (Thứ 2 - CN)</span>
                </li>
                <li>
                  <EnvironmentOutlined className={styles.icon} />
                  <span>Khu vực Thạnh Thắng, P.Phú Thứ, Q.Cái Răng, TP.Cần Thơ</span>
                </li>
              </ul>
            </Col>

            {/* Cột 4: Map & Trust Badge */}
            <Col xs={24} sm={12} md={6}>
              <Title level={5} className={styles.colTitle}>ĐỊA CHỈ & THANH TOÁN</Title>

              {/* Map nhúng gọn gàng hơn */}
              <div className={styles.mapWrapper}>
                <iframe
                  title="GreenFarm Map"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3929.053308638189!2d105.7468536!3d10.0124519!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31a0895a51d60719%3A0x9d76b0035f6d53d0!2zVHLGsOG7nW5nIMSQ4bqhaSBo4buNYyBD4bqnbiBUaMah!5e0!3m2!1svi!2s!4v1696999999999!5m2!1svi!2s"
                  width="100%"
                  height="120"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                ></iframe>
              </div>

              <div className={styles.paymentMethods}>
                <Text style={{ color: '#888', fontSize: 12 }}>Đối tác vận chuyển & Thanh toán:</Text>
                <Space style={{ marginTop: 8 }}>
                  <div className={styles.badge}>VNPAY</div>
                  <div className={`${styles.badge} ${styles.ghn}`}>GHN</div>
                  <div className={`${styles.badge} ${styles.cod}`}>COD</div>
                </Space>
              </div>
            </Col>
          </Row>
        </div>
      </div>

      {/* --- PHẦN 3: COPYRIGHT --- */}
      <div className={styles.bottomBar}>
        <div className={styles.container}>
          <Row justify="space-between" align="middle">
            <Col>
              <Text className={styles.copyright}>
                © 2025 GreenFarm. Phát triển bởi <span style={{ color: '#52c41a', fontWeight: 'bold' }}>GreenFarm Dev Team</span>.                    </Text>
            </Col>
            <Col>
              <Space split={<Divider type="vertical" style={{ borderColor: '#444' }} />}>
                <Link href="#" className={styles.footerLinkSmall}>Điều khoản</Link>
                <Link href="#" className={styles.footerLinkSmall}>Bảo mật</Link>
                <Link href="#" className={styles.footerLinkSmall}>Sitemap</Link>
              </Space>
            </Col>
          </Row>
        </div>
      </div>
    </footer>
  );
}