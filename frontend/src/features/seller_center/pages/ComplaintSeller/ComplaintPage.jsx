// src/features/seller/pages/ComplaintPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Button, message, Modal, Space, Tag, Typography, DatePicker, Select } from "antd";
import ComplaintTable from "../../components/ComplaintSeller/ComplaintTable";
import ApproveModal from "../../components/ComplaintSeller/ApproveModal";
import DetailModal from "../../components/ComplaintSeller/DetailModal";
import moment from "moment";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

// Import components layout (đảm bảo đường dẫn đúng)
import ComplaintBaseLayout from "../../components/ComplaintSeller/ComplaintBaseLayout";

dayjs.extend(isBetween);
const { RangePicker } = DatePicker;
const { Option } = Select;

export default function ComplaintPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtered, setFiltered] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // [MỚI] State quản lý thời gian
  const [timeFilter, setTimeFilter] = useState("all");
  const [dateRange, setDateRange] = useState(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const API_URL = process.env.REACT_APP_API_URL;

  // Modal duyệt
  const [approveModal, setApproveModal] = useState({
    open: false,
    record: null,
    note: "", 
    isReturnRequired: true, 
  });

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailComplaint, setDetailComplaint] = useState(null);

  /* ===== FETCH DATA ===== */
  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/complaints/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setComplaints(data);
      // setFiltered sẽ được xử lý bởi useEffect filter bên dưới
    } catch (e) {
      message.error("Không thể tải danh sách khiếu nại");
    } finally {
      setLoading(false);
    }
  }, [API_URL, token]);

  useEffect(() => {
    if (token) fetchComplaints();
  }, [token, fetchComplaints]);

  /* ===== FILTER LOGIC ===== */
  const handleTimeChange = (val) => {
    setTimeFilter(val);
    const today = dayjs();
    
    switch (val) {
      case "all":
        setDateRange(null);
        break;
      case "today": 
        setDateRange([today.startOf('day'), today.endOf('day')]); 
        break;
      case "7d": 
        setDateRange([today.subtract(6, "day").startOf('day'), today.endOf('day')]); 
        break;
      case "30d": 
        setDateRange([today.subtract(29, "day").startOf('day'), today.endOf('day')]); 
        break;
      default: break;
    }
  };

  const handleRangePickerChange = (dates) => {
    if (dates) {
      setDateRange([dates[0].startOf('day'), dates[1].endOf('day')]);
      setTimeFilter("custom");
    } else {
      setDateRange(null);
      setTimeFilter("all");
    }
  };

  useEffect(() => {
    const lower = searchKeyword.toLowerCase();
    const result = complaints.filter((c) => {
      // 1. Text Search
      const matchText =
        (c.created_by_name?.toLowerCase().includes(lower) ||
          c.product_name?.toLowerCase().includes(lower) ||
          String(c.id).includes(lower));

      // 2. Status Filter
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;

      // 3. Date Range Filter [UPDATED]
      let matchDate = true;
      if (dateRange && dateRange[0] && dateRange[1]) {
        const createdDate = dayjs(c.created_at);
        if (!createdDate.isValid()) return false;
        // So sánh bao gồm cả đầu và cuối
        matchDate = createdDate.isBetween(dateRange[0], dateRange[1], null, '[]');
      }

      return matchText && matchStatus && matchDate;
    });
    setFiltered(result);
  }, [searchKeyword, statusFilter, dateRange, complaints]);


  /* ===== ACTIONS ===== */
  const handleSellerAccept = async (record, note, isReturnRequired) => {
    try {
      const res = await fetch(`${API_URL}/complaints/${record.id}/seller-respond/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: 'accept',
          reason: note,
          return_required: isReturnRequired
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Lỗi xử lý");
      }

      message.success(isReturnRequired ? "Đã duyệt. Chờ khách gửi hàng về." : "Đã hoàn tiền thành công cho khách!");
      setApproveModal({ open: false, record: null, note: "", isReturnRequired: true });
      fetchComplaints();
    } catch (e) {
      message.error(e.message);
    }
  };

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

  /* ===== COLUMNS ===== */
  const columns = [
    {
      title: "Người mua",
      dataIndex: "created_by_name",
      key: "created_by_name",
      width: 160,
      sorter: (a, b) => (a.created_by_name || "").localeCompare(b.created_by_name || "", "vi"),
    },
    {
      title: "Sản phẩm",
      dataIndex: "product_name",
      key: "product_name",
      width: 220,
      sorter: (a, b) => (a.product_name || "").localeCompare(b.product_name || "", "vi"),
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
          negotiating: { text: "Đang thương lượng", color: "purple" },
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
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
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
              <Button type="primary" size="small" onClick={() => setApproveModal({ open: true, record, note: "" })}>
                Đồng ý
              </Button>
              <Button danger size="small" onClick={() => handleSellerReject(record)}>
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
      <ComplaintBaseLayout
        title="QUẢN LÝ TRẢ HÀNG/ HOÀN TIỀN"
        extra={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
             {/* [MỚI] Bộ lọc tinh gọn */}
             <Select 
                value={timeFilter} 
                onChange={handleTimeChange} 
                style={{ width: 130 }}
                placeholder="Thời gian"
              >
                <Option value="all">Toàn bộ</Option>
                <Option value="today">Hôm nay</Option>
                <Option value="7d">7 ngày qua</Option>
                <Option value="30d">30 ngày qua</Option>
                <Option value="custom">Tùy chọn</Option>
              </Select>

              <RangePicker 
                value={dateRange} 
                onChange={handleRangePickerChange} 
                format="DD/MM/YYYY" 
                placeholder={['Từ ngày', 'Đến ngày']} 
                style={{ width: 240 }} 
              />

              <Button type="primary" onClick={fetchComplaints} loading={loading}>Làm mới</Button>
          </div>
        }
        loading={loading}
        data={filtered}
        columns={columns}
        onSearch={setSearchKeyword}
        // Truyền rỗng để layout không render bộ lọc cũ nếu có
        statusFilter={statusFilter} 
        onStatusFilterChange={setStatusFilter}
        onRow={(record) => ({
          onClick: () => {
            setDetailComplaint(record);
            setDetailModalVisible(true);
          }
        })}
      />

      <ApproveModal
        open={approveModal.open}
        record={approveModal.record}
        note={approveModal.note}
        setNote={(val) => setApproveModal({ ...approveModal, note: val })}
        isReturnRequired={approveModal.isReturnRequired}
        setIsReturnRequired={(val) => setApproveModal({ ...approveModal, isReturnRequired: val })}
        onCancel={() => setApproveModal({ ...approveModal, open: false })}
        onOk={() => handleSellerAccept(approveModal.record, approveModal.note, approveModal.isReturnRequired)}
      />

      <DetailModal
        visible={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        complaint={detailComplaint}
      />
    </>
  );
}