import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Tag,
  message,
  Typography,
  Card,
  Badge,
  Tooltip,
  Input,
  DatePicker,
  Row,
  Col,
  Space,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import FlashSaleModal from "../../components/FlashSaleAdmin/FlashSaleModal";
import { getFlashSales, deleteFlashSale } from "../../services/flashsaleApi";
import moment from "moment";
import { intcomma } from "../../../../utils/format"; // Đảm bảo đường dẫn đúng
import AdminPageLayout from "../../components/AdminPageLayout";
import ButtonAction from "../../../../components/ButtonAction"; // ✅ Import component tái sử dụng

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const FlashSalePage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getFlashSales();
      if (Array.isArray(res.data)) {
        // Sắp xếp theo mới nhất
        const sortedData = res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setData(sortedData);
      } else {
        setData([]);
      }
    } catch (err) {
      message.error("Không tải được danh sách Flash Sale");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (record) => {
    try {
      await deleteFlashSale(record.id);
      message.success("Đã xóa chương trình Flash Sale");
      loadData();
    } catch (err) {
      message.error("Xóa thất bại");
    }
  };

  // Cấu hình Action Buttons
  const getActions = (record) => [
    {
      actionType: "edit",
      tooltip: "Chỉnh sửa chương trình",
      icon: <EditOutlined />,
      onClick: (r) => {
        setEditingRecord(r);
        setModalVisible(true);
      },
    },
    {
      actionType: "delete",
      tooltip: "Xóa chương trình",
      icon: <DeleteOutlined />,
      confirm: {
        title: "Xóa Flash Sale?",
        description: "Hành động này không thể hoàn tác.",
        okText: "Xóa ngay",
        cancelText: "Hủy",
      },
      onClick: (r) => handleDelete(r),
    },
  ];

  const columns = [
    {
      title: "Khung giờ",
      key: "time",
      width: 250,
      render: (_, record) => {
         const start = moment(record.start_time);
         const end = moment(record.end_time);
         return (
             <div style={{ display: 'flex', flexDirection: 'column' }}>
                 <Text strong>{start.format("HH:mm DD/MM")} - {end.format("HH:mm DD/MM")}</Text>
                 <Text type="secondary" style={{ fontSize: 12 }}>{end.diff(start, 'hours')} giờ diễn ra</Text>
             </div>
         )
      }
    },
    {
      title: "Số lượng sản phẩm",
      key: "product_count",
      align: 'center',
      render: (_, record) => (
        <Tag color="geekblue" style={{ fontSize: 13, padding: "4px 10px" }}>
          {record.flashsale_products?.length || 0} sản phẩm
        </Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "is_active",
      key: "status",
      width: 180,
      render: (isActive, record) => {
        const now = moment();
        const start = moment(record.start_time);
        const end = moment(record.end_time);
        
        let statusConfig = { color: "default", text: "Đã kết thúc", status: "default" };

        if (!isActive) {
            statusConfig = { color: "error", text: "Đang ẩn", status: "error" };
        } else if (now.isBetween(start, end)) {
            statusConfig = { color: "processing", text: "Đang diễn ra", status: "processing" };
        } else if (now.isBefore(start)) {
            statusConfig = { color: "warning", text: "Sắp diễn ra", status: "warning" };
        }

        return <Badge status={statusConfig.status} text={statusConfig.text} />;
      },
    },
    {
      title: "Thao tác",
      key: "action",
      width: 100,
      fixed: "right",
      render: (_, record) => (
        <ButtonAction actions={getActions(record)} record={record} />
      ),
    },
  ];

  // Render bảng con (Nested Table) chuyên nghiệp hơn
  const expandedRowRender = (record) => {
    const productColumns = [
        { title: 'Sản phẩm', dataIndex: 'product_name', key: 'name', render: (text) => <Text strong>{text}</Text> },
        { title: 'Giá gốc', dataIndex: 'original_price', key: 'original', render: (val) => <Text delete type="secondary">{intcomma(val)}đ</Text> },
        { 
            title: 'Giá Flash', 
            dataIndex: 'flash_price', 
            key: 'flash',
            render: (val, r) => (
                <Space>
                    <Text type="danger" strong>{intcomma(val)}đ</Text>
                    <Tag color="red">-{Math.round(((r.original_price - val) / r.original_price) * 100)}%</Tag>
                </Space>
            )
        },
        { 
            title: 'Đã bán / Tổng', 
            key: 'stock',
            render: (_, r) => {
                const sold = r.stock - r.remaining_stock;
                const percent = Math.round((sold / r.stock) * 100);
                return (
                    <div style={{ width: 150 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                            <span>Đã bán: {sold}</span>
                            <span>Tổng: {r.stock}</span>
                        </div>
                        <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, marginTop: 4, overflow: 'hidden' }}>
                             <div style={{ width: `${percent}%`, background: '#faad14', height: '100%' }}></div>
                        </div>
                    </div>
                )
            }
        }
    ];
    return (
        <Table 
            columns={productColumns} 
            dataSource={record.flashsale_products} 
            pagination={false} 
            size="small"
            rowKey="id"
            bordered
        />
    );
  };

  return (
    <AdminPageLayout title="QUẢN LÝ FLASH SALE">
      <Card bordered={false} className="c-shadow">
        {/* Thanh công cụ lọc */}
        <Row gutter={16} style={{ marginBottom: 20 }}>
            <Col span={6}>
                <Input prefix={<SearchOutlined />} placeholder="Tìm kiếm theo mã..." />
            </Col>
            <Col span={6}>
                 <RangePicker style={{ width: '100%' }} placeholder={['Từ ngày', 'Đến ngày']} />
            </Col>
            <Col span={12} style={{ textAlign: 'right' }}>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                        setEditingRecord(null);
                        setModalVisible(true);
                    }}
                    size="large"
                >
                    Tạo chương trình mới
                </Button>
            </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          expandable={{
            expandedRowRender,
            rowExpandable: (record) => record.flashsale_products?.length > 0,
          }}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          bordered
          size="small"
        />
      </Card>

      <FlashSaleModal
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onSuccess={() => {
          setModalVisible(false);
          loadData();
        }}
        record={editingRecord}
      />
    </AdminPageLayout>
  );
};

export default FlashSalePage;