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
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import FlashSaleModal from "../../components/FlashSaleAdmin/FlashSaleModal";
import FlashSaleTable from "../../components/FlashSaleAdmin/FlashSaleTable";
import FlashSaleImportModal from "../../components/FlashSaleAdmin/FlashSaleImportModal";
import { getFlashSales, deleteFlashSale } from "../../services/flashsaleApi";
import AdminPageLayout from "../../components/AdminPageLayout";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const FlashSalePage = () => {
  const isMobile =
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 480px)").matches;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getFlashSales();
      if (Array.isArray(res.data)) {
        // Sắp xếp theo mới nhất
        const sortedData = res.data.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
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
            <RangePicker
              style={{ width: "100%" }}
              placeholder={["Từ ngày", "Đến ngày"]}
              size={isMobile ? "small" : "middle"}
            />
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
                onClick={() => setImportModalVisible(true)}
                size={isMobile ? "small" : "middle"}
                style={{ whiteSpace: "nowrap" }}
              >
                {isMobile ? "Import Excel" : "Import từ Excel"}
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingRecord(null);
                  setModalVisible(true);
                }}
                size={isMobile ? "small" : "middle"}
                style={{ whiteSpace: "nowrap" }}
              >
                {isMobile ? "Tạo mới" : "Tạo chương trình mới"}
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
