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

// --- 1. CSS TÙY CHỈNH (Nhúng trực tiếp để chạy ngay) ---
const styles = `
  /* Class cắt chữ và thêm dấu ... */
  .text-truncate {
    white-space: nowrap; 
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
    width: 100%;
  }

  /* Tối ưu padding cho bảng trên mobile */
  .ant-table-thead > tr > th, 
  .ant-table-tbody > tr > td {
    padding: 10px 8px !important;
    font-size: 13px !important;
  }
`;

export default function OrdersCancelled() {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Inject CSS khi component chạy
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
    return () => document.head.removeChild(styleSheet);
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await API.get("orders/seller/cancelled/");
      setOrders(res.data);
      setFiltered(res.data);
    } catch (e) {
      message.error("Không thể tải đơn đã hủy");
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

  // --- 2. CẤU HÌNH CỘT (Đủ 6 cột) ---
  const columns = [
    {
      title: "Mã đơn",
      dataIndex: "id",
      width: 60, 
      fixed: "left", // Cố định cột này bên trái
      align: "center",
      render: (id) => <strong style={{color: '#1890ff'}}>#{id}</strong>,
    },
    {
      title: "Khách hàng",
      width: 140, // Giới hạn chiều rộng để kích hoạt dấu ...
      align: "center",
      render: (_, r) => (
        <div style={{ maxWidth: 130, margin: '0 auto', textAlign: 'center' }}>
            {/* Tên khách hàng: Cắt nếu quá dài */}
            <div className="text-truncate" style={{ fontWeight: 600 }}>
                {r.customer_name}
            </div>
            <div style={{ fontSize: 11, color: "#666" }}>{r.customer_phone}</div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 90,
      align: "center",
      render: (s) => (
        <Tag color="red" style={{ margin: 0, fontSize: 10 }}>
          {s === "cancelled" ? "Đã hủy" : s}
        </Tag>
      ),
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_price",
      width: 110,
      align: "center",
      render: (v) => <strong style={{color: '#cf1322'}}>{Number(v).toLocaleString()}đ</strong>,
    },
    {
      title: "Số Lượng", // Viết tắt cho gọn
      render: (_, o) => o.items?.length || 0,
      align: "center",
      width: 50,
    },
    {
      title: "Thời Gian Hủy", // Thời gian hủy
      dataIndex: "updated_at",
      width: 110, // Giới hạn width để ép xuống dòng hoặc cắt bớt
      align: "center",
      render: (t, o) => {
        const time = t || o.cancelled_at || o.created_at;
        if (!time) return "-";
        const date = new Date(time);
        return (
          // Class này sẽ biến ngày dài thành "12/12/20..." nếu thiếu chỗ
          <div className="text-truncate" style={{ fontSize: 12, color: "#666", margin: '0 auto', textAlign: 'center' }}>
            {date.toLocaleDateString("vi-VN")} {date.toLocaleTimeString("vi-VN", {hour: '2-digit', minute:'2-digit'})}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <OrdersBaseLayout
        title="ĐƠN ĐÃ HỦY"
        loading={loading}
        data={filtered}
        columns={columns}
        onSearch={handleSearch}
        onRefresh={fetchOrders}
        searchPlaceholder="Tìm kiếm..."
        // --- 3. QUAN TRỌNG: scroll x=900 kích hoạt trượt ngang ---
        scroll={{ x: 900 }} 
        onRow={(record) => ({
          className: "order-item-row-hover",
          onClick: () => fetchOrderDetail(record.id),
        })}
      />

      {/* Modal chi tiết đơn - Responsive */}
      <Modal
        open={isModalVisible}
        title={`Đơn hủy #${selectedOrder?.id}`}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width="96%" // Modal rộng 96% màn hình điện thoại
        style={{ top: 20, maxWidth: 600, padding: 0 }}
        centered
      >
        {selectedOrder ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            <Descriptions bordered column={1} size="small" labelStyle={{width: 110, fontWeight: 600}}>
              <Descriptions.Item label="Khách hàng">
                {selectedOrder.user?.username || selectedOrder.customer_name}
              </Descriptions.Item>
              <Descriptions.Item label="SĐT">
                {selectedOrder.user?.phone || selectedOrder.customer_phone}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ">
                 <span style={{ fontSize: 12 }}>{selectedOrder.address}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Lý do/Trạng thái">
                <Tag color="red">Đã hủy</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Thời gian hủy">
                {selectedOrder.updated_at
                  ? new Date(selectedOrder.updated_at).toLocaleString("vi-VN")
                  : "-"}
              </Descriptions.Item>
            </Descriptions>

            {/* Bảng sản phẩm bên trong Modal */}
            <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
              <Table
                dataSource={selectedOrder.items}
                pagination={false}
                rowKey={(item) => item.id}
                size="small"
                scroll={{ x: 400 }} // Cho phép bảng trong modal cuộn nếu cần
                columns={[
                  {
                    title: "Sản phẩm",
                    render: (item) => (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {item.product_image && (
                          <img
                            src={item.product_image}
                            alt=""
                            style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover' }}
                          />
                        )}
                        {/* Cắt tên sản phẩm nếu quá dài */}
                        <span className="text-truncate" style={{ maxWidth: 140, fontWeight: 500 }}>
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
                    width: 90,
                    render: (item) => (
                        <span style={{ fontSize: 12 }}>
                            {(Number(item.quantity) * Number(item.price)).toLocaleString()}
                        </span>
                    ),
                  },
                ]}
              />
            </div>
            
            <div style={{ textAlign: 'right', marginTop: 5, color: '#cf1322', fontWeight: 'bold', fontSize: 16 }}>
                Tổng mất: {Number(selectedOrder.total_price).toLocaleString()}đ
            </div>
          </div>
        ) : (
           <div style={{ padding: 20, textAlign: 'center' }}>Đang tải...</div>
        )}
      </Modal>
    </>
  );
}