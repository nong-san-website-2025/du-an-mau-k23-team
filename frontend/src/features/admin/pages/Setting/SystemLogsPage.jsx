import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  Button,
  message,
  Input,
  DatePicker,
  Select,
  Modal,
  Space,
  Popconfirm,
  Tooltip,
} from "antd";
import axios from "axios";
import { DownloadOutlined, ReloadOutlined, FilterOutlined, EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Option } = Select;

const API_BASE_URL = "http://localhost:8000/api";

export default function SystemLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({
    user: "",
    eventType: "",
    keyword: "",
    dateRange: null,
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [selectedLog, setSelectedLog] = useState(null);
  const [logLevel, setLogLevel] = useState("INFO"); // Mức ghi log mặc định
  const [autoDeleteDays, setAutoDeleteDays] = useState(30); // Tự động xóa sau 30 ngày

  // Fetch logs with filters & pagination
  const fetchLogs = async (params = {}) => {
    setLoading(true);
    try {
      const { current, pageSize } = pagination;
      // Build query params based on filter & pagination
      const query = {
        _page: params.current || current,
        _limit: params.pageSize || pageSize,
        user: filter.user || undefined,
        eventType: filter.eventType || undefined,
        keyword: filter.keyword || undefined,
        logLevel: logLevel,
      };

      // date range filter
      if (filter.dateRange && filter.dateRange.length === 2) {
        query.startDate = filter.dateRange[0].format("YYYY-MM-DD");
        query.endDate = filter.dateRange[1].format("YYYY-MM-DD");
      }

      // Call API with query params
      const res = await axios.get(`${API_BASE_URL}/system-logs`, {
        params: query,
      });

      // giả định API trả về data + total count trong header hoặc body
      setLogs(res.data.data || res.data); // tùy API
      setPagination((prev) => ({
        ...prev,
        total: res.data.total || 100, // nếu không có, đặt 100 giả định
        current: params.current || prev.current,
        pageSize: params.pageSize || prev.pageSize,
      }));
    } catch (err) {
      console.error(err);
      message.error("Không tải được log!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs({ current: 1 });
  }, [filter, logLevel]);

  // Handle pagination change
  const handleTableChange = (pagination) => {
    fetchLogs({
      current: pagination.current,
      pageSize: pagination.pageSize,
    });
  };

  // Export CSV
  const exportCSV = () => {
    if (!logs.length) {
      message.warning("Không có dữ liệu để xuất.");
      return;
    }

    const header = ["ID", "Thời gian", "Người thực hiện", "Hành động", "Chi tiết", "Loại sự kiện"];
    const csvRows = logs.map((log) => [
      log.id,
      log.timestamp,
      log.user,
      log.action,
      log.detail,
      log.eventType,
    ]);

    const csvContent =
      [header, ...csvRows]
        .map((e) => e.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `system_logs_${dayjs().format("YYYYMMDD_HHmmss")}.csv`;
    link.click();
  };

  // Export JSON
  const exportJSON = () => {
    if (!logs.length) {
      message.warning("Không có dữ liệu để xuất.");
      return;
    }
    const jsonStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `system_logs_${dayjs().format("YYYYMMDD_HHmmss")}.json`;
    link.click();
  };

  // Show detail modal
  const showDetail = (record) => {
    setSelectedLog(record);
  };
  const closeDetail = () => setSelectedLog(null);

  // Delete logs manually
  const handleDeleteLogs = async () => {
    Modal.confirm({
      title: "Xác nhận xóa log?",
      content: "Bạn có chắc muốn xóa toàn bộ log hệ thống? Không thể hoàn tác!",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await axios.delete(`${API_BASE_URL}/system-logs`);
          message.success("Xóa log thành công.");
          fetchLogs({ current: 1 });
        } catch (error) {
          message.error("Xóa log thất bại.");
        }
      },
    });
  };

  // UI filter handlers
  const onFilterChange = (field, value) => {
    setFilter((prev) => ({ ...prev, [field]: value }));
  };

  // Change log level filter
  const onLogLevelChange = (value) => {
    setLogLevel(value);
  };

  // --- Các cột bảng ---
  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 70 },
    { title: "Thời gian", dataIndex: "timestamp", key: "timestamp", sorter: true },
    { title: "Người thực hiện", dataIndex: "user", key: "user" },
    { title: "Hành động", dataIndex: "action", key: "action" },
    { title: "Loại sự kiện", dataIndex: "eventType", key: "eventType", width: 120 },
    {
      title: "Chi tiết",
      dataIndex: "detail",
      key: "detail",
      ellipsis: true,
      render: (_, record) => (
        <Tooltip title="Xem chi tiết">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => showDetail(record)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <Card
      title="Log hệ thống"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => fetchLogs({ current: 1 })}>
            Tải lại
          </Button>
          <Button icon={<DownloadOutlined />} onClick={exportCSV}>
            Xuất CSV
          </Button>
          <Button icon={<DownloadOutlined />} onClick={exportJSON}>
            Xuất JSON
          </Button>
          <Popconfirm
            title="Bạn có chắc muốn xóa tất cả log?"
            onConfirm={handleDeleteLogs}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button danger icon={<DeleteOutlined />}>
              Xóa log
            </Button>
          </Popconfirm>
        </Space>
      }
    >
      {/* Bộ lọc */}
      <Space style={{ marginBottom: 16, flexWrap: "wrap" }} size="middle">
        <Input
          placeholder="Từ khóa tìm kiếm"
          allowClear
          style={{ width: 180 }}
          value={filter.keyword}
          onChange={(e) => onFilterChange("keyword", e.target.value)}
          prefix={<FilterOutlined />}
        />
        <Input
          placeholder="Người dùng"
          allowClear
          style={{ width: 140 }}
          value={filter.user}
          onChange={(e) => onFilterChange("user", e.target.value)}
        />
        <Select
          allowClear
          placeholder="Loại sự kiện"
          style={{ width: 140 }}
          value={filter.eventType}
          onChange={(val) => onFilterChange("eventType", val)}
        >
          <Option value="INFO">INFO</Option>
          <Option value="WARNING">WARNING</Option>
          <Option value="ERROR">ERROR</Option>
        </Select>
        <RangePicker
          value={filter.dateRange}
          onChange={(dates) => onFilterChange("dateRange", dates)}
          allowClear
          style={{ width: 250 }}
        />
        <Select
          value={logLevel}
          onChange={onLogLevelChange}
          style={{ width: 140 }}
          tooltip="Mức độ ghi log"
        >
          <Option value="INFO">INFO</Option>
          <Option value="WARNING">WARNING</Option>
          <Option value="ERROR">ERROR</Option>
        </Select>
      </Space>

      <Table
        dataSource={logs}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
        }}
        onChange={handleTableChange}
      />

      {/* Modal xem chi tiết */}
      <Modal
        visible={!!selectedLog}
        title={`Chi tiết log ID: ${selectedLog?.id || ""}`}
        footer={<Button onClick={closeDetail}>Đóng</Button>}
        onCancel={closeDetail}
        width={600}
      >
        {selectedLog ? (
          <pre
            style={{
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
              maxHeight: "400px",
              overflowY: "auto",
            }}
          >
            {JSON.stringify(selectedLog, null, 2)}
          </pre>
        ) : null}
      </Modal>
    </Card>
  );
}
