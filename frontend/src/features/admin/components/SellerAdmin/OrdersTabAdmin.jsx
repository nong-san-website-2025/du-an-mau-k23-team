import React, { useState, useEffect } from "react";
import {
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Spin,
  Empty,
  Card,
  Descriptions,
} from "antd";
import { EyeOutlined } from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import { intcomma } from "../../../../utils/format";

const statusColorMap = {
  pending: "orange",
  shipping: "blue",
  delivery: "cyan",
  success: "green",
  cancelled: "red",
  ready_to_pick: "purple",
  picking: "processing",
  delivered: "green",
  out_for_delivery: "blue",
  delivery_failed: "volcano",
  lost: "error",
  damaged: "red",
  returned: "magenta",
};

const statusLabelMap = {
  pending: "Chờ xử lý",
  shipping: "Đang gửi",
  delivery: "Chờ giao",
  success: "Thành công",
  cancelled: "Đã hủy",
  ready_to_pick: "Sẵn sàng lấy",
  picking: "Đang lấy",
  delivered: "Đã giao",
  out_for_delivery: "Đang giao",
  delivery_failed: "Giao thất bại",
  lost: "Thất lạc",
  damaged: "Hư hỏng",
  returned: "Trả hàng",
};

export default function OrdersTabAdmin({ sellerId }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailsOrder, setDetailsOrder] = useState(null);
  const [detailsVisible, setDetailsVisible] = useState(false);

  const fetchOrders = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/sellers/${sellerId}/orders/`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setOrders(res.data.results || res.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    if (sellerId) {
      fetchOrders();
    }
  }, [sellerId, fetchOrders]);

  const handleViewDetails = (order) => {
    setDetailsOrder(order);
    setDetailsVisible(true);
  };

  const columns = [
    {
      title: "Mã đơn",
      dataIndex: "id",
      key: "id",
      width: 100,
      render: (id) => (
        <span style={{ fontWeight: 600, color: "#1890ff" }}>#{id}</span>
      ),
    },
    {
      title: "Khách hàng",
      dataIndex: "customer_name",
      key: "customer_name",
      width: 150,
      render: (name) => (
        <Space direction="vertical" size={0}>
          <div style={{ fontWeight: 500, color: "#1f2937" }}>{name}</div>
          <div style={{ fontSize: "12px", color: "#6b7280" }}>
            {/* Phone would be shown here if in data */}
          </div>
        </Space>
      ),
    },
    {
      title: "Sản phẩm",
      key: "products",
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          {record.items?.length ? (
            record.items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  fontSize: "12px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "block",
                  maxWidth: "200px",
                }}
                title={item.product?.name} // tooltip khi hover
              >
                - {item.product?.name || "Unknown"} x{item.quantity}
              </div>
            ))
          ) : (
            <span style={{ color: "#9ca3af" }}>Không có sản phẩm</span>
          )}
        </Space>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => (
        <Tag color={statusColorMap[status]}>{statusLabelMap[status]}</Tag>
      ),
    },
    {
      title: "Giá trị",
      dataIndex: "total_price",
      key: "total_price",
      width: 120,
      render: (price) => (
        <span style={{ fontWeight: 600, color: "#1f2937" }}>
           {intcomma(price)} ₫
        </span>
      ),
    },
    {
      title: "Ngày đặt",
      dataIndex: "created_at",
      key: "created_at",
      width: 140,
      render: (date) => dayjs(date).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Hành động",
      key: "action",
      width: 100,
      fixed: "right",
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record)}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <>
      <Card
        style={{
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Spin spinning={loading}>
          {orders.length > 0 ? (
            <Table
              columns={columns}
              dataSource={orders}
              rowKey="id"
              pagination={{
                pageSize: 10,
                total: orders.length,
                showSizeChanger: true,
                showTotal: (total) => `Tổng cộng ${total} đơn hàng`,
              }}
              scroll={{ x: 1200 }}
            />
          ) : (
            <Empty
              description="Không có đơn hàng nào"
              style={{ marginTop: 50 }}
            />
          )}
        </Spin>
      </Card>

      {/* Order Details Modal */}
      <Modal
        title="Chi tiết đơn hàng"
        open={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        width={800}
        footer={null}
        centered
      >
        {detailsOrder && (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            {/* Thông tin cơ bản */}
            <Descriptions
              bordered
              size="small"
              column={2}
              title="Thông tin chung"
            >
              <Descriptions.Item label="Mã đơn">
                <span style={{ fontWeight: 600, color: "#1890ff" }}>
                  #{detailsOrder.id}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={statusColorMap[detailsOrder.status]}>
                  {statusLabelMap[detailsOrder.status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Khách hàng">
                {detailsOrder.customer_name}
              </Descriptions.Item>
              <Descriptions.Item label="SĐT khách">
                {detailsOrder.customer_phone || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày đặt" span={2}>
                {dayjs(detailsOrder.created_at).format("DD/MM/YYYY HH:mm")}
              </Descriptions.Item>
            </Descriptions>

            {/* Sản phẩm */}
            <div>
              <h4 style={{ marginBottom: "12px", color: "#1f2937" }}>
                Sản phẩm trong đơn
              </h4>
              <Table
                columns={[
                  {
                    title: "Sản phẩm",
                    dataIndex: ["product", "name"],
                    key: "product_name",
                  },
                  {
                    title: "Số lượng",
                    dataIndex: "quantity",
                    key: "quantity",
                    width: 80,
                  },
                  {
                    title: "Giá",
                    dataIndex: "price",
                    key: "price",
                    width: 120,
                    render: (price) =>
                      intcomma(price) + " ₫",
                  },
                  {
                    title: "Thành tiền",
                    key: "total",
                    width: 120,
                    render: (_, record) =>
                      intcomma(record.price * record.quantity) + " ₫",
                  },
                ]}
                dataSource={detailsOrder.items || []}
                pagination={false}
                size="small"
                rowKey={(record, idx) => idx}
              />
            </div>

            {/* Địa chỉ giao hàng */}
            <Descriptions bordered size="small" title="Địa chỉ giao hàng">
              <Descriptions.Item label="Địa chỉ" span={2}>
                {detailsOrder.address || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Ghi chú" span={2}>
                {detailsOrder.note || "Không có ghi chú"}
              </Descriptions.Item>
            </Descriptions>

            {/* Thanh toán */}
            <Descriptions bordered size="small" title="Thanh toán">
              <Descriptions.Item label="Phương thức thanh toán" span={2}>
                {detailsOrder.payment_method || "Thanh toán khi nhận hàng"}
              </Descriptions.Item>
            </Descriptions>
            
            {/* Chi tiết thanh toán */}
            <div
              style={{
                padding: "16px",
                borderRadius: 8,
                background: "#fafafa",
                border: "1px solid #e5e7eb",
              }}
            >
              <div style={{ marginBottom: "12px", fontWeight: 600, color: "#1f2937" }}>
                Chi tiết thanh toán
              </div>
              
              <div style={{ marginBottom: "10px", display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6b7280" }}>Tổng giá trị sản phẩm:</span>
                <span style={{ fontWeight: 500, color: "#1f2937" }}>
                  {intcomma(
                    (detailsOrder.total_price || 0) - (detailsOrder.shipping_fee || 0)
                  )} ₫
                </span>
              </div>
              
              <div style={{ marginBottom: "10px", display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6b7280" }}>Phí vận chuyển:</span>
                <span style={{ fontWeight: 500, color: "#faad14" }}>
                  {intcomma(detailsOrder.shipping_fee || 0)} ₫
                </span>
              </div>
              
              <div style={{ marginBottom: "10px", display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6b7280" }}>Tổng phí sàn đã khấu trừ:</span>
                <span style={{ fontWeight: 500, color: "#f97316" }}>
                  -{intcomma(detailsOrder.total_commission || 0)} ₫
                </span>
              </div>
              
              <div
                style={{
                  borderTop: "2px solid #d1d5db",
                  paddingTop: "10px",
                  marginTop: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontWeight: 600, color: "#1f2937" }}>Doanh thu cửa hàng:</span>
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "#059669",
                  }}
                >
                  {intcomma(
                    (detailsOrder.total_price || 0) - (detailsOrder.total_commission || 0)
                  )} ₫
                </span>
              </div>
            </div>
          </Space>
        )}
      </Modal>
    </>
  );
}
