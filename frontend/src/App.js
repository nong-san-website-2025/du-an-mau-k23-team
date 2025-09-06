import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./features/login_register/services/AuthContext";
import { CartProvider } from "./features/cart/services/CartContext";
import { BannerProvider } from "./features/admin/contexts/BannerContext";
import LoginForm from "./features/login_register/pages/LoginForm";
import { userRoutes } from "./routes/UserRoutes";
import { adminRoutes } from "./routes/AdminRoutes";
import { sellerRoutes } from "./routes/SellerRoutes.jsx";
import DashboardPage from "./features/admin/pages/DashboardPage";
import SettingsPage from "./features/admin/pages/Setting/SettingsPage";
import AccountPage from "./features/admin/pages/Setting/AccountPage";
import AdminLayout from "./features/admin/components/AdminLayout";
import RolesPage from "./features/admin/pages/Setting/RolesPage";
import SystemConfigPage from "./features/admin/pages/Setting/SystemConfigPage";
import SystemLogsPage from "./features/admin/pages/Setting/SystemLogsPage";
import ProfilePage from "./features/admin/pages/Users/ProfilePage";
import ChangePasswordPage from "./features/admin/pages/Users/ChangePasswordPage";

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

              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<DashboardPage />} /> // /admin
                <Route path="dashboard" element={<DashboardPage />} /> //
                /admin/dashboard
                <Route path="settings" element={<SettingsPage />} /> //
                /admin/settings
                <Route path="account" element={<AccountPage />} /> //
                /admin/account
                <Route path="roles" element={<RolesPage />} /> // nếu bạn tạo
                page
                <Route path="system-config" element={<SystemConfigPage />} />
                <Route path="system-logs" element={<SystemLogsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route
                  path="change-password"
                  element={<ChangePasswordPage />}
                />
              </Route>
            </Routes>
          </BannerProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
