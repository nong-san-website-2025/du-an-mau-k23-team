import React, { useState, useEffect, useMemo } from "react";
import { Table, message } from "antd";
import API from "../../../login_register/services/api";
import OrdersBaseLayout from "../../components/OrderSeller/OrdersBaseLayout";
import StatusTag from "../../../../components/StatusTag"; 
import OrderDetailModal from "../OrderSeller/OrderDetailModal";

// Inject CSS
const styles = `
  .text-truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; max-width: 100%; }
  .order-item-row-hover:hover { cursor: pointer; background-color: #fafafa; }
  .ant-table-cell { font-size: 13px; }
`;

// Map trạng thái sang tiếng Việt cho bộ lọc
const STATUS_LABEL_MAP = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  processing: "Đang xử lý",
  shipping: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
  shipped: "Đã gửi hàng",
};

export default function GenericOrderTable({
  title,
  isLoading,
  data = [],
  actionsRenderer,
  extraColumns = [],
  refetch,
}) {
  const [filtered, setFiltered] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Inject CSS
  useEffect(() => {
    if (!document.getElementById("order-table-style")) {
      const styleSheet = document.createElement("style");
      styleSheet.id = "order-table-style";
      styleSheet.innerText = styles;
      document.head.appendChild(styleSheet);
    }
  }, []);

  // Sync data
  useEffect(() => {
    setFiltered(data);
  }, [data]);

  // --- LOGIC TẠO BỘ LỌC TỰ ĐỘNG ---
  // Memoize để không tính toán lại mỗi khi render nếu data không đổi
  const statusFilters = useMemo(() => {
    // 1. Lấy tất cả các status unique có trong data hiện tại
    const uniqueStatuses = [...new Set(data.map((item) => item.status))];
    
    // 2. Map sang format của Ant Design Column Filter
    return uniqueStatuses.map((status) => ({
      text: STATUS_LABEL_MAP[status] || status, // Fallback nếu không có trong map
      value: status,
    }));
  }, [data]);

  const handleSearch = (value) => {
    const lower = value.toLowerCase();
    setFiltered(
      data.filter(
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

  // Cấu hình cột
  const baseColumns = [
    {
      title: "Mã đơn",
      dataIndex: "id",
      width: 90,
      fixed: "left",
      align: "center",
      sorter: (a, b) => a.id - b.id, // ✅ Thêm sắp xếp theo ID
      render: (id) => <strong style={{ color: "#1890ff" }}>#{id}</strong>,
    },
    {
      title: "Khách hàng",
      width: 170,
      // Với cột tên, ta dùng thanh Search tổng ở trên Layout sẽ tiện hơn Filter cột
      render: (_, r) => (
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontWeight: 600 }} className="text-truncate" title={r.customer_name}>
            {r.customer_name}
          </div>
          <small style={{ color: "#888" }}>{r.customer_phone || r.user?.phone}</small>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 130,
      align: "center",
      filters: statusFilters, // ✅ Gắn bộ lọc tự động
      onFilter: (value, record) => record.status === value, // ✅ Logic lọc
      render: (status) => <StatusTag status={status} type="order" />,
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_price",
      width: 130,
      align: "right",
      sorter: (a, b) => Number(a.total_price) - Number(b.total_price), // ✅ Thêm sắp xếp theo tiền
      render: (v) => (
        <strong style={{ color: "#52c41a" }}>{Number(v).toLocaleString()}đ</strong>
      ),
    },
    ...extraColumns, 
    {
      title: "Hành động",
      key: "actions",
      width: 180,
      fixed: "right",
      align: "center",
      render: (_, record) => actionsRenderer ? actionsRenderer(record) : null,
    },
  ];

  return (
    <>
      <OrdersBaseLayout
        title={title}
        loading={isLoading}
        data={filtered}
        columns={baseColumns}
        onSearch={handleSearch}
        searchPlaceholder="Tìm tên, SĐT, mã đơn..."
        scroll={{ x: 900 }} // Tăng nhẹ scroll x để bảng thoáng hơn
        onRow={(record) => ({
          className: "order-item-row-hover",
          onClick: () => fetchOrderDetail(record.id),
        })}
      />

      <OrderDetailModal 
        order={selectedOrder} 
        visible={isModalVisible} 
        onClose={() => setIsModalVisible(false)} 
      />
    </>
  );
}