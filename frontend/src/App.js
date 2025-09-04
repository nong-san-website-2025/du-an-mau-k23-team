import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./features/login_register/services/AuthContext";
import { CartProvider } from "./features/cart/services/CartContext";
import { BannerProvider } from "./features/admin/contexts/BannerContext";
import LoginForm from "./features/login_register/pages/LoginForm";
import { userRoutes } from "./routes/UserRoutes";
import { adminRoutes } from "./routes/AdminRoutes";
import { sellerRoutes } from "./routes/SellerRoutes.jsx";
import DashboardPage from "./features/admin/pages/DashboardPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <BannerProvider>
            <Routes>
              <Route path="/login" element={<LoginForm />} />
              {userRoutes}
              {adminRoutes}
              {sellerRoutes}
              <Route path="/admin/dashboard" element={<DashboardPage />} />
            </Routes>
          </BannerProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;