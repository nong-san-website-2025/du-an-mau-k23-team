import React from "react";
import { Table, Tag, Space, Button, message } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import ComplaintBaseLayout from "../../components/ComplaintSeller/ComplaintBaseLayout";

const ComplaintTable = ({
  loading,
  filtered,
  columns,
  onRowClick,
  onSearch,
  onRefresh,
}) => {
  return (
    <ComplaintBaseLayout
      title="QUẢN LÝ KHIẾU NẠI"
      extra={
        <Button
          icon={<ReloadOutlined />}
          onClick={onRefresh}
          loading={loading}
        >
          Làm mới
        </Button>
      }
      loading={loading}
      data={filtered}
      columns={columns}
      onSearch={onSearch}
      onRow={(record) => ({
        className: "row-hover",
        onClick: () => onRowClick(record),
      })}
    />
  );
};

export default ComplaintTable;