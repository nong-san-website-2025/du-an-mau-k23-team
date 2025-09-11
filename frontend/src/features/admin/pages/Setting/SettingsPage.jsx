// src/features/admin/pages/Setting/SettingsPage.jsx
import React, { useEffect, useState } from "react";
import { Form, Input, Button, Table, message, Skeleton, Tabs } from "antd";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const { TabPane } = Tabs;
const API_BASE_URL = "http://localhost:8000/api";

export default function SettingsPage() {
  const [userInfoForm] = Form.useForm();
  const [logs, setLogs] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);

  const navigate = useNavigate();

  // Hàm kiểm tra token
  const getToken = () => localStorage.getItem("token");

  const handleUnauthorized = () => {
    message.error("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.");
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Load user info
  useEffect(() => {
    const fetchUser = async () => {
      const token = getToken();
      if (!token) return handleUnauthorized();

      try {
        const res = await axios.get(`${API_BASE_URL}/user/me/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.data) return handleUnauthorized();

        userInfoForm.setFieldsValue(res.data);
      } catch (err) {
        console.error(err);
        handleUnauthorized();
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, [userInfoForm]);

  // Load logs
  useEffect(() => {
    const fetchLogs = async () => {
      const token = getToken();
      if (!token) return handleUnauthorized();

      try {
        const res = await axios.get(`${API_BASE_URL}/admin/logs/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLogs(res.data || []);
      } catch (err) {
        console.error(err);
        setLogs([]);
      } finally {
        setLoadingLogs(false);
      }
    };
    fetchLogs();
  }, []);

  // Cập nhật thông tin cá nhân
  const handleUpdateUserInfo = async (values) => {
    const token = getToken();
    if (!token) return handleUnauthorized();

    try {
      await axios.put(`${API_BASE_URL}/user/me/`, values, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success("Cập nhật thông tin thành công!");
    } catch (err) {
      console.error(err);
      message.error("Cập nhật thất bại!");
    }
  };

  // Table columns
  const logColumns = [
    { title: "Thời gian", dataIndex: "timestamp", key: "timestamp" },
    { title: "Hành động", dataIndex: "action", key: "action" },
    { title: "Người thực hiện", dataIndex: "user", key: "user" },
    { title: "Trạng thái", dataIndex: "status", key: "status" },
  ];

  return (
    <div className="p-4">
      <h2>Trang cài đặt</h2>

      <Tabs defaultActiveKey="1">
        {/* Thông tin cá nhân */}
        <TabPane tab="Thông tin cá nhân" key="1">
          {loadingUser ? (
            <Skeleton active paragraph={{ rows: 6 }} />
          ) : (
            <Form
              form={userInfoForm}
              layout="vertical"
              onFinish={handleUpdateUserInfo}
              style={{ maxWidth: 600 }}
            >
              <Form.Item label="Tên hiển thị" name="full_name">
                <Input placeholder="Nhập tên hiển thị" />
              </Form.Item>
              <Form.Item label="Email" name="email">
                <Input disabled />
              </Form.Item>
              <Form.Item label="Số điện thoại" name="phone">
                <Input placeholder="Nhập số điện thoại" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  Cập nhật thông tin
                </Button>
              </Form.Item>
            </Form>
          )}
        </TabPane>

        {/* Lịch sử hoạt động */}
        <TabPane tab="Lịch sử hoạt động" key="2">
          {loadingLogs ? (
            <Skeleton active paragraph={{ rows: 6 }} />
          ) : (
            <Table
              columns={logColumns}
              dataSource={logs}
              rowKey={(record) => record.id || Math.random()}
              locale={{ emptyText: "Không có dữ liệu" }}
            />
          )}
        </TabPane>
      </Tabs>
    </div>
  );
}
