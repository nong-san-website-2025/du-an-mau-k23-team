import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout, Menu, Typography, theme } from 'antd';
import {
    ShoppingCartOutlined,
    ShopOutlined,
    SafetyOutlined,
    QuestionCircleOutlined,
    WalletOutlined,
    ReloadOutlined,
    TeamOutlined,
    PhoneOutlined,
    BookOutlined
} from '@ant-design/icons';

// --- IMPORT CÁC COMPONENT CON ---
// ⚠️ Lưu ý: Hãy đảm bảo đường dẫn import chính xác tới nơi bạn lưu file
import BuyingGuideAntd from '../pages/CustomerService/BuyingGuide'; 
import SellingGuide from '../pages/CustomerService/SellingGuide'; 

// Import các file bạn vừa tạo (Giả sử bạn lưu cùng thư mục hoặc chỉnh lại đường dẫn)
import ContactSupport from '../pages/CustomerService/ContactSupport';
import FAQPage from '../pages/CustomerService/FAQ';
import GreenFarmwallet from '../pages/CustomerService/GreenFarmwallet'; // Đổi tên file nếu cần
import PrivacyPolicyCompact from '../pages/CustomerService/PrimarySecurity';
import RecruitmentMinimal from '../pages/CustomerService/Recruitment';
import ReturnPolicy from '../pages/CustomerService/ReturnPolicy';

const { Content, Sider } = Layout;
const { Title } = Typography;

// --- CẤU HÌNH MENU ---
const MENU_ITEMS = [
    {
        key: 'guide',
        label: 'Hướng dẫn',
        type: 'group', // Nhóm menu
        children: [
            {
                key: 'buying-guide',
                icon: <ShoppingCartOutlined />,
                label: 'Hướng dẫn mua hàng',
                isFullPage: true,
                content: <BuyingGuideAntd />,
            },
            {
                key: 'selling-guide',
                icon: <ShopOutlined />,
                label: 'Hướng dẫn bán hàng',
                isFullPage: true,
                content: <SellingGuide />,
            },
            {
                key: 'wallet',
                icon: <WalletOutlined />,
                label: 'Ví GreenFarm',
                isFullPage: true,
                content: <GreenFarmwallet />,
            },
        ]
    },
    {
        key: 'policy',
        label: 'Chính sách & Quy định',
        type: 'group',
        children: [
            {
                key: 'return-policy',
                icon: <ReloadOutlined />,
                label: 'Chính sách đổi trả',
                isFullPage: true,
                content: <ReturnPolicy />,
            },
            {
                key: 'privacy',
                icon: <SafetyOutlined />,
                label: 'Chính sách bảo mật',
                isFullPage: true,
                content: <PrivacyPolicyCompact />,
            },
        ]
    },
    {
        key: 'support',
        label: 'Hỗ trợ & Khác',
        type: 'group',
        children: [
            {
                key: 'faq',
                icon: <QuestionCircleOutlined />,
                label: 'Câu hỏi thường gặp',
                isFullPage: true,
                content: <FAQPage />,
            },
            {
                key: 'recruitment',
                icon: <TeamOutlined />,
                label: 'Tuyển dụng',
                isFullPage: true,
                content: <RecruitmentMinimal />,
            },
            {
                key: 'contact',
                icon: <PhoneOutlined />,
                label: 'Liên hệ hỗ trợ',
                isFullPage: true,
                content: <ContactSupport />,
            },
        ]
    }
];

const LegalPage = () => {
    const [searchParams] = useSearchParams();
    const tabFromUrl = searchParams.get('tab') || 'buying-guide';
    
    // Mặc định chọn tab từ URL hoặc tab đầu tiên
    const [selectedKey, setSelectedKey] = useState(tabFromUrl); 
    const { token: { colorBgContainer } } = theme.useToken();

    useEffect(() => {
        const tabFromUrl = searchParams.get('tab');
        if (tabFromUrl) {
            setSelectedKey(tabFromUrl);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [searchParams]);

    const renderContent = () => {
        // Tìm item trong cấu trúc nested (lồng nhau)
        let activeItem = null;
        MENU_ITEMS.forEach(group => {
            if (group.children) {
                const found = group.children.find(item => item.key === selectedKey);
                if (found) activeItem = found;
            }
        });

        if (!activeItem) return null;

        return (
            <div style={{ animation: 'fadeIn 0.4s ease-in-out', height: '100%' }}>
                {/* Nếu component chưa có tiêu đề riêng (isFullPage = false), render tiêu đề mặc định */}
                {!activeItem.isFullPage && (
                    <div style={{ padding: '24px 40px' }}>
                        <Title level={2} style={{ marginBottom: 20 }}>{activeItem.label}</Title>
                    </div>
                )}

                {/* Render nội dung Component con */}
                {/* Lưu ý: Không set padding ở đây để các component con tràn viền đẹp mắt */}
                <div>
                    {activeItem.content}
                </div>
            </div>
        );
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', backgroundColor: '#f0f2f5' }}>
            <Layout style={{ maxWidth: '1400px', width: '100%', display: 'flex', background: 'transparent', padding: '20px' }}>
                
                {/* SIDEBAR */}
                <Sider
                    breakpoint="lg"
                    collapsedWidth="0"
                    theme="light"
                    width={280}
                    style={{ 
                        borderRadius: '16px', 
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        marginRight: '20px',
                        height: 'fit-content' // Để sidebar không dài quá mức cần thiết
                    }}
                >
                    {/* Header Sidebar */}
                    <div style={{ 
                        padding: '24px 20px', 
                        borderBottom: '1px solid #f0f0f0',
                        background: '#f6ffed'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#166534' }}>
                            <BookOutlined style={{ fontSize: 24 }} />
                            <span style={{ fontSize: '20px', fontWeight: '800' }}>
                                Trung tâm trợ giúp
                            </span>
                        </div>
                    </div>

                    {/* Menu */}
                    <Menu
                        mode="inline"
                        selectedKeys={[selectedKey]}
                        defaultOpenKeys={['guide', 'policy', 'support']} // Mặc định mở hết các nhóm
                        style={{ borderRight: 0, paddingBottom: 20 }}
                        items={MENU_ITEMS}
                        onClick={(e) => {
                            setSelectedKey(e.key);
                            window.scrollTo({ top: 0, behavior: 'smooth' }); // Cuộn lên đầu khi chuyển tab
                        }}
                    />
                </Sider>

                {/* CONTENT AREA */}
                <Layout style={{ flex: 1, background: 'transparent' }}>
                    <Content
                        style={{
                            margin: 0,
                            background: colorBgContainer,
                            borderRadius: '16px',
                            overflow: 'hidden', // Bo góc cho nội dung bên trong
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                            minHeight: '80vh'
                        }}
                    >
                        {renderContent()}
                    </Content>
                </Layout>

            </Layout>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                /* Tùy chỉnh thanh cuộn sidebar nếu cần */
                .ant-menu-item-selected {
                    background-color: #f6ffed !important;
                    color: #16a34a !important;
                    font-weight: 600;
                }
                .ant-menu-item-selected::after {
                    border-right: 3px solid #16a34a !important;
                }
            `}</style>
        </div>
    );
};

export default LegalPage;