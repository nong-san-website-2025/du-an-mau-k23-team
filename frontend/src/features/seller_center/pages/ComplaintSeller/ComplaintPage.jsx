import React, { useState, useEffect } from "react";
import { Button, message, Modal, Space, Tag, Typography } from "antd";
import ComplaintTable from "../../components/ComplaintSeller/ComplaintTable";
import ApproveModal from "../../components/ComplaintSeller/ApproveModal";
import DetailModal from "../../components/ComplaintSeller/DetailModal";
import BulkActionButtons from "../../components/ComplaintSeller/BulkActionButtons";
import {
  formatVND,
  computeFullRefundAmount,
  pushNotification,
} from "../../../../utils/complaintHelpers";
import moment from "moment";

export default function ComplaintPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtered, setFiltered] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const [approveModal, setApproveModal] = useState({
    open: false,
    record: null,
    method: "refund_full",
    amount: 0,
    note: "",
  });

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailComplaint, setDetailComplaint] = useState(null);

  /* ===== fetch data ===== */
  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/complaints/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setComplaints(data);
      setFiltered(data);
    } catch (e) {
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

  /* ===== search ===== */
  const handleSearch = (kw) => {
    const lower = kw.toLowerCase();
    setFiltered(
      complaints.filter(
        (c) =>
          c.complainant_name?.toLowerCase().includes(lower) ||
          c.product_name?.toLowerCase().includes(lower) ||
          String(c.id).includes(lower)
      )
    );
  };

  /* ===== CRUD / actions ===== */
  const updateRow = (updated) =>
    setComplaints((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );

  const resolveComplaint = async (record, resolution_type, amount, note) => {
    try {
      const body = { resolution_type };
      if (resolution_type === "refund_partial") body.amount = amount;
      if (note) body.note = note;

      const res = await fetch(
        `http://localhost:8000/api/complaints/${record.id}/resolve/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      updateRow(data);

      let title = "Khiếu nại đã xử lý";
      if (resolution_type === "reject") title = "Khiếu nại bị từ chối";
      if (resolution_type === "refund_full") title = "Hoàn tiền đầy đủ";
      if (resolution_type === "refund_partial") title = "Hoàn tiền một phần";
      if (resolution_type === "replace") title = "Đổi sản phẩm";

      let extra = "";
      if (resolution_type === "refund_full")
        extra = ` - Số tiền: ${formatVND(computeFullRefundAmount(record))}`;
      if (resolution_type === "refund_partial")
        extra = ` - Số tiền: ${formatVND(amount)}`;

      pushNotification({
        type: "complaint",
        title,
        message: `#${record.id} - ${record.product_name || "Sản phẩm"} - ${record.complainant_name || "Khách hàng"}${extra}`,
      });

      message.success(`Đã cập nhật khiếu nại #${record.id}`);
    } catch (e) {
      message.error(`Cập nhật thất bại: ${e.message}`);
    }
  };

  const handleReject = (id) => {
    Modal.confirm({
      title: "Xác nhận từ chối khiếu nại?",
      onOk: async () => {
        try {
          const res = await fetch(
            `http://localhost:8000/api/complaints/${id}/`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ status: "rejected" }),
            }
          );
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          message.success("Đã từ chối khiếu nại!");
          fetchComplaints();
        } catch (e) {
          message.error("Lỗi khi cập nhật!");
        }
      },
    });
  };

  const handleResetPending = (id) => {
    Modal.confirm({
      title: "Chuyển khiếu nại về trạng thái chờ xử lý?",
      onOk: async () => {
        try {
          const res = await fetch(
            `http://localhost:8000/api/complaints/${id}/`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ status: "pending" }),
            }
          );
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          message.success("Đã chuyển về trạng thái chờ!");
          fetchComplaints();
        } catch (e) {
          message.error("Lỗi khi cập nhật!");
        }
      },
    });
  };

  /* ===== bulk actions ===== */
  const bulkUpdate = (status) => {
    Modal.confirm({
      title: `${status === "resolved" ? "Xử lý" : "Từ chối"} ${selectedRowKeys.length} khiếu nại?`,
      onOk: async () => {
        try {
          await Promise.all(
            selectedRowKeys.map((id) =>
              fetch(`http://localhost:8000/api/complaints/${id}/`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status }),
              })
            )
          );
          message.success(
            `Đã ${status === "resolved" ? "xử lý" : "từ chối"} ${selectedRowKeys.length} khiếu nại!`
          );
          setSelectedRowKeys([]);
          fetchComplaints();
        } catch (err) {
          message.error("Lỗi hàng loạt!");
        }
      },
    });
  };

  /* ===== columns ===== */
  const columns = [
    {
      title: "Người gửi",
      dataIndex: "complainant_name",
      key: "complainant_name",
      width: 160,
      align: "center",
    },
    {
      title: "Sản phẩm",
      dataIndex: "product_name",
      key: "product_name",
      width: 220,
      align: "center",
    },
    {
      title: "Nội dung",
      dataIndex: "reason",
      key: "reason",
      align: "center",
      render: (t) => (
        <Typography.Text
          ellipsis={{ tooltip: t }}
          style={{ maxWidth: 360, display: "inline-block" }}
        >
          {t}
        </Typography.Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      align: "center",
      render: (s) => {
        const map = {
          pending: "Chờ xử lý",
          resolved: "Đã xử lý",
          rejected: "Đã từ chối",
        };
        const color =
          s === "resolved" ? "green" : s === "rejected" ? "red" : "orange";
        return <Tag color={color}>{map[s] || "Không xác định"}</Tag>;
      },
    },
    {
      title: "Thời gian",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      align: "center",
      render: (t) => moment(t).format("HH:mm DD/MM/YYYY"),
    },
    {
      title: "Hành động",
      key: "action",
      width: 320,
      className: "no-row-click",
      align: "center",
      render: (_, record) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Space>
            {record.status === "pending" ? (
              <>
                <Button
                  type="primary"
                  onClick={() =>
                    setApproveModal({
                      open: true,
                      record,
                      method: "refund_full",
                      amount: 0,
                      note: "",
                    })
                  }
                >
                  Duyệt
                </Button>
                <Button danger onClick={() => handleReject(record.id)}>
                  Từ chối
                </Button>
              </>
            ) : (
              <Button onClick={() => handleResetPending(record.id)}>
                Hoàn tác
              </Button>
            )}
          </Space>
        </div>
      ),
    },
  ];

  /* ===== render ===== */
  return (
    <>
      <ComplaintTable
        loading={loading}
        filtered={filtered}
        columns={columns}
        onSearch={handleSearch}
        onRefresh={fetchComplaints}
        onRowClick={(record) => {
          setDetailComplaint(record);
          setDetailModalVisible(true);
        }}
      />

      {/* Extra buttons for bulk actions */}
      <div style={{ marginTop: 16, textAlign: "right" }}>
        <BulkActionButtons
          selectedCount={selectedRowKeys.length}
          onBulkResolve={() => bulkUpdate("resolved")}
          onBulkReject={() => bulkUpdate("rejected")}
        />
      </div>

      <ApproveModal
        open={approveModal.open}
        onCancel={() =>
          setApproveModal({
            open: false,
            record: null,
            method: "refund_full",
            amount: 0,
            note: "",
          })
        }
        onOk={() => {
          const { method, amount, record, note } = approveModal;
          if (method === "refund_partial" && (!amount || amount <= 0)) {
            message.warning("Nhập số tiền hợp lệ");
            return;
          }
          resolveComplaint(record, method, amount, note).finally(() =>
            setApproveModal({
              open: false,
              record: null,
              method: "refund_full",
              amount: 0,
              note: "",
            })
          );
        }}
        approveModal={approveModal}
        setApproveModal={setApproveModal}
      />

      <DetailModal
        visible={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        complaint={detailComplaint}
      />
    </>
  );
}
