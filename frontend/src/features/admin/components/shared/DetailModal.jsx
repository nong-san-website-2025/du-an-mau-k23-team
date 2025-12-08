// src/components/common/DetailModal.jsx
import React from "react";
import { Modal, Descriptions, Avatar, Tag, Empty, Tabs } from "antd";
import NoImage from "../../../../components/shared/NoImage";

const { TabPane } = Tabs;

/**
 * Dùng để hiển thị thông tin chi tiết của bất kỳ đối tượng nào
 *
 * @param {{
 *   open: boolean,
 *   title: string,
 *   onCancel: function,
 *   width?: number,
 *   data: object,
 *   fields: { label: string, key: string, icon?: ReactNode, render?: (val, data) => ReactNode }[],
 *   avatar?: string,
 *   tabs?: { key: string, label: string, content: ReactNode }[],
 *   extraHeader?: ReactNode,
 * }}
 */
export default function DetailModal({
  open,
  title,
  onCancel,
  width = 800,
  data,
  fields = [],
  avatar,
  tabs,
  extraHeader,
}) {
  const [activeTab, setActiveTab] = React.useState("info");

  const renderDescriptions = () => {
    if (!data) return <Empty description="Không có dữ liệu" />;

    return (
      <Descriptions
        bordered
        column={1}
        size="middle"
        labelStyle={{ width: 200, fontWeight: 500 }}
        contentStyle={{ background: "#fff" }}
      >
        {fields.map((field) => (
          <Descriptions.Item
            key={field.key}
            label={
              <span style={{ display: "flex", alignItems: "center" }}>
                {field.icon && (
                  <span style={{ marginRight: 6 }}>{field.icon}</span>
                )}
                {field.label}
              </span>
            }
          >
            {field.render
              ? field.render(data[field.key], data)
              : (data[field.key] ?? "-")}
          </Descriptions.Item>
        ))}
      </Descriptions>
    );
  };

  return (
    <Modal
      open={open}
      onCancel={(e) => {
        e.stopPropagation();
        onCancel?.();
      }}
      footer={null}
      title={title}
      width={width}
      destroyOnClose
      bodyStyle={{ maxHeight: "80vh", overflowY: "auto" }}
      centered
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ display: "flex", gap: 24 }}
      >
        {/* Avatar / Ảnh */}
        <div style={{ flex: "0 0 220px", textAlign: "center" }}>
          {avatar ? (
            <Avatar
              src={avatar}
              size={120}
              style={{
                border: "2px solid #eee",
                marginBottom: 12,
              }}
            />
          ) : (
            <NoImage width={220} height={160} text="Không có ảnh" />
          )}
          {extraHeader}
        </div>

        {/* Nội dung */}
        <div style={{ flex: 1 }}>
          {tabs ? (
            <Tabs
              activeKey={activeTab}
              onChange={(key) => setActiveTab(key)}
              items={[
                {
                  key: "info",
                  label: "Thông tin",
                  children: renderDescriptions(),
                },
                ...tabs.map((t) => ({
                  key: t.key,
                  label: t.label,
                  children: t.content,
                })),
              ]}
            />
          ) : (
            renderDescriptions()
          )}
        </div>
      </div>
    </Modal>
  );
}
