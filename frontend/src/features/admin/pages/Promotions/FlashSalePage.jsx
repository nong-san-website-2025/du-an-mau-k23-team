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

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const FlashSalePage = () => {
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
        <Row gutter={16} style={{ marginBottom: 20 }}>
          <Col span={6}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Tìm kiếm theo mã..."
            />
          </Col>
          <Col span={6}>
            <RangePicker
              style={{ width: "100%" }}
              placeholder={["Từ ngày", "Đến ngày"]}
            />
          </Col>
          <Col span={12} style={{ textAlign: "right" }}>
            <Space>
              {/* 1. Nút Import Excel */}
              <Button
                type="primary"
                icon={<FileExcelOutlined />}
                  style={{
                    backgroundColor: "#fff",
                    borderColor: "#28a645",
                    color: "#28a645",
                  }}
                onClick={() => setImportModalVisible(true)}
              >
                Import từ Excel
              </Button>

              {/* 2. Nút Xóa (Đã chuyển lên trước) */}
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleBulkDelete}
                disabled={selectedRows.length === 0}
              >
                Xóa ({selectedRows.length})
              </Button>

              {/* 3. Nút Làm mới (Mới thêm - Kế bên trái nút Tạo mới) */}
              <Tooltip title="Tải lại dữ liệu">
                <Button
                  icon={<ReloadOutlined spin={loading} />}
                  onClick={loadData}
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