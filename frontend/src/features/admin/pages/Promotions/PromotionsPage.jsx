import React, { useEffect, useState } from "react";
import { Button, message, Card, Space, Modal, Alert } from "antd";
import { 
    PlusOutlined, 
    CloudUploadOutlined, 
    DeleteOutlined, 
    CheckSquareOutlined, 
    CloseSquareOutlined 
} from "@ant-design/icons";

import AdminPageLayout from "../../components/AdminPageLayout";
import PromotionFilter from "../../components/PromotionAdmin/PromotionFilter";
import PromotionTable from "../../components/PromotionAdmin/PromotionTable";
import PromotionModal from "../../components/PromotionAdmin/PromotionModal";
import PromotionDetailModal from "../../components/PromotionAdmin/PromotionDetailModal"; // Sẽ được design lại bên dưới
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

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);

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
      handleDeselectAll(); 
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
        // [FIX] Gọi API lấy chi tiết để đảm bảo đủ dữ liệu (đặc biệt là description, list category...)
        const detailData = await getVoucher(record.id);
        setSelectedRecord(detailData);
        setDetailModalOpen(true);
    } catch (error) {
        message.error("Lỗi tải chi tiết");
    }
  };

  const handleDelete = async (record) => {
    try {
      if (record.used_quantity > 0) {
          await updateVoucher(record.id, { active: false });
          message.warning("Voucher đã có người dùng, đã chuyển sang trạng thái ẨN.");
      } else {
          await deleteVoucher(record.id);
          message.success("Đã xóa voucher thành công");
      }
      fetchData(filters);
    } catch (err) {
      message.error("Thao tác thất bại.");
    }
  };

  const handleBulkDelete = () => {
    if (selectedRowKeys.length === 0) return;

    Modal.confirm({
        title: `Xử lý ${selectedRowKeys.length} voucher đã chọn?`,
        content: (
            <div>
                <p>Hệ thống sẽ tự động kiểm tra:</p>
                <ul style={{ paddingLeft: 20 }}>
                    <li>Voucher <b>chưa sử dụng</b>: Sẽ bị xóa vĩnh viễn.</li>
                    <li>Voucher <b>đã có người dùng</b>: Sẽ bị tắt kích hoạt (ẩn đi).</li>
                </ul>
            </div>
        ),
        okText: "Xác nhận",
        okType: "danger",
        cancelText: "Hủy",
        onOk: async () => {
            setLoading(true);
            try {
                let deletedCount = 0;
                let deactivatedCount = 0;
                
                await Promise.all(selectedRows.map(async (row) => {
                    try {
                        const usage = row.used_quantity || row.issued_count || 0;
                        if (usage > 0) {
                            await updateVoucher(row.id, { active: false });
                            deactivatedCount++;
                        } else {
                            await deleteVoucher(row.id);
                            deletedCount++;
                        }
                    } catch (err) {}
                }));

                message.success(`Thành công! Đã xóa ${deletedCount} và ẩn ${deactivatedCount} voucher.`);
                fetchData(filters);
            } catch (err) {
                message.error("Có lỗi xảy ra.");
                setLoading(false);
            }
        }
    });
  };
  
  const selectUnusedVouchers = () => {
      const unused = data.filter(item => !item.used_quantity && !item.issued_count);
      const keys = unused.map(item => item.id);
      setSelectedRowKeys(keys);
      setSelectedRows(unused);
      if (keys.length > 0) {
          message.info(`Đã chọn ${keys.length} voucher chưa sử dụng.`);
      } else {
          message.info("Không có voucher nào chưa sử dụng.");
      }
  };

  const handleDeselectAll = () => {
      setSelectedRowKeys([]);
      setSelectedRows([]);
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

  const processPayload = (values) => {
    const payload = { ...values };
    if (values.limit_usage !== undefined) payload.total_quantity = values.limit_usage;
    if (values.limit_per_user !== undefined) payload.per_user_quantity = values.limit_per_user;
    if (payload.voucherType === "freeship") {
      payload.freeship_amount = payload.discountValue;
      payload.discount_amount = null; payload.discount_percent = null; payload.max_discount_amount = null;
    } else {
      payload.freeship_amount = null; 
      if (payload.discountType === "percent") {
        payload.discount_percent = payload.discountValue; payload.discount_amount = null;
      } else {
        payload.discount_amount = payload.discountValue; payload.discount_percent = null;
      }
    }
    if (payload.dateRange && payload.dateRange.length === 2) {
      payload.start_at = payload.dateRange[0].toISOString();
      payload.end_at = payload.dateRange[1].toISOString();
    }
    payload.distribution_type = 'claim'; 
    delete payload.dateRange; delete payload.discountType; delete payload.discountValue;
    delete payload.voucherType; delete payload.limit_usage; delete payload.limit_per_user;
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
      message.error("Lỗi lưu dữ liệu.");
    } finally {
      setModalLoading(false);
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys, rows) => {
        setSelectedRowKeys(keys);
        setSelectedRows(rows);
    },
  };

  return (
    <AdminPageLayout title="QUẢN LÝ KHUYẾN MÃI" breadcrumb={['Trang chủ', 'Marketing', 'Khuyến mãi']}>
        <Card bordered={false} className="shadow-sm">
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                 <div style={{ flex: 1, minWidth: 200 }}>
                    <PromotionFilter onFilterChange={setFilters} onClear={() => setFilters({})} />
                 </div>
                 
                 <Space wrap>
                    <Button onClick={selectUnusedVouchers} icon={<CheckSquareOutlined />}>
                        Chọn chưa dùng
                    </Button>

                    {selectedRowKeys.length > 0 && (
                        <>
                            <Button onClick={handleDeselectAll} icon={<CloseSquareOutlined />}>
                                Hủy chọn
                            </Button>
                            <Button type="primary" danger icon={<DeleteOutlined />} onClick={handleBulkDelete}>
                                Xóa ({selectedRowKeys.length})
                            </Button>
                        </>
                    )}

                    <Button icon={<CloudUploadOutlined />} onClick={() => setImportModalOpen(true)} style={{ borderColor: '#217346', color: '#217346' }}>
                        Import Excel
                    </Button>

                    <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                        Tạo Voucher
                    </Button>
                 </Space>
            </div>

            {selectedRowKeys.length > 0 && (
                <Alert 
                    message={
                        <span>
                            Đang chọn <b>{selectedRowKeys.length}</b> voucher. 
                            <a onClick={handleDeselectAll} style={{ marginLeft: 12, fontWeight: 600 }}>Bỏ chọn tất cả</a>
                        </span>
                    } 
                    type="info" 
                    showIcon 
                    style={{ marginBottom: 16 }} 
                />
            )}

            <PromotionTable
                data={data}
                loading={loading}
                onView={handleViewDetail}
                onEdit={handleEdit}
                onDelete={handleDelete}
                rowSelection={rowSelection} 
            />
        </Card>

      <PromotionModal open={modalOpen} loading={modalLoading} onCancel={() => setModalOpen(false)} onSave={handleSave} detail={selectedRecord} categories={categories} />
      
      {/* Detail Modal được gọi ở đây */}
      <PromotionDetailModal open={detailModalOpen} onCancel={() => setDetailModalOpen(false)} detail={selectedRecord} />
      
      <ImportVoucherModal open={importModalOpen} onCancel={() => setImportModalOpen(false)} onImportAPI={handleImportAPI} />
    </AdminPageLayout>
  );
}