import React, { useEffect, useState } from "react";
import { Card, Table, Button, message } from "antd";
import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

export default function SystemLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/system-logs/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Nếu backend trả object có results → lấy results
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setLogs(data);
    } catch (err) {
      console.error("Fetch system logs error:", err);
      message.error("Không tải được log!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 60 },
    { title: "Thời gian", dataIndex: "created_at", key: "created_at" },
    { title: "Người thực hiện", dataIndex: "user", key: "user" },
    { title: "Hành động", dataIndex: "action", key: "action" },
    { title: "Chi tiết", dataIndex: "detail", key: "detail" },
  ];

  return (
    <Card title="Log hệ thống">
      <Button style={{ marginBottom: 10 }} onClick={fetchLogs}>
        Tải lại
      </Button>
      <Table
        dataSource={logs}
        columns={columns}
        rowKey="id"
        loading={loading}
      />
    </Card>
  );
}
