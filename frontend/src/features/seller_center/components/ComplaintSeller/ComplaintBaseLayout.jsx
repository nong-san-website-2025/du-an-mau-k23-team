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
  const isTiny = typeof window !== "undefined" && window.matchMedia("(max-width: 360px)").matches;
  const isSmall = typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;
  const isDesktop = typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;
  const searchMaxWidth = isTiny ? undefined : isDesktop ? 560 : isSmall ? 420 : 520;

  const handleSearch = (v) => {
    setSearch(v);
    onSearch?.(v);
  };

  return (
    <div style={{ padding: 6, background: "#fff", minHeight: "100vh" }}>
      {/* Tiêu đề */}
      <Row align="middle">
        <Col>
          <Title level={2} style={{ paddingLeft: 24 }}>
            {title}
          </Title>
        </Col>
      </Row>

      {/* Thanh công cụ: Tìm kiếm + Extra (lọc, làm mới) */}
      <Row
        style={{
          padding: isTiny ? '0 12px' : '0 24px',
          marginTop: 8,
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'nowrap',
        }}
      >
        <Col style={{ flex: '1 1 280px', minWidth: isTiny ? 120 : 140, maxWidth: searchMaxWidth }}>
          <Input.Search
            placeholder={searchPlaceholder}
            allowClear
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: '100%' }}
          />
        </Col>
        <Col style={{ flex: '0 0 auto', marginLeft: 'auto' }}>{extra}</Col>
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