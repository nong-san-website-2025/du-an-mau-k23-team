import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// ================== EXPORT PDF ==================
export const exportUsersToPDF = (users) => {
  const doc = new jsPDF("p", "pt", "a4");

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Danh sách người dùng", 40, 40);

  // Table data
  const tableColumn = ["Tên", "Email", "Số điện thoại", "Vai trò", "Trạng thái"];
  const tableRows = users.map((u) => [
    u.full_name || u.username || "",
    u.email || "",
    u.phone || "",
    u.role?.name || "Không rõ",
    u.is_active ? "Hoạt động" : "Bị khóa",
  ]);

  // Generate table
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 60,
    styles: { font: "helvetica", fontSize: 10 },
  });

  // Save file
  doc.save("users.pdf");
};

// ================== EXPORT EXCEL ==================
export const exportUsersToExcel = (users) => {
  const worksheetData = users.map((u) => ({
    Tên: u.full_name || u.username || "",
    Email: u.email || "",
    "Số điện thoại": u.phone || "",
    Vai_trò: u.role?.name || "Không rõ",
    Trạng_thái: u.is_active ? "Hoạt động" : "Bị khóa",
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

  XLSX.writeFile(workbook, "users.xlsx");
};
