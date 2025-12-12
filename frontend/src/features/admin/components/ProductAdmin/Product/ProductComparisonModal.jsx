import React from 'react';
import { 
  Modal, Table, Button, Space, Tag, Descriptions, Badge, Typography, Divider, Alert 
} from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  EditOutlined,
  InfoCircleOutlined,
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

  // Format giá trị
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

  // Cột bảng cải tiến: thêm arrow chỉ hướng thay đổi
  const columns = [
    {
      title: 'Trường thông tin',
      dataIndex: 'field',
      key: 'field',
      width: 180,
      fixed: 'left',
      render: (field) => <Text strong>{getFieldLabel(field)}</Text>
    },
    {
      title: 'Hiện tại',
      dataIndex: 'current',
      key: 'current',
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
      render: (value, record) => {
        const formatted = formatValue(record.field, value);
        return record.changed ? (
          <Text strong type="warning" style={{ color: '#d4380d' }}>
            {formatted}
          </Text>
        ) : formatted;
      }
    },
    {
      title: 'Thay đổi',
      key: 'status',
      width: 110,
      align: 'center',
      render: (_, record) => (
        record.changed ? (
          <Badge status="warning" text={<EditOutlined style={{ color: '#fa8c16' }} />} />
        ) : (
          <Badge status="success" text={<CheckCircleOutlined style={{ color: '#52c41a' }} />} />
        )
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

  return (
    <Modal
      title={
        <Space>
          <DiffOutlined style={{ color: '#fa8c16', fontSize: 20 }} />
          <span>Duyệt yêu cầu cập nhật sản phẩm</span>
          <Tag color="orange">ID: {product.id}</Tag>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={1100}
      destroyOnClose
      closeIcon={<CloseCircleOutlined />}
      footer={null} // Tự custom footer đẹp hơn
    >
      <Space direction="vertical" size={24} style={{ width: '100%' }}>
        {/* Header Card - Thông tin nhanh */}
        <Alert
          message={
            <Space>
              <ExclamationCircleOutlined style={{ color: '#faad14' }} />
              <Text strong>
                Có <Text type="warning" strong>{changeCount}</Text> trường thông tin được đề xuất thay đổi
              </Text>
            </Space>
          }
          type="warning"
          showIcon={false}
          banner
          style={{ borderLeft: '4px solid #faad14', background: '#fffbe6' }}
        />

        {/* Thông tin yêu cầu */}
        <Descriptions bordered size="small" column={4}>
          <Descriptions.Item label={<><UserOutlined /> Người bán</>} span={2}>
            <Text strong>{product.seller_name}</Text>
          </Descriptions.Item>
          <Descriptions.Item label={<><ClockCircleOutlined /> Thời gian gửi</>}>
            {product.pending_update?.created_at ? 
              new Date(product.pending_update.created_at).toLocaleString('vi-VN') : 
              '—'
            }
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Badge status="processing" text="Chờ duyệt" />
          </Descriptions.Item>
        </Descriptions>

        {/* Bảng so sánh - trọng tâm */}
        <div>
          <Title level={5}>
            <EditOutlined /> Chi tiết thay đổi
          </Title>
          <Table
            columns={columns}
            dataSource={dataSource}
            pagination={false}
            size="middle"
            scroll={{ x: 900 }}
            bordered
            rowClassName={(record) => record.changed ? 'ant-table-row-changed' : ''}
          />
        </div>

        {/* Tóm tắt thay đổi dạng highlight - cực kỳ hiệu quả cho reviewer */}
        {has_changes && (
          <div style={{ 
            background: 'linear-gradient(90deg, #fff7e6 0%, #fffbe6 100%)', 
            padding: '16px 20px', 
            borderRadius: 8,
            border: '1px solid #ffd591'
          }}>
            <Title level={5} style={{ margin: 0, color: '#d46b08' }}>
              <DiffOutlined /> Tóm tắt thay đổi quan trọng ({changeCount} mục)
            </Title>
            <Divider style={{ margin: '12px 0' }} />
            <Space direction="vertical" style={{ width: '100%' }}>
              {Object.entries(changes).map(([field, change]) => (
                <Space key={field} size="middle">
                  <Text strong>→ {getFieldLabel(field)}:</Text>
                  <Text delete type="secondary">{formatValue(field, change.old)}</Text>
                  <Text strong type="danger">⟶ {formatValue(field, change.new)}</Text>
                </Space>
              ))}
            </Space>
          </div>
        )}

        {/* Footer hành động cố định, nổi bật, chuẩn TMĐT */}
        <div style={{ 
          textAlign: 'right', 
          paddingTop: 16, 
          borderTop: '1px solid #f0f0f0',
          marginTop: 24
        }}>
          <Space size="middle">
            <Button size="large" onClick={onCancel}>
              Hủy bỏ
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
              style={{ minWidth: 160 }}
            >
              {loading ? 'Đang xử lý...' : 'Duyệt cập nhật'}
            </Button>
          </Space>
        </div>
      </Space>

      {/* CSS tinh chỉnh chuẩn Ant Design Pro */}
      <style jsx global>{`
        .ant-table-row-changed {
          background-color: #fff2e8 !important;
        }
        .ant-table-row-changed:hover > td {
          background-color: #ffddd1 !important;
        }
        .ant-descriptions-item-label {
          background: #fafafa;
          font-weight: 600;
        }
      `}</style>
    </Modal>
  );
};

export default ProductComparisonModal;