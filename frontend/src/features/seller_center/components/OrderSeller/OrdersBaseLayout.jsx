// src/features/seller_center/pages/OrderSeller/OrdersBaseLayout.jsx
import React, { useState } from "react";
import { Row, Col, Input, Select, Card, Table, Typography, Button, Grid } from "antd";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";

const { Title } = Typography;

export default function OrdersBaseLayout({
  title,
  loading,
  data,
  columns,
  onSearch,
  onFilterStatus,
  onRefresh,
  onRow, // 👈 thêm dòng này
  searchPlaceholder = "Tìm theo mã đơn hoặc tên khách hàng",
  statusFilterOptions = [],
}) {
  const [search, setSearch] = useState("");
  const { useBreakpoint } = Grid;
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const handleSearch = (value) => {
    setSearch(value);
    onSearch?.(value);
  };

  const handleStatusChange = (value) => {
    onFilterStatus?.(value);
  };

  return (
    <div style={{ padding: 6, background: "#fff", minHeight: "100vh" }}>
      {/* Tiêu đề */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
        <Col>
          <Title level={2} style={{ paddingLeft: 24, marginBottom: 0 }}>
            {title}
          </Title>
        </Col>
      </Row>

      {/* Thanh tìm kiếm + lọc */}
      <Row
        gutter={12}
        align="middle"
        style={{ paddingLeft: 24, marginBottom: 8, flexWrap: "wrap", gap: 8 }}
      >
        <Col>
          <Input.Search
            placeholder={searchPlaceholder}
            allowClear
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: isMobile ? 280 : 300 }}
            size={isMobile ? "middle" : "large"}
          />
        </Col>

        {statusFilterOptions.length > 0 && (
          <Col>
            <Select
              placeholder="Lọc theo trạng thái"
              style={{ width: isMobile ? 160 : 180 }}
              onChange={handleStatusChange}
              allowClear
              size={isMobile ? "middle" : "large"}
            >
              {statusFilterOptions.map((opt) => (
                <Select.Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Select.Option>
              ))}
            </Select>
          </Col>
        )}

        <Col>
          {onRefresh && (
            <Button icon={<ReloadOutlined />} onClick={onRefresh} size={isMobile ? "small" : "middle"}>
              Làm mới
            </Button>
          )}
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
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <Table
            rowKey="id"
            loading={loading}
            dataSource={data}
            columns={columns}
            bordered
            pagination={{ pageSize: 8, showSizeChanger: false }}
            onRow={onRow} // 👈 truyền sự kiện click row từ component cha
          />
        </div>
      </Card>
    </div>
  );
}
