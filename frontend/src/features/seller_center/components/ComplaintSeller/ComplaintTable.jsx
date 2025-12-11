import React, { useMemo, useState } from "react";
import { Table, Tag, Space, Button, message, Select } from "antd";
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
  // Local status filter for complaints
  const [status, setStatus] = useState("all");
  const isTiny = typeof window !== 'undefined' && window.matchMedia('(max-width: 360px)').matches;

  const dataView = useMemo(() => {
    if (!Array.isArray(filtered)) return [];
    if (status === "all") return filtered;
    return filtered.filter((item) => String(item.status) === String(status));
  }, [filtered, status]);

  return (
    <ComplaintBaseLayout
      title="QUẢN LÝ KHIẾU NẠI"
      extra={
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            width: 'auto',
            gap: isTiny ? 6 : 8,
            flexWrap: 'wrap',
          }}
        >
          <Select
            size="middle"
            value={status}
            onChange={setStatus}
            style={{ width: isTiny ? 96 : 100, height: isTiny ? 28 : 32 }}
            options={[
              { value: 'all', label: 'Tất cả' },
              { value: 'pending', label: 'Chờ xử lý' },
              { value: 'processing', label: 'Đang xử lý' },
              { value: 'resolved', label: 'Đã xử lý' },
              { value: 'rejected', label: 'Từ chối' },
            ]}
          />
          <Button
            size={isTiny ? 'small' : 'middle'}
            icon={<ReloadOutlined />}
            onClick={onRefresh}
            loading={loading}
          >
            {isTiny ? null : 'Làm mới'}
          </Button>
        </div>
      }
      loading={loading}
      data={dataView}
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