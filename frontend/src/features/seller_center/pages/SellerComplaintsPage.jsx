import React, { useState, useEffect } from "react";
import { Table, Tag, Space, Button, Modal, message, InputNumber, Typography, Radio } from "antd";

const { Text } = Typography;

// Helpers for currency and amount calculations
function toNumber(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}
function formatVND(value) {
  try {
    const n = Math.round(toNumber(value));
    return n.toLocaleString("vi-VN") + " ₫";
  } catch {
    return String(value);
  }
}
function computeFullRefundAmount(rec) {
  if (!rec) return 0;
  const q = toNumber(rec?.quantity || 1);
  const unit = toNumber(rec?.unit_price ?? rec?.discounted_price ?? rec?.product_price ?? 0);
  return q * unit;
}

// Simple local notification helper using localStorage
function pushNotification(notif) {
  try {
    const key = "notifications";
    const arr = JSON.parse(localStorage.getItem(key) || "[]");
    const item = {
      id: Date.now(),
      type: notif.type || "complaint",
      title: notif.title || "Thông báo",
      message: notif.message || "",
      created_at: new Date().toISOString(),
      read: false,
    };
    arr.unshift(item);
    // keep last 50
    localStorage.setItem(key, JSON.stringify(arr.slice(0, 50)));
    // Let any badge/dropdown listen and update
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("notifications_updated"));
    }
  } catch (e) {
    // ignore
  }
}

export default function SellerComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);

  const [partialModal, setPartialModal] = useState({ open: false, record: null, amount: 0 });
  const [approveModal, setApproveModal] = useState({ open: false, record: null, method: "refund_full", amount: 0 });

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:8000/api/complaints/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setComplaints(data);
    } catch (e) {
      console.error(e);
      message.error("Không thể tải danh sách khiếu nại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchComplaints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const updateRow = (updated) => {
    setComplaints((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const resolveComplaint = async (record, resolution_type, amount) => {
    try {
      const body = { resolution_type };
      if (resolution_type === "refund_partial") body.amount = amount;

      const res = await fetch(`http://localhost:8000/api/complaints/${record.id}/resolve/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      updateRow(data);

      // Push a notification for the complaint action
      let title = "Khiếu nại đã xử lý";
      if (resolution_type === "reject") title = "Khiếu nại bị từ chối";
      if (resolution_type === "refund_full") title = "Hoàn tiền đầy đủ";
      if (resolution_type === "refund_partial") title = "Hoàn tiền một phần";

      let extra = "";
      if (resolution_type === "refund_full") {
        const amt = computeFullRefundAmount(record);
        extra = ` - Số tiền: ${formatVND(amt)}`;
      } else if (resolution_type === "refund_partial") {
        extra = ` - Số tiền: ${formatVND(amount)}`;
      }

      pushNotification({
        type: "complaint",
        title,
        message: `#${record.id} - ${record.product_name || "Sản phẩm"} - ${record.user_name || "Khách hàng"}${extra}`,
      });

      message.success(`Đã cập nhật khiếu nại #${record.id}`);
    } catch (e) {
      console.error(e);
      message.error(`Cập nhật thất bại: ${e.message}`);
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 80 },
    { title: "Người gửi", dataIndex: "user_name", key: "user_name", width: 160 },
    { title: "Sản phẩm", dataIndex: "product_name", key: "product_name", width: 220 },
    {
      title: "Nội dung",
      dataIndex: "reason",
      key: "reason",
      render: (t) => <Text ellipsis={{ tooltip: t }} style={{ maxWidth: 360, display: "inline-block" }}>{t}</Text>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status) => {
        const vi = {
          pending: "Chờ xử lý",
          resolved: "Đã xử lý",
          rejected: "Đã từ chối",
        };
        let color = "blue";
        if (status === "resolved") color = "green";
        if (status === "rejected") color = "red";
        return <Tag color={color}>{vi[status] || "Không xác định"}</Tag>;
      },
    },
    {
      title: "Thời gian",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      render: (t) => new Date(t).toLocaleString("vi-VN"),
    },
    {
      title: "Hành động",
      key: "action",
      width: 260,
      render: (_, record) => (
        <Space>
          <Button type="primary" onClick={() => setApproveModal({ open: true, record, method: "refund_full", amount: 0 })}>Duyệt</Button>
          <Button danger onClick={() => resolveComplaint(record, "reject")}>
            Không
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Quản lý Khiếu nại</h2>
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={complaints}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={`Duyệt khiếu nại #${approveModal.record?.id || ""}`}
        open={approveModal.open}
        onCancel={() => setApproveModal({ open: false, record: null, method: "refund_full", amount: 0 })}
        onOk={() => {
          const { method, amount, record } = approveModal;
          if (method === "refund_partial") {
            if (!amount || amount <= 0) {
              message.warning("Nhập số tiền hợp lệ");
              return;
            }
            resolveComplaint(record, method, amount).finally(() =>
              setApproveModal({ open: false, record: null, method: "refund_full", amount: 0 })
            );
          } else {
            resolveComplaint(record, method).finally(() =>
              setApproveModal({ open: false, record: null, method: "refund_full", amount: 0 })
            );
          }
        }}
        okText="Xác nhận"
        cancelText="Hủy"
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <div className="mb-2">Hình thức xử lý</div>
            <Radio.Group
              value={approveModal.method}
              onChange={(e) => setApproveModal((s) => ({ ...s, method: e.target.value }))}
            >
              <Space direction="vertical">
                <Radio value="refund_full">Hoàn tiền sản phẩm (đầy đủ)</Radio>
                <Radio value="refund_partial">Hoàn tiền một phần</Radio>
                <Radio value="replace">Đổi sản phẩm</Radio>
                <Radio value="voucher">Tặng voucher</Radio>
                <Radio value="reject">Từ chối khiếu nại</Radio>
              </Space>
            </Radio.Group>
          </div>

          {approveModal.method === "refund_partial" && (
            <div>
              <div className="mb-2">Số tiền hoàn (VNĐ)</div>
              <InputNumber
                min={1000}
                step={1000}
                style={{ width: "100%" }}
                value={approveModal.amount}
                onChange={(v) => setApproveModal((s) => ({ ...s, amount: v || 0 }))}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(value) => String(value ?? "").replace(/\s|,/g, "")}
              />
            </div>
          )}

          {approveModal.method === "refund_full" && (
            <div>
              <div className="mb-2">Số tiền hoàn (đầy đủ)</div>
              <div><Text strong>{formatVND(computeFullRefundAmount(approveModal.record))}</Text></div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}