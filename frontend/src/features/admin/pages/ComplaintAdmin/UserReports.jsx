import React, { useState, useEffect } from "react";
import { Table, message, Button, Card, Tooltip, Popconfirm, Space } from "antd";
import {
    ReloadOutlined,
    ThunderboltOutlined, // Icon Tia sét cho nút Xử lý
    DeleteOutlined,
    SendOutlined,
    UndoOutlined,
    EyeOutlined
} from "@ant-design/icons";

// --- IMPORT COMPONENT MỚI (GỘP) ---
import ComplaintProcessingModal from "../../components/ComplaintAdmin/ComplaintProcessingModal";

import AdminPageLayout from "../../components/AdminPageLayout";
import StatusTag from "../../../../components/StatusTag";
import ButtonAction from "../../../../components/ButtonAction";

const UserReports = () => {
    const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 480px)").matches;

    // --- STATE ---
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);

    // State cho hành động hàng loạt (Bulk Actions)
    const [selectedDeleteKeys, setSelectedDeleteKeys] = useState([]);
    const [selectedResolveKeys, setSelectedResolveKeys] = useState([]);

    // State cho Modal Xử lý (Chỉ cần 1 cái)
    const [processingModalVisible, setProcessingModalVisible] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState(null);

    const API_URL = process.env.REACT_APP_API_URL;

    // --- FETCH DATA ---
    const refreshReports = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/complaints/`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error("Failed to fetch");

            const data = await res.json();
            let listData = Array.isArray(data) ? data : data.results || [];

            listData = listData.map((item) => ({
                ...item,
                seller_name: item.seller_name || "Không xác định",
            }));

            setReports(listData);
        } catch (err) {
            console.error(err);
            message.error("Không tải được dữ liệu!");
        }
        setLoading(false);
        setSelectedDeleteKeys([]);
        setSelectedResolveKeys([]);
    };

    useEffect(() => {
        refreshReports();
    }, []);

    // --- HANDLERS (LOGIC) ---

    // 1. Mở Modal Xử lý (Split View)
    const handleOpenProcess = (record) => {
        setSelectedComplaint(record);
        setProcessingModalVisible(true);
    };

    // 2. Reset về trạng thái chờ (Dùng khi lỡ tay duyệt nhầm)


    // 3. Xóa hàng loạt
    const handleDeleteBatch = async () => {
        const safeDeleteKeys = selectedDeleteKeys.filter((id) => {
            const item = reports.find((r) => r.id === id);
            return item && item.status !== "pending"; // Chỉ xóa đơn đã xong
        });

        if (safeDeleteKeys.length === 0) {
            message.warning("Chỉ được xóa các khiếu nại đã giải quyết xong hoặc đã hủy.");
            return;
        }

        setLoading(true);
        const token = localStorage.getItem("token");
        for (const id of safeDeleteKeys) {
            try {
                await fetch(`${API_URL}/complaints/${id}/`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                });
            } catch (err) { }
        }

        setLoading(false);
        message.success("Đã xóa các mục đã chọn.");
        refreshReports();
    };

    // 4. Duyệt nhanh hàng loạt (Dành cho các đơn dễ)
    const handleResolveBatch = async () => {
        if (selectedResolveKeys.length === 0) return;
        setLoading(true);
        const token = localStorage.getItem("token");

        for (const id of selectedResolveKeys) {
            try {
                await fetch(`${API_URL}/complaints/${id}/`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ status: "resolved" }), // Lưu ý: Logic này duyệt nhanh, ko có ghi chú
                });
            } catch (err) { }
        }

        setLoading(false);
        message.success("Đã xử lý duyệt nhanh.");
        refreshReports();
    };

    // --- TABLE CONFIG ---
    const rowSelection = {
        selectedRowKeys: [...selectedDeleteKeys, ...selectedResolveKeys],
        onChange: (newSelectedRowKeys, selectedRows) => {
            const deleteKeys = selectedRows
                .filter((row) => row.status !== "pending")
                .map((row) => row.id);
            const resolveKeys = selectedRows
                .filter((row) => row.status === "pending")
                .map((row) => row.id);
            setSelectedDeleteKeys(deleteKeys);
            setSelectedResolveKeys(resolveKeys);
        },
    };

    const columns = [
        {
            title: "STT",
            key: "index",
            width: isMobile ? 50 : 60,
            align: "center",
            render: (_, __, index) => index + 1,
        },
        {
            title: "Người dùng",
            dataIndex: "complainant_name", // Đảm bảo field này khớp với API mới
            ellipsis: true,
            render: (text, record) => (
                <b style={{ whiteSpace: "nowrap" }}>
                    {text || record.created_by_name || "Không xác định"}
                </b>
            ),
        },
        {
            title: "Sản phẩm",
            dataIndex: "product_name",
            ellipsis: true,
            render: (name) => (
                <Tooltip title={name}>
                    <span style={{ display: "inline-block", maxWidth: isMobile ? 150 : 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {name}
                    </span>
                </Tooltip>
            ),
        },
        {
            title: "Giá trị",
            key: "value",
            width: isMobile ? 120 : 150,
            render: (_, record) => {
                const unit = Number(record.purchase_price || record.unit_price || 0);
                const qty = record.purchase_quantity || record.quantity || 1;
                return (
                    <span style={{ whiteSpace: "nowrap" }}>
                        {unit.toLocaleString("vi-VN")} đ <br />
                        <small style={{ color: "#888" }}>x{qty}</small>
                    </span>
                );
            },
        },
        {
            title: "Ngày tạo",
            dataIndex: "created_at",
            width: isMobile ? 130 : 160,
            sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
            render: (date) => (date ? new Date(date).toLocaleString("vi-VN") : ""),
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            width: isMobile ? 120 : 140,
            align: "center",
            render: (status) => <StatusTag status={status} type="complaint" />,
        },
        {
            title: "Thao tác",
            key: "action",
            width: isMobile ? 100 : 140,
            align: isMobile ? "center" : "center",
            render: (_, record) => {
                // LOGIC MỚI: Chỉ xử lý khi trạng thái là 'admin_review'
                const isEscalated = record.status === "admin_review";

                // Các trạng thái đã xong
                const isResolved = ["resolved", "resolved_refund", "resolved_reject", "cancelled", "rejected"].includes(record.status);

                const actions = [
                    {
                        // Nút Xem/Xử lý
                        actionType: "view",
                        // Nếu đã Escalate -> Hiện icon Tia sét (Xử lý)
                        // Nếu chưa hoặc đã xong -> Hiện icon Mắt (Xem)
                        icon: isEscalated ? <ThunderboltOutlined /> : <EyeOutlined />,
                        tooltip: isEscalated ? "Sàn phán quyết ngay" : "Xem chi tiết",

                        // Màu sắc: Cam (Cần xử lý) - Xanh (Đang chạy) - Mặc định (Đã xong)
                        style: isEscalated
                            ? { color: '#faad14', borderColor: '#faad14' } // Cam
                            : !isResolved
                                ? { color: '#1890ff', borderColor: '#1890ff' } // Xanh (Pending/Negotiating)
                                : {},

                        onClick: () => handleOpenProcess(record),
                    },
                    {
                        actionType: "delete",
                        icon: <DeleteOutlined />,
                        tooltip: "Xóa dữ liệu",
                        show: isResolved, // Chỉ xóa khi đã xong hẳn
                        confirm: { title: "Xóa vĩnh viễn báo cáo này?" },
                        onClick: (r) => {
                            const token = localStorage.getItem("token");
                            fetch(`${API_URL}/complaints/${r.id}/`, {
                                method: "DELETE",
                                headers: { Authorization: `Bearer ${token}` },
                            }).then(() => {
                                message.success("Đã xóa");
                                refreshReports();
                            });
                        },
                    }
                ];
                return <ButtonAction actions={actions} record={record} />;
            },
        },
    ];

    return (
        <AdminPageLayout
            title="QUẢN LÝ TRẢ HÀNG"
            extra={
                <Space wrap>
                    {selectedResolveKeys.length > 0 && (
                        <Popconfirm title={`Duyệt nhanh ${selectedResolveKeys.length} đơn?`} onConfirm={handleResolveBatch}>
                            <Button type="primary" icon={<SendOutlined />} style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}>
                                Duyệt Nhanh ({selectedResolveKeys.length})
                            </Button>
                        </Popconfirm>
                    )}
                    {selectedDeleteKeys.length > 0 && (
                        <Popconfirm title={`Xóa ${selectedDeleteKeys.length} đơn?`} onConfirm={handleDeleteBatch}>
                            <Button type="primary" danger icon={<DeleteOutlined />}>
                                Xóa ({selectedDeleteKeys.length})
                            </Button>
                        </Popconfirm>
                    )}
                    <Button type="primary" icon={<ReloadOutlined />} onClick={refreshReports} loading={loading}>
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
                    pagination={{ pageSize: 10 }}
                    size={isMobile ? "small" : "middle"}
                    scroll={{ x: 1000 }}
                />
            </Card>

            {/* --- MODAL XỬ LÝ (ALL-IN-ONE) --- */}
            <ComplaintProcessingModal
                visible={processingModalVisible}
                complaint={selectedComplaint}
                onClose={() => setProcessingModalVisible(false)}
                onRefresh={refreshReports}
            />
        </AdminPageLayout>
    );
};

export default UserReports;