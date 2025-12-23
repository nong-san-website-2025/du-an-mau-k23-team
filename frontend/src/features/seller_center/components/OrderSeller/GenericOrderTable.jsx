import React, { useState, useEffect, useMemo } from "react";
import { Table, message, Grid } from "antd";
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

// Weight maps for meaningful sorting
const PAYMENT_SORT_WEIGHT = {
  paid: 3,
  unpaid: 2,
  refunded: 1,
};

const ORDER_SORT_WEIGHT = {
  pending: 1,
  approved: 2,
  processing: 3,
  shipped: 4,
  shipping: 5,
  delivered: 6,
  cancelled: 0,
  rejected: -1,
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
  const { useBreakpoint } = Grid;
  const screens = useBreakpoint();
  const isMobile = !screens.md;

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
      width: 80,
      fixed: isMobile ? undefined : "left",
      align: "center",
      sorter: (a, b) => Number(a.id) - Number(b.id),
      sortDirections: ["ascend", "descend"],
      render: (id) => <strong style={{ color: "#1890ff" }}>#{id}</strong>,
    },
    {
      title: "Thời gian đặt", // ✅ Cột mới
      dataIndex: "created_at_formatted", // Backend đã format sẵn "14:30 20/12/2025"
      width: isMobile ? 120 : 140,
      align: "center",
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      sortDirections: ["ascend", "descend"],
      render: (text) => <span style={{ fontSize: '13px', color: '#555' }}>{text}</span>
    },
    {
      title: "Khách hàng",
      width: isMobile ? 150 : 170,
      sorter: (a, b) => (a.customer_name || "").localeCompare(b.customer_name || "", "vi", { sensitivity: "base" }),
      sortDirections: ["ascend", "descend"],
      render: (_, r) => (
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontWeight: 600 }} className="text-truncate" title={r.customer_name}>
            {r.customer_name}
          </div>
          <small style={{ color: "#888" }}>{r.customer_phone}</small>
        </div>
      ),
    },
    {
        title: "Thanh toán", // ✅ Cột mới
        dataIndex: "payment_status",
        width: isMobile ? 120 : 130,
        align: "center",
        sorter: (a, b) =>
          (PAYMENT_SORT_WEIGHT[a.payment_status] || 0) - (PAYMENT_SORT_WEIGHT[b.payment_status] || 0),
        sortDirections: ["ascend", "descend"],
        render: (status) => {
            // Mapping màu sắc badge (Bạn có thể tách ra component riêng)
            let color = 'default';
            let text = 'Chưa TT';
            if (status === 'paid') { color = 'success'; text = 'Đã TT'; }
            if (status === 'unpaid') { color = 'warning'; text = 'Chưa TT'; }
            if (status === 'refunded') { color = 'error'; text = 'Hoàn tiền'; }
            
            // Dùng Badge của Antd hoặc Component StatusTag của bạn
            return <StatusTag status={status} type="payment" />; 
        }
    },
    {
      title: "Vận đơn", // Đổi tên cột status cũ thành Vận đơn
      dataIndex: "status",
      width: isMobile ? 120 : 130,
      align: "center",
      filters: statusFilters,
      onFilter: (value, record) => record.status === value,
      sorter: (a, b) => (ORDER_SORT_WEIGHT[a.status] ?? 0) - (ORDER_SORT_WEIGHT[b.status] ?? 0),
      sortDirections: ["ascend", "descend"],
      render: (status) => <StatusTag status={status} type="order" />,
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_price", // Đã fix ở serializer để luôn trả về string số
      width: isMobile ? 120 : 130,
      align: "right",
      sorter: (a, b) => Number(a.total_price) - Number(b.total_price),
      sortDirections: ["ascend", "descend"],
      render: (v) => (
        <strong style={{ color: "#d4380d" }}>
            {Number(v).toLocaleString('vi-VN')}đ
        </strong>
      ),
    },
    ...extraColumns, 
    {
      title: "Hành động",
      key: "actions",
      width: isMobile ? 150 : 180,
      fixed: isMobile ? undefined : "right",
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
        onRefresh={refetch}
        searchPlaceholder="Tìm tên, SĐT, mã đơn..."
        scroll={{ x: isMobile ? 850 : 900 }} // Tăng nhẹ scroll x để bảng thoáng hơn
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