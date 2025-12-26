import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Tag, message, Space, Image, Input, Descriptions, Card } from "antd";
import { CheckOutlined, EyeOutlined } from "@ant-design/icons";
import axiosInstance from "../../../utils/axiosInstance";
import moment from "moment";

const RefundManagementPage = () => {
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
      const response = await axiosInstance.get("/complaints/");
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
          await axiosInstance.post(`/complaints/${complaint.id}/admin-process-refund/`);
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
    },
    {
      title: "Người mua",
      dataIndex: "created_by_name",
      key: "buyer",
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
    },
    {
      title: "Ngày yêu cầu",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => moment(date).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const statusMap = {
          admin_review: { text: "Chờ xử lý", color: "orange" },
          resolved_refund: { text: "Đã hoàn tiền", color: "green" },
        };
        const config = statusMap[status] || { text: status, color: "default" };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "Hành động",
      key: "action",
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
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 24 }}>Quản lý hoàn tiền người dùng</h2>
      
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
          >
            Hoàn tiền
          </Button>,
        ]}
      >
        {selectedComplaint && (
          <div>
            <Card title="Thông tin người mua" className="mb-3">
              <Descriptions column={2}>
                <Descriptions.Item label="Tên">
                  {selectedComplaint.created_by_name}
                </Descriptions.Item>
                <Descriptions.Item label="Địa chỉ">
                  {selectedComplaint.buyer_address || "N/A"}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="Thông tin ngân hàng" className="mb-3">
              <Descriptions column={2}>
                <Descriptions.Item label="Ngân hàng">
                  {selectedComplaint.buyer_bank_name || "Chưa cập nhật"}
                </Descriptions.Item>
                <Descriptions.Item label="Số tài khoản">
                  {selectedComplaint.buyer_account_number || "Chưa cập nhật"}
                </Descriptions.Item>
                <Descriptions.Item label="Chủ tài khoản" span={2}>
                  {selectedComplaint.buyer_account_holder_name || "Chưa cập nhật"}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="Thông tin sản phẩm" className="mb-3">
              <Space direction="vertical" style={{ width: "100%" }}>
                <Image
                  src={selectedComplaint.product_image}
                  width={100}
                  height={100}
                  style={{ objectFit: "cover" }}
                />
                <Descriptions column={2}>
                  <Descriptions.Item label="Sản phẩm">
                    {selectedComplaint.product_name}
                  </Descriptions.Item>
                  <Descriptions.Item label="Số lượng">
                    {selectedComplaint.quantity || 1}
                  </Descriptions.Item>
                  <Descriptions.Item label="Số tiền hoàn" span={2}>
                    <strong style={{ color: "#f50" }}>
                      {(selectedComplaint.refund_amount || 0).toLocaleString()}₫
                    </strong>
                  </Descriptions.Item>
                </Descriptions>
              </Space>
            </Card>

            <Card title="Lý do hoàn tiền" className="mb-3">
              <p>{selectedComplaint.reason}</p>
            </Card>

            {selectedComplaint.media && selectedComplaint.media.length > 0 && (
              <Card title="Hình ảnh/Video" className="mb-3">
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

            <Card title="Thông tin cửa hàng">
              <Descriptions column={2}>
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

export default RefundManagementPage;
