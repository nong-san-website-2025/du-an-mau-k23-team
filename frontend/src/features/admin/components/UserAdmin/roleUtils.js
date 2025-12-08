export function roleLabel(roleNameOrObj) {
  if (!roleNameOrObj) return "";
  const name = typeof roleNameOrObj === "string" ? roleNameOrObj : roleNameOrObj.name || "";
  const key = String(name).toLowerCase();
  if (key === "customer") return "Khách hàng";
  if (key === "seller") return "Người bán";
  if (key === "admin") return "Quản trị viên";
  // Fallback: title-case the name
  return name.charAt(0).toUpperCase() + name.slice(1);
}
