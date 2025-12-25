import React from 'react';
import { Typography, Timeline } from 'antd';

const { Title, Paragraph, Text } = Typography;

export default function ShippingPolicy() {
  return (
    <div style={{ padding: '24px 40px' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: 24 }}>
        Chính Sách Vận Chuyển
      </Title>
      <Paragraph style={{ fontSize: 16 }}>
        GreenFarm hợp tác với các đơn vị vận chuyển uy tín (GHN, GHTK, Viettel Post)
        để đảm bảo nông sản tươi, sạch được giao đến bạn nhanh chóng và an toàn.
      </Paragraph>

      <Title level={4} style={{ marginTop: 16 }}>Thời gian giao hàng</Title>
      <Timeline
        items={[
          { children: (<><Text strong>Nội thành</Text>: 1 - 2 ngày làm việc</>) },
          { children: (<><Text strong>Ngoại thành</Text>: 2 - 4 ngày làm việc</>) },
          { children: (<><Text strong>Liên tỉnh</Text>: 3 - 7 ngày làm việc</>) },
        ]}
      />

      <Title level={4} style={{ marginTop: 8 }}>Phí vận chuyển</Title>
      <Paragraph>
        Phí ship được tính theo địa chỉ giao hàng và khối lượng thực tế.
        Hệ thống tự động hiển thị phí dự kiến ở bước thanh toán.
      </Paragraph>

      <Title level={4} style={{ marginTop: 8 }}>Lưu ý bảo quản</Title>
      <Paragraph>
        - Vui lòng kiểm tra tình trạng sản phẩm khi nhận hàng.\n
        - Bảo quản theo gợi ý trên bao bì để giữ chất lượng tốt nhất.
      </Paragraph>
    </div>
  );
}
