import React, { useState, useEffect } from "react";
import { Table, Tag, Space, Button, Modal, message } from "antd";
import { ReloadOutlined } from "@ant-design/icons";

const UserReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  // Thêm state cho modal xem chi tiết media
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailComplaint, setDetailComplaint] = useState(null);
  // Modal xử lý khiếu nại
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [resolveComplaint, setResolveComplaint] = useState(null);
  const [resolutionType, setResolutionType] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [voucherCode, setVoucherCode] = useState("");

  // Hàm làm mới dữ liệu khiếu nại
  const refreshReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/api/complaints/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      let data = await res.json();
      if (Array.isArray(data)) {
        setReports(data);
      } else if (data && Array.isArray(data.results)) {
        setReports(data.results);
      } else {
        setReports([]);
      }
    } catch (err) {
      console.error("Complaints API error:", err);
      message.error("Không tải được dữ liệu!");
      setReports([]);
    }
    setLoading(false);
  };

  // Tự động tải dữ liệu khi vào trang
  useEffect(() => {
    refreshReports();
  }, []);

  // Xử lý 1 khiếu nại
  const handleResolve = async (id) => {
    Modal.confirm({
      title: "Xác nhận xử lý khiếu nại?",
      onOk: async () => {
        try {
          const token = localStorage.getItem("token");
          await fetch(`http://localhost:8000/api/complaints/${id}/`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: "resolved" }),
          });
          message.success("Đã xử lý khiếu nại!");
          refreshReports();
        } catch (err) {
          message.error("Lỗi khi cập nhật!");
        }
      },
    });
  };

  // Từ chối 1 khiếu nại
  const handleReject = async (id) => {
    Modal.confirm({
      title: "Xác nhận từ chối khiếu nại?",
      onOk: async () => {
        try {
          const token = localStorage.getItem("token");
          await fetch(`http://localhost:8000/api/complaints/${id}/`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: "rejected" }),
          });
          message.success("Đã từ chối khiếu nại!");
          refreshReports();
        } catch (err) {
          message.error("Lỗi khi cập nhật!");
        }
      },
    });
  };

  // Xử lý tất cả khiếu nại đã chọn
  const handleResolveAll = async () => {
    Modal.confirm({
      title: `Xác nhận xử lý ${selectedRowKeys.length} khiếu nại?`,
      onOk: async () => {
        try {
          const token = localStorage.getItem("token");
          await Promise.all(
            selectedRowKeys.map((id) =>
              fetch(`http://localhost:8000/api/complaints/${id}/`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: "resolved" }),
              })
            )
          );
          message.success(`Đã xử lý ${selectedRowKeys.length} khiếu nại!`);
          setSelectedRowKeys([]);
          refreshReports();
        } catch (err) {
          message.error("Lỗi khi cập nhật hàng loạt!");
        }
      },
    });
  };

  // Từ chối tất cả khiếu nại đã chọn
  const handleRejectAll = async () => {
    Modal.confirm({
      title: `Xác nhận từ chối ${selectedRowKeys.length} khiếu nại?`,
      onOk: async () => {
        try {
          const token = localStorage.getItem("token");
          await Promise.all(
            selectedRowKeys.map((id) =>
              fetch(`http://localhost:8000/api/complaints/${id}/`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: "rejected" }),
              })
            )
          );
          message.success(`Đã từ chối ${selectedRowKeys.length} khiếu nại!`);
          setSelectedRowKeys([]);
          refreshReports();
        } catch (err) {
          message.error("Lỗi khi từ chối hàng loạt!");
        }
      },
    });
  };

  // Hoàn tất lại (reset về pending)
  const handleResetPending = async (id) => {
    Modal.confirm({
      title: "Xác nhận chuyển khiếu nại về trạng thái chờ xử lý?",
      onOk: async () => {
        try {
          const token = localStorage.getItem("token");
          await fetch(`http://localhost:8000/api/complaints/${id}/`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: "pending" }),
          });
          message.success("Đã chuyển về trạng thái chờ xử lý!");
          refreshReports();
        } catch (err) {
          message.error("Lỗi khi cập nhật!");
        }
      },
    });
  };

  // Gửi thông báo cho user (localStorage)
  const sendNotification = async (userId, complaint) => {
    let detail = `Khiếu nại sản phẩm: ${complaint.product_name || ''}.\nLý do: ${complaint.reason || ''}.\nHình thức xử lý: `;
    switch (resolutionType) {
      case 'refund_full':
        detail += 'Hoàn tiền toàn bộ';
        break;
      case 'refund_partial':
        detail += `Hoàn tiền một phần (${refundAmount}đ)`;
        break;
      case 'replace':
        detail += 'Đổi sản phẩm';
        break;
      case 'voucher':
        detail += `Tặng voucher/điểm thưởng (${voucherCode})`;
        break;
      case 'reject':
        detail += 'Từ chối khiếu nại';
        break;
      default:
        detail += resolutionType;
    }
    // Lấy thumbnail hình ảnh sản phẩm bị khiếu nại
    let thumbnail = null;
    if (Array.isArray(complaint.media_urls) && complaint.media_urls.length > 0) {
      // Ưu tiên ảnh, nếu không có thì lấy video
      const img = complaint.media_urls.find(url => url.match(/\.(jpg|jpeg|png|gif)$/i));
      thumbnail = img || complaint.media_urls[0];
    }
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    notifications.unshift({
      id: Date.now(),
      message: `Khiếu nại của bạn đã được xử lý!`,
      detail,
      time: new Date().toLocaleString(),
      read: false,
      userId,
      thumbnail,
    });
    localStorage.setItem('notifications', JSON.stringify(notifications));
  };

  // Mở modal xử lý khiếu nại
  const openResolveModal = (complaint) => {
  setResolveComplaint(complaint);
  setResolutionType("");
  const unit = complaint.unit_price ?? complaint.product_price ?? "";
  const qty = complaint.quantity ?? 1;
  setRefundAmount(unit !== "" ? String(Number(unit) * Number(qty)) : "");
  setVoucherCode("");
  setResolveModalVisible(true);
  };

  // Xác nhận xử lý khiếu nại
  const handleConfirmResolve = async () => {
    if (!resolutionType) {
      message.error('Vui lòng chọn hình thức xử lý!');
      return;
    }

    try {
      const token = localStorage.getItem('token');

      if (resolutionType === 'refund_partial' || resolutionType === 'refund_full') {
        if (resolutionType === 'refund_partial') {
          const amt = Number(refundAmount);
          if (!amt || isNaN(amt) || amt <= 0) {
            message.error('Vui lòng nhập số tiền hoàn hợp lệ (> 0)!');
            return;
          }
        }
        // Gọi endpoint resolve để cộng tiền vào ví khi hoàn tiền
        const payload = { resolution_type: resolutionType };
        if (resolutionType === 'refund_partial') payload.amount = Number(refundAmount);

        await fetch(`http://localhost:8000/api/complaints/${resolveComplaint.id}/resolve/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        // Các hình thức khác vẫn PATCH trạng thái/loại xử lý
        await fetch(`http://localhost:8000/api/complaints/${resolveComplaint.id}/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: 'resolved',
            resolution_type: resolutionType,
            refund_amount: refundAmount || null,
            voucher_code: voucherCode || null,
          }),
        });
      }

      message.success('Đã xử lý khiếu nại!');
      setResolveModalVisible(false);
      refreshReports();
      // Gửi thông báo cho user
      await sendNotification(resolveComplaint.user, resolveComplaint);
    } catch (err) {
      message.error('Lỗi khi cập nhật!');
    }
  };

  const columns = [
    {
      title: "Người dùng",
      dataIndex: "user_name",
    },
    {
      title: "Sản phẩm",
      dataIndex: "product_name",
    },
    {
      title: "Đơn giá (khi mua)",
      key: "unit_price",
      render: (_, record) => {
        const unit = record.unit_price ?? record.product_price;
        return unit ? Number(unit).toLocaleString('vi-VN') + ' VNĐ' : '—';
      },
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      render: (qty) => (qty ?? 1),
    },
    {
      title: "Lý do báo cáo",
      dataIndex: "reason",
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      render: (created_at) =>
        created_at ? new Date(created_at).toLocaleString() : "",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) =>
        status === "pending" ? (
          <Tag color="orange">Chờ xử lý</Tag>
        ) : status === "resolved" ? (
          <Tag color="green">Đã xử lý</Tag>
        ) : (
          <Tag color="red">Bị từ chối</Tag>
        ),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button
            onClick={() => {
              setDetailComplaint(record);
              setDetailModalVisible(true);
            }}
          >
            Xem chi tiết
          </Button>
          {record.status === "pending" && (
            <>
              <Button type="primary" onClick={() => openResolveModal(record)}>
                Duyệt
              </Button>
              <Button danger onClick={() => handleReject(record.id)}>
                Không duyệt
              </Button>
            </>
          )}
          {(record.status === "resolved" || record.status === "rejected") && (
            <Button onClick={() => handleResetPending(record.id)}>
              Hoàn tát
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <h2>Người dùng Khiếu nại sản phẩm</h2>

      <Button
        icon={<ReloadOutlined />}
        loading={loading}
        onClick={refreshReports}
        type="default"
        style={{ marginBottom: 16, marginRight: 8 }}
      >
        Làm mới
      </Button>

      {selectedRowKeys.length >= 2 && (
        <>
          <Button
            type="primary"
            onClick={handleResolveAll}
            style={{ marginBottom: 16, marginRight: 8 }}
          >
            Xử lý tất cả ({selectedRowKeys.length})
          </Button>
          <Button
            danger
            onClick={handleRejectAll}
            style={{ marginBottom: 16 }}
          >
            Từ chối tất cả ({selectedRowKeys.length})
          </Button>
        </>
      )}

      <Table
        rowKey="id"
        columns={columns}
        dataSource={reports}
        loading={loading}
        bordered
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
      />
      {/* Modal xem chi tiết media */}
      <Modal
        open={previewVisible}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={previewMedia?.type === "video" ? 700 : 500}
        centered
      >
        {previewMedia?.type === "image" ? (
          <img src={previewMedia.url} alt="media" style={{ width: "100%" }} />
        ) : previewMedia?.type === "video" ? (
          <video src={previewMedia.url} controls style={{ width: "100%" }} />
        ) : null}
      </Modal>
      {/* Modal xem chi tiết khiếu nại */}
      <Modal
        open={detailModalVisible}
        title="Chi tiết khiếu nại"
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={600}
      >
        {detailComplaint && (
          <div>
            <p>
              <b>Người dùng:</b> {detailComplaint.user_name}
            </p>
            <p>
              <b>Sản phẩm:</b> {detailComplaint.product_name}
            </p>
            <p>
              <b>Đơn giá (khi mua):</b> {
                (detailComplaint.unit_price ?? detailComplaint.product_price) 
                  ? Number(detailComplaint.unit_price ?? detailComplaint.product_price).toLocaleString('vi-VN') + ' VNĐ' 
                  : 'Không có thông tin'
              }
            </p>
            <p>
              <b>Số lượng:</b> {detailComplaint.quantity ?? 1}
            </p>
            <p>
              <b>Thành tiền (ước tính):</b> {
                (() => {
                  const unit = Number(detailComplaint.unit_price ?? detailComplaint.product_price ?? 0);
                  const qty = Number(detailComplaint.quantity ?? 1);
                  return (unit && qty) ? (unit * qty).toLocaleString('vi-VN') + ' VNĐ' : '—';
                })()
              }
            </p>
            <p>
              <b>Lý do báo cáo:</b> {detailComplaint.reason}
            </p>
            <p>
              <b>Trạng thái:</b>{" "}
              {detailComplaint.status === "pending"
                ? "Chờ xử lý"
                : detailComplaint.status === "resolved"
                ? "Đã xử lý"
                : "Bị từ chối"}
            </p>
            <p>
              <b>Ngày tạo:</b>{" "}
              {detailComplaint.created_at
                ? new Date(detailComplaint.created_at).toLocaleString()
                : ""}
            </p>
            <div style={{ marginTop: 12 }}>
              <b>Hình ảnh/Video minh họa:</b>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  marginTop: 8,
                }}
              >
                {Array.isArray(detailComplaint.media_urls) &&
                detailComplaint.media_urls.length > 0 ? (
                  detailComplaint.media_urls.map((url, idx) =>
                    url.match(/\.(mp4|webm|ogg)$/i) ? (
                      <video
                        key={idx}
                        src={url}
                        controls
                        style={{ width: 220, height: 120, objectFit: "cover" }}
                      />
                    ) : (
                      <img
                        key={idx}
                        src={url}
                        alt="media"
                        style={{
                          maxWidth: 120,
                          maxHeight: 90,
                          borderRadius: 4,
                        }}
                      />
                    )
                  )
                ) : (
                  <span className="text-muted">Không có</span>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
      {/* Modal xử lý khiếu nại */}
      <Modal
        open={resolveModalVisible}
        title="Xử lý khiếu nại"
        onCancel={() => setResolveModalVisible(false)}
        onOk={handleConfirmResolve}
        okText="Duyệt"
        width={500}
      >
        <div>
          <div style={{ marginBottom: 12 }}>
            <b>Hình thức xử lý:</b>
            <select
              value={resolutionType}
              onChange={(e) => {
                const val = e.target.value;
                setResolutionType(val);
                if (val === "refund_full" && resolveComplaint) {
                  const unit = resolveComplaint.unit_price ?? resolveComplaint.product_price ?? "";
                  const qty = resolveComplaint.quantity ?? 1;
                  setRefundAmount(unit !== "" ? String(Number(unit) * Number(qty)) : "");
                } else if (val === "refund_partial") {
                  setRefundAmount("");
                }
              }}
              style={{
                width: "100%",
                marginTop: 6,
                padding: 6,
                borderRadius: 4,
              }}
            >
              <option value="">-- Chọn --</option>
              <option value="refund_full">Hoàn tiền toàn bộ</option>
              <option value="refund_partial">Hoàn tiền một phần</option>
              <option value="replace">Đổi sản phẩm</option>

              <option value="reject">Từ chối khiếu nại</option>
            </select>
          </div>
          {resolutionType === "refund_full" && resolveComplaint && (
            <div style={{ marginBottom: 8 }}>
              <span style={{ color: '#333', fontWeight: 500 }}>
                Giá sản phẩm: {resolveComplaint.product_price ? Number(resolveComplaint.product_price).toLocaleString('vi-VN') + ' VNĐ' : 'Không có thông tin'}
              </span>
            </div>
          )}
          {resolutionType === "refund_partial" && (
            <div style={{ marginBottom: 12 }}>
              <b>Số tiền hoàn:</b>
              <input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="Nhập số tiền hoàn"
                style={{
                  width: "100%",
                  marginTop: 6,
                  padding: 6,
                  borderRadius: 4,
                }}
              />
            </div>
          )}
          {resolutionType === "refund_full" && (
            <div style={{ marginBottom: 12 }}>
              <b>Số tiền hoàn:</b>
              <input
                type="number"
                value={refundAmount}
                disabled
                style={{
                  width: "100%",
                  marginTop: 6,
                  padding: 6,
                  borderRadius: 4,
                  background: "#f5f5f5",
                }}
              />
            </div>
          )}
          {resolutionType === "voucher" && (
            <div style={{ marginBottom: 12 }}>
              <b>Mã voucher/điểm thưởng:</b>
              <input
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                placeholder="Nhập mã voucher hoặc điểm thưởng"
                style={{
                  width: "100%",
                  marginTop: 6,
                  padding: 6,
                  borderRadius: 4,
                }}
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default UserReports;
