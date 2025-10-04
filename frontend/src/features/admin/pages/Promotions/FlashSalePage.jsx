// pages/AdminFlashSalePage.jsx
import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  Popconfirm,
  message,
  Typography,
  Card,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import FlashSaleModal from "../../components/FlashSaleAdmin/FlashSaleModal";
import { getFlashSales, deleteFlashSale } from "../../services/flashsaleApi";
import moment from "moment";
import { intcomma } from "../../../../utils/format";

const { Title } = Typography;

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
        // ✅ GIỮ NGUYÊN CẤU TRÚC — KHÔNG FLATTEN
        setData(res.data);
      } else {
        console.error("Dữ liệu không phải mảng:", res.data);
        setData([]);
        message.error("Dữ liệu Flash Sale không hợp lệ");
      }
    } catch (err) {
      console.error("Lỗi khi tải Flash Sale:", err);
      message.error("Không tải được danh sách Flash Sale");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteFlashSale(id);
      message.success("Xóa Flash Sale thành công");
      loadData();
    } catch (err) {
      message.error("Xóa thất bại");
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: "Thời gian",
      key: "time",
      render: (_, record) => (
        <div>
          <div>
            {moment(record.start_time).local().format("DD/MM HH:mm")}→{" "}
            {moment(record.end_time).local().format("DD/MM HH:mm")}
          </div>
        </div>
      ),
      width: 200,
    },
    {
      title: "Sản phẩm",
      key: "product_count",
      render: (_, record) => (
        <Tag color="blue">
          {record.flashsale_products?.length || 0} sản phẩm
        </Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "is_active",
      key: "status",
      render: (isActive, record) => {
        const now = moment();
        const start = moment(record.start_time);
        const end = moment(record.end_time);
        const isOngoing = now.isBetween(start, end, null, "[]");

        if (!isActive) return <Tag>Chưa kích hoạt</Tag>;
        if (isOngoing) return <Tag color="green">Đang diễn ra</Tag>;
        if (now.isBefore(start)) return <Tag color="blue">Sắp diễn ra</Tag>;
        return <Tag color="default">Đã kết thúc</Tag>;
      },
    },
    {
      title: "Hành động",
      key: "action",
      width: 180,
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              setEditingRecord(record);
              setModalVisible(true);
            }}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa toàn bộ Flash Sale này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <Title level={3}>Quản lý Flash Sale</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingRecord(null);
              setModalVisible(true);
            }}
          >
            Tạo Flash Sale
          </Button>
        </div>

        {/* ✅ Đóng thẻ Table đúng cú pháp */}
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          expandable={{
            expandedRowRender: (record) => (
              <div style={{ padding: "16px 24px" }}>
                <Title level={5} style={{ marginBottom: 16 }}>
                  Danh sách sản phẩm ({record.flashsale_products?.length || 0})
                </Title>
                <Table
                  dataSource={record.flashsale_products || []}
                  rowKey="id"
                  pagination={false}
                  showHeader={false}
                  size="small"
                >
                  <Table.Column
                    title="Sản phẩm"
                    render={(product) => (
                      <div>
                        <strong>{product.product_name}</strong>
                        <div>
                          {product.original_price?.toLocaleString()}đ →{" "}
                          <Tag color="red">
                            {intcomma(product.flash_price)}đ
                          </Tag>
                        </div>
                      </div>
                    )}
                  />
                  <Table.Column
                    title="Số lượng"
                    render={(product) =>
                      `${product.stock - (product.remaining_stock || 0)} / ${product.stock}`
                    }
                  />
                  <Table.Column
                    title="Còn lại"
                    render={(product) => (
                      <Tag
                        color={product.remaining_stock <= 0 ? "red" : "green"}
                      >
                        {product.remaining_stock || product.stock} còn
                      </Tag>
                    )}
                  />
                </Table>
              </div>
            ),
            rowExpandable: (record) => record.flashsale_products?.length > 0,
          }}
        />

        <FlashSaleModal
          visible={modalVisible}
          onCancel={() => setModalVisible(false)}
          onSuccess={() => {
            setModalVisible(false);
            loadData();
          }}
          record={editingRecord}
        />
      </Card>
    </div>
  );
};

export default FlashSalePage;
