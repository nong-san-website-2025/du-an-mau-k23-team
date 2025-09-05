import React, { useState } from "react";

const Settings = () => {
  const [systemName, setSystemName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [smtpServer, setSmtpServer] = useState("");
  const [adminEmail, setAdminEmail] = useState("");

  const handleSave = () => {
    alert("Đã lưu cài đặt (sau này sẽ gọi API).");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">⚙️ Cài đặt hệ thống</h1>

      <div className="bg-white shadow rounded p-4 mb-6">
        <h2 className="font-semibold mb-2">Cấu hình chung</h2>
        <input
          type="text"
          placeholder="Tên hệ thống"
          className="border p-2 w-full mb-2"
          value={systemName}
          onChange={(e) => setSystemName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Logo URL"
          className="border p-2 w-full mb-2"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
        />
        <button
          onClick={handleSave}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Lưu
        </button>
      </div>

      <div className="bg-white shadow rounded p-4">
        <h2 className="font-semibold mb-2">Cài đặt Email</h2>
        <input
          type="text"
          placeholder="SMTP server"
          className="border p-2 w-full mb-2"
          value={smtpServer}
          onChange={(e) => setSmtpServer(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email quản trị"
          className="border p-2 w-full mb-2"
          value={adminEmail}
          onChange={(e) => setAdminEmail(e.target.value)}
        />
        <button
          onClick={handleSave}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Lưu
        </button>
      </div>
    </div>
  );
};

export default Settings;
