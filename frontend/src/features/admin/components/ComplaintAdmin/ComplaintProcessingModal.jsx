import React, { useEffect, useState, useMemo } from "react";
import { Modal, Row, Col, Typography, Image, Card, Empty, Descriptions, Tag, Tabs, Avatar, Form, Select, InputNumber, Input, Alert, Button, Statistic, message } from "antd";
import {
    UserOutlined, ShopOutlined,
    FileImageOutlined, DollarOutlined,
    InfoCircleOutlined,
    CheckCircleOutlined, WarningOutlined, CloseCircleOutlined, SendOutlined, LockOutlined, ClockCircleOutlined
} from "@ant-design/icons";

const API_URL = process.env.REACT_APP_API_URL;
const { Text, Title } = Typography;
const { TextArea } = Input;

const ComplaintProcessingModal = ({ visible, complaint, onClose, onRefresh }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    // --- [FIX] HÀM XỬ LÝ ẢNH SẢN PHẨM ---
    const resolveProductImage = (imagePath) => {
        if (!imagePath) return "";

        // 1. Nếu đã là link full (có http) thì giữ nguyên
        if (imagePath.startsWith("http")) return imagePath;

        // 2. Lấy API URL từ env
        const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

        // 3. Xử lý cắt bỏ đuôi "/api" để lấy domain gốc
        // Cách này an toàn: nó lấy phần "origin" (http://domain:port) và bỏ qua mọi path phía sau
        try {
            const urlObj = new URL(apiUrl);
            const baseUrl = urlObj.origin; // Kết quả: http://192.168.89.159:8000
            return `${baseUrl}/media/${imagePath}`;
        } catch (error) {
            // Fallback thủ công nếu URL trong env bị sai format
            const cleanBaseUrl = apiUrl.replace(/\/api\/?$/, "");
            return `${cleanBaseUrl}/media/${imagePath}`;
        }
    };

    // --- 1. PHÂN LOẠI TRẠNG THÁI ---

    // Kiểm tra đã xong hẳn chưa
    const isResolved = useMemo(() => {
        if (!complaint) return false;
        const finalStatuses = ['resolved', 'resolved_refund', 'resolved_reject', 'cancelled', 'rejected'];
        return finalStatuses.includes(complaint.status);
    }, [complaint]);

    // [QUAN TRỌNG] Kiểm tra Sàn có được quyền xử lý lúc này không?
    // Chỉ được xử lý khi status là 'admin_review'
    const canAdminIntervene = useMemo(() => {
        if (!complaint) return false;
        return complaint.status === 'admin_review';
    }, [complaint]);

    // --- LOGIC FORM XỬ LÝ ---
    const resolutionType = Form.useWatch('resolution_type', form);
    const refundAmountInput = Form.useWatch('refund_amount', form);

    const maxRefundAmount = useMemo(() => {
        if (!complaint) return 0;
        const price = Number(complaint.purchase_price || complaint.unit_price || complaint.product_price || 0);
        const quantity = Number(complaint.purchase_quantity || complaint.quantity || 1);
        return price * quantity;
    }, [complaint]);

    useEffect(() => {
        if (visible && complaint) {
            form.resetFields();

            // Logic fill dữ liệu cũ hoặc mặc định
            form.setFieldsValue({
                resolution_type: complaint.resolution_type || "refund_full",
                refund_amount: complaint.refund_amount || maxRefundAmount,
                admin_note: complaint.admin_notes || (canAdminIntervene ? "" : "(Chưa có phán quyết)"),
            });
        }
    }, [visible, complaint, maxRefundAmount, form, canAdminIntervene]);

    const handleTypeChange = (value) => {
        if (!canAdminIntervene) return; // Chặn
        if (value === 'refund_full') form.setFieldsValue({ refund_amount: maxRefundAmount });
        if (value === 'reject') form.setFieldsValue({ refund_amount: 0 });
    };

    const handleSubmit = async () => {
        // Chặn submit nếu không đúng trạng thái
        if (!canAdminIntervene) {
            message.warning("Chưa đến lượt Sàn xử lý hoặc đơn đã kết thúc!");
            return;
        }

        try {
            setLoading(true);
            const values = await form.validateFields();
            const token = localStorage.getItem("token");

            const payload = {
                status: "resolved",
                resolution_type: values.resolution_type,
                admin_notes: values.admin_note,
            };

            if (values.resolution_type.includes('refund')) {
                payload.refund_amount = values.refund_amount;
                payload.decision = 'refund_buyer';
            } else if (values.resolution_type === 'reject') {
                payload.decision = 'release_seller';
            }
            if (values.resolution_type === 'voucher') payload.voucher_code = values.voucher_code;

            const res = await fetch(`${API_URL}/complaints/${complaint.id}/admin-resolve/`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Lỗi xử lý API");

            message.success("Đã phán quyết thành công!");
            onClose();
            if (onRefresh) onRefresh();
        } catch (error) {
            message.error("Lỗi: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Helper hiển thị
    const getUserName = (data) => data?.created_by_name || data?.complainant_name || data?.user_name || "N/A";

    const { images, videos } = useMemo(() => {
        const rawMedia = complaint?.media || complaint?.media_urls || [];
        const imgs = []; const vids = [];
        if (Array.isArray(rawMedia)) {
            rawMedia.forEach((item) => {
                const url = typeof item === 'object' ? item.file : item;
                if (url) url.match(/\.(mp4|webm|ogg|mov)$/i) ? vids.push(url) : imgs.push(url);
            });
        }
        return { images: imgs, videos: vids };
    }, [complaint]);

    const renderSummary = () => {
        if (resolutionType === 'refund_full') return <Tag color="success">Khách: {maxRefundAmount.toLocaleString()}đ | Shop: 0đ</Tag>;
        if (resolutionType === 'reject') return <Tag color="error">Khách: 0đ | Shop: {maxRefundAmount.toLocaleString()}đ</Tag>;
        if (resolutionType === 'refund_partial') {
            const amt = refundAmountInput || 0;
            return <Tag color="warning">Khách: {amt.toLocaleString()}đ | Shop: {(maxRefundAmount - amt).toLocaleString()}đ</Tag>;
        }
        return null;
    };

    // 2. HELPER RENDER ALERT THÔNG MINH
    const renderStatusAlert = () => {
        if (isResolved) {
            return <Alert message="Đã kết thúc" description="Khiếu nại này đã được xử lý xong." type="success" showIcon icon={<CheckCircleOutlined />} style={{ marginBottom: 20 }} />;
        }
        if (!canAdminIntervene) {
            // Trường hợp Pending, Negotiating, Returning...
            return <Alert
                message="Chưa thể can thiệp"
                description="Hai bên đang thương lượng hoặc đang gửi hàng. Nút xử lý chỉ mở khi trạng thái là 'Sàn đang xem xét'."
                type="info" showIcon icon={<ClockCircleOutlined />}
                style={{ marginBottom: 20 }}
            />;
        }
        // Trường hợp Admin Review -> Cho phép xử lý
        return <Alert message="Cần xử lý ngay" description="Quyết định của bạn sẽ chuyển tiền ngay lập tức." type="warning" showIcon style={{ marginBottom: 20 }} />;
    };

    if (!complaint) return null;

    return (
        <Modal
            open={visible}
            title={null}
            onCancel={onClose}
            footer={null}
            width={1200}
            centered
            bodyStyle={{ padding: 0, height: '80vh', overflow: 'hidden' }}
        >
            <Row style={{ height: '100%' }}>

                {/* CỘT TRÁI (Giữ nguyên) */}
                <Col span={15} style={{ height: '100%', overflowY: 'auto', borderRight: '1px solid #f0f0f0', padding: 24 }}>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                        <Avatar
                            shape="square"
                            size={64}
                            src={resolveProductImage(complaint.product_image)}
                            icon={<FileImageOutlined />}
                        />
                        <div>
                            <Title level={5} style={{ margin: 0, color: '#1890ff' }}>#{complaint.id} - {complaint.product_name}</Title>
                            <div style={{ marginTop: 4 }}>
                                <Tag color="geekblue">{complaint.order_code || "Mã đơn: " + complaint.order_id}</Tag>
                                <Tag color={isResolved ? 'success' : 'processing'}>
                                    {complaint.status_display || complaint.status}
                                </Tag>
                            </div>
                        </div>
                    </div>

                    <Tabs defaultActiveKey="1" items={[
                        {
                            key: '1', label: <span><InfoCircleOutlined /> Chi tiết vụ việc</span>,
                            children: (
                                <>
                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Card size="small" title="Người mua (Khách)" bordered={false} style={{ background: '#f9f9f9' }}>
                                                <Text strong>{getUserName(complaint)}</Text><br />
                                                <Text type="secondary">{complaint.created_by_email}</Text>
                                            </Card>
                                        </Col>
                                        <Col span={12}>
                                            <Card size="small" title="Người bán (Shop)" bordered={false} style={{ background: '#f9f9f9' }}>
                                                <Text strong>{complaint.seller_name}</Text><br />
                                                <Text type="secondary">Thanh toán: {complaint.payment_method || "Tiền mặt / COD"}</Text>
                                            </Card>
                                        </Col>
                                    </Row>
                                    <div style={{ marginTop: 20 }}>
                                        <Text strong>Lý do khiếu nại:</Text>
                                        <div style={{ background: '#fff', border: '1px solid #eee', padding: 12, borderRadius: 6, fontStyle: 'italic', marginTop: 5 }}>
                                            "{complaint.reason}"
                                        </div>
                                    </div>
                                    {complaint.seller_response && (
                                        <div style={{ marginTop: 15 }}>
                                            <Text strong style={{ color: '#cf1322' }}>Phản hồi của Shop:</Text>
                                            <div style={{ background: '#fff1f0', border: '1px solid #ffa39e', padding: 12, borderRadius: 6, color: '#cf1322', marginTop: 5 }}>
                                                "{complaint.seller_response}"
                                            </div>
                                        </div>
                                    )}
                                </>
                            )
                        },
                        {
                            key: '2', label: <span><FileImageOutlined /> Bằng chứng ({images.length + videos.length})</span>,
                            children: (
                                <div>
                                    {images.length === 0 && videos.length === 0 && <Empty description="Không có bằng chứng" />}
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 10 }}>
                                        <Image.PreviewGroup>
                                            {images.map((url, idx) => (
                                                <div key={idx} style={{ aspectRatio: "1/1", borderRadius: 8, overflow: 'hidden', border: '1px solid #d9d9d9' }}>
                                                    <Image src={url} width="100%" height="100%" style={{ objectFit: "cover" }} />
                                                </div>
                                            ))}
                                        </Image.PreviewGroup>
                                    </div>
                                    {videos.length > 0 && (
                                        <Row gutter={[10, 10]} style={{ marginTop: 15 }}>
                                            {videos.map((url, idx) => (
                                                <Col span={12} key={idx}><video src={url} controls style={{ width: "100%", borderRadius: 8, maxHeight: 150, background: '#000' }} /></Col>
                                            ))}
                                        </Row>
                                    )}
                                </div>
                            )
                        }
                    ]} />
                </Col>

                {/* CỘT PHẢI: FORM XỬ LÝ (Có điều kiện Disabled) */}
                <Col span={9} style={{ height: '100%', background: '#f5f7fa', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid #e8e8e8', background: '#fff' }}>
                        <div style={{ fontSize: 12, textTransform: 'uppercase', color: '#888' }}>Tổng giá trị tranh chấp</div>
                        <Statistic
                            value={maxRefundAmount} suffix="VNĐ"
                            valueStyle={{ color: '#cf1322', fontWeight: 'bold' }}
                            prefix={<DollarOutlined />}
                        />
                    </div>

                    <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>

                        {/* HIỂN THỊ ALERT THEO TRẠNG THÁI */}
                        {renderStatusAlert()}

                        <Form form={form} layout="vertical">
                            <Form.Item name="resolution_type" label="Phán quyết của Sàn" rules={[{ required: true }]}>
                                <Select
                                    onChange={handleTypeChange}
                                    size="large"
                                    disabled={!canAdminIntervene} // 3. CHỈ CHO CHỌN KHI ĐƯỢC PHÉP
                                >
                                    <Select.Option value="refund_full"><CheckCircleOutlined style={{ color: '#52c41a' }} /> Hoàn 100% (Khách)</Select.Option>
                                    <Select.Option value="refund_partial"><WarningOutlined style={{ color: '#faad14' }} /> Hoàn 1 phần</Select.Option>
                                    <Select.Option value="reject"><CloseCircleOutlined style={{ color: '#ff4d4f' }} /> Từ chối (Shop)</Select.Option>
                                </Select>
                            </Form.Item>

                            {(resolutionType === "refund_partial" || resolutionType === "refund_full") && (
                                <Form.Item
                                    name="refund_amount" label="Số tiền hoàn lại"
                                    rules={[{ required: true }, { type: 'number', max: maxRefundAmount, message: 'Vượt quá tối đa' }]}
                                >
                                    <InputNumber
                                        style={{ width: "100%" }} size="large"
                                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                        parser={(value) => value?.replace(/\$\s?|(,*)/g, "")}
                                        disabled={!canAdminIntervene || resolutionType === "refund_full"}
                                        min={0} max={maxRefundAmount} addonAfter="đ"
                                    />
                                </Form.Item>
                            )}

                            <div style={{ marginBottom: 20 }}>Kết quả: {renderSummary()}</div>

                            <Form.Item
                                name="admin_note" label="Ghi chú"
                                rules={[{ required: canAdminIntervene, message: 'Vui lòng nhập ghi chú' }]}
                            >
                                <TextArea
                                    rows={6}
                                    placeholder={canAdminIntervene ? "Nhập lý do phán quyết..." : ""}
                                    showCount={canAdminIntervene}
                                    maxLength={500}
                                    disabled={!canAdminIntervene} // 3. KHÓA GHI CHÚ
                                    style={{ color: !canAdminIntervene ? '#000' : undefined }}
                                />
                            </Form.Item>
                        </Form>
                    </div>

                    <div style={{ padding: '16px 24px', borderTop: '1px solid #e8e8e8', background: '#fff', textAlign: 'right' }}>
                        <Button onClick={onClose} style={{ marginRight: 8 }}>Đóng</Button>

                        {/* 4. CHỈ HIỆN NÚT XÁC NHẬN KHI ĐƯỢC QUYỀN */}
                        {canAdminIntervene && (
                            <Button
                                type="primary" danger={resolutionType === 'reject'}
                                onClick={handleSubmit} loading={loading} icon={<SendOutlined />}
                            >
                                Xác nhận Phán quyết
                            </Button>
                        )}
                    </div>
                </Col>
            </Row>
        </Modal>
    );
};

export default ComplaintProcessingModal;