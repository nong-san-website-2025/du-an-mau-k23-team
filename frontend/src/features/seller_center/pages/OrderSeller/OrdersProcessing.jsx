import React, { useState, useEffect } from "react";
import { message } from "antd";
import { CarOutlined, StopOutlined } from "@ant-design/icons";
import API from "../../../login_register/services/api";
import GenericOrderTable from "../../components/OrderSeller/GenericOrderTable";
import ButtonAction from "../../../../components/ButtonAction";

export default function OrdersProcessing() {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await API.get("orders/seller/processing/");
      setOrders(res.data);
    } catch {
      message.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleAction = async (id, actionType) => {
    try {
      const endpoint = actionType === 'complete' ? `orders/${id}/seller/complete/` : `orders/${id}/cancel/`;
      await API.post(endpoint);
      message.success(actionType === 'complete' ? "Giao hàng thành công!" : "Đã hủy đơn!");
      fetchOrders(); // Reload lại bảng
    } catch {
      message.error("Có lỗi xảy ra");
    }
  };

  return (
    <GenericOrderTable
      title="ĐƠN ĐANG XỬ LÝ"
      isLoading={loading}
      data={orders}
      actionsRenderer={(record) => (
        <ButtonAction
          record={record}
          actions={[
            {
              actionType: "approve", // Tái sử dụng màu xanh lá
              tooltip: "Xác nhận đã giao hàng",
              icon: <CarOutlined />,
              confirm: { title: "Xác nhận đơn đã giao thành công?", okText: "Hoàn thành" },
              onClick: (r) => handleAction(r.id, 'complete'),
              // Ẩn nút nếu đang shipping (logic ví dụ)
              show: record.status !== 'shipping' 
            },
            {
              actionType: "delete",
              tooltip: "Hủy đơn hàng",
              icon: <StopOutlined />,
              confirm: { title: "Hủy đơn hàng đang xử lý?", isDanger: true },
              onClick: (r) => handleAction(r.id, 'cancel'),
            }
          ]}
        />
      )}
    />
  );
}