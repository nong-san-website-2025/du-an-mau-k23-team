// src/features/admin/promotions/PromotionsPage.jsx
import React, { useEffect, useState } from "react";
import { Button, message } from "antd";
import dayjs from "dayjs";
import AdminPageLayout from "../../components/AdminPageLayout";

import PromotionFilter from "../../components/PromotionAdmin/PromotionFilter";
import PromotionTable from "../../components/PromotionAdmin/PromotionTable";
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
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [categories, setCategories] = useState([]);

  const [filters, setFilters] = useState({});

  useEffect(() => {
    getCategories().then((res) => setCategories(res));
  }, []);

  const fetchData = async (params = {}) => {
    setLoading(true);
    try {
      const res = await getPromotionsOverview(params);
      const mapped = Array.isArray(res)
        ? res.map((item) => ({
            ...item,
            title: item.title ?? item.name ?? "",
            start: item.start_at ?? item.start ?? null,
            end: item.end_at ?? item.end ?? null,
          }))
        : [];
      setData(mapped);
    } catch (err) {
      console.error(err);
      message.error("Không thể tải danh sách khuyến mãi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(filters);
  }, [filters]);

  const handleCreate = () => {
    setDetail(null);
    setModalOpen(true);
  };

  const handleViewDetail = async (record) => {
    try {
      const id = record.id; // id là số nguyên
      const detailData = await getVoucher(id); // URL sẽ thành /vouchers/20/
      setDetail(detailData);
      setDetailModalOpen(true);
    } catch (err) {
      message.error("Không tải được chi tiết voucher");
    }
  };

  const handleDelete = async (record) => {
    try {
      await deleteVoucher(record.id);
      message.success("Đã xóa voucher");
      fetchData(filters);
    } catch (err) {
      message.error("Không thể xóa voucher");
    }
  };

  const handleSave = async (values) => {
    // 'values' nhận từ modal có dạng:
    // { ..., discountType: "amount", discountValue: 20000, dateRange: [...] }

    // 1. Sao chép tất cả giá trị từ form vào payload
    const payload = { ...values };

    // 2. Xử lý và chuyển đổi trường giảm giá
    // Dựa vào 'discountType' để tạo trường 'discount_amount' hoặc 'discount_percent' v.v.
    if (payload.discountType === "amount") {
      payload.discount_amount = payload.discountValue;
    } else if (payload.discountType === "percent") {
      payload.discount_percent = payload.discountValue;
    } else if (payload.discountType === "freeship") {
      // Giả sử backend mong muốn 'freeship_amount' cho loại 'freeship'
      // Nếu backend chỉ cần biết là freeship (không cần giá trị), bạn có thể gán true
      // Nhưng dựa trên lỗi ban đầu, có vẻ nó mong muốn 'freeship_amount'
      payload.freeship_amount = payload.discountValue;
    }

    // 3. Xóa các trường tạm thời 'discountType' và 'discountValue'
    delete payload.discountType;
    delete payload.discountValue;

    // 4. Xử lý trường dateRange (Nếu backend yêu cầu start_at và end_at riêng)
    // Giả sử 'values.dateRange' là một mảng 2 phần tử: [dayjsObjectStart, dayjsObjectEnd]
    // Hoặc chuỗi ISO: ["2025-10-27T17:00:00.000Z", "2025-11-29T17:00:00.000Z"]
    if (
      payload.dateRange &&
      Array.isArray(payload.dateRange) &&
      payload.dateRange.length === 2
    ) {
      // Backend có thể muốn 2 trường riêng biệt là 'start_at' và 'end_at'
      // Nếu `values.dateRange` là chuỗi (từ payload trước), nó đã sẵn sàng.
      // Nếu nó là đối tượng dayjs (từ Form của Antd), bạn cần .toISOString()

      // Kiểm tra xem phần tử có phải là đối tượng dayjs không
      const formatIfNeeded = (date) => {
        // Nếu là đối tượng dayjs (có hàm toISOString)
        if (date && typeof date.toISOString === "function") {
          return date.toISOString();
        }
        // Nếu đã là chuỗi ISO
        return date;
      };

      payload.start_at = formatIfNeeded(payload.dateRange[0]);
      payload.end_at = formatIfNeeded(payload.dateRange[1]);

      // Xóa trường dateRange thừa
      delete payload.dateRange;
    }

    // 5. Gửi payload đã được chuyển đổi lên server
    try {
      if (detail) {
        // Gửi payload đã chuyển đổi cho hàm update
        await updateVoucher(detail.id, payload);
        message.success("Cập nhật voucher thành công");
      } else {
        // Gửi payload đã chuyển đổi cho hàm create
        await createVoucher(payload);
        message.success("Tạo voucher thành công");
      }
      setModalOpen(false); // Đóng modal
      fetchData(filters); // Tải lại dữ liệu bảng
    } catch (err) {
      // Hiển thị lỗi chi tiết từ server (nếu có)
      const errorData = err.response?.data;
      let errorMessage = "Có lỗi khi lưu voucher";

      if (errorData) {
        // Lấy lỗi non_field_errors (như lỗi ban đầu)
        if (
          errorData.non_field_errors &&
          Array.isArray(errorData.non_field_errors)
        ) {
          errorMessage = errorData.non_field_errors.join(", ");
        }
        // Lấy lỗi của từng trường cụ thể (ví dụ: 'code' đã tồn tại)
        else if (typeof errorData === "object") {
          const fieldErrors = Object.keys(errorData)
            .map(
              (key) =>
                `${key}: ${errorData[key].join ? errorData[key].join(", ") : errorData[key]}`
            )
            .join("; ");
          if (fieldErrors) errorMessage = fieldErrors;
        }
      }

      console.error("Lỗi khi lưu voucher:", err.response || err);
      message.error(errorMessage);
    }
  };

  return (
    <AdminPageLayout
      title="QUẢN LÝ KHUYẾN MÃI"
      extra={
        <Button type="primary" onClick={handleCreate}>
          + Tạo Voucher
        </Button>
      }
    >
      <PromotionFilter
        onFilterChange={setFilters}
        onClear={() => setFilters({})}
      />

      <PromotionTable
        data={data}
        loading={loading}
        onView={handleViewDetail}
        onDelete={handleDelete}
      />

      <PromotionModal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onSave={handleSave}
        detail={detail}
        categories={categories}
      />

      <PromotionDetailModal
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        detail={detail}
      />
    </AdminPageLayout>
  );
}
