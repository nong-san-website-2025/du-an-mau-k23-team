import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Row, Col, Spin, Alert, Typography, Image, Card, Divider, Menu } from "antd";
import { 
  CheckCircleOutlined, 
  SafetyOutlined, 
  RocketOutlined, 
  HeartOutlined, 
  ThunderboltOutlined, 
  CrownOutlined,
  ShoppingOutlined,
  SwapOutlined,
  LockOutlined,
  CarOutlined,
  QuestionCircleOutlined,
  TeamOutlined
} from "@ant-design/icons";
import axiosInstance from "../features/admin/services/axiosInstance";

const { Title, Text } = Typography;

const ACCENT_COLORS = [
  { bg: '#f6ffed', border: '#b7eb8f', text: '#52c41a', shadow: 'rgba(82, 196, 26, 0.1)' },
  { bg: '#e6f7ff', border: '#91d5ff', text: '#1890ff', shadow: 'rgba(24, 144, 255, 0.1)' },
  { bg: '#fff7e6', border: '#ffd591', text: '#fa8c16', shadow: 'rgba(250, 140, 22, 0.1)' },
  { bg: '#fff0f6', border: '#ffadd2', text: '#eb2f96', shadow: 'rgba(235, 47, 150, 0.1)' }
];

const DECORATIVE_ICONS = [
  CheckCircleOutlined,
  SafetyOutlined,
  RocketOutlined,
  HeartOutlined,
  ThunderboltOutlined,
  CrownOutlined,
];

const getMenuItems = () => [
  {
    type: 'group',
    label: 'VỀ GREENFARM',
    children: [
      { key: 'recruitment', label: 'Tuyển dụng nhân tài', icon: <TeamOutlined /> },
      { key: 'store', label: 'Hệ thống cửa hàng', icon: <ShoppingOutlined /> },
    ]
  },
  {
    type: 'group',
    label: 'HƯỚNG DẪN & HỖ TRỢ',
    children: [
      { key: 'buying-guide', label: 'Hướng dẫn mua hàng', icon: <ShoppingOutlined /> },
      { key: 'selling-guide', label: 'Hướng dẫn bán hàng', icon: <RocketOutlined /> },
      { key: 'contact-support', label: 'Liên hệ & Hỗ trợ', icon: <HeartOutlined /> },
      { key: 'faq', label: 'Câu hỏi thường gặp', icon: <QuestionCircleOutlined /> },
    ]
  },
  {
    type: 'group',
    label: 'CHÍNH SÁCH',
    children: [
      { key: 'return-policy', label: 'Chính sách đổi trả', icon: <SwapOutlined /> },
      { key: 'privacy', label: 'Chính sách bảo mật', icon: <LockOutlined /> },
      { key: 'shipping', label: 'Vận chuyển & Giao nhận', icon: <CarOutlined /> },
    ]
  }
];

