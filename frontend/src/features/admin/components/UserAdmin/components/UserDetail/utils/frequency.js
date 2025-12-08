// Frequency Label Utilities - Hàm phân loại tần suất
export const getFrequencyLabel = (count) => {
  if (count >= 5) return "Rất thường xuyên";
  if (count >= 3) return "Thường xuyên";
  if (count >= 1) return "Thỉnh thoảng";
  return "Hiếm";
};

export const getFrequencyColor = (count) => {
  if (count >= 5) return "#52c41a"; // Xanh đậm
  if (count >= 3) return "#7cb305"; // Xanh nhạt
  return "#faad14"; // Cam
};

export const getFrequencyScore = (count) => {
  if (count >= 5) return 5;
  if (count >= 3) return 4;
  if (count >= 1) return 3;
  return 1;
};
