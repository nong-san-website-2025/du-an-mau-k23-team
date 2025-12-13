import React, { useState, useEffect } from "react";
import { Table, message, Button, Card, Tooltip, Popconfirm, Space } from "antd";
import { 
    ReloadOutlined, 
    EyeOutlined, 
    CheckCircleOutlined, 
    CloseCircleOutlined, 
    UndoOutlined,
    DeleteOutlined,
    SendOutlined, // Icon cho hành động Duyệt/Giải quyết
} from "@ant-design/icons";

// Import Components (Giữ nguyên cấu trúc import của bạn)
import ComplaintDetailModal from "../../components/ComplaintAdmin/ComplaintDetailModal";
import ComplaintResolveModal from "../../components/ComplaintAdmin/ComplaintResolveModal";
import AdminPageLayout from "../../components/AdminPageLayout";
import StatusTag from "../../../../components/StatusTag"; 
import ButtonAction from "../../../../components/ButtonAction"; 

const API_URL = "http://localhost:8000/api/complaints/";

const UserReports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // --- State cho chức năng chọn dòng (checkbox) ---
    // 1. Dùng cho Xóa (chọn các dòng đã xử lý: resolved/rejected)
    const [selectedDeleteKeys, setSelectedDeleteKeys] = useState([]); 
    // 2. Dùng cho Duyệt (chọn các dòng đang chờ: pending)
    const [selectedResolveKeys, setSelectedResolveKeys] = useState([]); 

    // Modal State
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [detailComplaint, setDetailComplaint] = useState(null);
    const [resolveModalVisible, setResolveModalVisible] = useState(false);
    const [resolveComplaint, setResolveComplaint] = useState(null);

    const refreshReports = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(API_URL, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            if (!res.ok) throw new Error("Failed to fetch");

            const data = await res.json();
            
            let listData = [];
            if (Array.isArray(data)) listData = data;
            else if (data && Array.isArray(data.results)) listData = data.results;
            
            // Sắp xếp: Pending lên đầu
            listData.sort((a, b) => (a.status === 'pending' ? -1 : 1));
            
            // Ensure seller_name is included or defaulted
            listData = listData.map(item => ({
                ...item,
                seller_name: item.seller_name || "Không xác định"
            }));

            setReports(listData);
        } catch (err) {
            console.error(err);
            message.error("Không tải được dữ liệu!");
        }
        setLoading(false);
        // Reset chọn sau khi refresh
        setSelectedDeleteKeys([]); 
        setSelectedResolveKeys([]); 
    };

    useEffect(() => {
        refreshReports();
    }, []);

    // --- LOGIC XỬ LÝ HÀNH ĐỘNG ĐƠN LẺ (API) ---

    const handleReject = async (record) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}${record.id}/`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status: "rejected" }),
            });

            if(res.ok) {
                message.success("Đã từ chối khiếu nại!");
                refreshReports();
            } else {
                message.error("Có lỗi xảy ra khi từ chối.");
            }
        } catch (err) {
            message.error("Lỗi kết nối!");
        }
    };

    const handleResetPending = async (record) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}${record.id}/`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status: "pending" }), 
            });

            if(res.ok) {
                message.success("Đã chuyển về chờ xử lý!");
                refreshReports();
            } else {
                message.error("Không thể reset trạng thái.");
            }
        } catch (err) {
            message.error("Lỗi kết nối!");
        }
    };

    // --- LOGIC XỬ LÝ HÀNG LOẠT (API) ---

    // 1. Xử lý Xóa Hàng Loạt (cho các dòng đã resolved/rejected)
    const handleDeleteBatch = async () => {
        if (selectedDeleteKeys.length === 0) return;

        setLoading(true);
        const token = localStorage.getItem("token");
        let successfulDeletes = 0;
        let failedDeletes = 0;

        for (const id of selectedDeleteKeys) {
            try {
                const res = await fetch(`${API_URL}${id}/`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.ok) {
                    successfulDeletes++;
                } else {
                    failedDeletes++;
                }
            } catch (err) {
                failedDeletes++;
            }
        }

        setLoading(false);
        if (successfulDeletes > 0) {
            message.success(`Đã xóa thành công ${successfulDeletes} khiếu nại.`);
            refreshReports(); 
        }
        if (failedDeletes > 0) {
            message.error(`Thất bại khi xóa ${failedDeletes} khiếu nại.`);
        }
    };
    
    // 2. Xử lý Duyệt Nhanh Hàng Loạt (cho các dòng pending)
    const handleResolveBatch = async () => {
        if (selectedResolveKeys.length === 0) return;

        setLoading(true);
        const token = localStorage.getItem("token");
        let successfulResolves = 0;
        let failedResolves = 0;

        for (const id of selectedResolveKeys) {
            try {
                // Giả định: duyệt hàng loạt sẽ chuyển status thành 'resolved'
                const res = await fetch(`${API_URL}${id}/`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ status: "resolved" }), 
                });

                if (res.ok) {
                    successfulResolves++;
                } else {
                    failedResolves++;
                }
            } catch (err) {
                failedResolves++;
            }
        }

        setLoading(false);
        if (successfulResolves > 0) {
            message.success(`Đã giải quyết thành công ${successfulResolves} khiếu nại.`);
            refreshReports(); 
        }
        if (failedResolves > 0) {
            message.error(`Thất bại khi giải quyết ${failedResolves} khiếu nại.`);
        }
    };

    // --- Cấu hình Row Selection ---
    const rowSelection = {
        // Tổng hợp cả hai loại keys để hiển thị trên checkbox
        selectedRowKeys: [...selectedDeleteKeys, ...selectedResolveKeys],
        
        onChange: (newSelectedRowKeys, selectedRows) => {
            // Tách các ID đã chọn thành 2 nhóm dựa trên trạng thái của chúng
            const deleteKeys = selectedRows
                .filter(row => row.status !== 'pending')
                .map(row => row.id);
            
            const resolveKeys = selectedRows
                .filter(row => row.status === 'pending')
                .map(row => row.id);

            setSelectedDeleteKeys(deleteKeys);
            setSelectedResolveKeys(resolveKeys);
        },
    };

    // --- Cấu hình Cột Bảng ---
    const columns = [
        { 
            title: "STT", 
            key: "index", 
            width: 60,
            align: 'center',
            render: (_, __, index) => index + 1 
        },
        { 
            title: "Người dùng", 
            dataIndex: "complainant_name", 
            render: (text) => <b>{text || "Không xác định"}</b>
        },
        { 
            title: "Sản phẩm", 
            dataIndex: "product_name",
            ellipsis: { showTitle: false },
            render: (name) => (
                <Tooltip placement="topLeft" title={name}>{name}</Tooltip>
            )
        },
        {
            title: "Giá trị",
            key: "value",
            width: 150,
            render: (_, record) => {
                const unit = Number(record.unit_price ?? record.product_price ?? 0);
                const qty = record.quantity ?? 1;
                return (
                    <span>
                        {unit.toLocaleString("vi-VN")} đ <br/> 
                        <small style={{color: '#888'}}>x{qty}</small>
                    </span>
                );
            },
        },
        { 
            title: "Người bán", 
            dataIndex: "seller_name", 
            width: 250,
            ellipsis: true,
            render: (seller_name) => <Tooltip title={seller_name}>{seller_name || "Không xác định"}</Tooltip>
        },
        {
            title: "Ngày tạo",
            dataIndex: "created_at",
            width: 160,
            render: (date) => (date ? new Date(date).toLocaleString("vi-VN") : ""),
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            width: 140,
            align: 'center',
            render: (status) => <StatusTag status={status} />,
        },
        {
            title: "Hành động",
            key: "action",
            width: 140,
            align: 'right',
            render: (_, record) => {
                const actions = [
                    {
                        actionType: 'view',
                        icon: <EyeOutlined />,
                        tooltip: "Xem chi tiết",
                        onClick: () => {
                            setDetailComplaint(record);
                            setDetailModalVisible(true);
                        }
                    },
                    {
                        actionType: 'approve',
                        icon: <CheckCircleOutlined />,
                        tooltip: "Giải quyết / Duyệt",
                        show: record.status === 'pending',
                        onClick: () => {
                            setResolveComplaint(record);
                            setResolveModalVisible(true);
                        }
                    },
                    {
                        actionType: 'reject',
                        icon: <CloseCircleOutlined />,
                        tooltip: "Từ chối khiếu nại",
                        show: record.status === 'pending',
                        confirm: {
                            title: "Từ chối khiếu nại này?",
                            description: "Hành động này sẽ đánh dấu khiếu nại là không hợp lệ.",
                            okText: "Từ chối",
                            cancelText: "Hủy",
                        },
                        // Sửa lỗi ESLint: Truyền callback nhận tham số (r)
                        onClick: (r) => handleReject(r) 
                    },
                    {
                        actionType: 'edit', 
                        icon: <UndoOutlined />,
                        tooltip: "Xử lý lại (Reset)",
                        show: record.status !== 'pending',
                        confirm: {
                            title: "Xử lý lại?",
                            description: "Chuyển trạng thái về 'Chờ xử lý'?",
                        },
                        // Sửa lỗi ESLint: Truyền callback nhận tham số (r)
                        onClick: (r) => handleResetPending(r) 
                    }
                ];

                return <ButtonAction actions={actions} record={record} />;
            },
        },
    ];

    // --- Render Component ---
    return (
        <AdminPageLayout 
            title="QUẢN LÝ KHIẾU NẠI NGƯỜI DÙNG" 
            extra={
                <Space>
                    {/* 1. Nút Duyệt Nhanh Hàng Loạt */}
                    {selectedResolveKeys.length > 0 && (
                        <Popconfirm
                            title={`Giải quyết ${selectedResolveKeys.length} khiếu nại đang chờ?`}
                            description="Hành động này sẽ chuyển trạng thái các khiếu nại đã chọn thành 'Đã giải quyết' (Resolved)."
                            onConfirm={handleResolveBatch}
                            okText="Xác nhận Duyệt"
                            cancelText="Hủy"
                            okButtonProps={{ loading: loading, style: { backgroundColor: '#52c41a', borderColor: '#52c41a' } }}
                        >
                            <Button 
                                type="primary" 
                                icon={<SendOutlined />} 
                                loading={loading}
                                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }} 
                            >
                                Duyệt Nhanh ({selectedResolveKeys.length})
                            </Button>
                        </Popconfirm>
                    )}
                
                    {/* 2. Nút Xóa Hàng Loạt */}
                    {selectedDeleteKeys.length > 0 && (
                        <Popconfirm
                            title={`Xóa ${selectedDeleteKeys.length} khiếu nại đã xử lý?`}
                            description="Các khiếu nại này sẽ bị xóa vĩnh viễn khỏi hệ thống."
                            onConfirm={handleDeleteBatch}
                            okText="Xác nhận Xóa"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true, loading: loading }}
                        >
                            <Button 
                                type="primary" 
                                danger
                                icon={<DeleteOutlined />} 
                                loading={loading}
                            >
                                Xóa Hàng Loạt ({selectedDeleteKeys.length})
                            </Button>
                        </Popconfirm>
                    )}
                    
                    {/* 3. Nút Làm Mới */}
                    <Button 
                        type="primary" 
                        icon={<ReloadOutlined />} 
                        onClick={refreshReports} 
                        loading={loading}
                    >
                        Làm mới
                    </Button>
                </Space>
            }
        >
            <Card bordered={false} bodyStyle={{ padding: 0 }}>
                <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={reports}
                    loading={loading}
                    rowSelection={rowSelection} 
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                    scroll={{ x: 1000 }} 
                />
            </Card>

            {/* Modal Xem chi tiết */}
            <ComplaintDetailModal
                visible={detailModalVisible}
                complaint={detailComplaint}
                onClose={() => setDetailModalVisible(false)}
            />

            {/* Modal Xử lý */}
            <ComplaintResolveModal
                visible={resolveModalVisible}
                complaint={resolveComplaint}
                onClose={() => setResolveModalVisible(false)}
                refreshReports={refreshReports}
            />
        </AdminPageLayout>
    );
};

export default UserReports;