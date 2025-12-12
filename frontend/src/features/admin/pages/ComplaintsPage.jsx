import React from "react";

const steps = [
  {
    title: "Bước 1: Quan sát danh sách đơn hàng",
    details: [
      "Khi vào trang Đơn hàng, bạn sẽ thấy bảng dữ liệu gồm các cột:",
      "ID: Mã số đơn hàng.",
      "Khách hàng: Tên người mua.",
      "Số điện thoại: Số liên lạc của khách hàng.",
      "Tổng tiền: Giá trị đơn hàng (kèm đơn vị ₫).",
      "Trạng thái: Tình trạng đơn hàng (Hoàn thành, Đang xử lý,…).",
      "Ngày tạo: Thời gian đặt đơn.",
      "Thao tác: Nút chỉnh sửa hoặc menu thao tác."
    ]
  },
  {
    title: "Bước 2: Lọc đơn hàng theo trạng thái",
    details: [
      "Ở cột bên trái, chọn Tất cả trạng thái hoặc lọc theo:",
      "Hoàn thành, Chờ xử lý, Hủy",
      "Việc này giúp bạn tập trung vào từng nhóm đơn hàng cụ thể."
    ]
  },
  {
    title: "Bước 3: Tìm kiếm đơn hàng",
    details: [
      "Nhập tên khách hàng hoặc số điện thoại vào ô tìm kiếm.",
      "Ví dụ: nhập 0328002213 → hệ thống sẽ hiển thị các đơn hàng của khách hàng đó."
    ]
  },
  {
    title: "Bước 4: Quản lý danh sách đơn hàng",
    details: [
      "Tick chọn nhiều đơn để thao tác hàng loạt.",
      "Với từng đơn hàng:",
      "Bấm ✏️ Chỉnh sửa để cập nhật thông tin.",
      "Hoặc mở menu thao tác để xử lý thêm."
    ]
  },
  {
    title: "Bước 5: Sử dụng các nút công cụ",
    details: [
      "Nhập file: Tải danh sách đơn hàng từ Excel/CSV vào hệ thống.",
      "Xuất file: Xuất danh sách đơn hàng ra file để báo cáo/in ấn.",
      "Làm mới: Cập nhật lại dữ liệu mới nhất."
    ]
  }
];

const examples = [
  "Đơn hàng #4 – Khách hàng: Huỳnh Minh Khoa – SĐT: 0328002213 – Tổng tiền: 600.000₫ – Trạng thái: Hoàn thành.",
  "Đơn hàng #1 – Giá trị 1.555.000₫ – Trạng thái: Hoàn thành."
];

const tips = [
  "Tìm kiếm nhanh khách hàng bằng số điện thoại.",
  "Cuối ngày nên xuất file để lưu trữ và báo cáo.",
  "Luôn kiểm tra trạng thái đơn hàng trước khi in hóa đơn."
];

export default function ComplaintsPage() {
  return (
    <div style={{ color: "#222", fontSize: 17, lineHeight: 1.7, textAlign: "justify", marginBottom: 18, width: "100%", paddingLeft: 36, paddingRight: 36, boxSizing: "border-box" }}>
      <span style={{ fontSize: 20 }}>📦 Hướng dẫn sử dụng trang Đơn hàng trong GreenFarm</span>
      <p>Trang Đơn hàng giúp bạn quản lý toàn bộ các giao dịch mua hàng trên hệ thống. Hãy làm theo các bước dưới đây để sử dụng hiệu quả.</p>
      <span style={{ fontWeight: "bold" }}>🔹 Các bước thực hiện</span>
      <ol>
        {steps.map((step, idx) => (
          <li key={idx} style={{ marginBottom: 12 }}>
            <b>{step.title}</b>
            <ul style={{ marginTop: 6 }}>
              {step.details.map((detail, i) => (
                <li key={i}>{detail}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      <span style={{ fontWeight: "bold" }}>✅ Ví dụ minh họa</span>
      <ul>
        {examples.map((ex, idx) => (
          <li key={idx}>{ex}</li>
        ))}
      </ul>
      <span style={{ fontWeight: "bold" }}>💡 Mẹo sử dụng</span>
      <ul>
        {tips.map((tip, idx) => (
          <li key={idx}>{tip}</li>
        ))}
      </ul>
      <p>👉 Như vậy, chỉ với 5 bước đơn giản, bạn đã có thể quản lý toàn bộ đơn hàng một cách nhanh chóng và hiệu quả.</p>
    </div>
  );
}
