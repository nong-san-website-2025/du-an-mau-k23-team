// src/features/seller_center/pages/PromotionSeller/Promotions.jsx
import React, { useEffect, useState } from "react";
import { Input, Select, Button, Spin } from "antd";
import axios from "axios";
import PromotionTable from "../../components/PromotionSeller/PromotionTable";
import PromotionPopup from "../../components/PromotionSeller/PromotionPopup";

const { Option } = Select;

const Promotions = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMode, setPopupMode] = useState("add"); // add, edit, view
  const [currentPromo, setCurrentPromo] = useState({});

  const token = localStorage.getItem("token");

  // Fetch promotions
  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/promotions/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPromotions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  // Filter promotions
  const filteredPromotions = promotions.filter((promo) => {
    const status = getStatus(promo);
    return (
      (!search ||
        promo.name.toLowerCase().includes(search.toLowerCase()) ||
        promo.code.toLowerCase().includes(search.toLowerCase())) &&
      (!typeFilter || promo.type === typeFilter) &&
      (!statusFilter || status === statusFilter)
    );
  });

  // Get status
  const getStatus = (promo) => {
    const now = new Date();
    const start = new Date(promo.start);
    const end = new Date(promo.end);
    if (!start || !end) return "Không xác định";
    if (now < start) return "Sắp diễn ra";
    if (now >= start && now <= end) return "Đang chạy";
    return "Hết hạn";
  };

  // Open popup
  const openPopup = (mode, promo = null) => {
    setPopupMode(mode);
    setCurrentPromo(
      promo || {
        name: "",
        code: "",
        type: "",
        condition: "",
        start: "",
        end: "",
        used: 0,
        total: 0,
        products: 0,
      }
    );
    setPopupVisible(true);
  };

  // Save promotion (add or edit)
  const handleSave = async (promoData) => {
    try {
      if (popupMode === "add") {
        const res = await axios.post(
          "http://127.0.0.1:8000/api/promotions/",
          promoData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setPromotions((prev) => [...prev, res.data]);
      } else if (popupMode === "edit") {
        const res = await axios.put(
          `http://127.0.0.1:8000/api/promotions/${promoData.id}/`,
          promoData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setPromotions((prev) =>
          prev.map((p) => (p.id === promoData.id ? res.data : p))
        );
      }
      setPopupVisible(false);
    } catch (err) {
      console.error(err);
      alert(popupMode === "add" ? "Thêm thất bại!" : "Cập nhật thất bại!");
    }
  };

  return (
    <div style={{ maxWidth: 1800, margin: "32px auto", padding: "0 16px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
        Quản lý duyệt khuyến mãi
      </h1>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <Input
          placeholder="Tìm kiếm theo tên hoặc mã"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 200 }}
        />
        <Select
          placeholder="Lọc theo trạng thái"
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 160 }}
        >
          <Option value="">Tất cả</Option>
          <Option value="Sắp diễn ra">Sắp diễn ra</Option>
          <Option value="Đang chạy">Đang chạy</Option>
          <Option value="Hết hạn">Hết hạn</Option>
        </Select>
        <Select
          placeholder="Chọn loại khuyến mãi"
          value={typeFilter}
          onChange={setTypeFilter}
          style={{ width: 160 }}
        >
          <Option value="">Tất cả</Option>
          <Option value="Promotion">Giảm tiền</Option>
          <Option value="Flash Sale">Giảm %</Option>
          <Option value="Voucher">Freeship</Option>
        </Select>
        <Button type="primary" onClick={() => openPopup("add")}>
          Thêm mới
        </Button>
      </div>

      {loading ? (
        <Spin tip="Đang tải dữ liệu..." style={{ display: "block", marginTop: 40 }} />
      ) : (
        <PromotionTable
          promotions={filteredPromotions}
          getStatus={getStatus}
          onEdit={(promo) => {
            const p = { ...promo };
            p.start = p.start instanceof Date ? p.start.toISOString() : p.start;
            p.end = p.end instanceof Date ? p.end.toISOString() : p.end;
            openPopup("edit", p);
          }}
          onDelete={fetchPromotions} // sau khi xóa, refresh lại
          onView={(promo) => {
            const p = { ...promo };
            p.start = p.start instanceof Date ? p.start.toISOString() : p.start;
            p.end = p.end instanceof Date ? p.end.toISOString() : p.end;
            openPopup("view", p);
          }}
        />
      )}

      {popupVisible && (
        <PromotionPopup
          visible={popupVisible}
          mode={popupMode}
          promotion={currentPromo}
          onClose={() => setPopupVisible(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default Promotions;
