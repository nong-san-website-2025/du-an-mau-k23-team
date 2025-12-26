import React, { useState } from "react";
import { Table, Checkbox, Tag, Badge, Typography, Space, Image } from "antd";
import { EditOutlined, DeleteOutlined, PictureOutlined } from "@ant-design/icons";
import moment from "moment";
import { intcomma } from "../../../../utils/format";
import ButtonAction from "../../../../components/ButtonAction";

const { Text } = Typography;

// [CẤU HÌNH] Thay đổi URL này thành domain backend của bạn nếu ảnh bị lỗi
const API_BASE_URL = "http://localhost:8000"; 

export default function FlashSaleTable({
  data,
  loading,
  onEdit,
  onDelete,
  selectedRows,
  onSelectionChange,
}) {
  const isMobile =
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 480px)").matches;
  const [selectAll, setSelectAll] = useState(false);

  // --- Handle Selection ---
  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    if (checked) {
      const allIds = data.map((record) => record.id);
      onSelectionChange(allIds);
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectRow = (id, checked) => {
    let newSelection = [...selectedRows];
    if (checked) {
      if (!newSelection.includes(id)) {
        newSelection.push(id);
      }
    } else {
      newSelection = newSelection.filter((item) => item !== id);
      setSelectAll(false);
    }
    onSelectionChange(newSelection);
  };

  // --- Action Config ---
  const getActions = (record) => [
    {
      actionType: "edit",
      tooltip: "Chỉnh sửa chương trình",
      icon: <EditOutlined />,
      onClick: (r) => onEdit(r),
    },
    {
      actionType: "delete",
      tooltip: "Xóa chương trình",
      icon: <DeleteOutlined />,
      confirm: {
        title: "Xóa Flash Sale?",
        description: "Hành động này không thể hoàn tác.",
        okText: "Xóa ngay",
        cancelText: "Hủy",
      },
      onClick: (r) => onDelete(r),
    },
  ];

  // --- Table Columns (Main Table) ---
  const columns = [
    {
      title: (
        <Checkbox
          checked={selectAll && data.length > 0}
          indeterminate={
            selectedRows.length > 0 && selectedRows.length < data.length
          }
          onChange={handleSelectAll}
        />
      ),
      dataIndex: "select",
      width: isMobile ? 40 : 50,
      align: "center",
      render: (_, record) => (
        <Checkbox
          checked={selectedRows.includes(record.id)}
          onChange={(e) => handleSelectRow(record.id, e.target.checked)}
        />
      ),
    },
    {
      title: "Khung giờ",
      key: "time",
      width: isMobile ? 220 : 250,
      sorter: (a, b) =>
        moment(a.start_time).unix() - moment(b.start_time).unix(),
      render: (_, record) => {
        const start = moment(record.start_time);
        const end = moment(record.end_time);
        return (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <Text strong style={{ whiteSpace: "nowrap" }}>
              {start.format("HH:mm DD/MM")} - {end.format("HH:mm DD/MM")}
            </Text>
            <Text
              type="secondary"
              style={{ fontSize: 12, whiteSpace: "nowrap" }}
            >
              {end.diff(start, "hours")} giờ diễn ra
            </Text>
          </div>
        );
      },
    },
    {
      title: "Số lượng sản phẩm",
      key: "product_count",
      align: "center",
      width: isMobile ? 140 : undefined,
      sorter: (a, b) =>
        (a.flashsale_products?.length || 0) -
        (b.flashsale_products?.length || 0),
      render: (_, record) => {
        const count = record.flashsale_products?.length || 0;
        return (
          <Tag color="geekblue" style={{ fontSize: 13, padding: "4px 10px" }}>
            <span style={{ whiteSpace: "nowrap" }}>{count} sản phẩm</span>
          </Tag>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "is_active",
      key: "status",
      width: isMobile ? 140 : 180,
      sorter: (a, b) => Number(a.is_active) - Number(b.is_active),
      render: (isActive, record) => {
        const now = moment();
        const start = moment(record.start_time);
        const end = moment(record.end_time);

        let statusConfig = {
          color: "default",
          text: "Đã kết thúc",
          status: "default",
        };

        if (!isActive) {
          statusConfig = { color: "error", text: "Đang ẩn", status: "error" };
        } else if (now.isBetween(start, end)) {
          statusConfig = {
            color: "processing",
            text: "Đang diễn ra",
            status: "processing",
          };
        } else if (now.isBefore(start)) {
          statusConfig = {
            color: "warning",
            text: "Sắp diễn ra",
            status: "warning",
          };
        }

        return (
          <Badge
            status={statusConfig.status}
            text={
              <span style={{ whiteSpace: "nowrap" }}>{statusConfig.text}</span>
            }
          />
        );
      },
    },
    {
      title: "Thao tác",
      key: "action",
      width: 100,
      fixed: isMobile ? undefined : "right",
      render: (_, record) => (
        <ButtonAction actions={getActions(record)} record={record} />
      ),
    },
  ];

  // --- Nested Product Table (Expanded) ---
  const expandedRowRender = (record) => {
    const productColumns = [
      {
        title: <PictureOutlined />, // Icon Cột Ảnh
        dataIndex: "image", // API key khớp với Serializer
        key: "image",
        width: 60,
        align: "center",
        render: (src) => {
          // Xử lý URL: Nếu src bắt đầu bằng http thì giữ nguyên, nếu không thì nối thêm API_BASE_URL
          const imageUrl = src
            ? src.startsWith("http")
              ? src
              : `${API_BASE_URL}${src}`
            : null;

          return (
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 4,
                border: "1px solid #f0f0f0",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#fff",
              }}
            >
              <Image
                src={imageUrl || "https://placehold.co/40x40?text=NoImg"}
                width={40}
                height={40}
                style={{ objectFit: "cover" }}
                fallback="https://placehold.co/40x40?text=Error"
                preview={true}
              />
            </div>
          );
        },
      },
      {
        title: "Sản phẩm",
        dataIndex: "product_name",
        key: "name",
        render: (text) => <Text strong>{text}</Text>,
      },
      {
        title: "Giá gốc",
        dataIndex: "original_price",
        key: "original",
        render: (val) => (
          <Text delete type="secondary">
            {intcomma(val)}đ
          </Text>
        ),
      },
      {
        title: "Giá Flash",
        dataIndex: "flash_price",
        key: "flash",
        render: (val, r) => (
          <Space>
            <Text type="danger" strong>
              {intcomma(val)}đ
            </Text>
            <Tag color="red">
              -
              {Math.round(
                ((r.original_price - val) / r.original_price) * 100
              )}
              %
            </Tag>
          </Space>
        ),
      },
      {
        title: "Đã bán / Tổng",
        key: "stock",
        render: (_, r) => {
          const sold = r.stock - r.remaining_stock;
          const percent = r.stock > 0 ? Math.round((sold / r.stock) * 100) : 0;
          return (
            <div style={{ width: 150 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                }}
              >
                <span>Đã bán: {sold}</span>
                <span>Tổng: {r.stock}</span>
              </div>
              <div
                style={{
                  height: 6,
                  background: "#f0f0f0",
                  borderRadius: 3,
                  marginTop: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${percent}%`,
                    background: "#faad14",
                    height: "100%",
                  }}
                />
              </div>
            </div>
          );
        },
      },
    ];

    return (
      <Table
        columns={productColumns}
        dataSource={record.flashsale_products}
        pagination={false}
        size="small"
        rowKey="id"
        bordered
      />
    );
  };

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="id"
      loading={loading}
      expandable={{
        expandedRowRender,
        rowExpandable: (record) => record.flashsale_products?.length > 0,
      }}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
      }}
      onChange={() => {
        setSelectAll(false);
        onSelectionChange([]);
      }}
      bordered
      size="small"
      tableLayout="fixed"
      scroll={{ x: isMobile ? 700 : undefined }}
    />
  );
}