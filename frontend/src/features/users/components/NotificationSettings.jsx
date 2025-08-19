import React, { useState, useEffect } from "react";

const NotificationSettings = () => {
  const [settings, setSettings] = useState({
    promo_email: true,
    order_email: true,
    news_email: false,
    in_app_notifications: true,
  });

  const [saved, setSaved] = useState(false);

  // Giả lập fetch từ API nếu sau này cần
  useEffect(() => {
    // Gọi API để lấy cài đặt thực tế ở đây
    // setSettings(res.data)
  }, []);

  const handleChange = (e) => {
    const { name, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: checked,
    }));
    setSaved(false);
  };

  const handleSave = () => {
    // Sau này sẽ gọi API PUT/PATCH ở đây
    console.log("Đã lưu cài đặt:", settings);
    setSaved(true);
  };

  return (
    <div>
      <h5 style={{ color: "#2E8B57" }}>Cài đặt thông báo</h5>
      <div className="form-check">
        <input
          type="checkbox"
          name="promo_email"
          className="form-check-input"
          checked={settings.promo_email}
          onChange={handleChange}
        />
        <label className="form-check-label">
          Nhận thông báo khuyến mãi (qua Email)
        </label>
      </div>
      <div className="form-check mt-2">
        <input
          type="checkbox"
          name="order_email"
          className="form-check-input"
          checked={settings.order_email}
          onChange={handleChange}
        />
        <label className="form-check-label">
          Nhận cập nhật đơn hàng (qua Email)
        </label>
      </div>
      <div className="form-check mt-2">
        <input
          type="checkbox"
          name="news_email"
          className="form-check-input"
          checked={settings.news_email}
          onChange={handleChange}
        />
        <label className="form-check-label">
          Nhận tin tức mới (qua Email)
        </label>
      </div>
      <div className="form-check mt-2">
        <input
          type="checkbox"
          name="in_app_notifications"
          className="form-check-input"
          checked={settings.in_app_notifications}
          onChange={handleChange}
        />
        <label className="form-check-label">
          Nhận thông báo trên hệ thống (trên website)
        </label>
      </div>

      <button className="btn btn-success mt-4" onClick={handleSave}>
        Lưu thay đổi
      </button>

      {saved && <div className="mt-3 text-success">✅ Đã lưu thành công</div>}
    </div>
  );
};

export default NotificationSettings;
