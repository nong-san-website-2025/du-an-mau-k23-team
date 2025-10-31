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
    setSaved(true);
  };

  return (
    <div
      style={{
        background: '#fafaf7',
        border: '1px solid #d2d2c8',
        borderRadius: 6,
        maxWidth: 400,
        margin: '0 auto',
        padding: '32px 24px 24px 24px',
        fontFamily: 'Arial, sans-serif',
        color: '#222',
        boxShadow: 'none',
      }}
    >
      <div style={{ fontSize: 18, marginBottom: 24, color: '#222', fontWeight: 400, letterSpacing: 0 }}>
        Cài đặt thông báo
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 400, fontSize: 15, lineHeight: 1.5 }}>
          <input
            type="checkbox"
            name="promo_email"
            checked={settings.promo_email}
            onChange={handleChange}
            style={{ accentColor: '#6b8e23', width: 18, height: 18, margin: 0 }}
          />
          Nhận thông báo khuyến mãi qua email
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 400, fontSize: 15, lineHeight: 1.5 }}>
          <input
            type="checkbox"
            name="order_email"
            checked={settings.order_email}
            onChange={handleChange}
            style={{ accentColor: '#6b8e23', width: 18, height: 18, margin: 0 }}
          />
          Nhận cập nhật đơn hàng qua email
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 400, fontSize: 15, lineHeight: 1.5 }}>
          <input
            type="checkbox"
            name="news_email"
            checked={settings.news_email}
            onChange={handleChange}
            style={{ accentColor: '#6b8e23', width: 18, height: 18, margin: 0 }}
          />
          Nhận tin tức mới qua email
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 400, fontSize: 15, lineHeight: 1.5 }}>
          <input
            type="checkbox"
            name="in_app_notifications"
            checked={settings.in_app_notifications}
            onChange={handleChange}
            style={{ accentColor: '#6b8e23', width: 18, height: 18, margin: 0 }}
          />
          Nhận thông báo trên website
        </label>
      </div>
      <button
        onClick={handleSave}
        style={{
          marginTop: 32,
          background: '#6b8e23',
          color: '#fff',
          border: 'none',
          borderRadius: 3,
          padding: '9px 22px',
          fontSize: 15,
          fontWeight: 400,
          cursor: 'pointer',
          boxShadow: 'none',
          transition: 'background 0.2s',
        }}
      >
        Lưu thay đổi
      </button>
      {saved && (
        <div style={{ marginTop: 16, color: '#6b8e23', fontSize: 14 }}>
          Đã lưu thành công
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;
