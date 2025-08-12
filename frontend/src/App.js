import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import DashboardPage from "./features/admin/pages/DashboardPage";
import UsersPage from "./features/admin/pages/UsersPage";
import ShopsPage from "./features/admin/pages/ShopsPage";
import ProductsPage from "./features/admin/pages/ProductsPage";
import OrdersPage from "./features/admin/pages/OrdersPage";
import ComplaintsPage from "./features/admin/pages/ComplaintsPage";
import VouchersPage from "./features/admin/pages/VouchersPage";
import WalletPage from "./features/admin/pages/WalletPage";
import BannersPage from "./features/admin/pages/BannersPage";
import NotificationsPage from "./features/admin/pages/NotificationsPage";
import StaffPage from "./features/admin/pages/StaffPage";
import ReportsPage from "./features/admin/pages/ReportsPage";
import AdminLayout from "./features/admin/components/AdminLayout";
import CartPage from "./features/cart/pages/CartPage";
import "./App.css";
import Layout from "./layouts/layout"; // Sử dụng layout có Header/Footer
import UserProductPage from './features/products/pages/UserProductPage';
import ProductDetailPage from './features/products/pages/ProductDetailPage';
import { CartProvider } from "./features/cart/services/CartContext";
import UserProfile from "./features/login_register/pages/UserProfile";
import LoginForm from "./features/login_register/pages/LoginForm";
import ManageStore from "./features/login_register/pages/ManageStore";
import CheckoutPage from './features/cart/pages/CheckoutPage';
import Orders from './features/orders/pages/Orders';
import PrivateRoute from "./features/login_register/components/PrivateRoute";
import ProfilePage from "./features/users/pages/ProfilePage";
import StoreList from './features/stores/pages/StoreList';
import StoreDetail from './features/stores/pages/StoreDetail';

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
            <Route path="store" element={<StoreList />} />
            <Route path="store/:id" element={<StoreDetail />} />
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
    </BrowserRouter>
  );
}

export default App;
