import React, { useState } from "react";
import { Row, Col, Input, Select, Card, Table, Typography, Button } from "antd";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";

const { Title } = Typography;

export default function ProductBaseLayout({
  title,
  loading,
  data,
  columns,
  onSearch,
  onFilterStatus,
  onAddNew,
  onRow,
  customTable, // 👈 Thêm prop này
  searchPlaceholder = "Tìm sản phẩm theo tên hoặc mã",
  statusFilterOptions = [
    { value: "", label: "Tất cả" },
    { value: "pending", label: "Chờ duyệt" },
    { value: "approved", label: "Đã duyệt" },
    { value: "rejected", label: "Bị từ chối" },
  ],
  showAddButton = true,
  addButtonText = "Thêm sản phẩm",
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const handleSearch = (value) => {
    setSearch(value);
    onSearch?.(value);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    onFilterStatus?.(value);
  };

  return (
    <div style={{ padding: 6, background: "#fff", minHeight: "100vh" }}>
      {/* Tiêu đề */}
      <Row justify="space-between" align="middle">
        <Col>
          <Title level={2} style={{ paddingLeft: 24 }}>
            {title}
          </Title>
        </Col>
        {showAddButton && (
          <Col style={{ paddingRight: 24 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onAddNew}
              size="large"
            >
              {addButtonText}
            </Button>
          </Col>
        )}
      </Row>

      {/* Thanh tìm kiếm + lọc */}
      <Row gutter={12} style={{ marginBottom: 0 }}>
        <Col>
          <Input.Search
            placeholder={searchPlaceholder}
            allowClear
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            onSearch={handleSearch}
            style={{ width: 300, paddingLeft: 24 }}
          />
        </Col>

        <Col>
          <Select
            placeholder="Lọc theo trạng thái"
            style={{ width: 180 }}
            value={statusFilter || undefined}
            onChange={handleStatusChange}
            allowClear
          >
            {statusFilterOptions.map((opt) => (
              <Select.Option key={opt.value} value={opt.value}>
                {opt.label}
              </Select.Option>
            ))}
          </Select>
        </Col>
      </Row>

      {/* Bảng dữ liệu */}
      <Card
        style={{
          borderRadius: 8,
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          padding: "0px",
        }}
      >
        {customTable || (
          <Table
            rowKey="id"
            loading={loading}
            dataSource={data}
            columns={columns}
            bordered
            pagination={{ pageSize: 10, showSizeChanger: true }}
            onRow={onRow}
          />
        )}
      </Card>
    </div>
  );
}