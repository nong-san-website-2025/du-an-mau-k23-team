import React, { useEffect, useState } from "react";
import { Timeline, Spin } from "antd";
import { getSellerActivity } from "../../services/sellerApi";
import dayjs from "dayjs";

export default function ActivityTimeline({ sellerId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [sellerId]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getSellerActivity(sellerId);
      setLogs(data);
    } catch (error) {
      console.error("Error fetching seller activity:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spin />;
  if (!logs.length) return <p style={{ color: "#888" }}>Chưa có hoạt động nào</p>;

  return (
    <Timeline mode="left" style={{ marginTop: 16 }}>
      {logs.map((log) => (
        <Timeline.Item key={log.id} color="blue">
          <strong>{log.action_display}</strong> — {log.description || "Không có mô tả"}
          <div style={{ fontSize: 12, color: "#888" }}>
            {dayjs(log.created_at).format("DD/MM/YYYY HH:mm")}
          </div>
        </Timeline.Item>
      ))}
    </Timeline>
  );
}
