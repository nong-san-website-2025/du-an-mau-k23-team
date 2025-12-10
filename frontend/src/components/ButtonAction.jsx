import React from "react";
import { Button, Popconfirm, Space, Tooltip } from "antd";

// Bảng màu chuẩn UX cho các hành động
const ACTION_COLORS = {
  view: "#1677ff",      // Xanh dương (Thông tin)
  edit: "#faad14",      // Vàng cam (Cảnh báo nhẹ / Sửa) - hoặc dùng #13c2c2 (Cyan)
  update: "#13c2c2",    // Cyan
  delete: "#ff4d4f",    // Đỏ (Nguy hiểm)
  reject: "#cf1322",    // Đỏ đậm
  approve: "#52c41a",   // Xanh lá (Tích cực)
  lock: "#8c8c8c",      // Xám
  unlock: "#52c41a",    // Xanh lá
  download: "#722ed1",  // Tím
};

const ButtonAction = ({ actions, record }) => {
  return (
    <Space size={4} onClick={(e) => e.stopPropagation()}>
      {actions.map((action, index) => {
        // 1. Kiểm tra điều kiện hiển thị
        if (action.show === false) return null;

        const isDisabled = Boolean(action.buttonProps?.disabled);
        
        // 2. Xác định màu sắc icon
        // Ưu tiên màu trong style -> màu theo actionType -> màu mặc định
        const baseColor = action.buttonProps?.style?.color || ACTION_COLORS[action.actionType] || "#595959";
        const finalColor = isDisabled ? "rgba(0, 0, 0, 0.25)" : baseColor;

        // Clone icon để gán màu
        const coloredIcon = action.icon
          ? React.cloneElement(action.icon, {
              style: { color: finalColor, fontSize: 16 },
            })
          : null;

        // 3. Chuẩn bị props cho Button
        const commonButtonProps = {
          type: "text", // Mặc định là text để bảng trông gọn gàng
          size: "small",
          ...action.buttonProps,
          icon: coloredIcon,
          disabled: isDisabled,
          style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            ...action.buttonProps?.style,
            color: finalColor, // Override text color nếu có label
          },
          onClick: (e) => {
            // Quan trọng: Chặn sự kiện nổi bọt
            e.stopPropagation();
            // Nếu không có Popconfirm và không disabled thì mới chạy onClick
            if (!action.confirm && !isDisabled && action.onClick) {
              action.onClick(record);
            }
          },
        };

        const renderButton = <Button {...commonButtonProps} />;

        // Nội dung Tooltip: Nếu disabled thì hiện lý do, không thì hiện tooltip hành động
        const tooltipContent = isDisabled
          ? action.disabledReason || "Hành động bị khóa"
          : action.tooltip;

        // 4. Render: Popconfirm hoặc Button thường
        if (action.confirm && !isDisabled) {
          return (
            <Tooltip key={index} title={tooltipContent}>
              <Popconfirm
                title={action.confirm.title}
                description={action.confirm.description}
                okText={action.confirm.okText || "Xác nhận"}
                cancelText={action.confirm.cancelText || "Hủy"}
                okButtonProps={{ 
                  danger: action.confirm.isDanger || ['delete', 'reject'].includes(action.actionType) 
                }}
                onConfirm={(e) => {
                  e?.stopPropagation();
                  action.onClick(record);
                }}
                onCancel={(e) => e?.stopPropagation()}
              >
                {renderButton}
              </Popconfirm>
            </Tooltip>
          );
        }

        return (
          <Tooltip key={index} title={tooltipContent}>
            {renderButton}
          </Tooltip>
        );
      })}
    </Space>
  );
};

export default ButtonAction;