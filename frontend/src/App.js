import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./features/login_register/services/AuthContext";
import { CartProvider } from "./features/cart/services/CartContext";
import { BannerProvider } from "./features/admin/contexts/BannerContext";
import LoginForm from "./features/login_register/pages/LoginForm";
import { userRoutes } from "./routes/UserRoutes";
import { adminRoutes } from "./routes/AdminRoutes";
import { sellerRoutes } from "./routes/SellerRoutes.jsx";
import VerifyEmailPage from "./features/login_register/components/VerifyEmailPage.jsx";
import VnpayReturn from "./pages/VnpayReturn";


function App() {
  return (
    <div className="main-container">
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <BannerProvider>
              <Routes>
                <Route path="/login" element={<LoginForm />} />
                {userRoutes}
                {adminRoutes}
                {sellerRoutes}
                {/* Handle backend redirect with tokens as query params */}
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                {/* Optional legacy route (if ever linked directly from email) */}
                <Route path="/verify-email/:uid/:token" element={<VerifyEmailPage />} />
                {/* VNPAY return handler */}
                <Route path="/vnpay-return" element={<VnpayReturn />} />
              </Routes>
            </BannerProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
    </div>
  );
}


export default App;
