import React, { useState, useEffect } from "react";
import { message, Tag } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import API from "../../../login_register/services/api";
import GenericOrderTable from "../../components/OrderSeller/GenericOrderTable"; // Đường dẫn file vừa tạo
import ButtonAction from "../../../../components/ButtonAction"; // Đường dẫn file ButtonAction bạn cung cấp

export default function OrdersNew() {
  const queryClient = useQueryClient();
  const [tick, setTick] = useState(0);

  // Ticker để update thời gian realtime
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000); // Update mỗi phút cho nhẹ
    return () => clearInterval(interval);
  }, []);

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ["sellerOrders", "pending"],
    queryFn: async () => (await API.get("orders/seller/pending/")).data.sort((a, b) => b.id - a.id),
    refetchInterval: 15000,
  });

  const approveMutation = useMutation({
    mutationFn: (id) => API.post(`orders/${id}/seller/approve/`),
    onSuccess: () => {
      message.success("Đã duyệt đơn hàng");
      queryClient.invalidateQueries(["sellerOrders", "pending"]);
    },
    onError: () => message.error("Lỗi khi duyệt đơn"),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => API.post(`orders/${id}/cancel/`),
    onSuccess: () => {
      message.success("Đã từ chối đơn hàng");
      queryClient.invalidateQueries(["sellerOrders", "pending"]);
    },
    onError: () => message.error("Lỗi thao tác"),
  });

  // Logic hiển thị thời gian trôi qua
  const getTimeInfo = (createdAt) => {
    if (!createdAt) return { text: "-", color: "#999" };
    const diffMs = new Date() - new Date(createdAt);
    const diffMins = Math.floor(diffMs / 60000);
    
    let color = "#52c41a"; // Xanh (mới)
    if (diffMins > 30) color = "#faad14"; // Vàng (hơi lâu)
    if (diffMins > 60) color = "#ff4d4f"; // Đỏ (quá lâu)

    let text = diffMins < 60 ? `${diffMins} phút trước` : `${Math.floor(diffMins/60)} giờ trước`;
    return { text, color };
  };

  // Cột custom cho trang New
  const extraColumns = [
    {
      title: "Thời gian chờ",
      dataIndex: "created_at",
      width: 120,
      align: "center",
      render: (t) => {
        const { text, color } = getTimeInfo(t);
        return <Tag color="default" style={{ color: color, borderColor: color, fontWeight: 600 }}>{text}</Tag>;
      }
    }
  ];

  return (
    <GenericOrderTable
      title="ĐƠN HÀNG MỚI"
      isLoading={isLoading}
      data={orders}
      extraColumns={extraColumns}
      refetch={refetch}
      actionsRenderer={(record) => (
        <ButtonAction
          record={record}
          actions={[
            {
              actionType: "approve",
              tooltip: "Duyệt đơn này",
              icon: <CheckCircleOutlined />,
              confirm: { title: "Duyệt đơn hàng?", okText: "Duyệt ngay" },
              onClick: (r) => approveMutation.mutate(r.id),
              buttonProps: { loading: approveMutation.isPending && approveMutation.variables === record.id }
            },
            {
              actionType: "reject",
              tooltip: "Từ chối đơn",
              icon: <CloseCircleOutlined />,
              confirm: { title: "Từ chối đơn hàng?", isDanger: true, okText: "Từ chối" },
              onClick: (r) => cancelMutation.mutate(r.id),
              buttonProps: { loading: cancelMutation.isPending && cancelMutation.variables === record.id }
            }
          ]}
        />
      )}
    />
  );
}