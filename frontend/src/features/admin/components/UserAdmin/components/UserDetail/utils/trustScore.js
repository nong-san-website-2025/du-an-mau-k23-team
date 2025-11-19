// Trust Score Utilities - Hàm tính điểm uy tín
export const getTrustScore = (stats) => {
  if (!stats) return 0;
  const {
    return_rate = 0,
    complaint_rate = 0,
    cancel_rate = 0,
    payment_success_rate = 100,
  } = stats;

  let score = 100;
  score -= return_rate * 0.5;
  score -= complaint_rate * 1;
  score -= cancel_rate * 0.8;
  score -= (100 - payment_success_rate) * 0.3;

  return Math.max(0, Math.round(score));
};

export const getTrustScoreColor = (score) => {
  if (score >= 80) return "#52c41a"; // Xanh - Cao
  if (score >= 40) return "#faad14"; // Cam - Trung bình
  return "#ff4d4f"; // Đỏ - Thấp
};

export const getTrustScoreLabel = (score) => {
  if (score >= 80) return "Rất uy tín";
  if (score >= 60) return "Uy tín";
  if (score >= 40) return "Bình thường";
  return "Cần cảnh báo";
};
