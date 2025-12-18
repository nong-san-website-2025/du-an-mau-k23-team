import React from "react";
import { Modal, Descriptions, Table, Tag } from "antd";
import StatusTag from "../../../../components/StatusTag"; // Import component bạn đã có

const OrderDetailModal = ({ order, visible, onClose }) => {
  if (!order) return null;

  return (
    <Modal
      open={visible}
      title={`Chi tiết đơn hàng #${order.id}`}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
    >
      <Descriptions bordered column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }} size="small">
        <Descriptions.Item label="Khách hàng">
          <strong>{order.customer_name || order.user?.username}</strong>
        </Descriptions.Item>
        <Descriptions.Item label="Số điện thoại">
          {order.customer_phone || order.user?.phone || "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Địa chỉ" span={2}>
          {order.address}
        </Descriptions.Item>
        <Descriptions.Item label="Trạng thái">
          <StatusTag status={order.status} type="order" />
        </Descriptions.Item>
        <Descriptions.Item label="Tổng tiền">
          <span style={{ color: "#52c41a", fontWeight: "bold", fontSize: 16 }}>
            {Number(order.total_price).toLocaleString()}đ
          </span>
        </Descriptions.Item>
        <Descriptions.Item label="Ngày đặt">
            {new Date(order.created_at).toLocaleString("vi-VN")}
        </Descriptions.Item>
      </Descriptions>

      <div style={{ marginTop: 24, border: "1px solid #f0f0f0", borderRadius: 8, overflow: "hidden" }}>
        <Table
          dataSource={order.items}
          pagination={false}
          rowKey="id"
          size="small"
          scroll={{ x: 500 }}
          columns={[
            {
              title: "Sản phẩm",
              width: 250,
              render: (_, item) => (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 4, overflow: "hidden", border: "1px solid #eee", background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {item.product_image ? (
                        <img src={item.product_image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : <span style={{fontSize: 10, color: '#999'}}>N/A</span>}
                  </div>
                  <span style={{ fontWeight: 500 }} className="text-truncate">{item.product_name}</span>
                </div>
              ),
            },
            { title: "Đơn giá", dataIndex: "price", align: "center", width: 120, render: (v) => `${Number(v).toLocaleString()}đ` },
            { title: "SL", dataIndex: "quantity", align: "center", width: 60 },
            { 
              title: "Thành tiền", 
              align: "right", 
              width: 120,
              render: (_, item) => <strong>{(Number(item.price) * Number(item.quantity)).toLocaleString()}đ</strong> 
            },
          ]}
        />
      </div>
    </Modal>
  );
};

export default OrderDetailModal;