import React, { useState, useEffect } from "react";
import {  Table, Button, Modal, Tag, message, Space, Image, Input, Descriptions, Card } from "antd";
import { CheckOutlined, EyeOutlined } from "@ant-design/icons";
import axios from "axios";
import moment from "moment";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

const RefundOrdersTab = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [processingRefund, setProcessingRefund] = useState(false);

  useEffect(() => {
    fetchRefundRequests();
  }, []);

  const fetchRefundRequests = async () => {
    setLoading(true);
    try {
      const response = await api.get("/complaints/", {
        headers: getAuthHeaders(),
      });
      const adminReviewComplaints = response.data.filter(
        (c) => c.status === "admin_review"
      );
      setComplaints(adminReviewComplaints);
    } catch (error) {
      console.error("Error fetching refund requests:", error);
      message.error("Không thể tải danh sách yêu cầu hoàn tiền");
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRefund = async (complaint) => {
    if (!complaint.buyer_bank_name) {
      message.error("Người mua chưa cài đặt thông tin ngân hàng");
      return;
    }

    Modal.confirm({
      title: "Xác nhận hoàn tiền?",
      content: (
        <div>
          <p>Bạn xác nhận hoàn tiền cho khách hàng?</p>
          <p><strong>Số tiền:</strong> {(complaint.refund_amount || 0).toLocaleString()}₫</p>
          <p><strong>Ngân hàng:</strong> {complaint.buyer_bank_name}</p>
          <p><strong>Số TK:</strong> {complaint.buyer_account_number}</p>
          <p><strong>Chủ TK:</strong> {complaint.buyer_account_holder_name}</p>
          <p className="text-muted mt-2">
            Mã giao dịch: REFUND-{complaint.id}-{Date.now()}
          </p>
        </div>
      ),
      onOk: async () => {
        setProcessingRefund(true);
        try {
          await api.post(`/complaints/${complaint.id}/admin-process-refund/`, {}, {
            headers: getAuthHeaders(),
          });
          message.success("Đã xử lý hoàn tiền thành công");
          fetchRefundRequests();
          setDetailModalVisible(false);
        } catch (error) {
          console.error("Error processing refund:", error);
          message.error(
            error.response?.data?.error || "Có lỗi xảy ra khi xử lý hoàn tiền"
          );
        } finally {
          setProcessingRefund(false);
        }
      },
    });
  };

  const columns = [
    {
      title: "Mã đơn",
      dataIndex: "id",
      key: "id",
      render: (id) => `#${id}`,
      width: 80,
    },
    {
      title: "Người mua",
      dataIndex: "created_by_name",
      key: "buyer",
      width: 150,
    },
    {
      title: "Sản phẩm",
      dataIndex: "product_name",
      key: "product",
      render: (text, record) => (
        <Space>
          <Image
            src={record.product_image}
            width={40}
            height={40}
            style={{ objectFit: "cover", borderRadius: 4 }}
            preview={false}
          />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: "Số tiền hoàn",
      dataIndex: "refund_amount",
      key: "refund_amount",
      render: (amount) => `${(amount || 0).toLocaleString()}₫`,
      width: 120,
    },
    {
      title: "Ngày yêu cầu",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => moment(date).format("DD/MM/YYYY HH:mm"),
      width: 140,
    },
    {
      title: "Hành động",
      key: "action",
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedComplaint(record);
              setDetailModalVisible(true);
            }}
          >
            Chi tiết
          </Button>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => handleProcessRefund(record)}
            loading={processingRefund}
          >
            Hoàn tiền
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Table
        dataSource={complaints}
        columns={columns}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="Chi tiết yêu cầu hoàn tiền"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => setDetailModalVisible(false)}>
            Đóng
          </Button>,
          <Button
            key="process"
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => handleProcessRefund(selectedComplaint)}
            loading={processingRefund}
            disabled={!selectedComplaint?.buyer_bank_name}
          >
            Hoàn tiền
          </Button>,
        ]}
      >
        {selectedComplaint && (
          <div>
            <Card title="Thông tin người mua" className="mb-3" size="small">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Tên">
                  {selectedComplaint.created_by_name}
                </Descriptions.Item>
                <Descriptions.Item label="Địa chỉ">
                  {selectedComplaint.buyer_address || "N/A"}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="Thông tin ngân hàng" className="mb-3" size="small">
              {selectedComplaint.buyer_bank_name ? (
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="Ngân hàng">
                    {selectedComplaint.buyer_bank_name}
                  </Descriptions.Item>
                  <Descriptions.Item label="Số tài khoản">
                    {selectedComplaint.buyer_account_number}
                  </Descriptions.Item>
                  <Descriptions.Item label="Chủ tài khoản" span={2}>
                    {selectedComplaint.buyer_account_holder_name}
                  </Descriptions.Item>
                </Descriptions>
              ) : (
                <Tag color="red">Người mua chưa cập nhật thông tin ngân hàng</Tag>
              )}
            </Card>

            <Card title="Thông tin sản phẩm" className="mb-3" size="small">
              <Space direction="vertical" style={{ width: "100%" }}>
                <Image
                  src={selectedComplaint.product_image}
                  width={100}
                  height={100}
                  style={{ objectFit: "cover" }}
                />
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="Sản phẩm">
                    {selectedComplaint.product_name}
                  </Descriptions.Item>
                  <Descriptions.Item label="Số lượng">
                    {selectedComplaint.quantity || 1}
                  </Descriptions.Item>
                  <Descriptions.Item label="Số tiền hoàn" span={2}>
                    <strong style={{ color: "#f50", fontSize: 16 }}>
                      {(selectedComplaint.refund_amount || 0).toLocaleString()}₫
                    </strong>
                  </Descriptions.Item>
                </Descriptions>
              </Space>
            </Card>

            <Card title="Lý do hoàn tiền" className="mb-3" size="small">
              <p>{selectedComplaint.reason}</p>
            </Card>

            {selectedComplaint.media && selectedComplaint.media.length > 0 && (
              <Card title="Hình ảnh/Video" className="mb-3" size="small">
                <Space>
                  {selectedComplaint.media.map((item, index) => (
                    <Image
                      key={index}
                      src={item.file}
                      width={100}
                      height={100}
                      style={{ objectFit: "cover" }}
                    />
                  ))}
                </Space>
              </Card>
            )}

            <Card title="Thông tin cửa hàng" className="mb-3" size="small">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Tên cửa hàng">
                  {selectedComplaint.shop_name}
                </Descriptions.Item>
                <Descriptions.Item label="Địa chỉ">
                  {selectedComplaint.shop_address || "N/A"}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <div className="mt-3 p-3" style={{ background: "#f0f2f5", borderRadius: 8 }}>
              <p><strong>Mã giao dịch hoàn tiền:</strong></p>
              <Input
                readOnly
                value={`REFUND-${selectedComplaint.id}-${Date.now()}`}
                style={{ fontFamily: "monospace" }}
              />
              <p className="text-muted mt-2" style={{ fontSize: 12 }}>
                Sử dụng mã này khi chuyển khoản ngân hàng
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RefundOrdersTab;
