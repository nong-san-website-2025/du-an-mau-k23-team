import React, { useState, useEffect } from 'react';
import {
    Button, Modal, message, Table, Space, Popconfirm, Tag,
    Form, Input, DatePicker, Radio, Select, InputNumber, Row, Col,
    Dropdown, Menu
} from 'antd';
import {
    PlusOutlined, EllipsisOutlined, EditOutlined, DeleteOutlined, EyeOutlined
} from '@ant-design/icons';
import moment from 'moment';

// LƯU Ý: Hãy chắc chắn đường dẫn này đúng với cấu trúc project của bạn!
import {
  getSellerVouchers, createSellerVoucher, updateSellerVoucher, deleteSellerVoucher, getMyProductsForVoucher,
} from '../../../admin/services/promotionServices'; 

const { Option } = Select;

// ====================================================================
// == Component Lọc/Tìm kiếm ==
// ====================================================================
const PromotionFilters = ({ onFilter, onClear }) => {
    const [form] = Form.useForm();
    const handleFinish = (values) => {
        const cleanedValues = Object.fromEntries(Object.entries(values).filter(([_, v]) => v != null && v !== ''));
        onFilter(cleanedValues);
    };
    const handleClear = () => {
        form.resetFields();
        onClear();
    };
    return (
        <Form form={form} layout="inline" onFinish={handleFinish} style={{ marginBottom: 24 }}>
            <Form.Item name="search" label="Tìm kiếm"><Input.Search placeholder="Tìm theo tên hoặc mã" allowClear onSearch={() => form.submit()} /></Form.Item>
            <Form.Item name="active" label="Trạng thái"><Select placeholder="Chọn trạng thái" allowClear style={{ width: 150 }}><Option value="true">Hoạt động</Option><Option value="false">Tạm dừng</Option></Select></Form.Item>
            <Form.Item><Space><Button type="primary" htmlType="submit">Lọc</Button><Button onClick={handleClear}>Xóa lọc</Button></Space></Form.Item>
        </Form>
    );
};

// ====================================================================
// == Component Form (Nâng cấp để có chế độ chỉ xem - disabled) ==
// ====================================================================
const PromotionForm = ({ onSubmit, onCancel, initialData, disabled = false }) => {
    const [form] = Form.useForm();
    const [productScope, setProductScope] = useState(initialData?.product_scope || 'ALL');
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    useEffect(() => {
        // Chỉ fetch sản phẩm khi cần thiết (chế độ sửa/xem chi tiết hoặc khi user chọn)
        if (productScope === 'SPECIFIC') {
            const fetchProducts = async () => {
                setLoadingProducts(true);
                try {
                    const data = await getMyProductsForVoucher();
                    setProducts(data);
                } catch (error) { message.error('Lỗi khi tải danh sách sản phẩm!'); } 
                finally { setLoadingProducts(false); }
            };
            fetchProducts();
        }
    }, [productScope]);
    const onFinish = (values) => {
        const payload = { ...values, start_at: values.dateRange[0].toISOString(), end_at: values.dateRange[1].toISOString(), applicable_products: values.product_scope === 'ALL' ? [] : values.applicable_products };
        delete payload.dateRange;
        onSubmit(payload);
    };
    return (
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ ...initialData, dateRange: initialData ? [moment(initialData.start_at), moment(initialData.end_at)] : undefined }} disabled={disabled}>
            <Row gutter={16}><Col span={12}><Form.Item name="title" label="Tên chương trình" rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}><Input /></Form.Item></Col><Col span={12}><Form.Item name="code" label="Mã khuyến mãi" rules={[{ required: true, message: 'Vui lòng nhập mã!' }]}><Input /></Form.Item></Col></Row>
            <Row gutter={16}><Col span={12}><Form.Item name="discount_amount" label="Số tiền giảm (VND)"><InputNumber min={0} style={{ width: '100%' }} formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(value) => value.replace(/\$\s?|(,*)/g, '')} /></Form.Item></Col><Col span={12}><Form.Item name="min_order_value" label="Giá trị đơn hàng tối thiểu (VND)"><InputNumber min={0} style={{ width: '100%' }} formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(value) => value.replace(/\$\s?|(,*)/g, '')} /></Form.Item></Col></Row>
            <Form.Item name="dateRange" label="Thời gian hiệu lực" rules={[{ required: true, message: 'Vui lòng chọn thời gian!' }]}><DatePicker.RangePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} /></Form.Item>
            <Form.Item name="product_scope" label="Phạm vi áp dụng"><Radio.Group onChange={(e) => setProductScope(e.target.value)}><Radio value="ALL">Tất cả sản phẩm</Radio><Radio value="SPECIFIC">Sản phẩm tùy chọn</Radio></Radio.Group></Form.Item>
            {productScope === 'SPECIFIC' && (<Form.Item name="applicable_products" label="Sản phẩm áp dụng"><Select mode="multiple" allowClear loading={loadingProducts} placeholder="Tìm và chọn sản phẩm" filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}>{products.map(product => (<Option key={product.id} value={product.id}>{product.name}</Option>))}</Select></Form.Item>)}
            {/* Chỉ hiển thị các nút hành động khi không ở chế độ "disabled" (chỉ xem) */}
            {!disabled && <Form.Item><Button type="primary" htmlType="submit">Lưu</Button><Button style={{ marginLeft: 8 }} onClick={onCancel}>Hủy</Button></Form.Item>}
        </Form>
    );
};

