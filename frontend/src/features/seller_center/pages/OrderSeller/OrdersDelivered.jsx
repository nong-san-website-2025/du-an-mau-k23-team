import React, { useState, useEffect } from "react";
import API from "../../../login_register/services/api";
import GenericOrderTable from "../../components/OrderSeller/GenericOrderTable";

export default function OrdersDelivered() {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await API.get("orders/seller/complete/");
        setOrders(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Trang này không cần render cột Action, GenericOrderTable sẽ tự ẩn nếu không truyền actionsRenderer
  // Hoặc nếu muốn hiển thị nút "Xem", bạn có thể truyền vào.
  
  return (
    <GenericOrderTable
      title="LỊCH SỬ ĐƠN HÀNG"
      isLoading={loading}
      data={orders}
      // Thêm cột ngày giao xong
      extraColumns={[
        {
          title: "Hoàn tất vào",
          dataIndex: "updated_at",
          width: 140,
          align: "center",
          render: (t) => <span style={{color: '#666', fontSize: 12}}>{new Date(t).toLocaleDateString("vi-VN")}</span>
        }
      ]}
    />
  );
}