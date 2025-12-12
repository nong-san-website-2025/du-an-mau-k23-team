// Membership Utilities - Hàm xác định hạng thành viên
export const getMembershipBadge = (totalSpent) => {
  if (totalSpent >= 10000000) {
    return { level: "Platinum", color: "#b37feb", label: "Hạng Kim Cương" };
  }
  if (totalSpent >= 5000000) {
    return { level: "Gold", color: "#ffc069", label: "Hạng Vàng" };
  }
  if (totalSpent >= 2000000) {
    return { level: "Silver", color: "#d9d9d9", label: "Hạng Bạc" };
  }
  if (totalSpent >= 500000) {
    return { level: "Bronze", color: "#ad6800", label: "Hạng Đồng" };
  }
  return { level: "Member", color: "#1890ff", label: "Thành viên" };
};

export const getNextMembershipLevel = (totalSpent) => {
  if (totalSpent >= 10000000) return { level: "Platinum", nextTarget: "Tối đa" };
  if (totalSpent >= 5000000) return { level: "Gold", nextSpend: 10000000 - totalSpent };
  if (totalSpent >= 2000000) return { level: "Silver", nextSpend: 5000000 - totalSpent };
  if (totalSpent >= 500000) return { level: "Bronze", nextSpend: 2000000 - totalSpent };
  return { level: "Member", nextSpend: 500000 - totalSpent };
};

export const getMembershipBenefits = (level) => {
  const benefits = {
    Member: ["Tham gia chương trình thành viên", "Hỗ trợ khách hàng 24/7"],
    Bronze: [
      "Giảm 2% cho đơn hàng",
      "Ưu tiên hỗ trợ khách hàng",
      "Miễn phí vận chuyển với đơn hàng ≥ 500K",
    ],
    Silver: [
      "Giảm 5% cho đơn hàng",
      "Ưu tiên hỗ trợ khách hàng VIP",
      "Miễn phí vận chuyển toàn bộ đơn hàng",
      "Sinh nhật đặc biệt: Giảm 10%",
    ],
    Gold: [
      "Giảm 8% cho đơn hàng",
      "Hỗ trợ khách hàng VIP 24/7",
      "Miễn phí vận chuyển toàn bộ đơn hàng",
      "Sinh nhật: Giảm 15%",
      "Hạn mức tín dụng: 50 triệu đồng",
    ],
    Platinum: [
      "Giảm 10% cho đơn hàng",
      "Hỗ trợ khách hàng VIP riêng",
      "Miễn phí vận chuyển + bảo hiểm",
      "Sinh nhật: Giảm 20% + Quà tặng",
      "Hạn mức tín dụng: 200 triệu đồng",
      "Ưu tiên bán hàng sớm (pre-sale)",
    ],
  };

  return benefits[level] || [];
};
