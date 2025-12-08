import React from "react";
import { Typography, Table, Image, Space, Button } from "antd";
import { ShoppingOutlined, EditOutlined } from "@ant-design/icons";
// import { useNavigate } from "react-router-dom"; // Bỏ comment nếu cần dùng
import { intcomma } from './../../../utils/format';

const { Text } = Typography;

const FALLBACK_IMAGE = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIiBzdHlsZT0iYmFja2dyb3VuZDojZjVmNWY1Ij4KICA8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2JmYmZiZiIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4=";

const ProductList = ({ cartItems, onEditCart }) => {
  // const navigate = useNavigate();
  const selectedItems = cartItems.filter((item) => item.selected);

  // Cấu hình các cột cho bảng
  const columns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'product',
      key: 'product',
      width: 300, 
      render: (_, record) => {
        const product = record.product_data || record.product || {};
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Image 
              src={product.image} 
              alt={product.name} 
              width={60}
              height={60}
              style={{ objectFit: 'cover', borderRadius: 6, border: '1px solid #f0f0f0' }}
              fallback={FALLBACK_IMAGE}
              preview={{ mask: 'Xem' }}
              placeholder={
                <Image preview={false} src={FALLBACK_IMAGE} width={60} height={60} />
              }
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Text strong style={{ fontSize: 14, maxWidth: 200 }} ellipsis={{ tooltip: product.name }}>
                {product.name}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Phân loại: Mặc định
              </Text>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Đơn giá',
      dataIndex: 'price',
      key: 'price',
      align: 'center',
      render: (_, record) => {
        const product = record.product_data || record.product || {};
        // Chuyển đổi sang số float để đảm bảo tính toán đúng
        const price = parseFloat(product.price) || 0;
        // Áp dụng intcomma ở đây
        return <Text>{intcomma(price)}₫</Text>;
      }
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'center',
      width: 100,
      render: (quantity) => (
        <span style={{ 
          padding: '4px 12px', 
          background: '#f5f5f5', 
          borderRadius: 4, 
          fontWeight: 500 
        }}>
          x{quantity}
        </span>
      ),
    },
    {
      title: 'Thành tiền',
      key: 'total',
      align: 'right',
      render: (_, record) => {
        const product = record.product_data || record.product || {};
        const price = parseFloat(product.price) || 0;
        const total = price * record.quantity;
        // Áp dụng intcomma ở đây
        return <Text strong style={{ color: '#4caf50' }}>{intcomma(total)}₫</Text>;
      }
    },
  ];

  return (
    <div className="checkout-card" style={{ background: '#fff', borderRadius: 8, padding: 16, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
      {/* Header riêng biệt phía trên bảng */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Space>
          <ShoppingOutlined style={{ fontSize: 18, color: '#1890ff' }} />
          <Text strong style={{ fontSize: 16 }}>Sản phẩm đã chọn ({selectedItems.length})</Text>
        </Space>
        
        <Button 
          type="link" 
          icon={<EditOutlined />} 
          onClick={onEditCart}
          size="small"
        >
          Chỉnh sửa
        </Button>
      </div>

      {/* Table Ant Design */}
      <Table
        className="checkout-table"
        columns={columns}
        dataSource={selectedItems}
        rowKey={(record) => record.id || (record.product_data || record.product).id}
        pagination={false} 
        size="middle" 
        scroll={{ x: 600 }} 
        summary={(pageData) => {
          let totalPayment = 0;
          pageData.forEach(({ quantity, product, product_data }) => {
            const p = product_data || product || {};
            totalPayment += (parseFloat(p.price) || 0) * quantity;
          });

          return (
            <Table.Summary.Row style={{ background: '#fafafa' }}>
              <Table.Summary.Cell index={0} colSpan={3}>
                <Text strong>Tổng tạm tính:</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">
                {/* Áp dụng intcomma ở đây cho tổng tiền */}
                <Text strong style={{ fontSize: 20, color: "#4caf50" }}>
                  {intcomma(totalPayment)}₫
                </Text>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          );
        }}
      />
    </div>
  );
};

export default ProductList;