import React, { useState, useEffect, useMemo } from "react";
import {
  Form,
  InputNumber,
  DatePicker,
  Switch,
  Card,
  Table,
  Button,
  Select,
  Row,
  Col,
  Space,
  Typography,
  Divider,
  message,
  Avatar,
  Tag,
  Input,
  Skeleton,
  Image
} from "antd";
import { DeleteOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { getProducts } from "../../services/products";
import { intcomma } from "./../../../../utils/format";

const { Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const FlashSaleForm = ({ form, isEdit = false }) => {
  const [allProducts, setAllProducts] = useState([]); // Tất cả sản phẩm từ API
  const [selectedProducts, setSelectedProducts] = useState([]); // Sản phẩm đã chọn cho Flash Sale
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showSkeletonAnimation, setShowSkeletonAnimation] = useState(false);

  // State cho Modal chọn sản phẩm (Logic hiển thị bảng chọn)
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [selectorCategory, setSelectorCategory] = useState("all");
  const [selectorSearch, setSelectorSearch] = useState("");

  // Load danh sách sản phẩm ban đầu
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      setShowSkeletonAnimation(true);
      try {
        const res = await getProducts();
        const list = Array.isArray(res) ? res : res.results || [];
        setAllProducts(list);
      } catch (error) {
        message.error("Lỗi tải sản phẩm");
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  // Dừng animation sau 1s
  useEffect(() => {
    if (showSkeletonAnimation) {
      const timer = setTimeout(() => {
        setShowSkeletonAnimation(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showSkeletonAnimation]);

  // Sync dữ liệu từ Form (khi sửa) vào State selectedProducts
  // Sync dữ liệu từ Form (khi sửa) vào State selectedProducts
  useEffect(() => {
    const currentProductIds = form.getFieldValue("products") || [];

    // Chỉ chạy khi có sản phẩm cần edit và list sản phẩm gốc đã load
    if (currentProductIds.length > 0 && allProducts.length > 0 && selectedProducts.length === 0) {
      const initialSelected = currentProductIds.map(id => {
        // Chỉ lấy thông tin sản phẩm gốc, KHÔNG merge với flashInfo
        return allProducts.find(p => p.id === id);
      }).filter(Boolean);

      setSelectedProducts(initialSelected);
    }
  }, [allProducts, form]); // Lưu ý: bỏ selectedProducts khỏi dependency để tránh loop nếu không cần thiết


  // Logic lọc sản phẩm trong bảng chọn
  const filteredProducts = useMemo(() => {
    return allProducts.filter(p => {
      const matchCat = selectorCategory === "all" || p.category?.id === selectorCategory;
      const matchSearch = p.name.toLowerCase().includes(selectorSearch.toLowerCase());
      // Lọc bỏ những sp đã chọn rồi
      const notSelected = !selectedProducts.find(sp => sp.id === p.id);
      return matchCat && matchSearch && notSelected;
    });
  }, [allProducts, selectorCategory, selectorSearch, selectedProducts]);

  // Handle chọn sản phẩm
  const handleSelectProducts = (selectedRowKeys) => {
    const newItems = allProducts.filter(p => selectedRowKeys.includes(p.id));
    const updatedList = [...selectedProducts, ...newItems];
    setSelectedProducts(updatedList);
    updateFormValues(updatedList);
  };

  // Handle xóa sản phẩm khỏi danh sách
  const handleRemoveProduct = (id) => {
    const updatedList = selectedProducts.filter(p => p.id !== id);
    setSelectedProducts(updatedList);
    updateFormValues(updatedList);
  };

  // Cập nhật giá trị ngược lại vào Form Antd
  const updateFormValues = (list) => {
    const productIds = list.map(p => p.id);
    form.setFieldsValue({ products: productIds });

    // Giữ lại giá trị input cũ nếu có
    const currentFlashItems = form.getFieldValue("flash_items") || {};
    list.forEach(p => {
      if (!currentFlashItems[p.id]) {
        currentFlashItems[p.id] = { flash_price: p.original_price * 0.9, stock: 10 }; // Default logic
      }
    });
    form.setFieldsValue({ flash_items: currentFlashItems });
  };

  // Columns cho bảng chọn sản phẩm (Mini Table)
  const selectionColumns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'name',
      render: (text, record) => {
        let imageUrl = null;
        if (Array.isArray(record.images) && record.images.length > 0) {
          const primary = record.images.find(img => img.is_primary);
          imageUrl = primary?.image || record.images[0]?.image;
        }
        
        return (
          <Space>
            {imageUrl ? (
              <Avatar shape="square" src={imageUrl} size={40} />
            ) : (
              <Skeleton.Image style={{ width: 40, height: 40 }} active={showSkeletonAnimation} />
            )}
            <div>
              <div style={{ fontSize: 12, fontWeight: 500 }}>{text}</div>
              <div style={{ fontSize: 11, color: '#888' }}>Kho: {record.stock}</div>
            </div>
          </Space>
        )
      }
    },
    {
      title: 'Giá gốc',
      dataIndex: 'original_price',
      render: val => <Text>{intcomma(val)}đ</Text>
    }
  ];

  // Columns cho bảng chính (Nhập liệu)
  const mainColumns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'name',
      render: (text, record) => {
        // Lấy ảnh đầu tiên từ mảng images, hoặc ảnh primary
        let imageUrl = null;
        if (Array.isArray(record.images) && record.images.length > 0) {
          const primary = record.images.find(img => img.is_primary);
          imageUrl = primary?.image || record.images[0]?.image;
        }

        return (
          <Space>
            {imageUrl ? (
              <Avatar shape="square" src={imageUrl} size={40} />
            ) : (
              <Skeleton.Image style={{ width: 40, height: 40 }} active={showSkeletonAnimation} />
            )}
            <div>
              <div style={{ fontSize: 12, fontWeight: 500 }}>{text}</div>
              <div style={{ fontSize: 11, color: '#888' }}>Kho: {record.stock}</div>
            </div>
          </Space>
        );
      }
    },
    {
      title: 'Giá gốc & Kho',
      width: 150,
      render: (_, record) => {
        const latestProduct = allProducts.find(p => p.id === record.id) || record;
        return (
          <div>
            <div>Giá: {intcomma(latestProduct.original_price)}đ</div>
            <div>Kho: {latestProduct.stock}</div>
          </div>
        );
      }
    },
    {
      title: 'Giá Flash Sale (đ)',
      key: 'flash_price',
      width: 200,
      render: (_, record) => {
        const latestProduct = allProducts.find(p => p.id === record.id) || record;
        return (
          <Form.Item
            name={['flash_items', record.id, 'flash_price']}
            style={{ marginBottom: 0 }}
            rules={[
              { required: true, message: "Nhập giá!" },
              () => ({
                validator(_, value) {
                  if (!value || value < latestProduct.original_price) return Promise.resolve();
                  return Promise.reject(new Error('Giá giảm phải nhỏ hơn giá gốc'));
                },
              }),
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              addonAfter={
                <Form.Item shouldUpdate noStyle>
                  {({ getFieldValue }) => {
                    const flashPrice = getFieldValue(['flash_items', record.id, 'flash_price']);
                    const percent = flashPrice ? Math.round(((latestProduct.original_price - flashPrice) / latestProduct.original_price) * 100) : 0;
                    return <span style={{ fontSize: 11, color: percent > 0 ? 'red' : '#ccc' }}>-{percent}%</span>
                  }}
                </Form.Item>
              }
            />
          </Form.Item>
        );
      }
    },
    {
      title: 'Số lượng Sale',
      key: 'stock',
      width: 150,
      render: (_, record) => {
        const latestProduct = allProducts.find(p => p.id === record.id) || record;
        return (
          <Form.Item
            name={['flash_items', record.id, 'stock']}
            style={{ marginBottom: 0 }}
            rules={[
              { required: true, message: "Nhập SL!" },
              { type: 'number', max: latestProduct.stock, message: `Max ${latestProduct.stock}` }
            ]}
          >
            <InputNumber style={{ width: '100%' }} min={1} max={latestProduct.stock} />
          </Form.Item>
        );
      }
    },
    {
      title: '',
      key: 'action',
      width: 50,
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveProduct(record.id)}
        />
      )
    }
  ];

  return (
    <div style={{ height: '100%' }}>
      <Form form={form} layout="vertical" name="flashsale_form">
        {/* Phần 1: Thông tin chung */}
        <Card size="small" title="Thông tin chương trình" style={{ marginBottom: 16 }}>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="time_range"
                label="Thời gian diễn ra"
                rules={[{ required: true, message: "Vui lòng chọn thời gian!" }]}
              >
                <RangePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="is_active" label="Trạng thái" valuePropName="checked">
                <Switch checkedChildren="Kích hoạt" unCheckedChildren="Tạm ẩn" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Phần 2: Danh sách sản phẩm */}
        <Card
          size="small"
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Danh sách sản phẩm tham gia ({selectedProducts.length})</span>
              <Button
                type="dashed"

                icon={<PlusOutlined />}
                onClick={() => setIsSelectorOpen(!isSelectorOpen)}
              >
                {isSelectorOpen ? "Đóng chọn SP" : "Thêm sản phẩm"}
              </Button>
            </div>
          }
          bodyStyle={{ padding: 0 }}
        >
          {/* Khu vực chọn sản phẩm (Toggle hiển thị) */}
          {isSelectorOpen && (
            <div style={{ padding: 16, background: '#f5f7fa', borderBottom: '1px solid #f0f0f0' }}>
              <Row gutter={12} style={{ marginBottom: 12 }}>
                <Col span={8}>
                  <Input
                    placeholder="Tìm tên sản phẩm..."
                    prefix={<SearchOutlined />}
                    onChange={e => setSelectorSearch(e.target.value)}
                  />
                </Col>
                {/* Có thể map Categories vào Select ở đây */}
              </Row>
              <Table
                columns={selectionColumns}
                dataSource={filteredProducts}
                rowKey="id"
                size="small"
                loading={loadingProducts}
                pagination={{ pageSize: 10, showSizeChanger: false }}
                rowSelection={{
                  type: 'checkbox',
                  onChange: handleSelectProducts,
                  selectedRowKeys: selectedProducts.map(p => p.id)
                }}
                scroll={{ y: 300 }}
              />
              <Divider style={{ margin: '12px 0' }}>Sản phẩm đã chọn hiển thị bên dưới</Divider>
            </div>
          )}

          {/* Bảng nhập liệu chính */}
          <Table
            columns={mainColumns}
            dataSource={selectedProducts}
            rowKey="id"
            pagination={false}
            locale={{ emptyText: "Chưa có sản phẩm nào được chọn" }}
            scroll={{ y: 400 }} // Cố định chiều cao nếu danh sách dài
          />

          {/* Input ẩn để Form Antd validate số lượng sản phẩm */}
          <Form.Item
            name="products"
            style={{ display: 'none' }}
            rules={[{ required: true, message: "Cần ít nhất 1 sản phẩm" }]}
          >
            <Input />
          </Form.Item>
        </Card>
      </Form>
    </div>
  );
};

export default FlashSaleForm;