export default function StaticPageView({ slug, defaultTitle }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tabParam = searchParams.get('tab');
  const activeSlug = tabParam || slug;
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [blocks, setBlocks] = useState([]);

  useEffect(() => {
    if (!activeSlug) {
      setLoading(false);
      setError(new Error("No slug provided"));
      return;
    }
    
    let isMounted = true;
    setLoading(true);
    setError(null);
    axiosInstance
      .get(`/pages/${activeSlug}/`)
      .then((res) => {
        if (isMounted) setData(res.data);
      })
      .catch((err) => {
        if (isMounted) setError(err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    axiosInstance.get(`/pages/${activeSlug}/blocks/`).then((res) => {
      if (isMounted) setBlocks(res.data || []);
    }).catch(()=>{});
    return () => {
      isMounted = false;
    };
  }, [activeSlug]);

  const title = data?.title || defaultTitle || activeSlug;
  const banner = data?.banner_image;
  const html = data?.content_html || "";

  const getLayoutStyle = (idx) => {
    const layouts = ['standard', 'card-elevated', 'minimal', 'bordered'];
    return layouts[idx % layouts.length];
  };

  const getAccentColor = (idx) => {
    return ACCENT_COLORS[idx % ACCENT_COLORS.length];
  };

  const getDecorativeIcon = (idx) => {
    const IconComponent = DECORATIVE_ICONS[idx % DECORATIVE_ICONS.length];
    return IconComponent;
  };

  const handleMenuClick = ({ key }) => {
    navigate(`/portal?tab=${key}`);
  };

  const getDefaultTitle = (slug) => {
    const items = getMenuItems();
    for (const group of items) {
      const found = group.children?.find(item => item.key === slug);
      if (found) return found.label;
    }
    return slug;
  };

  const displayTitle = data?.title || getDefaultTitle(activeSlug);

  return (
    <div style={{ padding: "0", background: 'linear-gradient(180deg, #ffffff 0%, #fafafa 100%)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '24px 16px' }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={6}>
            <Card 
              style={{ 
                position: 'sticky',
                top: 80,
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                padding: 0
              }}
              styles={{ body: { padding: 0 } }}
            >
              <div style={{ 
                padding: '16px 24px', 
                borderBottom: '1px solid #f0f0f0',
                background: 'linear-gradient(135deg, #f6ffed 0%, #e6f7ff 100%)'
              }}>
                <Title level={5} style={{ margin: 0, color: '#135200' }}>
                  Chính Sách & GreenFarm
                </Title>
              </div>
              <Menu
                mode="inline"
                selectedKeys={[activeSlug]}
                items={getMenuItems()}
                onClick={handleMenuClick}
                style={{ 
                  border: 'none',
                  background: 'transparent'
                }}
                className="portal-sidebar-menu"
              />
            </Card>
          </Col>

          <Col xs={24} lg={18}>
            <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              {loading ? (
                <div style={{ padding: "80px 40px", textAlign: 'center' }}>
                  <Spin size="large" />
                </div>
              ) : (
                <>
                  <div 
                    style={{ 
                      position: 'relative', 
                      background: 'linear-gradient(135deg, #f6ffed 0%, #e6f7ff 100%)', 
                      padding: '40px 20px', 
                      textAlign: 'center',
                      overflow: 'hidden',
                      borderBottom: '3px solid transparent',
                      borderImage: 'linear-gradient(90deg, #52c41a, #1890ff) 1',
                    }}
                  >
                    <div style={{ position: 'relative', zIndex: 2, maxWidth: 900, margin: '0 auto' }}>
                      <div style={{ 
                        display: 'inline-block', 
                        background: 'rgba(82, 196, 26, 0.08)', 
                        padding: '4px 14px', 
                        borderRadius: 20, 
                        marginBottom: 12,
                        border: '1px solid rgba(82, 196, 26, 0.2)'
                      }}>
                        <Text style={{ color: '#52c41a', fontWeight: 600, fontSize: 12, letterSpacing: 0.8 }}>
                          GREENFARM ORGANIC
                        </Text>
                      </div>
                      
                      <Title level={1} style={{ 
                        color: '#135200', 
                        fontWeight: 800, 
                        fontSize: 'clamp(1.6rem, 3.4vw, 2.2rem)', 
                        marginBottom: 12,
                        textShadow: '2px 2px 4px rgba(0,0,0,0.05)',
                        letterSpacing: '-0.02em'
                      }}>
                        {displayTitle}
                      </Title>
                      
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: 6, 
                        marginBottom: 20 
                      }}>
                        <div style={{ width: 60, height: 3, background: 'linear-gradient(90deg, transparent, #52c41a)', borderRadius: 2 }}></div>
                        <div style={{ width: 10, height: 10, background: '#52c41a', borderRadius: '50%', transform: 'rotate(45deg)' }}></div>
                        <div style={{ width: 60, height: 3, background: 'linear-gradient(90deg, #52c41a, transparent)', borderRadius: 2 }}></div>
                      </div>
                    </div>
                    
                    {banner && (
                      <div style={{ marginTop: 40, position: 'relative', zIndex: 2, maxWidth: 1000, margin: '40px auto 0' }}>
                        <div style={{ 
                          position: 'relative',
                          padding: 8,
                          background: 'linear-gradient(135deg, rgba(82, 196, 26, 0.1), rgba(24, 144, 255, 0.1))',
                          borderRadius: 24,
                        }}>
                          <Image 
                            src={banner?.startsWith('http') ? banner : `${process.env.REACT_APP_API_URL?.replace('/api', '')}${banner}`} 
                            alt={title} 
                            style={{ 
                              maxHeight: 450, 
                              width: '100%',
                              borderRadius: 20, 
                              boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
                              objectFit: 'cover'
                            }} 
                          />
                        </div>
                      </div>
                    )}
                    
                    <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(82, 196, 26, 0.08) 0%, transparent 70%)' }}></div>
                    <div style={{ position: 'absolute', bottom: -60, left: '5%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(24, 144, 255, 0.06) 0%, transparent 70%)' }}></div>
                    <div style={{ position: 'absolute', top: '50%', right: '15%', width: 100, height: 100, background: 'rgba(250, 140, 22, 0.03)', borderRadius: '20px', transform: 'rotate(45deg)' }}></div>
                  </div>

                  <div style={{ padding: '40px 24px' }}>
                {/* Error Alert */}
                {error && (
                  <Alert 
                    type="warning" 
                    message="Chưa có nội dung" 
                    description="Trang này chưa được tạo trong CMS. Vui lòng thêm nội dung ở Admin > GreenFarm & Chính Sách." 
                    style={{ marginBottom: 20 }}
                  />
                )}
                
                {/* Primary HTML content with enhanced styling */}
                {!error && html && (
                  <Card 
                    style={{ 
                      marginBottom: 100,
                      borderRadius: 20,
                      border: 'none',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
                      background: 'white'
                    }}
                  >
                    <div 
                      style={{ 
                        fontSize: 17, 
                        lineHeight: 2, 
                        color: '#262626', 
                        padding: '40px 28px',
                        textAlign: 'center',
                        maxWidth: 1040,
                        margin: '0 auto'
                      }} 
                      dangerouslySetInnerHTML={{ __html: html }} 
                    />
                  </Card>
                )}

                {/* Structured Blocks with Professional Multi-Layout System */}
                {!error && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 120 }}>
                  {blocks.map((blk, idx) => {
                    const isEven = idx % 2 === 0;
                    const layoutStyle = getLayoutStyle(idx);
                    const accentColor = getAccentColor(idx);
                    const IconComponent = getDecorativeIcon(idx);
                    const hasImage = !!blk.image;
                    
                    const renderContent = () => (
                      <div style={{ padding: '0 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                          <div style={{ 
                            width: 48, 
                            height: 48, 
                            borderRadius: 12,
                            background: `linear-gradient(135deg, ${accentColor.bg}, white)`,
                            border: `2px solid ${accentColor.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 4px 12px ${accentColor.shadow}`
                          }}>
                            <IconComponent style={{ fontSize: 24, color: accentColor.text }} />
                          </div>
                          <span style={{ 
                            background: accentColor.bg,
                            color: accentColor.text, 
                            padding: '6px 16px', 
                            borderRadius: 20, 
                            fontWeight: 700,
                            fontSize: 13,
                            border: `1px solid ${accentColor.border}`,
                            letterSpacing: 0.5,
                            textTransform: 'uppercase'
                          }}>
                            Phần {blk.order || idx + 1}
                          </span>
                        </div>
                        
                        <Title level={2} style={{ 
                          color: '#262626', 
                          fontWeight: 800, 
                          marginBottom: 20, 
                          fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
                          lineHeight: 1.3,
                          background: `linear-gradient(135deg, ${accentColor.text}, #262626)`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}>
                          {blk.heading}
                        </Title>
                        
                        <Divider style={{ 
                          margin: '20px 0', 
                          borderColor: accentColor.border,
                          borderWidth: 2
                        }} />
                        
                        <div 
                          style={{ 
                            fontSize: 16, 
                            lineHeight: 1.9, 
                            color: '#595959',
                            textAlign: 'justify',
                            letterSpacing: 0.2
                          }} 
                          dangerouslySetInnerHTML={{ __html: blk.body_html || '' }} 
                        />
                      </div>
                    );

                    const renderImage = () => {
                      if (!blk.image) {
                        return null;
                      }

                      const imageUrl = blk.image?.startsWith('http') ? blk.image : `${process.env.REACT_APP_API_URL?.replace('/api', '')}${blk.image}`;

                      if (layoutStyle === 'card-elevated') {
                        return (
                          <Card 
                            hoverable
                            style={{ 
                              borderRadius: 24,
                              overflow: 'hidden',
                              border: 'none',
                              boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
                            }}
                            styles={{ body: { padding: 0 } }}
                          >
                            <Image 
                              src={imageUrl}
                              alt={blk.heading || ''} 
                              preview={{
                                mask: (
                                  <div style={{ 
                                    background: 'rgba(0,0,0,0.45)', 
                                    color: 'white', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    fontSize: 14,
                                    letterSpacing: 0.5
                                  }}>
                                    Xem ảnh lớn
                                  </div>
                                )
                              }}
                              style={{ 
                                width: '100%',
                                height: 380,
                                objectFit: 'cover',
                                display: 'block'
                              }} 
                            />
                          </Card>
                        );
                      } else if (layoutStyle === 'minimal') {
                        return (
                          <div style={{ position: 'relative' }}>
                            <Image 
                              src={imageUrl}
                              alt={blk.heading || ''} 
                              style={{ 
                                width: '100%',
                                height: 360,
                                borderRadius: 16, 
                                boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
                                objectFit: 'cover',
                                border: `4px solid ${accentColor.bg}`,
                                display: 'block'
                              }} 
                            />
                          </div>
                        );
                      } else {
                        return (
                          <div style={{ padding: '0 20px' }}>
                            <Image 
                              src={imageUrl}
                              alt={blk.heading || ''} 
                              style={{ 
                                width: '100%',
                                height: 360,
                                borderRadius: 24, 
                                boxShadow: `0 16px 32px ${accentColor.shadow}`,
                                objectFit: 'cover',
                                display: 'block'
                              }} 
                            />
                          </div>
                        );
                      }
                    };

                    return (
                      <div 
                        key={blk.id}
                        style={{
                          animation: 'fadeInUp 0.6s ease-out',
                          animationFillMode: 'both',
                          animationDelay: `${idx * 0.1}s`,
                          overflow: 'hidden'
                        }}
                      >
                        <Row 
                          gutter={[48, 48]} 
                          align="middle" 
                          style={{ 
                            flexDirection: isEven ? 'row' : 'row-reverse',
                            margin: 0
                          }}
                        >
                          <Col xs={24} lg={hasImage ? 12 : 24} style={{ paddingLeft: 0, paddingRight: 0 }}>
                            {renderContent()}
                          </Col>
                          {hasImage && (
                            <Col xs={24} lg={12} style={{ paddingLeft: 0, paddingRight: 0 }}>
                              {renderImage()}
                            </Col>
                          )}
                        </Row>
                      </div>
                    );
                  })}
                </div>
                )}

                    {/* Bottom CTA Section */}
                    {!error && blocks.length > 0 && (
                      <Card 
                        style={{ 
                          marginTop: 120,
                          borderRadius: 24,
                          border: 'none',
                          background: 'linear-gradient(135deg, #f6ffed 0%, #e6f7ff 100%)',
                          boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
                          textAlign: 'center',
                          padding: '40px 20px'
                        }}
                      >
                      </Card>
                    )}
                  </div>
                </>
              )}
            </div>
          </Col>
        </Row>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .portal-sidebar-menu .ant-menu-item-group-title {
          padding: 12px 16px;
          font-weight: 700;
          font-size: 12px;
          color: #595959;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          background: #fafafa;
          margin-top: 8px;
        }

        .portal-sidebar-menu .ant-menu-item-group-title:first-child {
          margin-top: 0;
        }

        .portal-sidebar-menu .ant-menu-item {
          margin: 4px 8px;
          border-radius: 8px;
          padding-left: 16px !important;
        }

        .portal-sidebar-menu .ant-menu-item-selected {
          background-color: #95de64 !important;
          color: #135200 !important;
        }

        .portal-sidebar-menu .ant-menu-item-selected .anticon {
          color: #135200 !important;
        }

        .portal-sidebar-menu .ant-menu-item:hover {
          background-color: #f6ffed;
          color: #389E0D;
        }

        .portal-sidebar-menu .ant-menu-item .anticon {
          color: #52c41a;
        }

        .portal-sidebar-menu .ant-menu-item-selected:hover {
          background-color: #95de64 !important;
        }
      `}</style>
    </div>
  );
}
