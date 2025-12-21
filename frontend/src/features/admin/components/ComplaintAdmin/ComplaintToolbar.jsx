import React from "react";
import { Space, Button, Modal, message } from "antd";

const API_URL = process.env.REACT_APP_API_URL;

const ComplaintToolbar = ({ record, onViewDetail, onOpenResolve, refreshReports }) => {

  const handleReject = (id) => {
    Modal.confirm({
      title: "Xác nhận từ chối khiếu nại?",
      onOk: async () => {
        try {
          const token = localStorage.getItem("token");
          await fetch(`${API_URL}/complaints${id}/`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ status: "rejected" }),
          });
          message.success("Đã từ chối khiếu nại!");
          refreshReports();
        } catch (err) { message.error("Lỗi khi cập nhật!"); }
      },
    });
  };

  const handleResetPending = (id) => {
    Modal.confirm({
      title: "Chuyển khiếu nại về trạng thái chờ xử lý?",
      onOk: async () => {
        try {
          const token = localStorage.getItem("token");
          await fetch(`${API_URL}${id}/`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ status: "pending" }),
          });
          message.success("Đã chuyển về trạng thái chờ xử lý!");
          refreshReports();
        } catch (err) { message.error("Lỗi khi cập nhật!"); }
      }
    });
  };

  return (
    <Space>
      <Button onClick={onViewDetail}>Xem chi tiết</Button>
      {record.status === "pending" && (
        <>
          <Button type="primary" onClick={onOpenResolve}>Duyệt</Button>
          <Button danger onClick={() => handleReject(record.id)}>Không duyệt</Button>
        </>
      )}
      {(record.status === "resolved" || record.status === "rejected") && (
        <Button onClick={() => handleResetPending(record.id)}>Hoàn tất</Button>
      )}
    </Space>
  );
};

export default ComplaintToolbar;
