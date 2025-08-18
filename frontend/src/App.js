import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./features/login_register/services/AuthContext";
import { CartProvider } from "./features/cart/services/CartContext";
import LoginForm from "./features/login_register/pages/LoginForm";
<<<<<<< HEAD
import { userRoutes } from "./routes/UserRoutes";
import { adminRoutes } from "./routes/AdminRoutes";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/login" element={<LoginForm />} />
            {userRoutes}
            {adminRoutes}
          </Routes>
        </CartProvider>
      </AuthProvider>
=======
import ManageStore from "./features/login_register/pages/ManageStore";
import CheckoutPage from './features/cart/pages/CheckoutPage';
import Orders from './features/orders/pages/Orders';
import PrivateRoute from "./features/login_register/components/PrivateRoute";
import ProfilePage from "./features/users/pages/ProfilePage";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Security from "./pages/Security";
import Addresses from "./pages/Addresses";
import UpdateAvatar from "./pages/UpdateAvatar";
import OrderHistory from "./pages/OrderHistory";
import NotificationSettings from "./pages/NotificationSettings";
import DeleteAccount from "./pages/DeleteAccount";

function App() {
  return (
    <BrowserRouter> {/* ✅ Đây là wrapper bên ngoài */}
      <CartProvider> {/* ✅ Bên trong, có thể dùng useLocation */}
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route element={<PrivateRoute />}>
              <Route path="me" element={<UserProfile />} />
              <Route path="orders" element={<Orders />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="profile/" element={<ProfilePage />} />
            </Route>
            <Route path="productuser" element={<UserProductPage />} />
            <Route path="products/:id" element={<ProductDetailPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="manage-products" element={<ManageStore />} />
            <Route path="wishlist" element={<Wishlist />} />

            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
            <Route path="security" element={<Security />} />
            <Route path="addresses" element={<Addresses />} />
            <Route path="update-avatar" element={<UpdateAvatar />} />
            <Route path="order-history" element={<OrderHistory />} />
            <Route path="notifications-settings" element={<NotificationSettings />} />
            <Route path="delete-account" element={<DeleteAccount />} />

          </Route>
          {/* Admin routes with layout */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="shops" element={<ShopsPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="complaints" element={<ComplaintsPage />} />
            <Route path="vouchers" element={<VouchersPage />} />
            <Route path="wallet" element={<WalletPage />} />
            <Route path="banners" element={<BannersPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="staff" element={<StaffPage />} />
            <Route path="reports" element={<ReportsPage />} />
          </Route>
          <Route path="/login" element={<LoginForm />} />
        </Routes>
      </CartProvider>
>>>>>>> origin/feature/TriThuc
    </BrowserRouter>
  );
}

export default App;
