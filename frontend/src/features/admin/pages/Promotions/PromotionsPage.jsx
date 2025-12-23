import React, { useEffect, useState } from "react";
import { Button, message, Card, Space } from "antd";
import { PlusOutlined, CloudUploadOutlined, ReloadOutlined } from "@ant-design/icons";

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

  // --- LOGIC CHUẨN HÓA DỮ LIỆU ---
  const processPayload = (values) => {
    const payload = { ...values };
    
    // 1. Map số lượng từ Form sang DB
    if (values.limit_usage !== undefined) {
        payload.total_quantity = values.limit_usage;
    }
    if (values.limit_per_user !== undefined) {
        payload.per_user_quantity = values.limit_per_user;
    }

    // 2. Logic Phân loại Voucher (Freeship vs Normal)
    if (payload.voucherType === "freeship") {
      payload.freeship_amount = payload.discountValue;
      payload.discount_amount = null; 
      payload.discount_percent = null;
      payload.max_discount_amount = null;
    } else {
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
    
    // 4. Set mặc định Distribution Type
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

  // Style chung cho nút
  const commonButtonStyle = {
    height: '32px', // Chuẩn height của input Antd
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 0,
    paddingBottom: 0
  };

  return (
    <AdminPageLayout
      title="QUẢN LÝ KHUYẾN MÃI"
      breadcrumb={['Trang chủ', 'Marketing', 'Khuyến mãi']}
    >
        <Card bordered={false} className="shadow-sm">
            {/* [FIX] alignItems: 'end' -> Căn đáy để các nút thẳng hàng với ô Input (bỏ qua chiều cao của Label phía trên) */}
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                 <div style={{ flex: 1, marginRight: 16 }}>
                    <PromotionFilter
                        onFilterChange={setFilters}
                        onClear={() => setFilters({})}
                    />
                 </div>
                 
                 <Space>
                    <Button 
                        icon={<CloudUploadOutlined />} 
                        onClick={() => setImportModalOpen(true)}
                        style={{ 
                            ...commonButtonStyle,
                            borderColor: '#28a645', 
                            color: '#28a645' 
                        }}
                    >
                        Import Excel
                    </Button>

                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => fetchData(filters)}
                        style={commonButtonStyle}
                    >
                        Làm mới
                    </Button>

                    <Button 
                        type="primary" 
                        icon={<PlusOutlined />} 
                        onClick={handleCreate}
                        style={{ 
                            ...commonButtonStyle,
                            backgroundColor: '#28a645', 
                            borderColor: '#28a645' 
                        }}
                    >
                        Tạo Voucher
                    </Button>
                 </Space>
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