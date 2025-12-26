import React, { useEffect, useState, useMemo } from "react";
import { Modal, Row, Col, Typography, Image, Card, Empty, Descriptions, Tag, Tabs, Avatar, Form, Select, InputNumber, Input, Alert, Button, Statistic, message, Divider, Space, Steps } from "antd";
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

    // Helper hiển thị - robust: hỗ trợ nhiều cấu trúc payload từ API
    const getUserName = (data) => {
        if (!data) return "Khách hàng (Ẩn)";
        return (
            data.display_name ||
            data.created_by_name ||
            data.complainant_name ||
            data.user_name ||
            (data.user && (data.user.full_name || data.user.username)) ||
            (data.created_by && (data.created_by.full_name || data.created_by.username)) ||
            "Khách hàng (Ẩn)"
        );
    };

    const getUserEmail = (data) => {
        if (!data) return "";
        return data.created_by_email || data.user?.email || data.created_by?.email || "";
    };

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

    // Steps flow for status visualization
    const statusSteps = [
        'pending',
        'negotiating',
        'waiting_return',
        'returning',
        'admin_review',
        'resolved_refund',
        'resolved_reject',
    ];
    const currentStep = complaint ? Math.max(0, statusSteps.indexOf(complaint.status)) : 0;

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
                width={1100}
                centered
                bodyStyle={{ padding: 0, height: '80vh', overflow: 'hidden' }}
            >
                <Row style={{ height: '100%' }}>

                    {/* LEFT COLUMN: DETAILS (Larger, clearer layout) */}
                    <Col xs={24} md={16} style={{ height: '100%', overflowY: 'auto', borderRight: '1px solid #f0f0f0', padding: 28 }}>
                        <Space direction="vertical" size="large" style={{ width: '100%' }}>
                            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                                <Card bodyStyle={{ padding: 0, overflow: 'hidden' }} style={{ width: 160, borderRadius: 8, boxShadow: '0 4px 10px rgba(0,0,0,0.04)' }}>
                                    <Image src={resolveProductImage(complaint.product_image)} width={160} height={160} style={{ objectFit: 'cover' }} preview={false} />
                                </Card>
                                <div style={{ flex: 1 }}>
                                    <Title level={3} style={{ margin: 0, lineHeight: 1.1 }}>{complaint.product_name || `#${complaint.id}`}</Title>
                                    <div style={{ marginTop: 10, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                                        <Tag color="geekblue" style={{ fontWeight: 700 }}>{complaint.order_code || `Mã đơn: ${complaint.order_id || 'N/A'}`}</Tag>
                                        <Tag color={isResolved ? 'success' : 'processing'} style={{ fontWeight: 700 }}>{complaint.status_display || complaint.status}</Tag>
                                        <div style={{ color: '#888', fontSize: 13 }}>{new Date(complaint.created_at).toLocaleString()}</div>
                                    </div>

                                    <div style={{ marginTop: 16 }}>
                                        <Steps size="small" current={currentStep} items={[
                                            { title: 'Chờ xử lý' },
                                            { title: 'Thương lượng' },
                                            { title: 'Chờ gửi trả' },
                                            { title: 'Đang trả hàng' },
                                            { title: 'Sàn xem xét' },
                                            { title: 'Hoàn tiền' },
                                            { title: 'Từ chối' },
                                        ]} />
                                    </div>
                                </div>
                            </div>

                            <Divider style={{ margin: '12px 0' }} />

                            <Tabs defaultActiveKey="1" size="large" items={[
                                { key: '1', label: 'Thông tin', children: (
                                    <Descriptions column={1} bordered size="middle">
                                        <Descriptions.Item label={<span style={{ fontWeight: 700 }}>Người khiếu nại</span>}>
                                            {getUserName(complaint)}
                                            <div style={{ color: '#888', marginTop: 6 }}>{getUserEmail(complaint)}</div>
                                        </Descriptions.Item>
                                        <Descriptions.Item label={<span style={{ fontWeight: 700 }}>Shop</span>}>
                                            {complaint.seller_name || <i>Không rõ</i>}
                                            <div style={{ color: '#888', marginTop: 6 }}>Thanh toán: {complaint.payment_method || 'COD'}</div>
                                        </Descriptions.Item>
                                        <Descriptions.Item label={<span style={{ fontWeight: 700 }}>Lý do</span>}>
                                            <div style={{ whiteSpace: 'pre-wrap' }}>{complaint.reason}</div>
                                        </Descriptions.Item>
                                        {complaint.seller_response && (
                                            <Descriptions.Item label={<span style={{ fontWeight: 700 }}>Phản hồi Shop</span>}>
                                                <div style={{ background: '#fff7e6', padding: 12, borderRadius: 6 }}>{complaint.seller_response}</div>
                                            </Descriptions.Item>
                                        )}
                                        {complaint.admin_notes && (
                                            <Descriptions.Item label={<span style={{ fontWeight: 700 }}>Phán quyết Sàn</span>}>
                                                <div style={{ background: '#e6f7ff', padding: 12, borderRadius: 6 }}>{complaint.admin_notes}</div>
                                            </Descriptions.Item>
                                        )}
                                    </Descriptions>
                                ) },
                                { key: '2', label: `Bằng chứng (${images.length + videos.length})`, children: (
                                    <div>
                                        {images.length === 0 && videos.length === 0 && <Empty description="Không có bằng chứng" />}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
                                            <Image.PreviewGroup>
                                                {images.map((url, idx) => (
                                                    <div key={idx} style={{ aspectRatio: '1/1', borderRadius: 8, overflow: 'hidden', border: '1px solid #d9d9d9' }}>
                                                        <Image src={url} width="100%" height="100%" style={{ objectFit: 'cover' }} />
                                                    </div>
                                                ))}
                                            </Image.PreviewGroup>
                                        </div>
                                        {videos.length > 0 && (
                                            <Row gutter={[10, 10]} style={{ marginTop: 16 }}>
                                                {videos.map((url, idx) => (
                                                    <Col span={12} key={idx}><video src={url} controls style={{ width: '100%', borderRadius: 8, maxHeight: 300, background: '#000' }} /></Col>
                                                ))}
                                            </Row>
                                        )}
                                    </div>
                                ) }
                            ]} />
                        </Space>
                    </Col>

                    {/* RIGHT COLUMN: Action Card */}
                    <Col xs={24} md={9} style={{ height: '100%', background: '#f7f8fa', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: 20 }}>
                            <Card size="small" bordered={false} bodyStyle={{ padding: 12 }}>
                                <div style={{ fontSize: 12, textTransform: 'uppercase', color: '#888' }}>Tổng giá trị tranh chấp</div>
                                <Statistic value={maxRefundAmount} suffix="VNĐ" valueStyle={{ color: '#cf1322', fontWeight: '700' }} prefix={<DollarOutlined />} />
                            </Card>
                        </div>

                        <div style={{ flex: 1, padding: 20, overflowY: 'auto' }}>
                            {renderStatusAlert()}

                            <Card size="small" title="Phán quyết của Sàn" bordered={false} headStyle={{ fontWeight: 600 }}>
                                <Form form={form} layout="vertical">
                                    <Form.Item name="resolution_type" rules={[{ required: true, message: 'Chọn loại phán quyết' }] }>
                                        <Select onChange={handleTypeChange} size="middle" disabled={!canAdminIntervene}>
                                            <Select.Option value="refund_full">Hoàn 100% cho Khách</Select.Option>
                                            <Select.Option value="refund_partial">Hoàn một phần</Select.Option>
                                            <Select.Option value="reject">Từ chối (Trả về Shop)</Select.Option>
                                        </Select>
                                    </Form.Item>

                                    {(resolutionType === 'refund_partial' || resolutionType === 'refund_full') && (
                                        <Form.Item name="refund_amount" label="Số tiền hoàn lại" rules={[{ required: true }, { type: 'number', max: maxRefundAmount }] }>
                                            <InputNumber style={{ width: '100%' }} min={0} max={maxRefundAmount} disabled={!canAdminIntervene || resolutionType === 'refund_full'} addonAfter="đ" />
                                        </Form.Item>
                                    )}

                                    <Form.Item name="admin_note" rules={[{ required: canAdminIntervene, message: 'Nhập ghi chú' }] }>
                                        <Input.TextArea rows={5} placeholder={canAdminIntervene ? 'Nhập lý do phán quyết...' : ''} disabled={!canAdminIntervene} />
                                    </Form.Item>

                                    <div style={{ marginTop: 8 }}>{renderSummary()}</div>
                                </Form>
                            </Card>
                        </div>

                        <div style={{ padding: 16, borderTop: '1px solid #e8e8e8', background: '#fff', textAlign: 'right' }}>
                            <Space>
                                <Button onClick={onClose}>Đóng</Button>
                                {canAdminIntervene && (
                                    <Button type="primary" danger={resolutionType === 'reject'} onClick={handleSubmit} loading={loading}>Xác nhận</Button>
                                )}
                            </Space>
                        </div>
                    </Col>
                </Row>
            </Modal>
    );
};

export default ComplaintProcessingModal;