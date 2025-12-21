import React, { useState, useEffect } from "react";
import { Table, message, Button, Card, Tooltip, Popconfirm, Space } from "antd";
import { 
    ReloadOutlined, 
    EyeOutlined, 
    CheckCircleOutlined, 
    CloseCircleOutlined, 
    UndoOutlined,
    DeleteOutlined,
    SendOutlined, 
} from "@ant-design/icons";

// Đảm bảo đường dẫn import đúng với cấu trúc dự án của bạn
import ComplaintDetailModal from "../../components/ComplaintAdmin/ComplaintDetailModal";
import ComplaintResolveModal from "../../components/ComplaintAdmin/ComplaintResolveModal";
import AdminPageLayout from "../../components/AdminPageLayout";
import StatusTag from "../../../../components/StatusTag"; 
import ButtonAction from "../../../../components/ButtonAction"; 

const UserReports = () => {
    // --- KHAI BÁO STATE (Biến) ---
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // State checkbox
    const [selectedDeleteKeys, setSelectedDeleteKeys] = useState([]); 
    const [selectedResolveKeys, setSelectedResolveKeys] = useState([]); 

    // Modal State
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [detailComplaint, setDetailComplaint] = useState(null);
    const [resolveModalVisible, setResolveModalVisible] = useState(false);
    const [resolveComplaint, setResolveComplaint] = useState(null);

    // Lấy API URL từ env
    const API_URL = process.env.REACT_APP_API_URL;

    // --- HÀM CALL API ---
    const refreshReports = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            // SỬ DỤNG ENV Ở ĐÂY: nối thêm /complaints/
            const res = await fetch(`${API_URL}/complaints/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            if (!res.ok) throw new Error("Failed to fetch");

            const data = await res.json();
            
            let listData = [];
            if (Array.isArray(data)) listData = data;
            else if (data && Array.isArray(data.results)) listData = data.results;
            
            // Sắp xếp: Pending lên đầu
            listData.sort((a, b) => (a.status === 'pending' ? -1 : 1));
            
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- CÁC HÀM XỬ LÝ ---

    const handleReject = async (record) => {
        try {
            const token = localStorage.getItem("token");
            // SỬ DỤNG ENV Ở ĐÂY
            const res = await fetch(`${API_URL}/complaints/${record.id}/`, {
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
            // SỬ DỤNG ENV Ở ĐÂY
            const res = await fetch(`${API_URL}/complaints/${record.id}/`, {
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

    // --- LOGIC XỬ LÝ XÓA HÀNG LOẠT ---
    const handleDeleteBatch = async () => {
        const safeDeleteKeys = selectedDeleteKeys.filter(id => {
            const item = reports.find(r => r.id === id);
            return item && item.status !== 'pending';
        });

        if (safeDeleteKeys.length === 0) {
            message.warning("Không có mục nào hợp lệ để xóa (Đơn chờ duyệt không thể xóa).");
            return;
        }

        setLoading(true);
        const token = localStorage.getItem("token");
        let successfulDeletes = 0;
        let failedDeletes = 0;

        for (const id of safeDeleteKeys) {
            try {
                // SỬ DỤNG ENV Ở ĐÂY
                const res = await fetch(`${API_URL}/complaints/${id}/`, {
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
    
    // --- LOGIC DUYỆT HÀNG LOẠT ---
    const handleResolveBatch = async () => {
        if (selectedResolveKeys.length === 0) return;

        setLoading(true);
        const token = localStorage.getItem("token");
        let successfulResolves = 0;
        let failedResolves = 0;

        for (const id of selectedResolveKeys) {
            try {
                // SỬ DỤNG ENV Ở ĐÂY
                const res = await fetch(`${API_URL}/complaints/${id}/`, {
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
        selectedRowKeys: [...selectedDeleteKeys, ...selectedResolveKeys],
        onChange: (newSelectedRowKeys, selectedRows) => {
            // Tách các ID đã chọn thành 2 nhóm
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
                    {/* Nút Duyệt Nhanh */}
                    {selectedResolveKeys.length > 0 && (
                        <Popconfirm
                            title={`Giải quyết ${selectedResolveKeys.length} khiếu nại đang chờ?`}
                            description="Hành động này sẽ chuyển trạng thái các khiếu nại đã chọn thành 'Đã giải quyết'."
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
                
                    {/* Nút Xóa Hàng Loạt */}
                    {selectedDeleteKeys.length > 0 && (
                        <Popconfirm
                            title={`Xóa ${selectedDeleteKeys.length} khiếu nại đã hoàn tất?`}
                            description="LƯU Ý: Chỉ xóa các đơn đã Giải quyết/Từ chối. Đơn đang chờ (Pending) sẽ được giữ lại."
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

            <ComplaintDetailModal
                visible={detailModalVisible}
                complaint={detailComplaint}
                onClose={() => setDetailModalVisible(false)}
            />

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