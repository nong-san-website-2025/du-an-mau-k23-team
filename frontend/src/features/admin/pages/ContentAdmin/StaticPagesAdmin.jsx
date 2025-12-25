import React, { useEffect, useState, useMemo, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import CSS cho Editor

// UI Components
import { 
  Card, Tabs, Form, Input, Upload, Button, message, Typography, 
  Space, List, Modal, Tag, Alert, Row, Col, Empty, Spin, Popconfirm 
} from 'antd';

// Icons
import { 
  PlusOutlined, DeleteOutlined, EditOutlined, 
  FontSizeOutlined, CheckCircleOutlined, InfoCircleOutlined,
  RocketOutlined, TeamOutlined, ShopOutlined, 
  ShoppingCartOutlined, SolutionOutlined, WalletOutlined, 
  CustomerServiceOutlined, RollbackOutlined, LockOutlined, 
  CarOutlined, QuestionCircleOutlined, CodeOutlined,
  FileImageOutlined
} from '@ant-design/icons';

// Services (Giữ nguyên import của bạn)
import { 
  getPage, createPage, 
  getBlocks, createBlock, updateBlock, deleteBlock 
} from '../../services/contentApi';

const { Title, Text } = Typography;

// --- CONFIGURATION & CONSTANTS ---

const PAGE_DEFS = [
  { key: 'brand-story', title: 'Câu chuyện thương hiệu', section: 'about', icon: <RocketOutlined />, desc: 'Hành trình và giá trị cốt lõi.' },
  { key: 'recruitment', title: 'Tuyển dụng nhân tài', section: 'about', icon: <TeamOutlined />, desc: 'Cơ hội nghề nghiệp.' },
  { key: 'store-system', title: 'Hệ thống cửa hàng', section: 'about', icon: <ShopOutlined />, desc: 'Mạng lưới điểm bán.' },
  { key: 'buying-guide', title: 'Hướng dẫn mua hàng', section: 'help', icon: <ShoppingCartOutlined />, desc: 'Quy trình đặt hàng.' },
  { key: 'selling-guide', title: 'Hướng dẫn bán hàng', section: 'help', icon: <SolutionOutlined />, desc: 'Dành cho đối tác.' },
  { key: 'contact-support', title: 'Liên hệ & Hỗ trợ', section: 'help', icon: <CustomerServiceOutlined />, desc: 'Kênh CSKH.' },
  { key: 'return-policy', title: 'Chính sách đổi trả', section: 'policy', icon: <RollbackOutlined />, desc: 'Quy định hoàn hàng.' },
  { key: 'privacy', title: 'Chính sách bảo mật', section: 'policy', icon: <LockOutlined />, desc: 'Bảo mật dữ liệu.' },
  { key: 'shipping', title: 'Vận chuyển & Giao nhận', section: 'policy', icon: <CarOutlined />, desc: 'Phí ship và thời gian.' },
  { key: 'faq', title: 'Câu hỏi thường gặp', section: 'help', icon: <QuestionCircleOutlined />, desc: 'Giải đáp thắc mắc.' },
];

const CONTENT_TEMPLATES = {
  heading: [
    { label: 'Giới thiệu', value: 'Giới thiệu chung' },
    { label: 'Lợi ích', value: 'Lợi ích nổi bật' },
    { label: 'Quy trình', value: 'Quy trình thực hiện' },
    { label: 'Cam kết', value: 'Cam kết chất lượng' },
  ],
  content: [
    { label: 'Danh sách', value: '<ul><li>Nội dung 1</li><li>Nội dung 2</li></ul>' },
    { label: 'Đoạn văn', value: '<p>Nội dung chi tiết...</p>' },
    { label: 'In đậm', value: '<strong>Nội dung quan trọng</strong>' },
  ]
};

// Cấu hình Toolbar cho Quill Editor (Pro & Clean)
const QUILL_MODULES = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'], // toggled buttons
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'color': [] }, { 'background': [] }],
    ['link', 'clean'], // remove formatting button
  ],
};

const QUILL_FORMATS = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet',
  'color', 'background',
  'link'
];

// --- SUB-COMPONENTS ---