// ====================================================================
// == Component Cha (Chính): Quản lý toàn bộ logic và hiển thị ==
// ====================================================================
const PromotionSeller = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});
  
  // State cho modal Tạo/Sửa
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);

  // State MỚI cho modal Xem chi tiết
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [viewingVoucher, setViewingVoucher] = useState(null);

  useEffect(() => {
    const fetchVouchers = async () => {
        setLoading(true);
        try { const data = await getSellerVouchers(filters); setVouchers(data); } 
        catch (error) { if (error.response?.status !== 500) { message.error('Lỗi khi tải danh sách!'); } } 
        finally { setLoading(false); }
    };
    fetchVouchers();
  }, [filters]);

  // --- Các hàm xử lý CRUD ---
  const handleCreate = async (values) => { try { await createSellerVoucher(values); message.success('Tạo thành công!'); closeEditModal(); setFilters({}); } catch (error) { message.error(error.response?.data?.detail || 'Tạo thất bại!'); }};
  const handleUpdate = async (values) => { try { await updateSellerVoucher(editingVoucher.id, values); message.success('Cập nhật thành công!'); closeEditModal(); setFilters({}); } catch (error) { message.error(error.response?.data?.detail || 'Cập nhật thất bại!'); }};
  const handleDelete = async (id) => { try { await deleteSellerVoucher(id); message.success('Xóa thành công!'); setFilters({}); } catch (error) { message.error('Xóa thất bại!'); }};
  
  // --- Các hàm xử lý Filter ---
  const handleFilter = (newFilters) => { setFilters(newFilters); };
  const handleClearFilters = () => { setFilters({}); };

  // --- Các hàm điều khiển Modal ---
  const openCreateModal = () => { setEditingVoucher(null); setIsEditModalVisible(true); };
  const openEditModal = (voucher) => { setEditingVoucher(voucher); setIsEditModalVisible(true); };
  const closeEditModal = () => { setIsEditModalVisible(false); setEditingVoucher(null); };
  
  // Hàm MỚI để điều khiển modal Xem chi tiết
  const openViewModal = (voucher) => { setViewingVoucher(voucher); setIsViewModalVisible(true); };
  const closeViewModal = () => { setIsViewModalVisible(false); };

  const columns = [
    { title: 'Mã', dataIndex: 'code', key: 'code', render: (text) => <strong>{text}</strong> },
    { title: 'Tên khuyến mãi', dataIndex: 'title', key: 'title' },
    { title: 'Trạng thái', dataIndex: 'active', key: 'active', render: (active) => <Tag color={active ? 'green' : 'red'}>{active ? 'Hoạt động' : 'Tạm dừng'}</Tag> },
    { title: 'Ngày bắt đầu', dataIndex: 'start_at', key: 'start_at', render: (date) => moment(date).format('DD/MM/YYYY HH:mm') },
    { title: 'Ngày kết thúc', dataIndex: 'end_at', key: 'end_at', render: (date) => moment(date).format('DD/MM/YYYY HH:mm') },
    {
      title: 'Hành động', key: 'action',
      render: (_, record) => (
        <Dropdown overlay={<Menu>
              <Menu.Item key="view" icon={<EyeOutlined />} onClick={() => openViewModal(record)}>Xem chi tiết</Menu.Item>
              <Menu.Item key="edit" icon={<EditOutlined />} onClick={() => openEditModal(record)}>Sửa</Menu.Item>
              <Menu.Item key="delete" danger>
                 <Popconfirm title="Bạn có chắc muốn xóa?" onConfirm={() => handleDelete(record.id)} okText="Xóa" cancelText="Hủy">
                    <div style={{ display: 'flex', alignItems: 'center' }}><DeleteOutlined style={{ marginRight: 8 }} /> Xóa</div>
                 </Popconfirm>
              </Menu.Item>
            </Menu>} trigger={['click']}>
          <Button icon={<EllipsisOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2>Quản lý khuyến mãi</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>Tạo Voucher</Button>
      </div>
      
      <PromotionFilters onFilter={handleFilter} onClear={handleClearFilters} />
      
      <Table columns={columns} dataSource={vouchers} loading={loading} rowKey="id" />
      
      {/* Modal cho Tạo/Sửa */}
      <Modal title={editingVoucher ? "Sửa Khuyến Mãi" : "Tạo Khuyến Mãi Mới"} visible={isEditModalVisible} onCancel={closeEditModal} footer={null} width={800} destroyOnClose>
        <PromotionForm key={editingVoucher ? editingVoucher.id : 'new-edit'} onSubmit={editingVoucher ? handleUpdate : handleCreate} onCancel={closeEditModal} initialData={editingVoucher} />
      </Modal>

      {/* Modal MỚI chỉ để Xem chi tiết */}
      {viewingVoucher && (
        <Modal title="Xem Chi Tiết Khuyến Mãi" visible={isViewModalVisible} onCancel={closeViewModal} footer={[<Button key="back" onClick={closeViewModal}>Đóng</Button>]} width={800} destroyOnClose>
            {/* Tái sử dụng Form ở chế độ "chỉ xem" (disabled) */}
            <PromotionForm key={viewingVoucher.id} initialData={viewingVoucher} disabled={true} />
        </Modal>
      )}
    </div>
  );
};

export default PromotionSeller;