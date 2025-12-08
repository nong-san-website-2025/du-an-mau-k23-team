import React, { useEffect, useState } from "react";
import { Button, message, Card } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import AdminPageLayout from "../../components/AdminPageLayout"; // Giả định layout của bạn
import PromotionFilter from "../../components/PromotionAdmin/PromotionFilter";
import PromotionTable from "../../components/PromotionAdmin/PromotionTable"; // Đường dẫn component mới
import PromotionModal from "../../components/PromotionAdmin/PromotionModal";
import PromotionDetailModal from "../../components/PromotionAdmin/PromotionDetailModal";

import {
  getPromotionsOverview,
  getVoucher,
  createVoucher,
  updateVoucher,
  deleteVoucher,
} from "../../services/promotionServices";
import { getCategories } from "../../services/products";

export default function PromotionsPage() {
  // State quản lý UI
  const [loading, setLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  
  // State dữ liệu
  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({});
  const [selectedRecord, setSelectedRecord] = useState(null); // Dùng chung cho Edit và View Detail

  // Initial Fetch
  useEffect(() => {
    getCategories().then((res) => setCategories(res)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchData(filters);
  }, [filters]);

  const fetchData = async (params = {}) => {
    setLoading(true);
    try {
      const res = await getPromotionsOverview(params);
      // Backend Django thường trả về list, đảm bảo luôn là array
      setData(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
      message.error("Không thể tải dữ liệu khuyến mãi");
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---
  const handleCreate = () => {
    setSelectedRecord(null);
    setModalOpen(true);
  };

  const handleEdit = async (record) => {
    try {
      setModalLoading(true); // Hiển thị loading nhẹ
      // Gọi API chi tiết để lấy full data (categories, rules, etc.)
      const detailData = await getVoucher(record.id);
      setSelectedRecord(detailData);
      setModalOpen(true);
    } catch (error) {
      message.error("Không tải được chi tiết để chỉnh sửa");
    } finally {
      setModalLoading(false);
    }
  };

  const handleViewDetail = async (record) => {
    try {
        // Tương tự edit, lấy data mới nhất
        const detailData = await getVoucher(record.id);
        setSelectedRecord(detailData);
        setDetailModalOpen(true);
    } catch (error) {
        message.error("Lỗi tải chi tiết");
    }
  };

  const handleDelete = async (record) => {
    try {
      await deleteVoucher(record.id);
      message.success("Đã xóa voucher thành công");
      fetchData(filters); // Refresh table
    } catch (err) {
      message.error("Xóa thất bại. Vui lòng thử lại.");
    }
  };

  // --- Logic xử lý Data trước khi gửi lên Server (Business Logic Layer) ---
  const processPayload = (values) => {
    const payload = { ...values };
    
    // 1. Xử lý logic Voucher Type
    if (payload.voucherType === "freeship") {
      payload.freeship_amount = payload.discountValue;
      payload.discount_amount = 0;
      payload.discount_percent = 0;
    } else {
      // Normal voucher
      if (payload.discountType === "percent") {
        payload.discount_percent = payload.discountValue;
        payload.discount_amount = 0;
      } else {
        payload.discount_amount = payload.discountValue;
        payload.discount_percent = 0;
      }
      payload.freeship_amount = 0;
    }

    // 2. Xử lý DateRange (Antd trả về Dayjs object -> ISO String cho Django)
    if (payload.dateRange && payload.dateRange.length === 2) {
      payload.start_at = payload.dateRange[0].toISOString();
      payload.end_at = payload.dateRange[1].toISOString();
    }
    
    // Cleanup trường thừa của frontend
    delete payload.dateRange;
    delete payload.discountType;
    delete payload.discountValue;
    
    return payload;
  };

  const handleSave = async (values) => {
    setModalLoading(true);
    try {
      const payload = processPayload(values);

      if (selectedRecord && selectedRecord.id) {
        await updateVoucher(selectedRecord.id, payload);
        message.success("Cập nhật thành công!");
      } else {
        await createVoucher(payload);
        message.success("Tạo mới thành công!");
      }
      
      setModalOpen(false);
      fetchData(filters);
    } catch (err) {
      // Xử lý lỗi chuyên nghiệp: Đọc lỗi từ Django DRF response
      const errorData = err.response?.data;
      let msg = "Có lỗi xảy ra";
      
      if (typeof errorData === 'object') {
          // Lấy tin nhắn lỗi đầu tiên tìm thấy
          const firstKey = Object.keys(errorData)[0];
          const firstError = Array.isArray(errorData[firstKey]) ? errorData[firstKey][0] : errorData[firstKey];
          msg = `${firstKey}: ${firstError}`;
      }
      message.error(msg);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <AdminPageLayout
      title="QUẢN LÝ KHUYẾN MÃI"
      breadcrumb={['Trang chủ', 'Marketing', 'Khuyến mãi']} // Thêm breadcrumb cho chuyên nghiệp
    >
        {/* Bọc trong Card để tạo khối unified đẹp mắt */}
        <Card bordered={false} className="shadow-sm">
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                 {/* Filter Component */}
                 <div style={{ flex: 1, marginRight: 16 }}>
                    <PromotionFilter
                        onFilterChange={setFilters}
                        onClear={() => setFilters({})}
                    />
                 </div>
                 
                 {/* Main Action */}
                 <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    onClick={handleCreate}
                    size="large"
                >
                    Tạo Voucher
                </Button>
            </div>

            <PromotionTable
                data={data}
                loading={loading}
                onView={handleViewDetail}
                onEdit={handleEdit} // Thêm prop onEdit
                onDelete={handleDelete}
            />
        </Card>

      {/* Modal Form Create/Edit */}
      <PromotionModal
        open={modalOpen}
        loading={modalLoading}
        onCancel={() => setModalOpen(false)}
        onSave={handleSave}
        detail={selectedRecord}
        categories={categories}
      />

      {/* Modal View Detail */}
      <PromotionDetailModal
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        detail={selectedRecord}
      />
    </AdminPageLayout>
  );
}