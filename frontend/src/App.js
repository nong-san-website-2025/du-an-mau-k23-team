import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./features/login_register/services/AuthContext";
import { CartProvider } from "./features/cart/services/CartContext.js";
import LoginForm from "./features/login_register/pages/LoginForm";
import { userRoutes } from "./routes/UserRoutes";
import { adminRoutes } from "./routes/AdminRoutes";
import { sellerRoutes } from "./routes/SellerRoutes.jsx";
import VerifyEmailPage from "./features/login_register/components/VerifyEmailPage.jsx";
import VnpayReturn from "./pages/VnpayReturn";
import ScrollToTop from "./utils/ScrollToTop.js";
import PaymentWaiting from "./features/cart/pages/PaymentWaiting";

// 1. Import React Query
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// 2. Cấu hình Caching (Quan trọng nhất để Load nhanh)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // ✅ staleTime: Thời gian dữ liệu được coi là "còn mới".
      // Trong 5 phút (1000 * 60 * 5), nếu bạn quay lại trang cũ,
      // nó sẽ hiện NGAY LẬP TỨC dữ liệu từ bộ nhớ mà không gọi API.
      staleTime: 1000 * 60 * 5,

      // ✅ gcTime (hoặc cacheTime ở bản cũ): Thời gian lưu trong bộ nhớ đệm
      // Sau 10 phút không dùng thì mới xóa khỏi bộ nhớ để nhẹ máy
      gcTime: 1000 * 60 * 10,

      retry: 1, // Thử lại 1 lần nếu lỗi mạng
      refetchOnWindowFocus: false, // ❌ Tắt tự động load lại khi alt-tab (giúp đỡ giật màn hình)
      refetchOnReconnect: true, // Tự load lại khi có mạng trở lại
    },
  },
});

function App() {
  return (
    <div className="main-container">
      {/* 3. Bọc toàn bộ App bằng QueryClientProvider */}
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <ScrollToTop />
              <Routes>
                <Route path="/login" element={<LoginForm />} />
                {userRoutes}
                {adminRoutes}
                {sellerRoutes}
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route
                  path="/verify-email/:uid/:token"
                  element={<VerifyEmailPage />}
                />
                <Route
                  path="/payment/waiting/:orderId"
                  element={<PaymentWaiting />}
                />
                <Route path="/vnpay-return" element={<VnpayReturn />} />
              </Routes>
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </div>
  );
}

export default App;
