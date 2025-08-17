
import React, { useState, useEffect } from "react";
import API from "../features/login_register/services/api";

export default function Profile() {
  const [form, setForm] = useState({
    full_name: "",
    address: "",
    phone: "",
    email: "",
    // Các trường bổ sung nếu backend có: gender, birthday, cccd, bio
    gender: "",
    birthday: "",
    cccd: "",
    bio: ""
  });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Lấy thông tin user khi load trang
  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      setError("");
      try {
        const res = await API.get("users/me/");
        setForm(prev => ({
          ...prev,
          full_name: res.data.full_name || "",
          address: res.data.address || "",
          phone: res.data.phone || "",
          email: res.data.email || "",
          // Nếu backend trả về các trường này thì lấy luôn
          gender: res.data.gender || "",
          birthday: res.data.birthday || "",
          cccd: res.data.cccd || "",
          bio: res.data.bio || ""
        }));
      } catch (err) {
        setError("Không lấy được thông tin người dùng. Vui lòng đăng nhập lại!");
      }
      setLoading(false);
    }
    fetchProfile();
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSuccess("");
    setError("");
    if (!form.full_name || !form.email) {
      setError("Vui lòng nhập đầy đủ họ tên và email.");
      return;
    }
    setLoading(true);
    try {
      // Chỉ gửi các trường backend hỗ trợ
      const payload = {
        full_name: form.full_name,
        address: form.address,
        phone: form.phone,
        email: form.email,
        // Nếu backend hỗ trợ các trường này thì gửi luôn
        gender: form.gender,
        birthday: form.birthday,
        cccd: form.cccd,
        bio: form.bio
      };
      await API.put("users/me/", payload);
      setSuccess("Cập nhật thông tin thành công!");
    } catch (err) {
      setError("Cập nhật thất bại. Vui lòng thử lại!");
    }
    setLoading(false);
  };

  return (
    <div className="container py-4" style={{maxWidth: 500}}>
      <div className="card mb-4" style={{borderRadius: 6, border: '1px solid #eee'}}>
        <div className="card-body">
          <div className="mb-3" style={{fontWeight: 500, fontSize: 20}}>Thông tin cá nhân</div>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Họ và tên</label>
              <input type="text" className="form-control" name="full_name" value={form.full_name} onChange={handleChange} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Bio</label>
              <textarea className="form-control" name="bio" value={form.bio} onChange={handleChange} rows={2} placeholder="Giới thiệu ngắn gọn về bạn" />
            </div>
            <div className="mb-3">
              <label className="form-label">Giới tính</label>
              <div>
                <div className="form-check form-check-inline">
                  <input className="form-check-input" type="radio" name="gender" id="gender_male" value="male" checked={form.gender === "male"} onChange={handleChange} />
                  <label className="form-check-label" htmlFor="gender_male">Nam</label>
                </div>
                <div className="form-check form-check-inline">
                  <input className="form-check-input" type="radio" name="gender" id="gender_female" value="female" checked={form.gender === "female"} onChange={handleChange} />
                  <label className="form-check-label" htmlFor="gender_female">Nữ</label>
                </div>
                <div className="form-check form-check-inline">
                  <input className="form-check-input" type="radio" name="gender" id="gender_other" value="other" checked={form.gender === "other"} onChange={handleChange} />
                  <label className="form-check-label" htmlFor="gender_other">Khác</label>
                </div>
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Ngày sinh</label>
              <input type="date" className="form-control" name="birthday" value={form.birthday} onChange={handleChange} />
            </div>
            <div className="mb-3">
              <label className="form-label">Số CCCD</label>
              <input type="text" className="form-control" name="cccd" value={form.cccd} onChange={handleChange} />
            </div>
            <div className="mb-3">
              <label className="form-label">Địa chỉ</label>
              <input type="text" className="form-control" name="address" value={form.address} onChange={handleChange} />
            </div>
            <div className="mb-3">
              <label className="form-label">Số điện thoại</label>
              <input type="text" className="form-control" name="phone" value={form.phone} onChange={handleChange} />
            </div>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" name="email" value={form.email} onChange={handleChange} required />
            </div>
            {error && <div className="alert alert-danger py-2 mb-2">{error}</div>}
            {success && <div className="alert alert-success py-2 mb-2">{success}</div>}
            <div className="d-flex gap-3 justify-content-center mt-3">
              <button className="btn btn-outline-dark px-5" type="button" onClick={() => {
                setForm({full_name: "", bio: "", gender: "", birthday: "", cccd: "", address: "", phone: "", email: ""}); setError(""); setSuccess("");
              }} disabled={loading}>HỦY</button>
              <button className="btn btn-dark px-5" type="submit" disabled={loading}>
                {loading ? "Đang xử lý..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
