import React from "react";
import { Button, Popconfirm, Space, Tooltip } from "antd";

// 1. Cấu hình màu sắc: Bao gồm cả màu chữ (color) và màu nền (bg)
// Màu nền thường dùng level 1 hoặc opacity thấp của màu chính
const ACTION_STYLES = {
  view:     { color: "#1677ff", bg: "#e6f4ff", borderColor: "#bae0ff" }, // Blue
  edit:     { color: "#faad14", bg: "#fff7e6", borderColor: "#ffe7ba" }, // Orange
  update:   { color: "#13c2c2", bg: "#e6fffb", borderColor: "#87e8de" }, // Cyan
  delete:   { color: "#ff4d4f", bg: "#fff1f0", borderColor: "#ffccc7" }, // Red
  reject:   { color: "#cf1322", bg: "#fff1f0", borderColor: "#ffa39e" }, // Dark Red
  approve:  { color: "#52c41a", bg: "#f6ffed", borderColor: "#b7eb8f" }, // Green
  lock:     { color: "#8c8c8c", bg: "#f5f5f5", borderColor: "#d9d9d9" }, // Grey
  unlock:   { color: "#52c41a", bg: "#f6ffed", borderColor: "#b7eb8f" }, // Green
  download: { color: "#722ed1", bg: "#f9f0ff", borderColor: "#efdbff" }, // Purple
};

const ButtonAction = ({ actions, record }) => {
  return (
    <Space size={8} onClick={(e) => e.stopPropagation()}>
      {actions.map((action, index) => {
        // 1. Kiểm tra điều kiện hiển thị
        if (action.show === false) return null;

        const isDisabled = Boolean(action.buttonProps?.disabled);
        
        // 2. Lấy style config
        // Nếu không có trong map thì fallback về màu xám mặc định
        const styleConfig = ACTION_STYLES[action.actionType] || { 
            color: "#595959", 
            bg: "#f5f5f5", 
            borderColor: "transparent" 
        };

        const finalColor = isDisabled ? "rgba(0, 0, 0, 0.25)" : styleConfig.color;
        const finalBg    = isDisabled ? "rgba(0, 0, 0, 0.04)" : styleConfig.bg;
        const finalBorder= isDisabled ? "transparent" : "transparent"; // Để transparent cho đẹp, hoặc dùng styleConfig.borderColor nếu muốn viền

        // 3. Chuẩn bị props cho Button
        const commonButtonProps = {
          type: "text", // Dùng text để dễ custom background
          shape: "circle", // Quan trọng: Bo tròn nút
          size: "small",
          ...action.buttonProps,
          icon: action.icon, // Antd Button tự xử lý icon alignment rất tốt
          disabled: isDisabled,
          style: {
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: "32px", // Đảm bảo nút tròn đều
            height: "32px",
            
            // Áp dụng màu sắc
            color: finalColor,
            backgroundColor: finalBg,
            border: `1px solid ${finalBorder}`,
            
            // Custom CSS khác
            boxShadow: "none",
            ...action.buttonProps?.style,
          },
          onClick: (e) => {
            e.stopPropagation();
            if (!action.confirm && !isDisabled && action.onClick) {
              action.onClick(record);
            }
          },
          // Thêm class này nếu bạn muốn hover nó đậm màu hơn một chút (tùy chọn)
          className: "action-btn-hover", 
        };

        const renderButton = <Button {...commonButtonProps} />;

        const tooltipContent = isDisabled
          ? action.disabledReason || "Hành động bị khóa"
          : action.tooltip;

        // 4. Render
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