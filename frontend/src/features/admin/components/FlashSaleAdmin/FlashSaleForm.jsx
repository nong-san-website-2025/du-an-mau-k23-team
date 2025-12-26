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
  Input,
  Skeleton,
  Tooltip,
  Alert,
} from "antd";
import { DeleteOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { getProducts } from "../../services/products";
import { intcomma } from "./../../../../utils/format";
import moment from "moment";

const { Text } = Typography;
const { RangePicker } = DatePicker;

// Hàm kiểm tra trùng lịch (Logic cốt lõi)
const checkOverlap = (start, end, existingSales, currentId = null) => {
  return existingSales.some((sale) => {
    // 1. Bỏ qua chính nó (khi đang Edit)
    if (currentId && sale.id === currentId) return false;
    // 2. Bỏ qua các sale đã bị hủy/ẩn (tùy logic business của bạn)
    if (!sale.is_active) return false;

    const s1 = moment(start);
    const e1 = moment(end);
    const s2 = moment(sale.start_time);
    const e2 = moment(sale.end_time);

    // 3. Công thức kiểm tra trùng khoảng thời gian: (StartA < EndB) && (StartB < EndA)
    return s1.isBefore(e2) && s2.isBefore(e1);
  });
};

const FlashSaleForm = ({ form, isEdit = false, existingSales = [], currentId = null }) => {
  const [allProducts, setAllProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showSkeletonAnimation, setShowSkeletonAnimation] = useState(false);

  // State cho UI Timeline
  const [timelineDate, setTimelineDate] = useState(moment()); // Ngày đang xem trên thanh timeline

  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [selectorCategory, setSelectorCategory] = useState("all");
  const [selectorSearch, setSelectorSearch] = useState("");

  // --- Load Products (Giữ nguyên logic cũ) ---
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

  useEffect(() => {
    if (showSkeletonAnimation) {
      const timer = setTimeout(() => setShowSkeletonAnimation(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [showSkeletonAnimation]);

  // --- Sync Form Data (Giữ nguyên logic cũ) ---
  useEffect(() => {
    const currentProductIds = form.getFieldValue("products") || [];
    if (currentProductIds.length > 0 && allProducts.length > 0 && selectedProducts.length === 0) {
      const initialSelected = currentProductIds.map(id => allProducts.find(p => p.id === id)).filter(Boolean).filter(p => p.stock > 0);
      setSelectedProducts(initialSelected);
      updateFormValues(initialSelected);
    }
  }, [allProducts, form]);

  const updateFormValues = (list) => {
    const productIds = list.map((p) => p.id);
    form.setFieldsValue({ products: productIds });
    const currentFlashItems = form.getFieldValue("flash_items") || {};
    list.forEach((p) => {
      const latestProduct = allProducts.find(prod => prod.id === p.id) || p;
      if (!currentFlashItems[p.id]) {
        const defaultFlashPrice = p.original_price * 0.9;
        const defaultDiscount = Math.round(((p.original_price - defaultFlashPrice) / p.original_price) * 100);
        currentFlashItems[p.id] = {
          flash_price: defaultFlashPrice,
          discount_percent: defaultDiscount,
          stock: latestProduct.stock
        };
      } else {
        // Giữ nguyên stock nếu đã nhập, hoặc cập nhật nếu muốn logic khác
      }
    });
    form.setFieldsValue({ flash_items: currentFlashItems });
  };

  const handleSelectProducts = (selectedRowKeys) => {
    const newItems = allProducts.filter((p) => selectedRowKeys.includes(p.id) && p.stock > 0);
    const updatedList = [...selectedProducts, ...newItems];
    setSelectedProducts(updatedList);
    updateFormValues(updatedList);
  };

  const handleRemoveProduct = (id) => {
    const updatedList = selectedProducts.filter((p) => p.id !== id);
    setSelectedProducts(updatedList);
    updateFormValues(updatedList);
  };

  const filteredProducts = useMemo(() => {
    return allProducts.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(selectorSearch.toLowerCase());
      const notSelected = !selectedProducts.find((sp) => sp.id === p.id);
      return matchSearch && notSelected && p.stock > 0;
    });
  }, [allProducts, selectorSearch, selectedProducts]);

  // --- RENDER TIMELINE UI (Phần mới thêm) ---
  const renderTimeline = () => {
    // Lấy các sale diễn ra trong ngày đang xem (timelineDate)
    const salesInDay = existingSales.filter(sale => {
      if (currentId && sale.id === currentId) return false; // Không vẽ chính nó (cũ) lên timeline
      if (!sale.is_active) return false;

      const s = moment(sale.start_time);
      const e = moment(sale.end_time);
      // Check nếu sale dính dáng đến ngày này
      return s.isSame(timelineDate, 'day') || e.isSame(timelineDate, 'day') || (s.isBefore(timelineDate) && e.isAfter(timelineDate));
    });

    return (
      <div style={{ marginTop: 12, padding: "10px 15px", background: "#f0f2f5", borderRadius: 8, border: "1px solid #d9d9d9" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>
            Lịch trình ngày: {timelineDate.format("DD/MM/YYYY")}
          </span>
          <span style={{ fontSize: 10, color: '#888' }}>(Kéo chuột trên lịch để thay đổi ngày xem)</span>
        </div>

        {/* Thanh Bar 24h */}
        <div style={{ position: "relative", height: 28, background: "#fff", border: "1px solid #ccc", borderRadius: 4, overflow: "hidden", display: "flex" }}>
          {/* Vạch chia giờ */}
          {[...Array(24)].map((_, i) => (
            <div key={i} style={{ flex: 1, borderRight: "1px dashed #eee", height: "100%", position: 'relative' }}>
              {i % 4 === 0 && <span style={{ position: 'absolute', bottom: 1, left: 2, fontSize: 8, color: '#ccc' }}>{i}h</span>}
            </div>
          ))}

          {/* Render Existing Sales (Màu Đỏ) */}
          {salesInDay.map((sale) => {
            const start = moment(sale.start_time);
            const end = moment(sale.end_time);

            // Tính toán vị trí start/end trong ngày timelineDate (0h -> 24h)
            let startHour = 0;
            let endHour = 24;

            if (start.isSame(timelineDate, 'day')) startHour = start.hour() + start.minute() / 60;
            if (end.isSame(timelineDate, 'day')) endHour = end.hour() + end.minute() / 60;

            const left = (startHour / 24) * 100;
            const width = ((endHour - startHour) / 24) * 100;

            return (
              <Tooltip key={sale.id} title={`Đã có lịch: ${start.format("HH:mm")} - ${end.format("HH:mm")}`}>
                <div
                  style={{
                    position: "absolute",
                    left: `${left}%`,
                    width: `${width}%`,
                    height: "100%",
                    background: "#ff4d4f", // Đỏ
                    opacity: 0.6,
                    zIndex: 2,
                    cursor: "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    color: "white",
                    fontWeight: "bold"
                  }}
                >Đầy</div>
              </Tooltip>
            );
          })}

          {/* Render Selection (Màu Xanh - Realtime) */}
          <Form.Item shouldUpdate noStyle>
            {({ getFieldValue }) => {
              const range = getFieldValue("time_range");
              if (!range || !range[0] || !range[1]) return null;
              const start = range[0];
              const end = range[1];

              // Nếu khoảng chọn không dính dáng ngày timeline thì không vẽ
              if (!start.isSame(timelineDate, 'day') && !end.isSame(timelineDate, 'day')) return null;

              let startHour = 0;
              let endHour = 24;
              if (start.isSame(timelineDate, 'day')) startHour = start.hour() + start.minute() / 60;
              if (end.isSame(timelineDate, 'day')) endHour = end.hour() + end.minute() / 60;

              const left = (startHour / 24) * 100;
              const width = ((endHour - startHour) / 24) * 100;

              return (
                <div
                  style={{
                    position: "absolute",
                    left: `${left}%`,
                    width: `${width}%`,
                    height: "100%",
                    background: "#52c41a", // Xanh lá
                    opacity: 0.5,
                    zIndex: 3,
                    borderLeft: "2px solid #237804",
                    borderRight: "2px solid #237804",
                  }}
                />
              );
            }}
          </Form.Item>
        </div>
        <div style={{ display: 'flex', gap: 15, marginTop: 5, fontSize: 11 }}>
          <Space><div style={{ width: 12, height: 12, background: '#ff4d4f', opacity: 0.6 }}></div>Đã có lịch</Space>
          <Space><div style={{ width: 12, height: 12, background: '#52c41a', opacity: 0.5 }}></div>Đang chọn</Space>
        </div>
      </div>
    );
  };

  // --- Columns Definitions ---
  const selectionColumns = [
    {
      title: "Ảnh",
      dataIndex: "images",
      width: 60,
      render: (images) => (
        // Lấy ảnh đầu tiên hoặc hiển thị icon mặc định
        <Avatar
          shape="square"
          size={40}
          src={images?.[0]?.image} // Giả sử cấu trúc API trả về mảng images
          icon={<SearchOutlined />}
        />
      ),
    },
    {
      title: "Tên sản phẩm",
      dataIndex: "name",
      render: (text) => <Text style={{ fontSize: 12, fontWeight: 500 }}>{text}</Text>
    },
    {
      title: "Giá gốc",
      dataIndex: "original_price",
      width: 100,
      render: (val) => <Text type="secondary">{intcomma(val)}đ</Text>
    },
    {
      title: "Kho",
      dataIndex: "stock",
      width: 60,
      align: 'center'
    },
  ];

  const mainColumns = [
    {
      title: "Sản phẩm",
      dataIndex: "name",
      render: (text, record) => (
        <Space>
          {/* Placeholder ảnh */}
          <Avatar shape="square" size={40} src={record.images?.[0]?.image} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 500 }}>{text}</div>
            <div style={{ fontSize: 11, color: "#888" }}>Kho gốc: {record.stock}</div>
          </div>
        </Space>
      ),
    },
    {
      title: "Giá gốc (đ)",
      width: 120,
      render: (_, record) => {
        const latestProduct = allProducts.find(p => p.id === record.id) || record;
        return <Text type="secondary">{intcomma(latestProduct.original_price)}đ</Text>;
      },
    },
    {
      title: "Giá Flash Sale (đ)",
      width: 160,
      render: (_, record) => {
        const latestProduct = allProducts.find(p => p.id === record.id) || record;
        return (
          <Form.Item
            name={['flash_items', record.id, 'flash_price']}
            style={{ marginBottom: 0 }}
            rules={[
              { required: true, message: "Nhập giá" },
              {
                validator: (_, value) => {
                  if (!value || value >= latestProduct.original_price) {
                    return Promise.reject("Giá Flash Sale phải nhỏ hơn giá gốc");
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              onChange={(value) => {
                const discount = value ? Math.round(((latestProduct.original_price - value) / latestProduct.original_price) * 100) : 0;
                form.setFieldValue(['flash_items', record.id, 'discount_percent'], Math.min(discount, 100));
              }}
              min={0}
            />
          </Form.Item>
        )
      }
    },
    {
      title: "Chiết khấu (%)",
      width: 120,
      render: (_, record) => {
        const latestProduct = allProducts.find(p => p.id === record.id) || record;
        return (
          <Form.Item
            name={['flash_items', record.id, 'discount_percent']}
            style={{ marginBottom: 0 }}
            rules={[
              { required: true, message: "Nhập %" },
              {
                validator: (_, value) => {
                  if (value === undefined || value === null) return Promise.resolve();
                  if (value < 0 || value > 100) {
                    return Promise.reject("Chiết khấu từ 0-100%");
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              max={100}
              addonAfter="%"
              onChange={(value) => {
                if (value !== undefined && value !== null) {
                  const flashPrice = latestProduct.original_price * (1 - value / 100);
                  form.setFieldValue(['flash_items', record.id, 'flash_price'], Math.round(flashPrice));
                }
              }}
            />
          </Form.Item>
        );
      },
    },
    {
      title: "Số lượng Sale",
      width: 140,
      render: (_, record) => {
        const latestProduct = allProducts.find(p => p.id === record.id) || record;
        return (
          <Form.Item
            name={['flash_items', record.id, 'stock']}
            style={{ marginBottom: 0 }}
            initialValue={latestProduct.stock}
            rules={[
              { required: true, message: "Nhập SL" },
              { type: 'number', min: 1, message: ">= 1" },
              { type: 'number', max: latestProduct.stock, message: "Vượt kho" }
            ]}
          >
            <InputNumber min={1} max={latestProduct.stock} style={{ width: "100%" }} />
          </Form.Item>
        );
      },
    },
    {
      key: "action",
      width: 50,
      render: (_, record) => <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleRemoveProduct(record.id)} />,
    },
  ];

  return (
    <div style={{ height: "100%" }}>
      <Form form={form} layout="vertical" name="flashsale_form">
        <Card size="small" title="Cấu hình thời gian" style={{ marginBottom: 16 }}>
          <Row gutter={24}>
            <Col span={16}>
              <Form.Item
                name="time_range"
                label="Thời gian diễn ra"
                validateFirst // Dừng lại ở lỗi đầu tiên
                rules={[
                  { required: true, message: "Vui lòng chọn thời gian!" },
                  {
                    validator: (_, value) => {
                      if (!value || value.length < 2) return Promise.resolve();
                      // LOGIC CHECK TRÙNG Ở ĐÂY
                      const isOverlapped = checkOverlap(value[0], value[1], existingSales, currentId);
                      if (isOverlapped) {
                        return Promise.reject("Thời gian bị trùng với Flash Sale khác! Hãy nhìn thanh bên dưới.");
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <RangePicker
                  showTime={{ format: "HH:mm" }}
                  format="DD/MM/YYYY HH:mm"
                  style={{ width: "100%" }}
                  placeholder={['Bắt đầu', 'Kết thúc']}
                  // Khi user đổi ngày trên lịch, update timelineDate để UI nhảy theo
                  onCalendarChange={(dates) => {
                    if (dates && dates[0]) setTimelineDate(dates[0]);
                  }}
                  onChange={(dates) => {
                    if (dates && dates[0]) setTimelineDate(dates[0]);
                  }}
                />
              </Form.Item>

              {/* COMPONENT TIMELINE HIỂN THỊ TẠI ĐÂY */}
              {renderTimeline()}
            </Col>

            <Col span={8}>
              <Form.Item name="is_active" label="Trạng thái" valuePropName="checked">
                <Switch checkedChildren="Kích hoạt" unCheckedChildren="Ẩn" />
              </Form.Item>
              <Alert message="Lưu ý" description="Các khoảng đỏ là thời gian đã có lịch. Vui lòng chọn khoảng trống." type="info" showIcon style={{ fontSize: 12 }} />
            </Col>
          </Row>
        </Card>

        {/* --- Phần chọn sản phẩm giữ nguyên --- */}
        <Card
          size="small"
          title={
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Sản phẩm ({selectedProducts.length})</span>
              <Button type="dashed" icon={<PlusOutlined />} onClick={() => setIsSelectorOpen(!isSelectorOpen)}>
                {isSelectorOpen ? "Đóng" : "Thêm SP"}
              </Button>
            </div>
          }
        >
          {isSelectorOpen && (
            <div style={{ padding: 10, background: "#fafafa", borderBottom: "1px solid #eee" }}>
              <Input placeholder="Tìm sản phẩm..." prefix={<SearchOutlined />} onChange={(e) => setSelectorSearch(e.target.value)} style={{ marginBottom: 10 }} />
              <Table
                columns={selectionColumns}
                dataSource={filteredProducts}
                rowKey="id"
                size="small"
                pagination={{ pageSize: 5 }}
                rowSelection={{
                  type: 'checkbox',
                  onChange: handleSelectProducts,
                  selectedRowKeys: selectedProducts.map(p => p.id)
                }}
              />
            </div>
          )}
          <Table columns={mainColumns} dataSource={selectedProducts} rowKey="id" pagination={false} scroll={{ y: 300 }} />
          <Form.Item name="products" style={{ display: "none" }} rules={[{ required: true }]}><Input /></Form.Item>
        </Card>
      </Form>
    </div>
  );
};

export default FlashSaleForm;