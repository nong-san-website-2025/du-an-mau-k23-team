// Mock data cho Seller Analytics
// Sử dụng file này để test giao diện mà không cần backend

export const mockAnalyticsData = {
  overview: {
    total_products: 145,
    active_products: 98,
    hidden_products: 47,
    total_orders: 2543,
  },
  performance: {
    growth_rate: 12.5, // +12.5% so với tháng trước
    revenue_trend: [
      { date: "Thứ 2", revenue: 15500000 },
      { date: "Thứ 3", revenue: 18200000 },
      { date: "Thứ 4", revenue: 16800000 },
      { date: "Thứ 5", revenue: 22100000 },
      { date: "Thứ 6", revenue: 25600000 },
      { date: "Thứ 7", revenue: 28900000 },
      { date: "CN", revenue: 31200000 },
    ],
    order_trend: [
      { date: "Thứ 2", orders: 45 },
      { date: "Thứ 3", orders: 52 },
      { date: "Thứ 4", orders: 48 },
      { date: "Thứ 5", orders: 63 },
      { date: "Thứ 6", orders: 78 },
      { date: "Thứ 7", orders: 89 },
      { date: "CN", orders: 95 },
    ],
    cancel_rate: 2.8, // 2.8%
    cancel_count: 71,
    return_rate: 1.5, // 1.5%
    return_count: 38,
  },
  top_products: [
    {
      name: "Rau cải xanh hữu cơ (500g)",
      quantity: 456,
      revenue: 22800000,
    },
    {
      name: "Cà chua tươi (1kg)",
      quantity: 392,
      revenue: 19600000,
    },
    {
      name: "Cà rốt hữu cơ (500g)",
      quantity: 378,
      revenue: 13230000,
    },
    {
      name: "Dưa chuột tươi (1kg)",
      quantity: 315,
      revenue: 9450000,
    },
    {
      name: "Cải bắp trắng (500g)",
      quantity: 287,
      revenue: 8610000,
    },
  ],
  finance: {
    total_revenue: 177300000, // Doanh thu tháng này
    total_commission: 17730000, // Chiết khấu (10%)
    available_balance: 159570000, // Có thể rút
  },
  withdrawal_history: [
    {
      date: "2024-11-15",
      amount: 50000000,
      method: "bank",
      status: "approved",
    },
    {
      date: "2024-11-10",
      amount: 75000000,
      method: "bank",
      status: "approved",
    },
    {
      date: "2024-11-05",
      amount: 40000000,
      method: "wallet",
      status: "approved",
    },
    {
      date: "2024-11-01",
      amount: 60000000,
      method: "bank",
      status: "approved",
    },
    {
      date: "2024-10-28",
      amount: 35000000,
      method: "bank",
      status: "pending",
    },
    {
      date: "2024-10-20",
      amount: 45000000,
      method: "bank",
      status: "approved",
    },
  ],
  reviews: {
    avg_rating: 4.6, // 4.6/5 sao
    total_reviews: 892,
  },
  rating_distribution: {
    five_star: 645, // 5 sao
    four_star: 178, // 4 sao
    three_star: 49, // 3 sao
    two_star: 15, // 2 sao
    one_star: 5, // 1 sao
  },
  review_list: [
    {
      buyer_name: "Nguyễn Thị An",
      rating: 5,
      comment: "Rau rất tươi, giao hàng nhanh chóng và đóng gói cẩn thận!",
      date: "2024-11-17",
      has_response: true,
    },
    {
      buyer_name: "Trần Văn Hùng",
      rating: 5,
      comment: "Chất lượng tuyệt vời, giá cả hợp lý, sẽ mua tiếp",
      date: "2024-11-16",
      has_response: true,
    },
    {
      buyer_name: "Phạm Hoàng Mỹ",
      rating: 4,
      comment: "Tốt, nhưng hơi chậm so với thời gian dự kiến",
      date: "2024-11-15",
      has_response: true,
    },
    {
      buyer_name: "Võ Thị Linh",
      rating: 5,
      comment: "Cải xanh rất sạch và tươi ngon. Tiểu thương chân thực!",
      date: "2024-11-14",
      has_response: false,
    },
    {
      buyer_name: "Lê Minh Tuấn",
      rating: 4,
      comment: "Có một số lá hơi héo nhưng vẫn chấp nhận được",
      date: "2024-11-13",
      has_response: true,
    },
    {
      buyer_name: "Đặng Kim Thảo",
      rating: 5,
      comment: "Giao nhanh, rau tươi, shop rất chuyên nghiệp!",
      date: "2024-11-12",
      has_response: true,
    },
    {
      buyer_name: "Hoàng Việt Anh",
      rating: 3,
      comment: "Bình thường, không có gì đặc biệt",
      date: "2024-11-11",
      has_response: false,
    },
    {
      buyer_name: "Bùi Thị Hoa",
      rating: 5,
      comment: "Hàng đúng như mô tả, người bán rất tốt bụng",
      date: "2024-11-10",
      has_response: true,
    },
    {
      buyer_name: "Dương Quốc Huy",
      rating: 5,
      comment: "Cài bắp trắng rất ngon, ăn khoẻ mạnh",
      date: "2024-11-09",
      has_response: true,
    },
    {
      buyer_name: "Cao Thị Xuân",
      rating: 4,
      comment: "Tốt nhưng giá hơi cao so với chợ",
      date: "2024-11-08",
      has_response: false,
    },
  ],
  positive_keywords: [
    { word: "Giao hàng nhanh", count: 156 },
    { word: "Rau sạch", count: 142 },
    { word: "Tươi ngon", count: 138 },
    { word: "Đóng gói cẩn thận", count: 127 },
    { word: "Chất lượng tốt", count: 114 },
    { word: "Hữu cơ", count: 96 },
    { word: "Tiểu thương chân thực", count: 78 },
    { word: "Giá hợp lý", count: 65 },
  ],
  negative_keywords: [
    { word: "Hơi héo", count: 8 },
    { word: "Chậm giao", count: 6 },
    { word: "Giá cao", count: 5 },
    { word: "Bị lỗi", count: 2 },
  ],
  response_rate: 71.5, // Tỉ lệ phản hồi đánh giá
  responded_count: 638, // Số đánh giá đã phản hồi (638/892)
};

// Hàm để mock dữ liệu analytics trong fetchAnalytics
export const useMockAnalytics = (id) => {
  // Giả lập delay API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data: mockAnalyticsData,
      });
    }, 800);
  });
};

// Hàm để mock dữ liệu seller detail
export const mockSellerDetail = {
  id: 1,
  store_name: "Nông Sản Tươi Fresh",
  owner_username: "nongsan_fresh",
  user_email: "nongsan.fresh@gmail.com",
  phone: "0912345678",
  address: "Số 123, Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
  image: "https://via.placeholder.com/200x150?text=Store+Logo",
  status: "active",
  created_at: "2023-06-15T10:30:00Z",
  rejection_reason: null,
};
