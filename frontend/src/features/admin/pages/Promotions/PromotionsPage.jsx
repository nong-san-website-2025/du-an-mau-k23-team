import React, { useEffect, useState } from "react";
import { Button, message, Card, Space } from "antd";
import { PlusOutlined, CloudUploadOutlined } from "@ant-design/icons";

import AdminPageLayout from "../../components/AdminPageLayout";
import PromotionFilter from "../../components/PromotionAdmin/PromotionFilter";
import PromotionTable from "../../components/PromotionAdmin/PromotionTable";
import PromotionModal from "../../components/PromotionAdmin/PromotionModal";
import PromotionDetailModal from "../../components/PromotionAdmin/PromotionDetailModal";
import ImportVoucherModal from "../../components/PromotionAdmin/ImportVoucherModal";

import {
  getPromotionsOverview,
  getVoucher,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  importVouchers,
} from "../../services/promotionServices";
import { getCategories } from "../../services/products";

export default function PromotionsPage() {
  const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 480px)").matches;
  const [loading, setLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  
  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({});
  const [selectedRecord, setSelectedRecord] = useState(null);

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
      setData(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
      message.error("Không thể tải dữ liệu khuyến mãi");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedRecord(null);
    setModalOpen(true);
  };

  const handleEdit = async (record) => {
    try {
      setModalLoading(true);
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
      fetchData(filters);
    } catch (err) {
      message.error("Xóa thất bại. Vui lòng thử lại.");
    }
  };

  const handleImportAPI = async (excelData) => {
    try {
        await importVouchers(excelData);
        fetchData(filters);
        return true; 
    } catch (error) {
        throw error;
    }
  };

  // --- [FIX QUAN TRỌNG] LOGIC CHUẨN HÓA DỮ LIỆU ---
  const processPayload = (values) => {
    const payload = { ...values };
    
    // 1. Map số lượng từ Form sang DB
    // Form dùng limit_usage, DB dùng total_quantity
    if (values.limit_usage !== undefined) {
        payload.total_quantity = values.limit_usage;
    }
    if (values.limit_per_user !== undefined) {
        payload.per_user_quantity = values.limit_per_user;
    }

    // 2. Logic Phân loại Voucher (Freeship vs Normal)
    if (payload.voucherType === "freeship") {
      // Freeship: Gán giá trị vào freeship_amount, reset các trường discount về null
      payload.freeship_amount = payload.discountValue;
      payload.discount_amount = null; 
      payload.discount_percent = null;
      payload.max_discount_amount = null; // Freeship ko cần trần giảm giá
    } else {
      // Normal: Reset freeship về null
      payload.freeship_amount = null; 
      
      if (payload.discountType === "percent") {
        payload.discount_percent = payload.discountValue;
        payload.discount_amount = null;
      } else {
        payload.discount_amount = payload.discountValue;
        payload.discount_percent = null;
      }
    }

    // 3. Xử lý thời gian
    if (payload.dateRange && payload.dateRange.length === 2) {
      payload.start_at = payload.dateRange[0].toISOString();
      payload.end_at = payload.dateRange[1].toISOString();
    }
    
    // 4. Set mặc định Distribution Type = CLAIM (Để user nhận được)
    payload.distribution_type = 'claim'; 

    // 5. Cleanup trường thừa
    delete payload.dateRange;
    delete payload.discountType;
    delete payload.discountValue;
    delete payload.voucherType; 
    delete payload.limit_usage; 
    delete payload.limit_per_user;
    
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
      const errorData = err.response?.data;
      let msg = "Có lỗi xảy ra";
      
      // Xử lý thông báo lỗi chi tiết từ DRF
      if (typeof errorData === 'object' && errorData !== null) {
          if (errorData.non_field_errors) {
              msg = errorData.non_field_errors[0]; 
          } else {
              const firstKey = Object.keys(errorData)[0];
              const firstError = Array.isArray(errorData[firstKey]) ? errorData[firstKey][0] : errorData[firstKey];
              msg = `${firstKey}: ${firstError}`;
          }
      }
      message.error(msg);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <AdminPageLayout
      title="QUẢN LÝ KHUYẾN MÃI"
      breadcrumb={['Trang chủ', 'Marketing', 'Khuyến mãi']}
    >
      <Card bordered={false} className="shadow-sm">
        <div style={{ marginBottom: 16 }}>
           <div style={{ marginBottom: 12 }}>
            <PromotionFilter
              onFilterChange={setFilters}
              onClear={() => setFilters({})}
            />
           </div>
           <div style={{ display: 'flex', justifyContent: isMobile ? 'flex-start' : 'flex-end' }}>
             <Space wrap style={{ rowGap: 8 }}>
              <Button 
                icon={<CloudUploadOutlined />} 
                onClick={() => setImportModalOpen(true)}
                size={isMobile ? "small" : "middle"}
                style={{ borderColor: '#217346', color: '#217346', whiteSpace: 'nowrap' }}
              >
                Import Excel
              </Button>

              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={handleCreate}
                size={isMobile ? "small" : "middle"}
                style={{ whiteSpace: 'nowrap' }}
              >
                {isMobile ? 'Tạo Voucher' : 'Tạo Voucher'}
              </Button>
             </Space>
           </div>
        </div>

            <PromotionTable
                data={data}
                loading={loading}
                onView={handleViewDetail}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
        </Card>

      <PromotionModal
        open={modalOpen}
        loading={modalLoading}
        onCancel={() => setModalOpen(false)}
        onSave={handleSave}
        detail={selectedRecord}
        categories={categories}
      />

      <PromotionDetailModal
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        detail={selectedRecord}
      />

      <ImportVoucherModal
         open={importModalOpen}
         onCancel={() => setImportModalOpen(false)}
         onImportAPI={handleImportAPI}
      />
    </AdminPageLayout>
  );
}