import React from "react";
import { Button, Popconfirm, Space, Tooltip } from "antd";

// Bảng màu chuẩn cho các hành động
const COLORS = {
  view: "#1677ff",      // Xanh dương
  edit: "#13c2c2",      // Cyan
  lock: "#faad14",      // Vàng cam
  unlock: "#52c41a",    // Xanh lá
  delete: "#ff4d4f",    // Đỏ
  approve: "#389e0d",   // Xanh lá đậm
  reject: "#cf1322",    // Đỏ đậm
};

const ButtonAction = ({ actions, record }) => {
  return (
    <Space size={1} onClick={(e) => e.stopPropagation()}>
      {actions.map((action, index) => {
        // 1. Kiểm tra điều kiện hiển thị
        if (action.show === false) return null;

        const isDisabled = Boolean(action.buttonProps?.disabled);

        // 2. Xử lý màu sắc icon
        const baseColor = COLORS[action.actionType] || "#595959";
        const iconColor = isDisabled ? "#bfbfbf" : baseColor;

        const coloredIcon = action.icon
          ? React.cloneElement(action.icon, {
              style: { color: iconColor, fontSize: 16 },
            })
          : null;

        // 3. Chuẩn bị props cho Button
        const buttonProps = {
          type: action.buttonProps?.type || "text",
          icon: coloredIcon,
          onClick: (e) => {
            e.stopPropagation();
            // Nếu không có confirm thì chạy hàm onClick ngay
            if (!action.confirm && !isDisabled && action.onClick) {
              action.onClick(record);
            }
          },
          ...action.buttonProps,
          style: {
            ...(action.buttonProps?.style || {}),
            ...(isDisabled ? { opacity: 0.65, cursor: "not-allowed" } : {}),
          },
        };

        const tooltipTitle = isDisabled
          ? action.disabledReason || action.tooltip
          : action.tooltip;

        // 4. Render: Có Popconfirm hoặc Button thường
        if (action.confirm && !isDisabled) {
          return (
            <Tooltip key={index} title={tooltipTitle}>
              <Popconfirm
                title={action.confirm.title}
                description={action.confirm.description}
                okText={action.confirm.okText || "Xác nhận"}
                cancelText={action.confirm.cancelText || "Hủy"}
                okButtonProps={{ 
                    danger: action.actionType === 'delete' || action.actionType === 'reject' 
                }}
                onConfirm={(e) => {
                  e?.stopPropagation();
                  action.onClick(record);
                }}
                onCancel={(e) => e?.stopPropagation()}
              >
                <Button {...buttonProps} />
              </Popconfirm>
            </Tooltip>
          );
        }

        return (
          <Tooltip key={index} title={tooltipTitle}>
            <Button {...buttonProps} />
          </Tooltip>
        );
      })}
    </Space>
  );
};

export default ButtonAction;