import React, { useState, useEffect } from "react";
import {
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Spin,
  Empty,
  Card,
  Image,
  Badge,
  Statistic,
  Row,
  Col,
  Divider,
  Tooltip,
  Input,
  Select,
} from "antd";
import {
  EyeOutlined,
  SearchOutlined,
  FilterOutlined,
  ShoppingOutlined,
  InboxOutlined,
  StarOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import { intcomma, intcommaGeneral } from "../../../../utils/format";

const { Search } = Input;
const { Option } = Select;

const statusColorMap = {
  pending: "orange",
  approved: "green",
  rejected: "red",
  self_rejected: "volcano",
  banned: "red",
};

const statusLabelMap = {
  pending: "Chờ duyệt",
  approved: "Đang bán",
  rejected: "Bị từ chối",
  self_rejected: "Tự ẩn",
  banned: "Bị cấm",
};

export default function ProductsTab({ sellerId }) {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [quickViewVisible, setQuickViewVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchProducts = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/sellers/${sellerId}/products/`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      const data = res.data.results || res.data;
      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    if (sellerId) {
      fetchProducts();
    }
  }, [sellerId, fetchProducts]);

  // Tính toán thống kê
  const stats = React.useMemo(() => {
    const total = products.length;
    const totalSold = products.reduce((sum, p) => sum + (p.sold || 0), 0);
    const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
    const avgRating =
      products.reduce((sum, p) => sum + (p.rating || 0), 0) / total || 0;

    return {
      total,
      totalSold,
      totalStock,
      avgRating: avgRating.toFixed(1),
    };
  }, [products]);

  // Lọc sản phẩm
  useEffect(() => {
    let filtered = products;

    // Lọc theo tìm kiếm
    if (searchText) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchText.toLowerCase()) ||
          p.id.toString().includes(searchText)
      );
    }

    // Lọc theo trạng thái
    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    setFilteredProducts(filtered);
  }, [searchText, statusFilter, products]);

  const handleQuickView = (product) => {
    setQuickViewProduct(product);
    setQuickViewVisible(true);
  };

  const columns = [
    {
      title: "Sản phẩm",
      key: "product",
      width: 280,
      fixed: "left",
      render: (_, record) => {
        // 🔥 Lấy ảnh đúng từ API
        const imageUrl =
          record.main_image?.image || record.images?.[0]?.image || null;

        return (
          <Space size={12}>
            {/* ==== ẢNH SẢN PHẨM ==== */}
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 8,
                overflow: "hidden",
                backgroundColor: "#f5f5f5",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={record.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <InboxOutlined style={{ fontSize: 24, color: "#bfbfbf" }} />
              )}
            </div>

            {/* ==== THÔNG TIN ==== */}
            <Space direction="vertical" size={4} style={{ flex: 1 }}>
              <Tooltip title={record.name}>
                <div
                  style={{
                    fontWeight: 500,
                    color: "#1f2937",
                    fontSize: 14,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: 180,
                  }}
                >
                  {record.name}
                </div>
              </Tooltip>

              <div
                style={{
                  fontSize: 12,
                  color: "#9ca3af",
                }}
              >
                ID: {record.id}
              </div>
            </Space>
          </Space>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      align: "center",
      render: (status) => (
        <Tag
          color={statusColorMap[status]}
          style={{ margin: 0, fontWeight: 500 }}
        >
          {statusLabelMap[status]}
        </Tag>
      ),
    },
    {
      title: "Tồn kho",
      dataIndex: "stock",
      key: "stock",
      width: 100,
      align: "center",
      sorter: (a, b) => a.stock - b.stock,
      render: (stock) => (
        <Badge
          count={stock}
          overflowCount={9999}
          style={{
            backgroundColor:
              stock > 10 ? "#52c41a" : stock > 0 ? "#faad14" : "#ff4d4f",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            padding: "0 8px",
          }}
        />
      ),
    },
    {
      title: "Đã bán",
      dataIndex: "sold",
      key: "sold",
      width: 100,
      align: "center",
      sorter: (a, b) => (a.sold || 0) - (b.sold || 0),
      render: (sold) => (
        <span style={{ color: "#1890ff", fontWeight: 500, fontSize: 14 }}>
          {sold || 0}
        </span>
      ),
    },
    {
      title: "Giá bán",
      key: "price",
      width: 140,
      align: "right",
      sorter: (a, b) =>
        (a.discounted_price || a.original_price) -
        (b.discounted_price || b.original_price),
      render: (_, record) => (
        <Space direction="vertical" size={2} style={{ width: "100%" }}>
          {record.discounted_price > 0 ? (
            <>
              <div
                style={{
                  textDecoration: "line-through",
                  color: "#9ca3af",
                  fontSize: 12,
                }}
              >
                {intcomma(record.original_price)} ₫ 
              </div>
              <div style={{ color: "#ef4444", fontWeight: 600, fontSize: 15 }}>
                {intcomma(record.discounted_price)} ₫
              </div>
            </>
          ) : (
            <div style={{ fontWeight: 600, color: "#1f2937", fontSize: 15 }}>
              {intcomma(record.original_price)} ₫ 
            </div>
          )}
        </Space>
      ),
    },
    {
      title: "Đánh giá",
      key: "rating",
      width: 120,
      align: "center",
      sorter: (a, b) => (a.rating || 0) - (b.rating || 0),
      render: (_, record) => (
        <Space direction="vertical" size={2} align="center">
          <div style={{ fontWeight: 600, color: "#faad14", fontSize: 14 }}>
            <StarOutlined /> {record.rating || 0}
          </div>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>
            {record.review_count} đánh giá
          </div>
        </Space>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      width: 120,
      align: "center",
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      render: (date) => (
        <Tooltip title={dayjs(date).format("DD/MM/YYYY HH:mm")}>
          <div style={{ fontSize: 13, color: "#6b7280" }}>
            {dayjs(date).format("DD/MM/YYYY")}
          </div>
        </Tooltip>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 100,
      fixed: "right",
      align: "center",
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleQuickView(record)}
        >
          Xem
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: "0 0 24px 0" }}>
      {/* Thống kê tổng quan */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: 12,
            }}
          >
            <Statistic
              title={
                <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 14 }}>
                  Tổng sản phẩm
                </span>
              }
              value={stats.total}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: "#fff", fontSize: 28, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              borderRadius: 12,
            }}
          >
            <Statistic
              title={
                <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 14 }}>
                  Đã bán
                </span>
              }
              value={stats.totalSold}
              prefix={<DollarOutlined />}
              valueStyle={{ color: "#fff", fontSize: 28, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
              borderRadius: 12,
            }}
          >
            <Statistic
              title={
                <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 14 }}>
                  Tồn kho
                </span>
              }
              value={stats.totalStock}
              prefix={<InboxOutlined />}
              valueStyle={{ color: "#fff", fontSize: 28, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
              borderRadius: 12,
            }}
          >
            <Statistic
              title={
                <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 14 }}>
                  Đánh giá TB
                </span>
              }
              value={stats.avgRating}
              prefix={<StarOutlined />}
              suffix="/5"
              valueStyle={{ color: "#fff", fontSize: 28, fontWeight: 600 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Bộ lọc và tìm kiếm */}
      <Card
        style={{
          borderRadius: 12,
          marginBottom: 16,
          boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
        }}
        bodyStyle={{ padding: 16 }}
      >
        <Row gutter={16} align="middle">
          <Col xs={24} sm={24} md={12} lg={14}>
            <Search
              placeholder="Tìm kiếm theo tên hoặc ID sản phẩm..."
              allowClear
              size="large"
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: "100%" }}
            />
          </Col>
          <Col xs={24} sm={12} md={6} lg={5}>
            <Select
              size="large"
              style={{ width: "100%" }}
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="Lọc theo trạng thái"
              suffixIcon={<FilterOutlined />}
            >
              <Option value="all">Tất cả trạng thái</Option>
              <Option value="pending">Chờ duyệt</Option>
              <Option value="approved">Đang bán</Option>
              <Option value="rejected">Bị từ chối</Option>
              <Option value="self_rejected">Tự ẩn</Option>
              <Option value="banned">Bị cấm</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6} lg={5}>
            <div
              style={{
                fontSize: 14,
                color: "#6b7280",
                textAlign: "right",
                padding: "0 8px",
              }}
            >
              Hiển thị: <strong>{filteredProducts.length}</strong> /{" "}
              {products.length} sản phẩm
            </div>
          </Col>
        </Row>
      </Card>

      {/* Bảng sản phẩm */}
      <Card
        style={{
          borderRadius: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
        bodyStyle={{ padding: 0 }}
      >
        <Spin spinning={loading} size="large">
          {filteredProducts.length > 0 ? (
            <Table
              columns={columns}
              dataSource={filteredProducts}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: ["10", "20", "50"],
                showTotal: (total) => `Tổng ${total} sản phẩm`,
                style: { padding: "16px 24px" },
              }}
              scroll={{ x: 1200 }}
              style={{
                borderRadius: 12,
              }}
            />
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: "#9ca3af" }}>
                  {searchText || statusFilter !== "all"
                    ? "Không tìm thấy sản phẩm phù hợp"
                    : "Chưa có sản phẩm nào"}
                </span>
              }
              style={{ padding: "60px 0" }}
            />
          )}
        </Spin>
      </Card>

      {/* Modal xem nhanh */}
      <Modal
        title={
          <div style={{ fontSize: 18, fontWeight: 600, color: "#1f2937" }}>
            Chi tiết sản phẩm
          </div>
        }
        open={quickViewVisible}
        onCancel={() => setQuickViewVisible(false)}
        width={800}
        footer={null}
        centered
        style={{ top: 20 }}
      >
        {quickViewProduct && (
          <div>
            <Row gutter={24}>
              {/* Cột trái - Hình ảnh */}
              <Col xs={24} md={10}>
                {quickViewProduct.image ? (
                  <Image
                    src={quickViewProduct.image}
                    alt={quickViewProduct.name}
                    style={{
                      width: "100%",
                      borderRadius: 12,
                      objectFit: "cover",
                    }}
                    preview={{
                      mask: (
                        <div style={{ fontSize: 14 }}>
                          <EyeOutlined /> Phóng to
                        </div>
                      ),
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: 300,
                      backgroundColor: "#f5f5f5",
                      borderRadius: 12,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#bfbfbf",
                    }}
                  >
                    <InboxOutlined style={{ fontSize: 48, marginBottom: 8 }} />
                    <div>Không có hình ảnh</div>
                  </div>
                )}
              </Col>

              {/* Cột phải - Thông tin */}
              <Col xs={24} md={14}>
                <Space direction="vertical" size={16} style={{ width: "100%" }}>
                  <div>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: 20,
                        fontWeight: 600,
                        color: "#1f2937",
                        lineHeight: 1.4,
                      }}
                    >
                      {quickViewProduct.name}
                    </h2>
                  </div>

                  <div>
                    <Tag
                      color={statusColorMap[quickViewProduct.status]}
                      style={{
                        fontSize: 13,
                        padding: "4px 12px",
                        fontWeight: 500,
                      }}
                    >
                      {statusLabelMap[quickViewProduct.status]}
                    </Tag>
                  </div>

                  <Divider style={{ margin: 0 }} />

                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <div
                        style={{
                          fontSize: 13,
                          color: "#9ca3af",
                          marginBottom: 4,
                        }}
                      >
                        Giá bán
                      </div>
                      {quickViewProduct.discounted_price > 0 ? (
                        <>
                          <div
                            style={{
                              textDecoration: "line-through",
                              color: "#9ca3af",
                              fontSize: 14,
                            }}
                          >
                            {Number(
                              quickViewProduct.original_price
                            ).toLocaleString("vi-VN")}
                            ₫
                          </div>
                          <div
                            style={{
                              fontSize: 24,
                              color: "#ef4444",
                              fontWeight: 700,
                            }}
                          >
                            {Number(
                              quickViewProduct.discounted_price
                            ).toLocaleString("vi-VN")}
                            ₫
                          </div>
                        </>
                      ) : (
                        <div
                          style={{
                            fontSize: 24,
                            fontWeight: 700,
                            color: "#1f2937",
                          }}
                        >
                          {Number(
                            quickViewProduct.original_price
                          ).toLocaleString("vi-VN")}
                          ₫
                        </div>
                      )}
                    </Col>

                    <Col span={12}>
                      <div
                        style={{
                          fontSize: 13,
                          color: "#9ca3af",
                          marginBottom: 4,
                        }}
                      >
                        Đánh giá
                      </div>
                      <div
                        style={{
                          fontSize: 20,
                          color: "#faad14",
                          fontWeight: 600,
                        }}
                      >
                        <StarOutlined /> {quickViewProduct.rating || 0}
                      </div>
                      <div style={{ fontSize: 13, color: "#9ca3af" }}>
                        {quickViewProduct.review_count} lượt đánh giá
                      </div>
                    </Col>

                    <Col span={12}>
                      <div
                        style={{
                          fontSize: 13,
                          color: "#9ca3af",
                          marginBottom: 4,
                        }}
                      >
                        Tồn kho
                      </div>
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 600,
                          color: "#1f2937",
                        }}
                      >
                        {quickViewProduct.stock}{" "}
                        <span style={{ fontSize: 14, color: "#9ca3af" }}>
                          {quickViewProduct.unit}
                        </span>
                      </div>
                    </Col>

                    <Col span={12}>
                      <div
                        style={{
                          fontSize: 13,
                          color: "#9ca3af",
                          marginBottom: 4,
                        }}
                      >
                        Đã bán
                      </div>
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 600,
                          color: "#1890ff",
                        }}
                      >
                        {quickViewProduct.sold || 0}
                      </div>
                    </Col>
                  </Row>

                  <Divider style={{ margin: 0 }} />

                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "#9ca3af",
                        marginBottom: 6,
                      }}
                    >
                      Danh mục
                    </div>
                    <div style={{ fontSize: 14, color: "#1f2937" }}>
                      {quickViewProduct.category?.name || "—"} /{" "}
                      {quickViewProduct.subcategory?.name || "—"}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "#9ca3af",
                        marginBottom: 6,
                      }}
                    >
                      Ngày tạo
                    </div>
                    <div style={{ fontSize: 14, color: "#1f2937" }}>
                      {dayjs(quickViewProduct.created_at).format(
                        "DD/MM/YYYY HH:mm"
                      )}
                    </div>
                  </div>
                </Space>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
}
