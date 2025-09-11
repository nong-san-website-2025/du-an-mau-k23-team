import React, { useEffect, useState } from "react";
import { Button, Modal, message } from "antd";
import axios from "axios";
import PromotionFilters from "../../components/PromotionSeller/PromotionFilters";
import PromotionTable from "../../components/PromotionSeller/PromotionTable";
import PromotionPopup from "../../components/PromotionSeller/PromotionPopup";

const Promotions = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);

  // filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // popup
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupMode, setPopupMode] = useState("add"); // add | edit | view
  const [currentPromo, setCurrentPromo] = useState(null);

  const token = localStorage.getItem("token");

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/promotions/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("API response:", res.data);

      // Nếu backend trả về {results: [...]}, lấy results
      if (Array.isArray(res.data)) {
        setPromotions(res.data);
      } else if (res.data?.results) {
        setPromotions(res.data.results);
      } else {
        setPromotions([]);
      }
    } catch (err) {
      console.error("fetchPromotions error:", err.response ?? err);
      message.error("Không tải được danh sách khuyến mãi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatus = (promo) => {
    try {
      const now = new Date();
      const start = promo.start ? new Date(promo.start) : null;
      const end = promo.end ? new Date(promo.end) : null;
      if (!start || !end) return "Không xác định";
      if (now < start) return "Sắp diễn ra";
      if (now >= start && now <= end) return "Đang chạy";
      return "Hết hạn";
    } catch {
      return "Không xác định";
    }
  };

  const openPopup = (mode, promo = null) => {
    setPopupMode(mode);
    if (promo) setCurrentPromo(promo);
    else
      setCurrentPromo({
        name: "",
        code: "",
        type: "",
        condition: "",
        start: null, // sửa từ "" thành null
        end: null, // sửa từ "" thành null
        used: 0,
        total: 0,
        products: 0,
      });
    setPopupOpen(true);
  };

  const handleSave = async (payload) => {
    const normalized = {
      ...payload,
      used: Number(payload.used) || 0,
      total: Number(payload.total) || 0,
      products: Number(payload.products) || 0,
      start: payload.start || "",
      end: payload.end || "",
    };

    try {
      if (popupMode === "add") {
        console.log("POST payload:", normalized);
        const res = await axios.post(
          "http://127.0.0.1:8000/api/promotions/",
          normalized,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log("POST response:", res.data);
        await fetchPromotions();
        message.success("Thêm khuyến mãi thành công");
      } else if (popupMode === "edit") {
        if (!normalized.id) {
          console.error("Edit payload missing id:", normalized);
          message.error("Không xác định khuyến mãi để cập nhật");
          return;
        }
        console.log("PUT payload:", normalized);
        const res = await axios.put(
          `http://127.0.0.1:8000/api/promotions/${normalized.id}/`,
          normalized,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("PUT response:", res.data);
        await fetchPromotions();
        message.success("Cập nhật khuyến mãi thành công");
      }
      setPopupOpen(false);
    } catch (err) {
      console.error("handleSave error:", err.response ?? err);
      const serverMsg =
        err?.response?.data?.detail || err?.response?.data || "";
      message.error(
        (popupMode === "add" ? "Thêm thất bại: " : "Cập nhật thất bại: ") +
          serverMsg
      );
    }
  };

  const handleDelete = (promo) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: `Bạn có chắc muốn xóa "${promo.name}"?`,
      onOk: async () => {
        try {
          console.log("DELETE promo id:", promo.id);
          await axios.delete(
            `http://127.0.0.1:8000/api/promotions/${promo.id}/`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          await fetchPromotions();
          message.success("Xóa thành công");
        } catch (err) {
          console.error("handleDelete error:", err.response ?? err);
          message.error("Xóa thất bại");
        }
      },
    });
  };

  const filtered = promotions.filter((p) => {
    const status = getStatus(p);
    if (
      search &&
      !(
        (p.name && p.name.toLowerCase().includes(search.toLowerCase())) ||
        (p.code && p.code.toLowerCase().includes(search.toLowerCase()))
      )
    )
      return false;
    if (typeFilter && p.type !== typeFilter) return false;
    if (statusFilter && status !== statusFilter) return false;
    return true;
  });

  return (
    <div
      style={{
        margin: "20px",
        padding: 10,
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 2px 8px rgba(44,62,80,0.07)",
        fontSize: "0.92rem",
        fontFamily: "Roboto, Arial, sans-serif",
        letterSpacing: 0.1,
      }}
    >
      <div style={{ marginBottom: 10 }}>
        <span
          style={{
            fontSize: "1.6rem",
            fontWeight: 700,
            color: "#222",
            letterSpacing: 0.5,
            fontFamily: "Roboto, Arial, sans-serif",
          }}
        >
          Quản lý khuyến mãi
        </span>
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <PromotionFilters
          search={search}
          setSearch={setSearch}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
        <Button
          type="primary"
          onClick={() => openPopup("add", null)}
          style={{
            height: 35,
            borderRadius: 6,
            marginLeft: 8,
            minWidth: 130,
            fontSize: "1rem",
            width: 140,
            padding: 0,
          }}
        >
          Thêm mới
        </Button>
      </div>

      <PromotionTable
        promotions={filtered}
        loading={loading}
        getStatus={getStatus}
        onEdit={(p) => openPopup("edit", p)}
        onView={(p) => openPopup("view", p)}
        onDelete={handleDelete}
      />

      {popupOpen && (
        <PromotionPopup
          visible={popupOpen}
          mode={popupMode}
          promotion={currentPromo}
          onClose={() => setPopupOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default Promotions;