const BlockFormModal = ({ visible, mode, initialValues, onSubmit, onCancel, totalBlocks }) => {
  const [form] = Form.useForm();
  const quillRef = useRef(null); // Ref để điều khiển Editor
  const [showPreview, setShowPreview] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    if (visible) {
      form.resetFields();
      if (initialValues) {
        form.setFieldsValue(initialValues);
        setCharCount(initialValues.body_html?.length || 0);
        
        if (initialValues.image) {
          setFileList([{
            uid: '-1',
            name: 'image.png',
            status: 'done',
            url: initialValues.image.startsWith('http') 
              ? initialValues.image 
              : `${process.env.REACT_APP_API_URL?.replace('/api', '')}${initialValues.image}`
          }]);
        } else {
          setFileList([]);
        }
      } else {
        form.setFieldValue('order', totalBlocks + 1);
        setFileList([]);
        setCharCount(0);
      }
    }
  }, [visible, initialValues, form, totalBlocks]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = { ...values };
      if (fileList.length > 0 && fileList[0].originFileObj) {
        payload.image = fileList[0].originFileObj;
      } else if (fileList.length === 0) {
        payload.image = null;
      }
      await onSubmit(payload);
    } catch (error) {
      console.error('Validate Failed:', error);
    }
  };

  const insertTemplate = (template) => {
    // Logic chèn template thông minh vào Quill
    const currentVal = form.getFieldValue('body_html') || '';
    const newVal = currentVal + template;
    form.setFieldValue('body_html', newVal);
    setCharCount(newVal.length);
  };

  const uploadProps = {
    accept: 'image/*',
    listType: 'picture-card',
    fileList,
    maxCount: 1,
    beforeUpload: () => false,
    onChange: ({ fileList: newFileList }) => setFileList(newFileList),
    showUploadList: { showPreviewIcon: false }
  };

  return (
    <Modal
      title={
        <Space>
          {mode === 'create' ? <PlusOutlined /> : <EditOutlined />}
          <Text strong style={{ fontSize: 16 }}>
            {mode === 'create' ? 'Soạn Thảo Nội Dung Mới' : 'Chỉnh Sửa Nội Dung'}
          </Text>
        </Space>
      }
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      width={900} // Mở rộng chiều ngang để viết cho thoải mái
      okText={mode === 'create' ? 'Hoàn tất' : 'Lưu lại'}
      cancelText="Hủy bỏ"
      okButtonProps={{ className: 'static-pages-modal-ok-btn' }}
      maskClosable={false}
      centered
      style={{ top: 20 }}
    >
      <Form form={form} layout="vertical">
        <Row gutter={24}>
          <Col span={18}>
            <Form.Item
              name="heading"
              label={<Text strong>Tiêu đề mục</Text>}
              rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
            >
              <Input size="large" placeholder="Ví dụ: Lợi ích sức khỏe..." prefix={<FontSizeOutlined className="site-form-item-icon" />} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="order"
              label={<Text strong>Thứ tự hiển thị</Text>}
              rules={[{ required: true }]}
            >
              <Input size="large" type="number" min={1} max={10} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Gợi ý tiêu đề nhanh">
          <Space size={[8, 8]} wrap>
            {CONTENT_TEMPLATES.heading.map((t, idx) => (
              <Tag 
                key={idx} 
                color="blue" 
                style={{ cursor: 'pointer', padding: '4px 10px' }} 
                onClick={() => form.setFieldValue('heading', t.value)}
              >
                {t.label}
              </Tag>
            ))}
          </Space>
        </Form.Item>

        {/* EDITOR SECTION */}
        <Form.Item
          label={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <Text strong>Nội dung chi tiết</Text>
              <Text type={charCount > 2000 ? "danger" : "secondary"} style={{ fontSize: 12 }}>
                {charCount}/2000 ký tự (HTML)
              </Text>
            </div>
          }
          name="body_html"
          rules={[
            { required: true, message: 'Nội dung không được để trống' },
            { max: 2000, message: 'Nội dung quá dài!' }
          ]}
          style={{ marginBottom: 12 }}
        >
          <ReactQuill 
            ref={quillRef}
            theme="snow"
            modules={QUILL_MODULES}
            formats={QUILL_FORMATS}
            placeholder="Viết nội dung của bạn tại đây..."
            style={{ 
              height: 250, // Chiều cao cố định cho vùng soạn thảo
              marginBottom: 50 // Khoảng trống để thanh toolbar dưới không bị che
            }}
            onChange={(content, delta, source, editor) => {
              // Set value form và đếm ký tự
              setCharCount(content.length);
            }}
          />
        </Form.Item>

        <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: 6, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
             <Text type="secondary" style={{ fontSize: 13 }}>Chèn mẫu nhanh:</Text>
            {CONTENT_TEMPLATES.content.map((t, idx) => (
              <Button key={idx} size="small" type="dashed" onClick={() => insertTemplate(t.value)}>
                + {t.label}
              </Button>
            ))}
          </Space>
          <Button 
            size="small" 
            icon={<CodeOutlined />} 
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? 'Ẩn Mã HTML' : 'Xem Mã HTML'}
          </Button>
        </div>

        {showPreview && (
          <div style={{ padding: 12, border: '1px dashed #d9d9d9', borderRadius: 6, marginBottom: 24, background: '#fafafa' }}>
            <Text type="secondary" code>{form.getFieldValue('body_html')}</Text>
          </div>
        )}

        <Form.Item label={<Text strong>Hình ảnh minh họa</Text>}>
          <Upload {...uploadProps}>
            {fileList.length < 1 && (
              <div>
                <FileImageOutlined style={{ fontSize: 24, color: '#999' }} />
                <div style={{ marginTop: 8, color: '#666' }}>Chọn ảnh</div>
              </div>
            )}
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
};

