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

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Thử lại 1 lần nếu lỗi
      refetchOnWindowFocus: true, // Tự động refetch khi người dùng quay lại tab
    },
  },
});

function App() {
  return (
    <div className="main-container">
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
                <Route path="/payment/waiting/:orderId" element={<PaymentWaiting />} />
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
