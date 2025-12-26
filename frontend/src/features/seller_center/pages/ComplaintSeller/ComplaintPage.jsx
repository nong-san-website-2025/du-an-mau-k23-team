// src/features/seller/pages/ComplaintPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Button,
  message,
  Modal,
  Space,
  Tag,
  Typography,
  DatePicker,
  Select,
} from "antd";
import { debounce } from "lodash"; // Cần cài lodash: npm install lodash
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

// Components
import ComplaintBaseLayout from "../../components/ComplaintSeller/ComplaintBaseLayout";
import ApproveModal from "../../components/ComplaintSeller/ApproveModal";
import DetailModal from "../../components/ComplaintSeller/DetailModal";

// Config
dayjs.extend(isBetween);
const { RangePicker } = DatePicker;
const { Option } = Select;

export default function ComplaintPage() {
  // --- STATE QUẢN LÝ DỮ LIỆU ---
  const [complaints, setComplaints] = useState([]); // Dữ liệu gốc từ API
  const [loading, setLoading] = useState(false);

  // --- STATE BỘ LỌC (FILTER) ---
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [dateRange, setDateRange] = useState(null);

  // --- STATE MODAL ---
  const [approveModal, setApproveModal] = useState({
    open: false,
    record: null,
    note: "",
    isReturnRequired: true,
  });
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailComplaint, setDetailComplaint] = useState(null);

  // --- AUTH & API ---
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const API_URL = process.env.REACT_APP_API_URL;

  // 1. FETCH DỮ LIỆU (Chỉ chạy 1 lần hoặc khi refresh)
  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/complaints/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Sắp xếp mặc định: Mới nhất lên đầu
      const sortedData = Array.isArray(data)
        ? data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        : [];

      setComplaints(sortedData);
    } catch (e) {
      console.error(e);
      message.error("Không thể tải danh sách khiếu nại");
    } finally {
      setLoading(false);
    }
  }, [API_URL, token]);

  useEffect(() => {
    if (token) fetchComplaints();
  }, [token, fetchComplaints]);

  // 2. TỐI ƯU TÌM KIẾM (DEBOUNCE)
  // Giúp không bị giật lag khi gõ phím liên tục
  const handleSearchDebounced = useCallback(
    debounce((value) => {
      setSearchKeyword(value);
    }, 500),
    []
  );

  // 3. TỐI ƯU BỘ LỌC (USEMEMO) - QUAN TRỌNG NHẤT ĐỂ LOAD NHANH
  // Chỉ tính toán lại khi các điều kiện lọc thay đổi
  const filteredData = useMemo(() => {
    if (!complaints.length) return [];

    return complaints.filter((c) => {
      // a. Lọc theo trạng thái
      if (statusFilter !== "all" && c.status !== statusFilter) return false;

      // b. Lọc theo từ khóa (Tên khách, tên SP, ID)
      if (searchKeyword) {
        const lowerKey = searchKeyword.toLowerCase();
        const matchName = c.created_by_name?.toLowerCase().includes(lowerKey);
        const matchProduct = c.product_name?.toLowerCase().includes(lowerKey);
        const matchId = String(c.id).includes(lowerKey);
        if (!matchName && !matchProduct && !matchId) return false;
      }

      // c. Lọc theo ngày
      if (dateRange && dateRange[0] && dateRange[1]) {
        const createdDate = dayjs(c.created_at);
        if (!createdDate.isValid()) return false;
        // Kiểm tra nằm trong khoảng
        if (!createdDate.isBetween(dateRange[0], dateRange[1], null, "[]"))
          return false;
      }

      return true;
    });
  }, [complaints, statusFilter, searchKeyword, dateRange]);

  // 4. XỬ LÝ SỰ KIỆN THỜI GIAN
  const handleTimeChange = (val) => {
    setTimeFilter(val);
    const today = dayjs();
    switch (val) {
      case "all":
        setDateRange(null);
        break;
      case "today":
        setDateRange([today.startOf("day"), today.endOf("day")]);
        break;
      case "7d":
        setDateRange([
          today.subtract(6, "day").startOf("day"),
          today.endOf("day"),
        ]);
        break;
      case "30d":
        setDateRange([
          today.subtract(29, "day").startOf("day"),
          today.endOf("day"),
        ]);
        break;
      default:
        break;
    }
  };

  const handleRangePickerChange = (dates) => {
    if (dates) {
      setDateRange([dates[0].startOf("day"), dates[1].endOf("day")]);
      setTimeFilter("custom");
    } else {
      setDateRange(null);
      setTimeFilter("all");
    }
  };

  // 5. CÁC HÀNH ĐỘNG (DUYỆT/TỪ CHỐI)
  const handleSellerAccept = async (record, note, isReturnRequired) => {
    try {
      const res = await fetch(
        `${API_URL}/complaints/${record.id}/seller-respond/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "accept",
            reason: note,
            return_required: isReturnRequired,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Lỗi xử lý");
      }

      message.success(
        isReturnRequired
          ? "Đã duyệt. Chờ khách gửi hàng."
          : "Đã hoàn tiền thành công!"
      );
      setApproveModal({
        open: false,
        record: null,
        note: "",
        isReturnRequired: true,
      });
      fetchComplaints(); // Tải lại dữ liệu mới nhất
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
          <p>Khách hàng có thể khiếu nại lên Sàn nếu không đồng ý.</p>
          <input
            placeholder="Nhập lý do từ chối..."
            className="ant-input"
            onChange={(e) => (rejectReason = e.target.value)}
            style={{ marginTop: 8 }}
          />
        </div>
      ),
      onOk: async () => {
        if (!rejectReason.trim()) {
          message.warning("Vui lòng nhập lý do từ chối");
          return Promise.reject();
        }
        try {
          const res = await fetch(
            `${API_URL}/complaints/${record.id}/seller-respond/`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ action: "reject", reason: rejectReason }),
            }
          );
          if (!res.ok) throw new Error("Lỗi khi từ chối");
          message.success("Đã từ chối yêu cầu.");
          fetchComplaints();
        } catch (e) {
          message.error("Có lỗi xảy ra");
        }
      },
    });
  };

  // 6. CẤU HÌNH CỘT (COLUMNS)
  const columns = [
    {
      title: "Người mua",
      dataIndex: "created_by_name",
      key: "created_by_name",
      width: 160,
      render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: "Sản phẩm",
      dataIndex: "product_name",
      key: "product_name",
      width: 240,
      render: (text, record) => (
        <Space>
          <img
            src={record.product_image}
            alt="product"
            style={{
              width: 40,
              height: 40,
              objectFit: "cover",
              borderRadius: 6,
              border: "1px solid #f0f0f0",
            }}
          />
          <Typography.Text ellipsis style={{ maxWidth: 180 }} title={text}>
            {text}
          </Typography.Text>
        </Space>
      ),
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
      width: 140,
      align: "center",
      render: (s) => {
        const map = {
          pending: { text: "Chờ xử lý", color: "orange" },
          negotiating: { text: "Đang thương lượng", color: "purple" },
          admin_review: { text: "Chờ Sàn xử lý", color: "blue" },
          resolved_refund: { text: "Đã hoàn tiền", color: "green" },
          resolved_reject: { text: "Từ chối", color: "red" },
          cancelled: { text: "Đã hủy", color: "default" },
        };
        const conf = map[s] || { text: s, color: "default" };
        return <Tag color={conf.color}>{conf.text}</Tag>;
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      width: 120,
      align: "center",
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      render: (t) => dayjs(t).format("DD/MM/YYYY"),
    },
    {
      title: "Hành động",
      key: "action",
      width: 180,
      align: "center",
      render: (_, record) => (
        <div onClick={(e) => e.stopPropagation()}>
          {record.status === "pending" && (
            <Space>
              <Button
                type="primary"
                size="small"
                onClick={() =>
                  setApproveModal({
                    open: true,
                    record,
                    note: "",
                    isReturnRequired: true,
                  })
                }
              >
                Duyệt
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
          {record.status !== "pending" && (
            <Button
              size="small"
              type="link"
              onClick={() => {
                setDetailComplaint(record);
                setDetailModalVisible(true);
              }}
            >
              Xem chi tiết
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <ComplaintBaseLayout
        title="KHIẾU NẠI & HOÀN TIỀN"
        loading={loading}
        // Dữ liệu đã được lọc qua useMemo (nhanh hơn)
        data={filteredData}
        columns={columns}
        // Truyền hàm debounce vào search
        onSearch={handleSearchDebounced}
        // Quản lý status filter
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        // Thanh công cụ mở rộng (Time filter)
        extra={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Select
              value={timeFilter}
              onChange={handleTimeChange}
              style={{ width: 120 }}
              options={[
                { value: "all", label: "Tất cả" },
                { value: "today", label: "Hôm nay" },
                { value: "7d", label: "7 ngày qua" },
                { value: "30d", label: "30 ngày qua" },
                { value: "custom", label: "Tùy chọn" },
              ]}
            />

            <RangePicker
              value={dateRange}
              onChange={handleRangePickerChange}
              format="DD/MM/YYYY"
              placeholder={["Từ ngày", "Đến ngày"]}
              style={{ width: 220 }}
              allowClear={false}
            />

            <Button type="primary" onClick={fetchComplaints} loading={loading}>
              Làm mới
            </Button>
          </div>
        }
        // Sự kiện click vào hàng
        onRow={(record) => ({
          onClick: () => {
            setDetailComplaint(record);
            setDetailModalVisible(true);
          },
          style: { cursor: "pointer" },
        })}
        // Pagination phía Client (Quan trọng để không render 1000 dòng 1 lúc)
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} khiếu nại`,
        }}
      />

      {/* --- MODALS --- */}
      <ApproveModal
        open={approveModal.open}
        record={approveModal.record}
        note={approveModal.note}
        setNote={(val) => setApproveModal((prev) => ({ ...prev, note: val }))}
        isReturnRequired={approveModal.isReturnRequired}
        setIsReturnRequired={(val) =>
          setApproveModal((prev) => ({ ...prev, isReturnRequired: val }))
        }
        onCancel={() => setApproveModal({ ...approveModal, open: false })}
        onOk={() =>
          handleSellerAccept(
            approveModal.record,
            approveModal.note,
            approveModal.isReturnRequired
          )
        }
      />

      <DetailModal
        visible={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        complaint={detailComplaint}
      />
    </>
  );
}
