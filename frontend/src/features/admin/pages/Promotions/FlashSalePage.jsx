import React, { useState, useEffect } from "react";
import {
  Button,
  message,
  Typography,
  Card,
  Input,
  DatePicker,
  Row,
  Col,
  Space,
  Modal,
  Tooltip, // <--- Thêm Tooltip
  Select,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
  FileExcelOutlined,
  ReloadOutlined, // <--- Thêm icon Reload
} from "@ant-design/icons";
import FlashSaleModal from "../../components/FlashSaleAdmin/FlashSaleModal";
import FlashSaleTable from "../../components/FlashSaleAdmin/FlashSaleTable";
import FlashSaleImportModal from "../../components/FlashSaleAdmin/FlashSaleImportModal";
import { getFlashSales, deleteFlashSale } from "../../services/flashsaleApi";
import AdminPageLayout from "../../components/AdminPageLayout";
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const FlashSalePage = () => {
  const isMobile =
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 480px)").matches;
  const [data, setData] = useState([]);
  const [allList, setAllList] = useState([]); // raw data from API
  const [dateFilter, setDateFilter] = useState("all");
  const [customRange, setCustomRange] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);

  const applyDateFilter = (list, df = dateFilter, range = customRange) => {
    if (!list || list.length === 0) return [];
    if (!df || df === "all") return list;

    const now = dayjs();
    let start = null;
    let end = null;
    if (df === "today") {
      start = now.startOf("day");
      end = now.endOf("day");
    } else if (df === "7d") {
      start = now.subtract(6, "day").startOf("day");
      end = now.endOf("day");
    } else if (df === "30d") {
      start = now.subtract(29, "day").startOf("day");
      end = now.endOf("day");
    } else if (df === "month") {
      start = now.startOf("month");
      end = now.endOf("month");
    } else if (df === "custom" && range && range.length === 2) {
      start = range[0].startOf("day");
      end = range[1].endOf("day");
    }

    if (!start || !end) return list;

    return list.filter((item) => {
      const s = item.start_time ? dayjs(item.start_time) : null;
      const e = item.end_time ? dayjs(item.end_time) : null;
      // Consider overlap if any part of sale is within [start,end]
      if (s && e) {
        return s.isBefore(end) && e.isAfter(start);
      }
      // Fallback: try created_at
      const c = item.created_at ? dayjs(item.created_at) : null;
      if (c) return c.isBetween(start, end, null, '[]');
      return false;
    });
  };

  const getRangeForFilter = (df) => {
    const now = dayjs();
    if (!df || df === 'all') return null;
    if (df === 'today') return [now.startOf('day'), now.endOf('day')];
    if (df === '7d') return [now.subtract(6, 'day').startOf('day'), now.endOf('day')];
    if (df === '30d') return [now.subtract(29, 'day').startOf('day'), now.endOf('day')];
    if (df === 'month') return [now.startOf('month'), now.endOf('month')];
    return null;
  };

  const determineFilterFromRange = (range) => {
    if (!range || range.length < 2) return 'custom';
    const now = dayjs();
    const [s, e] = range;
    const eq = (a, b) => a.isSame(b);

    // today
    if (eq(s.startOf('day'), now.startOf('day')) && eq(e.endOf('day'), now.endOf('day'))) return 'today';

    // 7d -> start = now.subtract(6,'day').startOf('day')
    const r7 = [now.subtract(6, 'day').startOf('day'), now.endOf('day')];
    if (eq(s.startOf('day'), r7[0]) && eq(e.endOf('day'), r7[1])) return '7d';

    // 30d
    const r30 = [now.subtract(29, 'day').startOf('day'), now.endOf('day')];
    if (eq(s.startOf('day'), r30[0]) && eq(e.endOf('day'), r30[1])) return '30d';

    // month
    const rm = [now.startOf('month'), now.endOf('month')];
    if (eq(s.startOf('day'), rm[0]) && eq(e.endOf('day'), rm[1])) return 'month';

    return 'custom';
  };

  const loadData = async (overrides = {}) => {
    console.debug('[FlashSalePage] loadData called', overrides);
    setLoading(true);
    try {
      const res = await getFlashSales();
      // Normalise possible response shapes: array or paginated {results: []} or {items: []}
      let list = [];
      if (Array.isArray(res.data)) list = res.data;
      else if (res.data && Array.isArray(res.data.results)) list = res.data.results;
      else if (res.data && Array.isArray(res.data.items)) list = res.data.items;

      // store raw list then apply client-side date filter
      setAllList(list);
      console.debug('[FlashSalePage] fetched list length:', list.length);
      const df = overrides.dateFilter !== undefined ? overrides.dateFilter : dateFilter;
      const cr = overrides.customRange !== undefined ? overrides.customRange : customRange;
      let filtered = applyDateFilter(list, df, cr);

      // Apply client-side search filter (search by flashsale id or product name/product id)
      const s = (overrides.searchTerm !== undefined ? overrides.searchTerm : searchTerm || "").toString().trim().toLowerCase();
      if (s) {
        filtered = filtered.filter((item) => {
          if (item.id && item.id.toString().includes(s)) return true;
          const products = item.flashsale_products || [];
          return products.some((p) => {
            if (p.product && p.product.toString().includes(s)) return true;
            if (p.product_name && p.product_name.toLowerCase().includes(s)) return true;
            return false;
          });
        });
      }
      if (filtered.length > 0) {
        const sortedData = [...filtered].sort((a, b) => {
          const ta = new Date(a.created_at || a.start_time || 0).getTime();
          const tb = new Date(b.created_at || b.start_time || 0).getTime();
          return tb - ta;
        });
        setData(sortedData);
      } else {
        setData([]);
      }
    } catch (err) {
      message.error("Không tải được danh sách Flash Sale");
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    setSelectedRows([]);
    // Reset date filters to show all results on refresh
    setDateFilter('all');
    setCustomRange(null);
    // Clear search box
    setSearchTerm('');
    // If we already have fetched list, apply immediately to avoid waiting for state updates
    if (Array.isArray(allList) && allList.length > 0) {
      const sortedData = [...allList].sort((a, b) => (new Date(b.created_at||b.start_time||0).getTime() - new Date(a.created_at||a.start_time||0).getTime()));
      setData(sortedData);
    } else {
      // clear visible list while fetching
      setData([]);
    }
    // Always refetch from server to ensure latest data and pass overrides so loadData uses 'all'
    loadData({ dateFilter: 'all', customRange: null, searchTerm: '' });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (record) => {
    try {
      await deleteFlashSale(record.id);
      message.success("Đã xóa chương trình Flash Sale");
      setSelectedRows([]);
      loadData();
    } catch (err) {
      message.error("Xóa thất bại");
    }
  };

  const handleBulkDelete = () => {
    if (selectedRows.length === 0) {
      message.warning("Vui lòng chọn ít nhất một Flash Sale để xóa");
      return;
    }

    Modal.confirm({
      title: `Xóa ${selectedRows.length} chương trình Flash Sale?`,
      description: "Hành động này không thể hoàn tác",
      okText: "Xóa",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      onOk: async () => {
        setLoading(true);
        try {
          const selectedFlashSales = data.filter((sale) =>
            selectedRows.includes(sale.id)
          );
          await Promise.all(
            selectedFlashSales.map((sale) => deleteFlashSale(sale.id))
          );
          message.success(
            `Đã xóa ${selectedRows.length} chương trình Flash Sale`
          );
          setSelectedRows([]);
          loadData();
        } catch {
          message.error("Xóa thất bại, vui lòng thử lại");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <AdminPageLayout title="QUẢN LÝ FLASH SALE">
      <Card bordered={false} className="c-shadow">
        {/* Thanh công cụ */}
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Tìm kiếm theo mã..."
              allowClear
              size={isMobile ? "small" : "middle"}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            {/* Compact date filter */}
            <Space style={{ width: '100%', justifyContent: 'flex-start' }}>
              <Select
                value={dateFilter}
                onChange={(val) => {
                  setDateFilter(val);
                  const rangeFor = getRangeForFilter(val);
                  setCustomRange(rangeFor);
                  // apply filter on current raw list
                  const filtered = applyDateFilter(allList, val, rangeFor);
                  const sorted = filtered.sort((a, b) => (new Date(b.created_at||b.start_time||0).getTime() - new Date(a.created_at||a.start_time||0).getTime()));
                  setData(sorted);
                }}
                size={isMobile ? 'small' : 'middle'}
                style={{ minWidth: 160 }}
              >
                <Select.Option value="all">Toàn bộ</Select.Option>
                <Select.Option value="today">Hôm nay</Select.Option>
                <Select.Option value="7d">7 ngày</Select.Option>
                <Select.Option value="30d">30 ngày</Select.Option>
                <Select.Option value="month">Tháng này</Select.Option>
                <Select.Option value="custom">Tùy chỉnh</Select.Option>
              </Select>
              <RangePicker
                value={customRange}
                onChange={(vals) => {
                  setCustomRange(vals);
                  // detect if the chosen range matches a preset
                  const matched = determineFilterFromRange(vals);
                  setDateFilter(matched);
                  const filtered = applyDateFilter(allList, matched, vals);
                  const sorted = filtered.sort((a, b) => (new Date(b.created_at||b.start_time||0).getTime() - new Date(a.created_at||a.start_time||0).getTime()));
                  setData(sorted);
                }}
                style={{ minWidth: 200 }}
                allowClear
              />
            </Space>
          </Col>
          <Col
            xs={24}
            md={12}
            style={{ textAlign: isMobile ? "left" : "right" }}
          >
            <Space wrap style={{ rowGap: 8 }}>
              <Button
                type="primary"
                icon={<FileExcelOutlined />}
                  style={{
                    backgroundColor: "#fff",
                    borderColor: "#28a645",
                    color: "#28a645",
                    whiteSpace: "nowrap"
                  }}
                onClick={() => setImportModalVisible(true)}
                size={isMobile ? "small" : "middle"}
              >
                {isMobile ? "Import Excel" : "Import từ Excel"}
              </Button>

              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleBulkDelete}
                disabled={selectedRows.length === 0}
                size={isMobile ? "small" : "middle"}
                style={{ whiteSpace: "nowrap" }}
              >
                {`Xóa (${selectedRows.length})`}
              </Button>

              {/* 3. Nút Làm mới (Mới thêm - Kế bên trái nút Tạo mới) */}
              <Tooltip title="Tải lại dữ liệu">
                <Button
                icon={<ReloadOutlined spin={loading} />}
                onClick={refreshData}
                  style={{
                    backgroundColor: "#fff",
                    borderColor: "#d9d9d9",
                    color: "#1677ff",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  Làm mới
                </Button>
              </Tooltip>

              {/* 4. Nút Tạo chương trình mới (Đã chuyển xuống cuối và đổi màu) */}
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingRecord(null);
                  setModalVisible(true);
                }}
                style={{
                  backgroundColor: "#28a645", // Màu xanh lá #28a645
                  borderColor: "#28a645",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                Tạo chương trình mới
              </Button>
            </Space>
          </Col>
        </Row>

        <FlashSaleTable
          data={data}
          loading={loading}
          onEdit={(record) => {
            setEditingRecord(record);
            setModalVisible(true);
          }}
          onDelete={handleDelete}
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
        />
      </Card>

      <FlashSaleModal
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onSuccess={() => {
          setModalVisible(false);
          loadData();
        }}
        record={editingRecord}
        existingSales={data}
      />

      <FlashSaleImportModal
        visible={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        onSuccess={() => {
          setImportModalVisible(false);
          loadData();
        }}
      />
    </AdminPageLayout>
  );
};

export default FlashSalePage;
