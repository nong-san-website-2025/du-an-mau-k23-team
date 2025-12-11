import React from "react";
import { Modal, Tag, Typography, Divider, Image } from "antd";
import moment from "moment";
import { formatVND, isImageUrl } from "../../../../utils/complaintHelpers";

const { Title, Text } = Typography;

const DetailModal = ({ visible, onCancel, complaint }) => {
  if (!complaint) return null;

  const getStatusConfig = (status) => {
    const config = {
      pending: { color: "orange", text: "Chờ xử lý" },
      resolved: { color: "green", text: "Đã xử lý" },
      rejected: { color: "red", text: "Đã từ chối" },
    };
    return config[status] || { color: "default", text: "Không xác định" };
  };

  const getResolutionText = (resolution_type) => {
    const config = {
      refund_full: "Hoàn tiền toàn bộ",
      refund_partial: "Hoàn tiền một phần",
      replace: "Đổi sản phẩm",
      voucher: "Tặng voucher/điểm thưởng",
      reject: "Từ chối khiếu nại",
    };
    return config[resolution_type] || "Không xác định";
  };

  const { color: statusColor, text: statusText } = getStatusConfig(complaint.status);

  const mediaList = Array.isArray(complaint.media_urls)
    ? complaint.media_urls.filter(Boolean)
    : [];

  return (
    <Modal
      title={
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Chi tiết khiếu nại #{complaint.id}
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Thông tin chi tiết và minh chứng liên quan
          </Text>
        </div>
      }
      open={visible}
      footer={null}
      onCancel={onCancel}
      width={760}
      styles={{
        body: { padding: "24px" },
      }}
    >
      {/* Grid 2 cột chính */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px" }}>
        {/* Cột trái: Thông tin người dùng & sản phẩm */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <InfoGroup title="Người khiếu nại">
            <InfoRow label="Họ và tên" value={complaint.complainant_name || "—"} />
          </InfoGroup>

          <InfoGroup title="Thông tin sản phẩm">
            <InfoRow label="Tên sản phẩm" value={complaint.product_name || "—"} />
            <InfoRow label="Mã sản phẩm" value={complaint.product_id || "—"} />
            <InfoRow label="Số lượng" value={complaint.quantity ?? 1} />
            <InfoRow
              label="Đơn giá"
              value={formatVND(complaint.unit_price ?? complaint.product_price ?? 0)}
            />
            <InfoRow label="Mã đơn hàng" value={complaint.order_id ? `#${complaint.order_id}` : "—"} />
          </InfoGroup>
        </div>

        {/* Cột phải: Trạng thái, thời gian, lý do */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <InfoGroup title="Xử lý khiếu nại">
            <InfoRow label="Trạng thái">
              <Tag color={statusColor} style={{ fontSize: 14, padding: "4px 10px" }}>
                {statusText}
              </Tag>
            </InfoRow>
            <InfoRow
              label="Thời gian tạo"
              value={
                complaint.created_at
                  ? moment(complaint.created_at).format("HH:mm DD/MM/YYYY")
                  : "—"
              }
            />
          </InfoGroup>

          <InfoGroup title="Nội dung khiếu nại">
            <div style={{ lineHeight: 1.6, whiteSpace: "pre-wrap", color: "#000" }}>
              {complaint.reason || "—"}
            </div>
          </InfoGroup>
        </div>
      </div>

      {/* Hình thức xử lý (khi đã xử lý) */}
      {(complaint.status === "resolved" || complaint.status === "rejected") && complaint.resolution_type && (
        <>
          <Divider style={{ margin: "24px 0 16px" }} />
          <div>
            <Text strong style={{ marginBottom: 12, display: "block", fontSize: 15 }}>
              Hình thức xử lý
            </Text>
            <Tag color={complaint.status === "resolved" ? "green" : "red"} style={{ fontSize: 14, padding: "6px 14px" }}>
              {getResolutionText(complaint.resolution_type)}
            </Tag>
          </div>
        </>
      )}

      {/* Minh chứng (full-width dưới 2 cột) */}
      {mediaList.length > 0 && (
        <>
          <Divider style={{ margin: "24px 0 16px" }} />
          <div>
            <Text strong style={{ marginBottom: 12, display: "block", fontSize: 15 }}>
              Minh chứng ({mediaList.length})
            </Text>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                gap: 14,
              }}
            >
              {mediaList.map((url, idx) => (
                <div
                  key={idx}
                  style={{
                    borderRadius: 8,
                    overflow: "hidden",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    aspectRatio: isImageUrl(url) ? "4/3" : "16/9",
                    background: "#000",
                  }}
                >
                  {isImageUrl(url) ? (
                    <Image
                      src={url}
                      alt={`evidence-${idx}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      preview={{ mask: "Xem" }}
                    />
                  ) : (
                    <video
                      src={url}
                      controls
                      style={{ width: "100%", height: "100%", outline: "none" }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </Modal>
  );
};

// Nhóm thông tin có tiêu đề
const InfoGroup = ({ title, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
    <Text strong style={{ fontSize: 14, color: "#1D1D1F" }}>
      {title}
    </Text>
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {children}
    </div>
  </div>
);

// Hàng thông tin chi tiết
const InfoRow = ({ label, value, children }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
    <Text type="secondary" style={{ fontSize: 13, minWidth: 90, flexShrink: 0 }}>
      {label}:
    </Text>
    <div style={{ textAlign: "right", flex: 1, overflowWrap: "break-word", paddingLeft: 12 }}>
      {children || <Text style={{ fontSize: 15, color: "#000" }}>{value}</Text>}
    </div>
  </div>
);

export default DetailModal;