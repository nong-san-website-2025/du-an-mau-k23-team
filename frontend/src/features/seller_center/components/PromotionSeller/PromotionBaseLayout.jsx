import React, { useState } from "react";
import { Row, Col, Input, Select, Card, Typography, Button, Table } from "antd";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";
const { Title } = Typography;

export default function PromotionBaseLayout({
  title,
  extra,          // ReactNode thêm vào góc phải (nút Tạo, …)
  loading,
  data,
  columns,
  onSearch,
  onFilterStatus,
  searchPlaceholder = "Tìm theo tên hoặc mã",
  statusFilterOptions = [], // [{value, label}, …]
  onRow,
}) {
  const [search, setSearch] = useState("");

  const handleSearch = (val) => {
    setSearch(val);
    onSearch?.(val);
  };
  const handleStatusChange = (v) => onFilterStatus?.(v);

  return (
    <div style={{ padding: 6, background: "#fff", minHeight: "100vh" }}>
      {/* Tiêu đề + nút thêm */}
      <Row justify="space-between" align="middle">
        <Col>
          <Title level={2} style={{ paddingLeft: 24 }}>
            {title}
          </Title>
        </Col>
        <Col style={{ paddingRight: 24 }}>{extra}</Col>
      </Row>

      {/* Thanh tìm + lọc */}
      <Row gutter={12} style={{ paddingLeft: 24, marginBottom: 0 }}>
        <Col>
          <Input.Search
            placeholder={searchPlaceholder}
            allowClear
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 300 }}
          />
        </Col>

        {statusFilterOptions.length > 0 && (
          <Col>
            <Select
              placeholder="Lọc theo trạng thái"
              style={{ width: 180 }}
              onChange={handleStatusChange}
              allowClear
            >
              {statusFilterOptions.map((o) => (
                <Select.Option key={o.value} value={o.value}>
                  {o.label}
                </Select.Option>
              ))}
            </Select>
          </Col>
        )}
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
          rowKey="id"
          loading={loading}
          dataSource={data}
          columns={columns}
          bordered
          pagination={{ pageSize: 8, showSizeChanger: false }}
          onRow={onRow}
        />
      </Card>
    </div>
  );
}