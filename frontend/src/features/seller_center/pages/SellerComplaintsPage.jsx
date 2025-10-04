import React, { useState, useEffect } from "react";
import { Table, Tag, Space, Button, Modal, message, InputNumber, Typography, Radio, Input } from "antd";

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

// Helpers for media preview
function isImageUrl(url) {
  if (!url) return false;
  // Nếu có đuôi ảnh phổ biến thì là ảnh
  if (/\.(jpg|jpeg|png|gif|webp)$/i.test(url)) return true;
  // Nếu có đuôi video phổ biến thì là video
  if (/\.(mp4|mov|avi|wmv|webm)$/i.test(url)) return false;
  // Nếu không có đuôi, thử đoán: nếu không phải video thì là ảnh
  return true;
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
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const [approveModal, setApproveModal] = useState({
    open: false,
    record: null,
    method: "refund_full",
    amount: 0,
    note: "",
  });

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailComplaint, setDetailComplaint] = useState(null);

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

  // Từ chối 1 khiếu nại
  const handleReject = async (id) => {
    Modal.confirm({
      title: "Xác nhận từ chối khiếu nại?",
      onOk: async () => {
        try {
          const res = await fetch(`http://localhost:8000/api/complaints/${id}/`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: "rejected" }),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          message.success("Đã từ chối khiếu nại!");
          fetchComplaints();
        } catch (e) {
          message.error("Lỗi khi cập nhật!");
        }
      },
    });
  };

  // Xử lý tất cả khiếu nại đã chọn
  const handleResolveAll = async () => {
    Modal.confirm({
      title: `Xác nhận xử lý ${selectedRowKeys.length} khiếu nại?`,
      onOk: async () => {
        try {
          const token = localStorage.getItem("token");
          await Promise.all(
            selectedRowKeys.map((id) =>
              fetch(`http://localhost:8000/api/complaints/${id}/`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: "resolved" }),
              })
            )
          );
          message.success(`Đã xử lý ${selectedRowKeys.length} khiếu nại!`);
          setSelectedRowKeys([]);
          fetchComplaints();
        } catch (err) {
          message.error("Lỗi khi cập nhật hàng loạt!");
        }
      },
    });
  };

  // Từ chối tất cả khiếu nại đã chọn
  const handleRejectAll = async () => {
    Modal.confirm({
      title: `Xác nhận từ chối ${selectedRowKeys.length} khiếu nại?`,
      onOk: async () => {
        try {
          const token = localStorage.getItem("token");
          await Promise.all(
            selectedRowKeys.map((id) =>
              fetch(`http://localhost:8000/api/complaints/${id}/`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: "rejected" }),
              })
            )
          );
          message.success(`Đã từ chối ${selectedRowKeys.length} khiếu nại!`);
          setSelectedRowKeys([]);
          fetchComplaints();
        } catch (err) {
          message.error("Lỗi khi từ chối hàng loạt!");
        }
      },
    });
  };

  // Chuyển trạng thái về pending
  const handleResetPending = async (id) => {
    Modal.confirm({
      title: "Xác nhận chuyển khiếu nại về trạng thái chờ xử lý?",
      onOk: async () => {
        try {
          const res = await fetch(`http://localhost:8000/api/complaints/${id}/`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: "pending" }),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          message.success("Đã chuyển về trạng thái chờ xử lý!");
          fetchComplaints();
        } catch (e) {
          message.error("Lỗi khi cập nhật!");
        }
      },
    });
  };

  const resolveComplaint = async (record, resolution_type, amount, note) => {
    try {
      const body = { resolution_type };
      if (resolution_type === "refund_partial") body.amount = amount;
      if (note) body.note = note;

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
      if (resolution_type === "replace") title = "Đổi sản phẩm";

      let extra = "";
      if (resolution_type === "refund_full") {
        const amt = computeFullRefundAmount(record);
        extra = ` - Số tiền: ${formatVND(amt)}`;
      } else if (resolution_type === "refund_partial") {
        extra = ` - Số tiền: ${formatVND(amount)}`;
      }

      const noteText = note ? `\nGhi chú: ${note}` : "";
      pushNotification({
        type: "complaint",
        title,
        message: `#${record.id} - ${record.product_name || "Sản phẩm"} - ${record.user_name || "Khách hàng"}${extra}${noteText}`,
      });

      message.success(`Đã cập nhật khiếu nại #${record.id}`);
    } catch (e) {
      console.error(e);
      message.error(`Cập nhật thất bại: ${e.message}`);
    }
  };

  const columns = [
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
      width: 320,
      render: (_, record) => (
        <Space>
          <Button onClick={() => { setDetailComplaint(record); setDetailModalVisible(true); }}>
            Xem chi tiết
          </Button>
          {record.status === "pending" ? (
            <>
              <Button
                type="primary"
                onClick={() => setApproveModal({ open: true, record, method: "refund_full", amount: 0, note: "" })}
              >
                Duyệt
              </Button>
              <Button danger onClick={() => handleReject(record.id)}>
                Không duyệt
              </Button>
            </>
          ) : (
            <Button onClick={() => handleResetPending(record.id)}>
              Hoàn tất
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Quản lý Khiếu nại</h2>
      <div style={{ marginBottom: 16 }}>
        <Button
          onClick={fetchComplaints}
          loading={loading}
          style={{ marginRight: 8 }}
        >
          Làm mới
        </Button>
        {selectedRowKeys.length >= 2 && (
          <>
            <Button
              type="primary"
              onClick={handleResolveAll}
              style={{ marginRight: 8 }}
            >
              Xử lý tất cả ({selectedRowKeys.length})
            </Button>
            <Button danger onClick={handleRejectAll}>
              Từ chối tất cả ({selectedRowKeys.length})
            </Button>
          </>
        )}
      </div>
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={complaints}
        pagination={{ pageSize: 10 }}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
      />

      {/* Modal duyệt xử lý khiếu nại */}
      <Modal
        title={`Duyệt khiếu nại #${approveModal.record?.id || ""}`}
        open={approveModal.open}
        onCancel={() => setApproveModal({ open: false, record: null, method: "refund_full", amount: 0, note: "" })}
        onOk={() => {
          const { method, amount, record, note } = approveModal;
          if (method === "refund_partial") {
            if (!amount || amount <= 0) {
              message.warning("Nhập số tiền hợp lệ");
              return;
            }
            resolveComplaint(record, method, amount, note).finally(() =>
              setApproveModal({ open: false, record: null, method: "refund_full", amount: 0, note: "" })
            );
          } else {
            resolveComplaint(record, method, undefined, note).finally(() =>
              setApproveModal({ open: false, record: null, method: "refund_full", amount: 0, note: "" })
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

          {/* Ghi chú chung */}
          <div className="mt-3">Ghi chú</div>
          <Input.TextArea
            rows={3}
            placeholder="Nhập ghi chú cho quyết định xử lý"
            value={approveModal.note}
            onChange={(e) => setApproveModal((s) => ({ ...s, note: e.target.value }))}
          />
        </div>
      </Modal>

      {/* Modal xem chi tiết khiếu nại */}
      <Modal
        title={`Chi tiết khiếu nại #${detailComplaint?.id ?? ""}`}
        open={detailModalVisible}
        footer={null}
        onCancel={() => setDetailModalVisible(false)}
        width={700}
      >
        {detailComplaint ? (
          <div style={{ display: "grid", gap: 8 }}>
            <div>
              <Text strong>Người dùng:</Text> <span>{detailComplaint.user_name || detailComplaint.user || "—"}</span>
            </div>
            <div>
              <Text strong>Sản phẩm:</Text> <span>{detailComplaint.product_name || "—"}</span>
            </div>
            <div>
              <Text strong>Số lượng:</Text> <span>{detailComplaint.quantity ?? 1}</span>
            </div>
            <div>
              <Text strong>Đơn giá (khi mua):</Text> <span>{formatVND(detailComplaint.unit_price ?? detailComplaint.product_price ?? 0)}</span>
            </div>
            <div>
              <Text strong>Lý do:</Text>
              <div style={{ whiteSpace: "pre-wrap" }}>{detailComplaint.reason || "—"}</div>
            </div>
            <div>
              <Text strong>Trạng thái:</Text>{" "}
              <Tag color={detailComplaint.status === 'resolved' ? 'green' : detailComplaint.status === 'rejected' ? 'red' : 'orange'}>
                {detailComplaint.status === 'pending' ? 'Chờ xử lý' : detailComplaint.status === 'resolved' ? 'Đã xử lý' : 'Đã từ chối'}
              </Tag>
            </div>
            <div>
              <Text strong>Ngày tạo:</Text>{" "}
              <span>{detailComplaint.created_at ? new Date(detailComplaint.created_at).toLocaleString('vi-VN') : ''}</span>
            </div>

            {/* Media preview nếu có */}
            {Array.isArray(detailComplaint.media_urls) && detailComplaint.media_urls.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <Text strong>Minh chứng:</Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {detailComplaint.media_urls.map((url, idx) => (
                    <div key={idx} style={{ border: '1px solid #eee', padding: 4, borderRadius: 4 }}>
                      {isImageUrl(url) ? (
                        <img src={url} alt={`evidence-${idx}`} style={{ width: 160, height: 120, objectFit: 'cover' }} />
                      ) : (
                        <video src={url} controls style={{ width: 220, height: 120, background: '#000' }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
