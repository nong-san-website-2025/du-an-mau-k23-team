import React, { useState } from "react";
import { Table, Button, Tooltip, Space, Tag, Popconfirm, Modal, Input, message } from "antd";
import { CheckOutlined, CloseOutlined, EyeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { TextArea } = Input;

const WithdrawRequestsTable = ({ data, onApprove, onReject, loading }) => {
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleRejectClick = (record) => {
    setSelectedRecord(record);
    setRejectionReason('');
    setRejectModalVisible(true);
  };

  const handleRejectConfirm = () => {
    if (!rejectionReason.trim()) {
      message.warning('Vui lòng nhập lý do từ chối');
      return;
    }
    onReject(selectedRecord, rejectionReason);
    setRejectModalVisible(false);
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
      sorter: (a, b) => a.id - b.id,
      align: "center",
      fixed: 'left',
    },
    {
      title: "Tên cửa hàng",
      dataIndex: "store_name",
      key: "store_name",
      width: 180,
      sorter: (a, b) => (a.store_name || "").localeCompare(b.store_name || ""),
      fixed: 'left',
    },
    {
      title: "Email",
      dataIndex: "seller_email",
      key: "seller_email",
      width: 200,
      sorter: (a, b) => (a.seller_email || "").localeCompare(b.seller_email || ""),
    },
    {
      title: "Số tiền rút",
      dataIndex: "amount",
      key: "amount",
      width: 150,
      render: (amount) => (
        <span style={{
          fontWeight: 700,
          fontSize: 16,
          color: '#cf1322'
        }}>
          {amount?.toLocaleString('vi-VN')} ₫
        </span>
      ),
      sorter: (a, b) => a.amount - b.amount,
      align: "right",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status) => {
        const config = {
          pending: { 
            color: "orange", 
            text: "⏳ Chờ duyệt",
            style: { fontWeight: 600 }
          },
          paid: { 
            color: "green", 
            text: "✓ Đã thanh toán",
            style: {}
          },
          rejected: { 
            color: "red", 
            text: "✗ Từ chối",
            style: {}
          },
        }[status] || { color: "default", text: status, style: {} };
        return (
          <Tag color={config.color} style={config.style}>
            {config.text}
          </Tag>
        );
      },
      filters: [
        { text: "Chờ duyệt", value: "pending" },
        { text: "Đã thanh toán", value: "paid" },
        { text: "Từ chối", value: "rejected" },
      ],
      onFilter: (value, record) => record.status === value,
      sorter: (a, b) => a.status.localeCompare(b.status),
    },
    {
      title: "Ngân hàng",
      key: "bank_info",
      width: 200,
      render: (_, record) => (
        <div style={{ fontSize: 12 }}>
          {record.bank_name ? (
            <>
              <div style={{ fontWeight: 600 }}>{record.bank_name}</div>
              <div style={{ color: '#8c8c8c' }}>{record.account_number}</div>
            </>
          ) : (
            <span style={{ color: '#bfbfbf' }}>Chưa có thông tin</span>
          )}
        </div>
      ),
    },
    {
      title: "Ngày yêu cầu",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      render: (date) => (
        <div style={{fontSize: 13}}>
          <div style={{ fontWeight: 500 }}>
            {date ? dayjs(date).format("DD/MM/YYYY") : "—"}
          </div>
          <div style={{color: '#8c8c8c'}}>
            {date ? dayjs(date).format("HH:mm:ss") : ""}
          </div>
        </div>
      ),
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      align: "center",
    },
    {
      title: "Ngày xử lý",
      dataIndex: "processed_at",
      key: "processed_at",
      width: 180,
      render: (date) => (
        date ? (
          <div style={{fontSize: 13}}>
            <div style={{ fontWeight: 500 }}>
              {dayjs(date).format("DD/MM/YYYY")}
            </div>
            <div style={{color: '#8c8c8c'}}>
              {dayjs(date).format("HH:mm:ss")}
            </div>
          </div>
        ) : (
          <span style={{ color: '#bfbfbf' }}>—</span>
        )
      ),
      sorter: (a, b) => {
        if (!a.processed_at) return 1;
        if (!b.processed_at) return -1;
        return new Date(a.processed_at) - new Date(b.processed_at);
      },
      align: "center",
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      key: "note",
      width: 200,
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <span style={{ fontSize: 13 }}>
            {text || <span style={{ color: '#bfbfbf' }}>Không có</span>}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      width: 150,
      align: "center",
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {record.status === "pending" && (
            <>
              <Popconfirm
                title="Xác nhận duyệt yêu cầu?"
                description={
                  <div>
                    <p>Số tiền: <strong>{record.amount?.toLocaleString('vi-VN')}₫</strong></p>
                    <p>Shop: <strong>{record.store_name}</strong></p>
                    <p style={{ color: '#faad14', marginTop: 8 }}>
                      ⚠️ Tiền sẽ được chuyển vào tài khoản ngân hàng của seller
                    </p>
                  </div>
                }
                onConfirm={() => onApprove(record)}
                okText="Duyệt ngay" 
                cancelText="Hủy"
                okButtonProps={{ type: 'primary' }}
              >
                <Tooltip title="Duyệt yêu cầu">
                  <Button 
                    type="primary" 
                    icon={<CheckOutlined />} 
                    size="small" 
                    loading={loading}
                  >
                    Duyệt
                  </Button>
                </Tooltip>
              </Popconfirm>
              
              <Tooltip title="Từ chối yêu cầu">
                <Button 
                  danger
                  icon={<CloseOutlined />} 
                  size="small"
                  onClick={() => handleRejectClick(record)}
                  loading={loading}
                >
                  Từ chối
                </Button>
              </Tooltip>
            </>
          )}
          
          {record.status !== "pending" && (
            <Tag color={record.status === 'paid' ? 'success' : 'error'}>
              {record.status === 'paid' ? 'Đã xử lý' : 'Đã từ chối'}
            </Tag>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        bordered
        pagination={{ 
          pageSize: 10,
          showTotal: (total) => `Tổng ${total} yêu cầu`,
          showSizeChanger: true,
        }}
        scroll={{ x: 1400 }}
        size="middle"
        loading={loading}
        rowClassName={(record) => {
          if (record.status === 'pending') return 'pending-row';
          return '';
        }}
      />

      {/* Modal từ chối */}
      <Modal
        title="Từ chối yêu cầu rút tiền"
        open={rejectModalVisible}
        onCancel={() => setRejectModalVisible(false)}
        onOk={handleRejectConfirm}
        okText="Xác nhận từ chối"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
        width={500}
      >
        {selectedRecord && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 8, marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>
                <span style={{ color: '#666' }}>Shop: </span>
                <strong>{selectedRecord.store_name}</strong>
              </div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ color: '#666' }}>Số tiền: </span>
                <strong style={{ color: '#cf1322', fontSize: 16 }}>
                  {selectedRecord.amount?.toLocaleString('vi-VN')} ₫
                </strong>
              </div>
              <div>
                <span style={{ color: '#666' }}>Ngày yêu cầu: </span>
                <strong>{dayjs(selectedRecord.created_at).format("DD/MM/YYYY HH:mm")}</strong>
              </div>
            </div>

            <div style={{ 
              padding: 12, 
              background: '#fff2e8', 
              border: '1px solid #ffbb96',
              borderRadius: 8,
              marginBottom: 16 
            }}>
              <div style={{ fontSize: 13, color: '#d4380d' }}>
                ⚠️ Khi từ chối, tiền sẽ được hoàn lại vào ví của seller
              </div>
            </div>

            <div>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>
                Lý do từ chối <span style={{ color: 'red' }}>*</span>
              </div>
              <TextArea
                rows={4}
                placeholder="Nhập lý do từ chối yêu cầu rút tiền (VD: Thông tin ngân hàng không đúng, số dư bất thường...)"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                maxLength={500}
                showCount
              />
            </div>
          </div>
        )}
      </Modal>

      <style>{`
        .pending-row {
          background-color: #fffbe6 !important;
        }
        .pending-row:hover {
          background-color: #fff7cc !important;
        }
      `}</style>
    </>
  );
};

export default WithdrawRequestsTable;