import React, { useState, useEffect } from "react";
import { Button, message, Modal, Space, Tag, Typography } from "antd";
import ComplaintTable from "../../components/ComplaintSeller/ComplaintTable";
import ApproveModal from "../../components/ComplaintSeller/ApproveModal";
import DetailModal from "../../components/ComplaintSeller/DetailModal";
import moment from "moment";

export default function ComplaintPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtered, setFiltered] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Lấy API URL từ env
  const API_URL = process.env.REACT_APP_API_URL;

  // Modal duyệt (Chỉ còn Đồng ý hoàn tiền)
  const [approveModal, setApproveModal] = useState({
    open: false,
    record: null,
    note: "", // Lời nhắn cho khách (tùy chọn)
  });

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailComplaint, setDetailComplaint] = useState(null);

  /* ===== fetch data ===== */
  const fetchComplaints = async () => {
    setLoading(true);
    try {
      // SỬ DỤNG ENV Ở ĐÂY
      const res = await fetch(`${API_URL}/complaints/`, {
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
    if (token) fetchComplaints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  /* ===== search and filter ===== */
  useEffect(() => {
    const lower = searchKeyword.toLowerCase();
    const result = complaints.filter((c) => {
      const matchText =
        (c.created_by_name?.toLowerCase().includes(lower) ||
          c.product_name?.toLowerCase().includes(lower) ||
          String(c.id).includes(lower));

      const matchStatus = statusFilter === 'all' || c.status === statusFilter;

      return matchText && matchStatus;
    });
    setFiltered(result);
  }, [searchKeyword, statusFilter, complaints]);


  /* ===== ACTIONS (QUAN TRỌNG: GỌI ĐÚNG API BACKEND MỚI) ===== */

  // 1. Shop Đồng ý hoàn tiền
  const handleSellerAccept = async (record, note) => {
    try {
      // SỬ DỤNG ENV Ở ĐÂY
      const res = await fetch(`${API_URL}/complaints/${record.id}/seller-respond/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: 'accept',
          reason: note // Backend dùng field 'reason' để lưu phản hồi
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Lỗi xử lý");
      }

      message.success(`Đã chấp nhận hoàn tiền cho khiếu nại #${record.id}`);
      setApproveModal({ open: false, record: null, note: "" });
      fetchComplaints(); // Reload lại data
    } catch (e) {
      message.error(e.message);
    }
  };

  // 2. Shop Từ chối
  const handleSellerReject = (record) => {
    let rejectReason = "";
    Modal.confirm({
      title: "Từ chối hoàn tiền?",
      content: (
        <div>
          <p>Bạn có chắc muốn từ chối yêu cầu này? Khách hàng có thể khiếu nại lên Sàn.</p>
          <input
            placeholder="Nhập lý do từ chối..."
            className="ant-input"
            onChange={(e) => rejectReason = e.target.value}
          />
        </div>
      ),
      onOk: async () => {
        if (!rejectReason.trim()) {
          message.warning("Vui lòng nhập lý do từ chối");
          return Promise.reject();
        }
        try {
          // SỬ DỤNG ENV Ở ĐÂY
          const res = await fetch(`${API_URL}/complaints/${record.id}/seller-respond/`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: 'reject',
              reason: rejectReason
            }),
          });

          if (!res.ok) throw new Error("Lỗi khi từ chối");

          message.success("Đã từ chối yêu cầu. Trạng thái chuyển sang Thương lượng.");
          fetchComplaints();
        } catch (e) {
          message.error("Có lỗi xảy ra");
        }
      },
    });
  };

  /* ===== columns ===== */
  const columns = [
    {
      title: "Người mua",
      dataIndex: "created_by_name", // Khớp serializer
      key: "created_by_name",
      width: 160,
    },
    {
      title: "Sản phẩm",
      dataIndex: "product_name",
      key: "product_name",
      width: 220,
      render: (text, record) => (
        <Space>
          <img src={record.product_image} alt="" style={{ width: 30, height: 30, objectFit: 'cover', borderRadius: 4 }} />
          <Typography.Text ellipsis style={{ maxWidth: 150 }}>{text}</Typography.Text>
        </Space>
      )
    },
    {
      title: "Lý do",
      dataIndex: "reason",
      key: "reason",
      ellipsis: true,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 150,
      align: "center",
      render: (s) => {
        const map = {
          pending: { text: "Chờ xử lý", color: "orange" },
          negotiating: { text: "Đang thương lượng", color: "purple" }, // Shop đã từ chối
          admin_review: { text: "Chờ Sàn xử lý", color: "blue" },
          resolved_refund: { text: "Đã hoàn tiền", color: "green" },
          resolved_reject: { text: "Đã hủy/Từ chối", color: "red" },
          cancelled: { text: "Khách hủy", color: "default" },
        };
        const conf = map[s] || { text: s, color: "default" };
        return <Tag color={conf.color}>{conf.text}</Tag>;
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      width: 150,
      render: (t) => moment(t).format("DD/MM/YYYY"),
    },
    {
      title: "Hành động",
      key: "action",
      width: 200,
      align: "center",
      render: (_, record) => (
        <div onClick={(e) => e.stopPropagation()}>
          {record.status === "pending" && (
            <Space>
              <Button
                type="primary"
                size="small"
                onClick={() => setApproveModal({ open: true, record, note: "" })}
              >
                Đồng ý
              </Button>
              <Button
                danger
                size="small"
                onClick={() => handleSellerReject(record)}
              >
                Từ chối
              </Button>
            </Space>
          )}
          {record.status === "negotiating" && <Tag>Đã từ chối</Tag>}
          {record.status === "resolved_refund" && <Tag color="success">Hoàn tất</Tag>}
        </div>
      ),
    },
  ];

  return (
    <>
      <ComplaintTable
        loading={loading}
        filtered={filtered}
        columns={columns}
        onSearch={setSearchKeyword}
        onStatusFilterChange={setStatusFilter}
        statusFilter={statusFilter}
        onRefresh={fetchComplaints}
        onRowClick={(record) => {
          setDetailComplaint(record);
          setDetailModalVisible(true);
        }}
      />

      {/* Modal Đồng ý hoàn tiền */}
      <ApproveModal
        open={approveModal.open}

        // Truyền record trực tiếp để hiển thị thông tin tiền nong
        record={approveModal.record}

        // Truyền note và hàm setNote
        note={approveModal.note}
        setNote={(val) => setApproveModal({ ...approveModal, note: val })}

        onCancel={() => setApproveModal({ ...approveModal, open: false })}

        // Khi bấm OK -> Gọi API handleSellerAccept
        onOk={() => handleSellerAccept(approveModal.record, approveModal.note)}
      />

      <DetailModal
        visible={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        complaint={detailComplaint}
      />
    </>
  );
}