import React, { useEffect, useState } from "react";
import {
  Tag,
  message,
  Modal,
  Descriptions,
  Table,
} from "antd";
import API from "../../../login_register/services/api";
import OrdersBaseLayout from "../../components/OrderSeller/OrdersBaseLayout";
import "../../styles/OrderPage.css";

// --- CSS TÙY CHỈNH (Nhúng trực tiếp để đảm bảo hoạt động ngay) ---
const styles = `
  /* Class để cắt chữ nếu quá dài và thêm dấu ... */
  .text-truncate {
    white-space: nowrap; 
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
    max-width: 100%;
  }

  /* Tinh chỉnh bảng cho mobile */
  .ant-table-thead > tr > th, 
  .ant-table-tbody > tr > td {
    padding: 8px 6px !important; /* Giảm padding để tiết kiệm chỗ */
    font-size: 13px !important;
  }
`;

export default function OrdersDelivered() {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Inject CSS styles khi component mount
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
    return () => document.head.removeChild(styleSheet);
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await API.get("orders/seller/complete/");
      setOrders(res.data);
      setFiltered(res.data);
    } catch (e) {
      message.error("Không thể tải đơn đã giao");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleSearch = (value) => {
    const lower = value.toLowerCase();
    setFiltered(
      orders.filter(
        (o) =>
          o.customer_name?.toLowerCase().includes(lower) ||
          o.customer_phone?.includes(lower) ||
          String(o.id).includes(lower)
      )
    );
  };

  const fetchOrderDetail = async (id) => {
    try {
      const res = await API.get(`orders/${id}/detail/`);
      setSelectedOrder(res.data);
      setIsModalVisible(true);
    } catch {
      message.error("Không thể tải chi tiết đơn hàng");
    }
  };

  // --- CẤU HÌNH CỘT (GIỮ NGUYÊN TẤT CẢ CỘT) ---
  const columns = [
    {
      title: "Mã đơn",
      dataIndex: "id",
      width: 60, // Chiều rộng cố định
      fixed: "left", // Ghim cột này bên trái để khi cuộn vẫn thấy
      align: "center",
      render: (id) => <strong style={{color: '#1890ff'}}>#{id}</strong>,
    },
    {
      title: "Khách hàng",
      width: 130, // Giới hạn chiều rộng để kích hoạt dấu ...
      align: "center",
      render: (_, r) => (
        // Dùng class text-truncate để cắt chữ nếu tên quá dài
        <div className="text-truncate" style={{ fontWeight: 600, width: 120, margin: '0 auto', textAlign: 'center' }} title={r.customer_name}>
          {r.customer_name}
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 100,
      align: "center",
      render: (s) => (
        <Tag color="green" style={{ margin: 0, fontSize: 11 }}>
          {s === "delivered" ? "Đã giao" : "Xong"}
        </Tag>
      ),
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_price",
      width: 110,
      align: "center",
      render: (v) => (
         <div className="text-truncate" style={{ fontWeight: "bold", color: "#52c41a", margin: '0 auto', textAlign: 'center' }}>
            {Number(v).toLocaleString()}đ
         </div>
      ),
    },
    {
      title: "Số Lượng", // Viết tắt Số lượng SP cho gọn header
      render: (_, o) => o.items?.length || 0,
      align: "center",
      width: 60,
    },
    {
      title: "Thời gian giao",
      dataIndex: "updated_at",
      width: 120,
      align: "center",
      render: (t, o) => {
        const time = t || o.delivered_at || o.created_at;
        if (!time) return "-";
        const date = new Date(time);
        return (
          // Cắt bớt nếu ngày quá dài, chỉ hiện ngày tháng năm
          <div className="text-truncate" style={{ fontSize: 12, color: "#666", margin: '0 auto', textAlign: 'center' }}>
            {date.toLocaleDateString("vi-VN")}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <OrdersBaseLayout
        title="ĐƠN HÀNG ĐÃ GIAO"
        loading={loading}
        data={filtered}
        columns={columns}
        onSearch={handleSearch}
        searchPlaceholder="Tìm tên, SĐT, mã..."
        // QUAN TRỌNG: scroll={{ x: 750 }} giúp bảng cuộn ngang trên màn hình nhỏ
        // 750 là tổng độ rộng ước lượng của các cột
        scroll={{ x: 750 }} 
        onRow={(record) => ({
          className: "order-item-row-hover",
          onClick: () => fetchOrderDetail(record.id),
        })}
      />

      {/* Modal chi tiết đơn - Responsive */}
      <Modal
        open={isModalVisible}
        title={`Đơn #${selectedOrder?.id}`}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width="96%" // Chiếm 96% màn hình điện thoại
        style={{ top: 20, maxWidth: 600, padding: 0 }}
        centered
      >
        {selectedOrder ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            <Descriptions bordered column={1} size="small" labelStyle={{width: 100, fontWeight: 600}}>
              <Descriptions.Item label="Khách hàng">
                {selectedOrder.user?.username || selectedOrder.customer_name}
              </Descriptions.Item>
              <Descriptions.Item label="SĐT">
                {selectedOrder.user?.phone || selectedOrder.customer_phone}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ">
                 <span style={{ fontSize: 12 }}>{selectedOrder.address}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color="green">
                  {selectedOrder.status === "delivered" ? "Đã giao" : "Hoàn thành"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tổng tiền">
                <span style={{color: '#16a34a', fontWeight: 'bold'}}>
                    {Number(selectedOrder.total_price).toLocaleString()}đ
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày giao">
                {selectedOrder.updated_at
                  ? new Date(selectedOrder.updated_at).toLocaleString("vi-VN")
                  : "-"}
              </Descriptions.Item>
            </Descriptions>

            {/* Bảng sản phẩm trong modal */}
            <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
              <Table
                dataSource={selectedOrder.items}
                pagination={false}
                rowKey={(item) => item.id}
                size="small"
                scroll={{ x: 400 }} // Cho phép cuộn ngang trong modal nếu cần
                columns={[
                  {
                    title: "SP",
                    width: 180,
                    render: (item) => (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {item.product_image && (
                          <img
                            src={item.product_image}
                            alt=""
                            style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover' }}
                          />
                        )}
                        {/* Tên sản phẩm cũng cắt nếu quá dài */}
                        <span className="text-truncate" style={{ width: 120 }}>
                            {item.product_name}
                        </span>
                      </div>
                    ),
                  },
                  {
                    title: "SL",
                    dataIndex: "quantity",
                    align: "center",
                    width: 50,
                  },
                  {
                    title: "Tiền",
                    align: "right",
                    width: 100,
                    render: (item) => (
                        <span style={{ fontSize: 12 }}>
                            {(Number(item.quantity) * Number(item.price)).toLocaleString()}đ
                        </span>
                    ),
                  },
                ]}
              />
            </div>
          </div>
        ) : (
           <div style={{ padding: 20, textAlign: 'center' }}>Đang tải dữ liệu...</div>
        )}
      </Modal>
    </>
  );
}