// --- MAIN COMPONENT ---

export default function StaticPagesAdmin() {
  const [activeKey, setActiveKey] = useState(PAGE_DEFS[0].key);
  const [loading, setLoading] = useState(false);
  const [blocks, setBlocks] = useState({});
  const [modalState, setModalState] = useState({ visible: false, mode: 'create', data: null });

  // Load Initial Data
  useEffect(() => {
    const fetchAllPages = async () => {
      setLoading(true);
      try {
        const promises = PAGE_DEFS.map(async (def) => {
          try {
            const bl = await getBlocks(def.key);
            return { key: def.key, blocks: bl };
          } catch (err) {
            // Tự động tạo trang nếu chưa có
            await createPage({ slug: def.key, title: def.title, section: def.section });
            return { key: def.key, blocks: [] };
          }
        });
        
        const results = await Promise.all(promises);
        const newBlocks = {};
        results.forEach(r => newBlocks[r.key] = r.blocks);
        setBlocks(newBlocks);
      } catch (error) {
        console.error("Init Error:", error);
        message.error("Không thể tải dữ liệu trang.");
      } finally {
        setLoading(false);
      }
    };
    fetchAllPages();
  }, []);

  // Handlers
  const handleModalSubmit = async (values) => {
    const isEdit = modalState.mode === 'edit';
    try {
      if (isEdit) {
        const updated = await updateBlock(modalState.data.id, values);
        setBlocks(prev => ({
          ...prev,
          [activeKey]: prev[activeKey].map(b => b.id === updated.id ? updated : b)
        }));
        message.success('Đã lưu thay đổi!');
      } else {
        const created = await createBlock(activeKey, values);
        setBlocks(prev => ({
          ...prev,
          [activeKey]: [...(prev[activeKey] || []), created]
        }));
        message.success('Tạo mục mới thành công!');
      }
      setModalState({ visible: false, mode: 'create', data: null });
    } catch (error) {
      message.error('Có lỗi xảy ra, vui lòng thử lại.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteBlock(id);
      setBlocks(prev => ({
        ...prev,
        [activeKey]: prev[activeKey].filter(b => b.id !== id)
      }));
      message.success('Đã xóa thành công');
    } catch (error) {
      message.error('Xóa thất bại');
    }
  };

  // Derived State
  const activePageDef = PAGE_DEFS.find(p => p.key === activeKey);
  const activeBlocks = useMemo(() => {
    return (blocks[activeKey] || []).sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [blocks, activeKey]);

  return (
    <div style={{ padding: '24px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <Row gutter={[24, 24]}>
        {/* Header Section */}
        <Col span={24}>
          <Card bordered={false} bodyStyle={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Space direction="vertical" size={2}>
                <Title level={3} style={{ margin: 0 }}>Quản Lý Nội Dung Tĩnh</Title>
                <Text type="secondary">Cấu hình landing page, chính sách và hướng dẫn sử dụng</Text>
              </Space>
              <Tag color="green" icon={<CheckCircleOutlined />}>System Active</Tag>
            </div>
          </Card>
        </Col>

        {/* Sidebar / Navigation */}
        <Col xs={24} lg={6}>
          <Card bordered={false} bodyStyle={{ padding: 0 }}>
            <Tabs
              activeKey={activeKey}
              onChange={setActiveKey}
              tabPosition="left"
              className="static-pages-tabs"
              items={PAGE_DEFS.map(p => ({
                key: p.key,
                label: (
                  <span style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                    {p.icon} {p.title}
                  </span>
                )
              }))}
              style={{ height: '100%', minHeight: 400, paddingTop: 16 }}
            />
          </Card>
        </Col>

        {/* Main Content Area */}
        <Col xs={24} lg={18}>
          <Card 
            title={
              <Space style={{ fontSize: 16 }}>
                {activePageDef?.icon}
                <span style={{ fontWeight: 600 }}>{activePageDef?.title}</span>
              </Space>
            }
            extra={
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                className="static-pages-add-btn"
                onClick={() => setModalState({ visible: true, mode: 'create', data: null })}
                disabled={activeBlocks.length >= 6}
                style={{ fontWeight: 500 }}
              >
                Thêm nội dung
              </Button>
            }
          >
            {activePageDef && (
              <Alert 
                message={<span style={{ color: '#135200', fontWeight: 600 }}>Giới thiệu trang</span>}
                description={<span style={{ color: '#595959' }}>{activePageDef.desc}</span>}
                type="info" 
                showIcon 
                icon={<InfoCircleOutlined style={{ color: '#389E0D' }} />}
                style={{ 
                  marginBottom: 24, 
                  borderRadius: 6,
                  backgroundColor: '#f6ffed',
                  borderColor: '#389E0D',
                  color: '#135200'
                }} 
              />
            )}

            {loading ? (
              <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>
            ) : activeBlocks.length === 0 ? (
              <Empty 
                description="Trang này chưa có nội dung nào" 
                image={Empty.PRESENTED_IMAGE_SIMPLE} 
              />
            ) : (
              <List
                itemLayout="vertical"
                size="large"
                dataSource={activeBlocks}
                renderItem={(item) => (
                  <List.Item
                    key={item.id}
                    style={{ 
                      padding: '24px', 
                      background: '#fff', 
                      border: '1px solid #e8e8e8', 
                      borderRadius: 12, 
                      marginBottom: 20,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                    }}
                    actions={[
                      <Button 
                        type="text" 
                        icon={<EditOutlined />} 
                        onClick={() => setModalState({ visible: true, mode: 'edit', data: item })}
                        style={{ color: '#1890ff' }}
                      >
                        Chỉnh sửa
                      </Button>,
                      <Popconfirm title="Bạn có chắc muốn xóa mục này?" onConfirm={() => handleDelete(item.id)} okText="Xóa" cancelText="Hủy">
                        <Button type="text" danger icon={<DeleteOutlined />}>Xóa bỏ</Button>
                      </Popconfirm>,
                    ]}
                    extra={
                      item.image && (
                        <div style={{ 
                          width: 200, 
                          height: 140, 
                          overflow: 'hidden', 
                          borderRadius: 8, 
                          border: '1px solid #f0f0f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#fafafa'
                        }}>
                          <img
                            alt="minh họa"
                            src={item.image.startsWith('http') ? item.image : `${process.env.REACT_APP_API_URL?.replace('/api', '')}${item.image}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      )
                    }
                  >
                    <List.Item.Meta
                      avatar={
                        <div style={{ 
                          width: 36, height: 36, background: '#f6ffed', color: '#52c41a', 
                          borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 16, border: '1px solid #b7eb8f'
                        }}>
                          {item.order}
                        </div>
                      }
                      title={<Text strong style={{ fontSize: 18, color: '#262626' }}>{item.heading}</Text>}
                      description={
                        <Space>
                          <Tag color="default">HTML Length: {item.body_html?.length || 0}</Tag>
                        </Space>
                      }
                    />
                    <div 
                      className="ql-editor" // Class mặc định của Quill để hiển thị đúng style
                      style={{ 
                        marginTop: 16, 
                        color: '#595959', 
                        padding: 0,
                        maxHeight: 100, 
                        overflow: 'hidden',
                        position: 'relative',
                        maskImage: 'linear-gradient(180deg, #000 60%, transparent)' 
                      }}
                      dangerouslySetInnerHTML={{ __html: item.body_html }}
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      <BlockFormModal
        visible={modalState.visible}
        mode={modalState.mode}
        initialValues={modalState.data}
        onSubmit={handleModalSubmit}
        onCancel={() => setModalState({ visible: false, mode: 'create', data: null })}
        totalBlocks={activeBlocks.length}
      />
      <style>{`
        .static-pages-tabs .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #389E0D !important;
          font-weight: 600;
        }

        .static-pages-tabs .ant-tabs-tab:hover .ant-tabs-tab-btn {
          color: #389E0D !important;
        }

        .static-pages-tabs .ant-tabs-ink-bar {
          background: #389E0D !important;
        }

        .static-pages-add-btn.ant-btn-primary,
        .static-pages-add-btn.ant-btn-primary:focus,
        .static-pages-add-btn.ant-btn-primary:hover {
          background-color: #389E0D;
          border-color: #389E0D;
        }

        .static-pages-modal-ok-btn.ant-btn-primary,
        .static-pages-modal-ok-btn.ant-btn-primary:focus,
        .static-pages-modal-ok-btn.ant-btn-primary:hover {
          background-color: #389E0D;
          border-color: #389E0D;
        }
      `}</style>
    </div>
  );
}