import { useState } from "react";

export default function SellerRegisterPage() {
  const [form, setForm] = useState({
    store_name: "",
    bio: "",
    address: "",
    phone: "",
    image: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);
    try {
      const formData = new FormData();
      // Lấy user id từ token JWT trước khi gửi request
      function getUserIdFromToken() {
        const token = localStorage.getItem("token");
        if (!token) return null;
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          return payload.user_id || payload.id;
        } catch {
          return null;
        }
      }
      const userId = getUserIdFromToken();
      if (userId) {
        formData.append("user", userId);
      }
      Object.entries(form).forEach(([key, value]) => {
        if (value !== null && value !== "") formData.append(key, value);
      });
      // Gửi yêu cầu đăng ký seller, trạng thái mặc định là "pending"
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch("http://localhost:8000/api/sellers/register/", {
        method: "POST",
        body: formData,
        headers,
      });
      if (!res.ok) throw new Error("Đăng ký thất bại");
      setSuccess(true);
      setForm({ store_name: "", bio: "", address: "", phone: "", image: null });
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-0" style={{ maxWidth: 520 }}>
      <div className="card shadow-sm border-0 p-4" style={{ borderRadius: 18 }}>
        <h2 className="mb-3" style={{ fontWeight: 700 }}>Đăng ký cửa hàng</h2>
        {success && (
          <div className="alert alert-success">Yêu cầu đăng ký đã gửi, chờ duyệt!</div>
        )}
        {error && (
          <div className="alert alert-danger">{error}</div>
        )}
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label fw-bold">Tên cửa hàng *</label>
              <input
                type="text"
                className="form-control border rounded-3"
                name="store_name"
                value={form.store_name}
                onChange={handleChange}
                required
                placeholder="Nhập tên cửa hàng"
                autoFocus
              />
            </div>
            <div className="col-12">
              <label className="form-label fw-bold">Mô tả</label>
              <textarea
                className="form-control border rounded-3"
                name="bio"
                value={form.bio}
                onChange={handleChange}
                rows={3}
                placeholder="Giới thiệu ngắn về cửa hàng, sản phẩm, dịch vụ..."
              />
            </div>
            <div className="col-12">
              <label className="form-label fw-bold">Địa chỉ</label>
              <input
                type="text"
                className="form-control border rounded-3"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Địa chỉ cửa hàng"
              />
            </div>
            <div className="col-12">
              <label className="form-label fw-bold">Số điện thoại</label>
              <input
                type="text"
                className="form-control border rounded-3"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Số điện thoại liên hệ"
              />
            </div>
            <div className="col-12">
              <label className="form-label fw-bold">Ảnh cửa hàng</label>
              <input
                type="file"
                className="form-control border rounded-3"
                name="image"
                accept="image/*"
                onChange={handleChange}
              />
              {form.image && typeof form.image === "object" && (
                <div className="mt-2">
                  <img
                    src={URL.createObjectURL(form.image)}
                    alt="Preview"
                    style={{ maxWidth: 120, maxHeight: 120, borderRadius: 10, boxShadow: "0 2px 8px #22c55e33" }}
                  />
                </div>
              )}
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-success w-100 mt-4 py-2 fw-bold"
            style={{ borderRadius: 8, fontSize: 17, letterSpacing: 0.5 }}
            disabled={submitting}
          >
            {submitting ? "Đang gửi..." : "Gửi yêu cầu đăng ký"}
          </button>
        </form>
      </div>
    </div>
  );
}
