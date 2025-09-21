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

const { Title } = Typography;

const AdminFlashSalePage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getFlashSales();

      // ✅ VALIDATE: chỉ gán nếu là mảng
      if (Array.isArray(res.data)) {
        setData(res.data);
      } else {
        console.error("Dữ liệu không phải mảng:", res.data);
        setData([]); // fallback an toàn
        message.error("Dữ liệu Flash Sale không hợp lệ");
      }
    } catch (err) {
      console.error("Lỗi khi tải Flash Sale:", err);
      message.error("Không tải được danh sách Flash Sale");
      setData([]); // ✅ luôn đảm bảo state là mảng
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
      title: "Sản phẩm",
      dataIndex: ["product", "name"],
      key: "product",
      render: (text, record) => (
        <div>
          <div>
            <strong>{text}</strong>
          </div>
          <div>
            {record.flash_price?.toLocaleString()}đ →{" "}
            <Tag color="red">{record.flash_price?.toLocaleString()}đ</Tag>
          </div>
        </div>
      ),
    },
    {
      title: "Số lượng",
      dataIndex: "stock",
      key: "stock",
      render: (stock, record) =>
        `${record.stock - record.remaining_stock} / ${stock}`,
    },
    {
      title: "Thời gian",
      key: "time",
      render: (_, record) => (
        <div>
          <div>{moment(record.start_time).format("DD/MM HH:mm")}</div>
          <div>→ {moment(record.end_time).format("DD/MM HH:mm")}</div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "is_active",
      key: "status",
      render: (isActive, record) => {
        // So sánh bằng Moment objects (không dùng .format() vì sẽ thành string)
        const now = moment(); // local time
        const start = moment(record.start_time); // parse ISO giữ timezone
        const end = moment(record.end_time);
        const isOngoing = now.isBetween(start, end, undefined, '[]'); // inclusive

        if (!isActive) return <Tag>Chưa kích hoạt</Tag>;
        if (isOngoing) return <Tag color="green">Đang diễn ra</Tag>;
        if (now.isBefore(start)) return <Tag color="blue">Sắp diễn ra</Tag>;
        return <Tag color="default">Đã kết thúc</Tag>;
      },
    },
    {
      title: "Hành động",
      key: "action",
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
            title="Xóa Flash Sale?"
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

        <Table
          columns={columns}
          dataSource={Array.isArray(data) ? data : []}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
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

export default AdminFlashSalePage;
