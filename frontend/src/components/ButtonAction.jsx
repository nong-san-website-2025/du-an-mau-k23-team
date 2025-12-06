import React from "react";
import { Button, Popconfirm, Space, Tooltip } from "antd";

const COLORS = {
  view: "#1677ff",
  edit: "#52c41a",
  lock: "#faad14",
  delete: "#ff4d4f",
};

const ButtonAction = ({ actions, record }) => {
  return (
    <Space size={1} onClick={(e) => e.stopPropagation()}>
      {actions.map((action, index) => {
        if (!action.show) return null;

        const isDisabled = Boolean(action.buttonProps?.disabled);

        const baseColor = COLORS[action.actionType] || "#595959";
        const iconColor = isDisabled ? "#bfbfbf" : baseColor;

        const coloredIcon = action.icon
          ? React.cloneElement(action.icon, {
              style: {
                color: iconColor,
                fontSize: 16,
              },
            })
          : null;

        const mergedStyle = {
          ...(action.buttonProps?.style || {}),
          ...(isDisabled ? { opacity: 0.65, cursor: "not-allowed" } : {}),
        };

        const buttonProps = {
          type: action.buttonProps?.type || "text",
          icon: coloredIcon,
          onClick: (e) => {
            e.stopPropagation();
            if (!action.confirm && !isDisabled) action.onClick(record);
          },
          ...action.buttonProps,
          style: mergedStyle,
        };

        const tooltipTitle = isDisabled
          ? action.disabledReason || action.tooltip
          : action.tooltip;

        // If action requires confirmation but is disabled, do not render Popconfirm
        if (action.confirm && !isDisabled) {
          return (
            <Tooltip key={index} title={tooltipTitle}>
              <Popconfirm
                title={action.confirm.title}
                okText={action.confirm.okText || "Xác nhận"}
                cancelText={action.confirm.cancelText || "Hủy"}
                okButtonProps={action.confirm.okButtonProps}
                onConfirm={() => action.onClick(record)}
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
