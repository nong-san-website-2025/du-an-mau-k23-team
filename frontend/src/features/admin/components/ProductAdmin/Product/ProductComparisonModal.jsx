import React from 'react';
import { 
  Modal, Table, Button, Space, Tag, Descriptions, Badge, Typography, Alert 
} from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  EditOutlined,
  DiffOutlined,
  ClockCircleOutlined,
  UserOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

const { Text, Title } = Typography;

const ProductComparisonModal = ({ 
  visible, 
  onCancel, 
  product, 
  onApprove, 
  onReject, 
  loading, 
  intcomma 
}) => {
  if (!product || !product.comparison_data) return null;

  const { comparison_data } = product;
  const { current, pending, changes, has_changes } = comparison_data;
  const changeCount = Object.keys(changes || {}).length;

  // Format giá trị (Giữ nguyên logic của bạn)
  const formatValue = (field, value) => {
    if (value === null || value === undefined || value === '') return <Text type="secondary">—</Text>;
    const currencyFields = ['original_price', 'discounted_price'];
    if (currencyFields.includes(field) && intcomma && typeof value === 'number') {
      return <Text strong>{intcomma(value)} <small style={{fontWeight: 400}}>VND</small></Text>;
    }
    if (typeof value === 'number') return value.toLocaleString('vi-VN');
    return String(value);
  };

  const getFieldLabel = (field) => {
    const labels = {
      name: 'Tên sản phẩm',
      description: 'Mô tả sản phẩm',
      original_price: 'Giá niêm yết',
      discounted_price: 'Giá bán (khuyến mãi)',
      unit: 'Đơn vị tính',
      stock: 'Số lượng tồn kho',
      location: 'Khu vực/Kho',
      brand: 'Thương hiệu',
      availability_status: 'Trạng thái hiển thị',
      season_start: 'Thời gian bắt đầu mùa',
      season_end: 'Thời gian kết thúc mùa',
    };
    return labels[field] || field;
  };

  const columns = [
    {
      title: 'Trường thông tin',
      dataIndex: 'field',
      key: 'field',
      width: 180,
      fixed: 'left', // Cố định cột đầu tiên khi bảng quá rộng
      render: (field) => <Text strong>{getFieldLabel(field)}</Text>
    },
    {
      title: 'Hiện tại',
      dataIndex: 'current',
      key: 'current',
      width: 300,
      render: (value, record) => (
        <Text delete={record.changed} type={record.changed ? "secondary" : "default"}>
          {formatValue(record.field, value)}
        </Text>
      )
    },
    {
      title: 'Đề xuất mới',
      dataIndex: 'pending',
      key: 'pending',
      width: 300,
      render: (value, record) => {
        const formatted = formatValue(record.field, value);
        return record.changed ? (
          <div style={{ background: '#fff7e6', padding: '4px 8px', borderRadius: 4, border: '1px dashed #ffa940' }}>
             <Text strong type="warning" style={{ color: '#d4380d' }}>{formatted}</Text>
          </div>
        ) : formatted;
      }
    },
    {
      title: 'TT',
      key: 'status',
      width: 60,
      align: 'center',
      fixed: 'right', // Cố định trạng thái để dễ nhìn
      render: (_, record) => (
        record.changed ? <EditOutlined style={{ color: '#fa8c16' }} /> : <CheckCircleOutlined style={{ color: '#52c41a', opacity: 0.3 }} />
      )
    }
  ];

  const dataSource = Object.keys(current || {}).map(field => ({
    key: field,
    field,
    current: current[field],
    pending: pending?.[field] ?? current[field],
    changed: !!changes?.[field]
  }));

  // --- RENDERING FOOTER RIÊNG ---
  // Đưa nút bấm ra prop footer của Modal để nó luôn hiển thị ở đáy
  const renderFooter = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ textAlign: 'left' }}>
        {has_changes ? (
           <Text type="warning"><ExclamationCircleOutlined /> Đang xem xét <b>{changeCount}</b> thay đổi</Text>
        ) : (
           <Text type="secondary">Không có thay đổi nào</Text>
        )}
      </div>
      <Space size="middle">
        <Button size="large" onClick={onCancel}>
          Đóng
        </Button>
        <Button 
          size="large" 
          danger 
          icon={<CloseCircleOutlined />}
          onClick={() => onReject(product)}
          loading={loading}
        >
          Từ chối
        </Button>
        <Button
          size="large"
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={() => onApprove(product)}
          loading={loading}
          disabled={!has_changes}
          style={{ minWidth: 160, background: has_changes ? '#1890ff' : '#d9d9d9' }}
        >
          {loading ? 'Đang xử lý...' : 'Duyệt cập nhật'}
        </Button>
      </Space>
    </div>
  );

  return (
    <Modal
      title={
        <Space>
          <DiffOutlined style={{ color: '#fa8c16', fontSize: 20 }} />
          <span>Duyệt yêu cầu cập nhật</span>
          <Tag color="blue">#{product.id}</Tag>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={1000}
      centered
      destroyOnClose
      maskClosable={false} // Bắt buộc user phải chọn hành động
      footer={renderFooter} // <--- CẢI TIẾN QUAN TRỌNG NHẤT
      style={{ top: 20 }}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        
        {/* Phần Header thông tin chung */}
        <Descriptions bordered size="small" column={2}>
          <Descriptions.Item label={<span style={{color: '#8c8c8c'}}><UserOutlined /> Người bán</span>}>
            <b>{product.seller_name}</b>
          </Descriptions.Item>
          <Descriptions.Item label={<span style={{color: '#8c8c8c'}}><ClockCircleOutlined /> Gửi lúc</span>}>
            {product.pending_update?.created_at ? new Date(product.pending_update.created_at).toLocaleString('vi-VN') : '—'}
          </Descriptions.Item>
        </Descriptions>

        {/* CẢI TIẾN: Đưa phần tóm tắt thay đổi lên đầu (Context First) */}
        {has_changes && (
          <Alert
            message={
              <Space direction="vertical" style={{width: '100%'}}>
                <Text strong style={{color: '#d46b08'}}><ExclamationCircleOutlined /> Tóm tắt {changeCount} thay đổi:</Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {Object.entries(changes).map(([field, change]) => (
                    <Tag key={field} color="orange" style={{ margin: 0, padding: '4px 10px' }}>
                      <b>{getFieldLabel(field)}:</b>{' '}
                      <span style={{textDecoration: 'line-through', opacity: 0.7}}>{formatValue(field, change.old)}</span>
                      {' '}→{' '}
                      <b>{formatValue(field, change.new)}</b>
                    </Tag>
                  ))}
                </div>
              </Space>
            }
            type="warning"
            style={{ border: '1px solid #ffe58f', background: '#fffbe6' }}
          />
        )}

        {/* Bảng chi tiết */}
        {/* CẢI TIẾN: Scroll Y cho bảng */}
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          size="small"
          bordered
          scroll={{ x: 900, y: 'calc(100vh - 450px)' }} // Tự động tính chiều cao để vừa màn hình
          rowClassName={(record) => record.changed ? 'highlight-row' : ''}
          sticky // Sticky header
        />
      </Space>

      <style jsx global>{`
        .highlight-row td {
          background-color: #fffaf0 !important;
          transition: background 0.3s;
        }
        .highlight-row:hover td {
          background-color: #ffe7ba !important;
        }
      `}</style>
    </Modal>
  );
};

export default ProductComparisonModal;