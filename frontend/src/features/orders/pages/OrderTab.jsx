import React, { useEffect, useState } from "react";
import {
  Collapse,
  Tag,
  Typography,
  Skeleton,
  Empty,
  Table,
  Image,
  Space,
  message,
  Card,
  Button,
  Input,
  Upload,
} from "antd";
import { UploadOutlined, SendOutlined, CloseOutlined } from "@ant-design/icons";
import API from "../../login_register/services/api";
import { MdOutlineReportGmailerrorred } from "react-icons/md";
import "../styles/css/OrderTab.css";


const { Panel } = Collapse;
const { Text } = Typography;
const { TextArea } = Input;

// Map trạng thái đơn hàng -> label + màu
const statusMap = {
  pending: { label: "Chờ xác nhận", color: "gold" },
  shipping: { label: "Chờ nhận hàng", color: "blue" },
  success: { label: "Đã thanh toán", color: "green" },
  cancelled: { label: "Đã huỷ", color: "red" },
};

const OrderTab = ({ status }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Complaint UI state
  const [openComplaint, setOpenComplaint] = useState({});
  const [complaintTexts, setComplaintTexts] = useState({});
  const [complaintFiles, setComplaintFiles] = useState({});
  const [sendingByProduct, setSendingByProduct] = useState({});

  // Toggle complaint form
  const toggleComplaint = (productId) => {
    setOpenComplaint((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

  const onChangeText = (productId, val) => {
    setComplaintTexts((prev) => ({ ...prev, [productId]: val }));
  };

  const onChangeFiles = (productId, files) => {
    setComplaintFiles((prev) => ({
      ...prev,
      [productId]: Array.from(files),
    }));
  };

  const sendComplaint = async (productId, unitPrice, quantity) => {
    const token = localStorage.getItem("token");
    if (!token) {
      message.info("Bạn cần đăng nhập để gửi khiếu nại");
      return;
    }
    const reason = (complaintTexts[productId] || "").trim();
    if (!reason) {
      message.warning("Vui lòng nhập nội dung khiếu nại");
      return;
    }

    try {
      setSendingByProduct((prev) => ({ ...prev, [productId]: true }));
      const formData = new FormData();
      formData.append("product", productId);
      formData.append("reason", reason);
      if (quantity != null) formData.append("quantity", String(quantity));
      if (unitPrice != null) formData.append("unit_price", String(unitPrice));
      (complaintFiles[productId] || []).forEach((f) =>
        formData.append("media", f)
      );

      const res = await fetch("http://localhost:8000/api/complaints/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error(`Lỗi API: ${res.status}`);
      message.success("Đã gửi khiếu nại thành công!");

      // Reset form
      setComplaintTexts((prev) => ({ ...prev, [productId]: "" }));
      setComplaintFiles((prev) => ({ ...prev, [productId]: [] }));
      setOpenComplaint((prev) => ({ ...prev, [productId]: false }));
    } catch (e) {
      console.error(e);
      message.error("Gửi khiếu nại thất bại!");
    } finally {
      setSendingByProduct((prev) => ({ ...prev, [productId]: false }));
    }
  };

  // Fetch dữ liệu từ API
  useEffect(() => {
    setLoading(true);

    const statusParam = status === "completed" ? "success" : status;

    API.get(`orders/?status=${statusParam}`)
      .then((res) => {
        const sortedOrders = res.data.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        setOrders(sortedOrders);
      })
      .catch(() => {
        message.error("Không thể tải đơn hàng");
        setOrders([]);
      })
      .finally(() => setLoading(false));
  }, [status]);

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Skeleton active paragraph={{ rows: 2 }} />
      </div>
    );
  }

  // Empty state
  if (!orders.length) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Empty description="Không có đơn hàng nào" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-0 bg-gray-50">
      <div className="w-full max-w-7xl mx-auto ">
        <Collapse
          accordion
          bordered={false}
          expandIconPosition="end"
          className="card-order-container"
        >
          {orders.map((order) => (
            <Panel
              key={order.id}
              className="card-order"
              header={
                <div className="flex justify-between items-center w-full px-2">
                  <Space size="large">
                    <Text strong>Mã đơn: #{order.id}</Text>
                    <Tag color={statusMap[order.status]?.color || "default"}>
                      {statusMap[order.status]?.label || "Không xác định"}
                    </Tag>
                  </Space>
                  <Space size="large">
                    <Text strong style={{ color: "#27ae60" }}>
                      {Number(order.total_price).toLocaleString()}đ
                    </Text>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      {new Date(order.created_at).toLocaleString("vi-VN")}
                    </Text>
                  </Space>
                </div>
              }
              style={{
                background: "#fff",
                border: "1px solid #f0f0f0",
                borderRadius: 12,
                padding: "4px 12px",
              }}
            >
              <div className="flex flex-col lg:flex-row gap-6">
                {/* BÊN TRÁI - Danh sách sản phẩm trải ngang */}
                <div className="flex-1">
                  {/* Nhóm sản phẩm theo cửa hàng (seller) */}
                  {(() => {
                    const groups = (order.items || []).reduce((acc, item) => {
                      const sid = item.seller_id ?? "unknown";
                      if (!acc[sid]) {
                        acc[sid] = {
                          sellerId: sid,
                          sellerName: item.seller_name || "Cửa hàng",
                          sellerPhone: item.seller_phone || "",
                          items: [],
                        };
                      }
                      acc[sid].items.push(item);
                      return acc;
                    }, {});

                    const groupList = Object.values(groups);

                    const columns = [
                      {
                        title: "Sản phẩm",
                        dataIndex: "product_name",
                        key: "product_name",

                        render: (text, record) => (
                          <div className="flex items-center">
                            <Image
                              src={
                                record.product_image?.startsWith("/")
                                  ? `http://localhost:8000${record.product_image}`
                                  : record.product_image?.startsWith("http")
                                    ? record.product_image
                                    : `http://localhost:8000/media/${record.product_image || ""}`
                              }
                              alt={record.product_name}
                              width={60}
                              height={60}
                              style={{
                                borderRadius: 8,
                                objectFit: "cover",
                                marginRight: 12,
                              }}
                              preview={false}
                            />
                            <span>{record.product_name}</span>
                          </div>
                        ),
                      },
                      {
                        title: "Giá",
                        dataIndex: "price",
                        key: "price",
                        render: (price) => (
                          <Text>{Number(price).toLocaleString()}đ</Text>
                        ),
                        align: "center",
                      },
                      {
                        title: "Số lượng",
                        dataIndex: "quantity",
                        key: "quantity",
                        align: "center",
                      },
                      {
                        title: "Thành tiền",
                        key: "total",
                        render: (record) => (
                          <Text strong style={{ color: "#27ae60" }}>
                            {(
                              Number(record.price) * Number(record.quantity)
                            ).toLocaleString()}
                            đ
                          </Text>
                        ),
                        align: "center",
                      },
                      {
                        title: "",
                        key: "actions",
                        render: (record) =>
                          status === "completed" && (
                            <Button
                              type="link"
                              onClick={() => toggleComplaint(record.product)}
                            >
                              <MdOutlineReportGmailerrorred color="#ff9d00" />
                            </Button>
                          ),
                        align: "center",
                      },
                    ];

                    return groupList.map((group) => (
                      <Card
                        key={`seller-${group.sellerId}`}
                        size="small"
                        title={
                          <div className="flex items-center justify-between">
                            <span>
                              Cửa hàng: <strong>{group.sellerName}</strong>
                              {group.sellerPhone
                                ? ` • ${group.sellerPhone}`
                                : ""}
                            </span>
                          </div>
                        }
                        style={{ marginBottom: 6 }}
                      >
                        <Table
                          pagination={false}
                          dataSource={group.items}
                          rowKey={(item) => item.product}
                          columns={columns}
                          size="small"
                        />

                        {/* Form khiếu nại theo từng sản phẩm trong nhóm cửa hàng */}
                        {group.items.map(
                          (item) =>
                            openComplaint[item.product] && (
                              <div
                                key={`complaint-${item.product}`}
                                className="mt-3 p-4 border rounded-lg bg-gray-50"
                              >
                                <TextArea
                                  rows={3}
                                  value={complaintTexts[item.product] || ""}
                                  onChange={(e) =>
                                    onChangeText(item.product, e.target.value)
                                  }
                                  placeholder="Mô tả vấn đề bạn gặp phải..."
                                />
                                <Upload
                                  multiple
                                  beforeUpload={() => false}
                                  onChange={(info) =>
                                    onChangeFiles(
                                      item.product,
                                      info.fileList.map((f) => f.originFileObj)
                                    )
                                  }
                                  style={{ marginTop: 8 }}
                                >
                                  <Button icon={<UploadOutlined />}>
                                    Chọn ảnh/video
                                  </Button>
                                </Upload>
                                <div className="flex justify-end gap-2 mt-3">
                                  <Button
                                    type="primary"
                                    icon={<SendOutlined />}
                                    loading={sendingByProduct[item.product]}
                                    onClick={() =>
                                      sendComplaint(
                                        item.product,
                                        item.price,
                                        item.quantity
                                      )
                                    }
                                  >
                                    Gửi
                                  </Button>
                                  <Button
                                    icon={<CloseOutlined />}
                                    onClick={() =>
                                      toggleComplaint(item.product)
                                    }
                                  >
                                    Huỷ
                                  </Button>
                                </div>
                              </div>
                            )
                        )}
                      </Card>
                    ));
                  })()}
                </div>
              </div>
            </Panel>
          ))}
        </Collapse>
      </div>
    </div>
  );
};

export default OrderTab;
