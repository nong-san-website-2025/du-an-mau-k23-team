import React, { useState } from "react";
import { Row, Col, Input, Card, Typography, Button, Table, Select } from "antd";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";

const { Title } = Typography;

export default function ComplaintBaseLayout({
  title,
  extra,              // nút bổ sung (Tạo, Reload, v.v.)
  loading,
  data,
  columns,
  onSearch,
  searchPlaceholder = "Tìm theo tên khách, tên SP, mã đơn…",
  onStatusFilterChange,
  statusFilter,
  onRow,
}) {
  const [search, setSearch] = useState("");

  const handleSearch = (v) => {
    setSearch(v);
    onSearch?.(v);
  };

  return (
    <div style={{ padding: 6, background: "#fff", minHeight: "100vh" }}>
      {/* Tiêu đề + nút */}
      <Row justify="space-between" align="middle">
        <Col>
          <Title level={2} style={{ paddingLeft: 24 }}>
            {title}
          </Title>
        </Col>
        <Col style={{ paddingRight: 24 }}>{extra}</Col>
      </Row>

      {/* Thanh tìm và lọc */}
      <Row style={{ paddingLeft: 24, marginBottom: 16, gap: 16 }} align="middle">
        <Col>
          <Input.Search
            placeholder={searchPlaceholder}
            allowClear
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 320 }}
          />
        </Col>
        <Col>
          <Select
            placeholder="Lọc theo trạng thái"
            allowClear
            value={statusFilter}
            onChange={onStatusFilterChange}
            style={{ width: 200 }}
            options={[
              { label: "Chờ xử lý", value: "pending" },
              { label: "Đã xử lý", value: "resolved" },
              { label: "Đã từ chối", value: "rejected" },
            ]}
          />
        </Col>
      </Row>

      {/* Bảng */}
      <Card
        style={{
          borderRadius: 8,
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          margin: "0 0px",
        }}
      >
        <Table
          size="small"
          rowKey="id"
          loading={loading}
          dataSource={data}
          columns={columns}
          bordered
          pagination={{ pageSize: 10, showSizeChanger: false }}
          onRow={onRow}
        />
      </Card>
    </div>
  );
}