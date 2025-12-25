import React, { useEffect, useState } from "react";
import { Row, Col, Spin, Alert, Typography, Image, Card, Divider } from "antd";
import { CheckCircleOutlined, SafetyOutlined, RocketOutlined, HeartOutlined, ThunderboltOutlined, CrownOutlined } from "@ant-design/icons";
import axiosInstance from "../../features/admin/services/axiosInstance";

const { Title, Paragraph, Text } = Typography;

const LAYOUT_VARIANTS = [
  { type: 'standard', imageRatio: 1.5 },
  { type: 'wide', imageRatio: 2 },
  { type: 'square', imageRatio: 1 },
  { type: 'portrait', imageRatio: 0.75 },
];

const ACCENT_COLORS = [
  { bg: '#f6ffed', border: '#b7eb8f', text: '#52c41a', shadow: 'rgba(82, 196, 26, 0.1)' },
  { bg: '#e6f7ff', border: '#91d5ff', text: '#1890ff', shadow: 'rgba(24, 144, 255, 0.1)' },
  { bg: '#fff7e6', border: '#ffd591', text: '#fa8c16', shadow: 'rgba(250, 140, 22, 0.1)' },
  { bg: '#fff0f6', border: '#ffadd2', text: '#eb2f96', shadow: 'rgba(235, 47, 150, 0.1)' },
];

const DECORATIVE_ICONS = [
  CheckCircleOutlined,
  SafetyOutlined,
  RocketOutlined,
  HeartOutlined,
  ThunderboltOutlined,
  CrownOutlined,
];

export default function StaticPageView({ slug, defaultTitle }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [blocks, setBlocks] = useState([]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    axiosInstance
      .get(`/pages/${slug}/`)
      .then((res) => {
        if (isMounted) setData(res.data);
      })
      .catch((err) => {
        if (isMounted) setError(err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    axiosInstance.get(`/pages/${slug}/blocks/`).then((res) => {
      if (isMounted) setBlocks(res.data || []);
    }).catch(()=>{});
    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div style={{ padding: "24px 40px" }}>
        <Spin />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "24px 40px" }}>
        <Alert type="warning" message="Chưa có nội dung" description="Trang này chưa được tạo trong CMS. Vui lòng thêm nội dung ở Admin > GreenFarm & Chính Sách." />
      </div>
    );
  }

  const title = data?.title || defaultTitle || slug;
  const banner = data?.banner_image;
  const html = data?.content_html || "";

  return (
    <div style={{ padding: "0" }}>
      {/* Premium Hero Banner Section */}
      <div 
        style={{ 
          position: 'relative', 
          backgroundColor: '#f6ffed', 
          padding: '60px 20px', 
          textAlign: 'center',
          overflow: 'hidden',
          borderBottom: '1px solid #e6f4ff'
        }}
      >
        <div style={{ position: 'relative', zIndex: 2 }}>
          <Title level={1} style={{ color: '#135200', fontWeight: 800, fontSize: '2.5rem', marginBottom: 16 }}>
            {title}
          </Title>
          <div style={{ width: 80, height: 4, background: '#52c41a', margin: '0 auto 24px', borderRadius: 2 }}></div>
        </div>
        
        {banner && (
          <div style={{ marginTop: 32, position: 'relative', zIndex: 2 }}>
            <Image 
              src={banner?.startsWith('http') ? banner : `${process.env.REACT_APP_API_URL?.replace('/api', '')}${banner}`} 
              alt={title} 
              style={{ 
                maxHeight: 400, 
                borderRadius: 20, 
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                objectFit: 'cover'
              }} 
            />
          </div>
        )}
        
        {/* Abstract background shapes for "pro" look */}
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(82, 196, 26, 0.05)' }}></div>
        <div style={{ position: 'absolute', bottom: -30, left: '10%', width: 120, height: 120, borderRadius: '50%', background: 'rgba(82, 196, 26, 0.03)' }}></div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px' }}>
        {/* Primary HTML content (legacy) */}
        {html && (
          <div 
            style={{ 
              fontSize: 18, 
              lineHeight: 1.8, 
              color: '#434343', 
              marginBottom: 80,
              textAlign: 'center',
              maxWidth: 800,
              margin: '0 auto 80px'
            }} 
            dangerouslySetInnerHTML={{ __html: html }} 
          />
        )}

        {/* Structured Blocks with alternating professional layout */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 100 }}>
          {blocks.map((blk, idx) => {
            const isEven = idx % 2 === 0;
            return (
              <Row 
                key={blk.id} 
                gutter={[48, 48]} 
                align="middle" 
                style={{ flexDirection: isEven ? 'row' : 'row-reverse' }}
              >
                <Col xs={24} md={12}>
                  <div style={{ padding: '0 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <span style={{ 
                        background: '#f6ffed', 
                        color: '#52c41a', 
                        padding: '4px 12px', 
                        borderRadius: 6, 
                        fontWeight: 700,
                        fontSize: 14,
                        border: '1px solid #b7eb8f'
                      }}>
                        Mục {blk.order || idx + 1}
                      </span>
                    </div>
                    <Title level={2} style={{ color: '#135200', fontWeight: 700, marginBottom: 24, fontSize: '1.8rem' }}>
                      {blk.heading}
                    </Title>
                    <div 
                      style={{ 
                        fontSize: 16, 
                        lineHeight: 1.8, 
                        color: '#595959',
                        textAlign: 'justify'
                      }} 
                      dangerouslySetInnerHTML={{ __html: blk.body_html || '' }} 
                    />
                  </div>
                </Col>
                
                <Col xs={24} md={12}>
                  {blk.image ? (
                    <div style={{ position: 'relative' }}>
                      {/* Decorative background behind image */}
                      <div style={{ 
                        position: 'absolute', 
                        top: 20, 
                        left: isEven ? 20 : -20, 
                        right: isEven ? -20 : 20, 
                        bottom: -20, 
                        background: '#f6ffed', 
                        borderRadius: 24, 
                        zIndex: 0 
                      }}></div>
                      
                      <Image 
                        src={blk.image?.startsWith('http') ? blk.image : `${process.env.REACT_APP_API_URL?.replace('/api', '')}${blk.image}`} 
                        alt={blk.heading || ''} 
                        style={{ 
                          width: '100%',
                          height: 340,
                          borderRadius: 24, 
                          boxShadow: '0 12px 24px rgba(0,0,0,0.08)',
                          objectFit: 'cover',
                          position: 'relative',
                          zIndex: 1
                        }} 
                      />
                    </div>
                  ) : (
                    <div style={{ 
                      height: 300, 
                      background: '#fafafa', 
                      borderRadius: 24, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      border: '1px dashed #d9d9d9'
                    }}>
                      <span style={{ color: '#bfbfbf' }}>Nông Sản GreenFarm</span>
                    </div>
                  )}
                </Col>
              </Row>
            );
          })}
        </div>
      </div>
    </div>
  );
}
