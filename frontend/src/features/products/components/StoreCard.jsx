import React, { useState, useEffect } from "react";
import { Card, Button, Image, Row, Col, Typography, Space, Divider } from "antd";
import { EnvironmentOutlined, ShopOutlined, CheckCircleFilled } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import NoImage from "../../../components/shared/NoImage";

// Giả sử bạn import API ở đây
import { getProvinces } from "../../../services/api/ghnApi"; 

const { Text, Paragraph } = Typography;

const StoreCard = ({ store, productId }) => {
  const navigate = useNavigate();
  const [locationName, setLocationName] = useState("Đang tải...");

  // --- Logic lấy địa chỉ (giữ nguyên logic cũ của bạn) ---
  useEffect(() => {
    if (store.address && store.address.length > 10) {
      setLocationName(store.address);
      return;
    }
    const fetchLocationName = async () => {
      if (!store.district_id) {
        setLocationName("Chưa cập nhật địa chỉ");
        return;
      }
      // Demo logic hiển thị tạm
      setLocationName(`Khu vực GHN: ${store.district_id}`); 
    };
    fetchLocationName();
  }, [store]);
  // ------------------------------------------------------

  return (
    <Card 
      hoverable // ✨ Hiệu ứng hover nhẹ khi di chuột vào
      style={{ 
        marginTop: 24, 
        borderRadius: 12, 
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)", // ✨ Đổ bóng mềm
        overflow: 'hidden',
        border: 'none' // Bỏ viền cứng mặc định
      }} 
      bodyStyle={{ padding: 0 }} // Xóa padding mặc định để tự custom
    >
      {/* --- PHẦN HEADER: AVATAR + INFO --- */}
      <div style={{ padding: '20px 20px 16px 20px', display: "flex", alignItems: "center", gap: 16 }}>
        
        {/* Avatar Shop */}
        <div style={{ position: 'relative' }}>
          {store.avatar ? (
            <Image
              src={store.avatar}
              width={70} // Tăng kích thước chút
              height={70}
              preview={false}
              style={{ 
                borderRadius: "50%", 
                objectFit: "cover", 
                border: "1px solid #f0f0f0", // Viền nhẹ cho ảnh
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
              }}
            />
          ) : (
            <div style={{ 
              width: 70, height: 70, borderRadius: '50%', background: '#f5f5f5', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: "1px solid #e8e8e8"
            }}>
              <ShopOutlined style={{ fontSize: 28, color: '#bfbfbf' }} />
            </div>
          )}
          
          {/* Badge Online/Verified (Option) */}
          <CheckCircleFilled style={{ 
            position: 'absolute', bottom: 2, right: 2, 
            color: '#52c41a', background: '#fff', borderRadius: '50%', border: '2px solid white' 
          }} />
        </div>

        {/* Info Shop */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <Text strong style={{ fontSize: 17, display: 'block', marginBottom: 4, color: '#333' }}>
                {store.store_name}
              </Text>
              
              <Space align="start" size={6} style={{ color: '#888', fontSize: 13 }}>
                <EnvironmentOutlined style={{ marginTop: 3, color: '#595959' }} />
                <Paragraph 
                  style={{ margin: 0, color: '#666', maxWidth: 220 }} 
                  ellipsis={{ rows: 1, tooltip: store.address || locationName }}
                >
                   {store.address || locationName}
                </Paragraph>
              </Space>
            </div>

            <Button
              type="primary"
              shape="round" // ✨ Bo tròn nút
              ghost // Nút rỗng viền màu
              size="middle"
              onClick={() => navigate(`/store/${store.id}`, { state: { productId } })}
              style={{ fontWeight: 600, borderColor: '#1890ff', color: '#1890ff' }}
            >
              Xem Shop
            </Button>
          </div>
        </div>
      </div>

      {/* --- PHẦN THỐNG KÊ (STATS) --- */}
      <div style={{ background: '#fafafa', padding: '16px 0', borderTop: '1px solid #f0f0f0' }}>
        <Row gutter={16} align="middle">
          
          <Col span={8} style={{ textAlign: 'center', position: 'relative' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Sản phẩm</Text>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#333', lineHeight: 1.2 }}>
              {store.total_products || 0}
            </div>
            {/* Vạch ngăn cách */}
            <Divider type="vertical" style={{ height: '30px', position: 'absolute', right: 0, top: 4, margin: 0 }} />
          </Col>

          <Col span={8} style={{ textAlign: 'center', position: 'relative' }}>
             <Text type="secondary" style={{ fontSize: 12 }}>Người theo dõi</Text>
             <div style={{ fontSize: 18, fontWeight: 700, color: '#333', lineHeight: 1.2 }}>
               {store.followers_count || 0}
             </div>
             <Divider type="vertical" style={{ height: '30px', position: 'absolute', right: 0, top: 4, margin: 0 }} />
          </Col>

          <Col span={8} style={{ textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Đánh giá</Text>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#faad14', lineHeight: 1.2 }}>
              {store.rating || "4.9"} <span style={{fontSize: 12, color: '#999'}}>/ 5.0</span>
            </div>
          </Col>

        </Row>
      </div>
    </Card>
  );
};

export default StoreCard;