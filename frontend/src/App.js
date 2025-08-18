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
import { AuthProvider } from "./features/login_register/services/AuthContext";
import UserProfile from "./features/login_register/pages/UserProfile";
import LoginForm from "./features/login_register/pages/LoginForm";
import ManageStore from "./features/login_register/pages/ManageStore";
import CheckoutPage from './features/cart/pages/CheckoutPage';
import Orders from './features/orders/pages/Orders';
import PrivateRoute from "./features/login_register/components/PrivateRoute";
import AdminPrivateRoute from "./features/login_register/components/AdminPrivateRoute";
import ProfilePage from "./features/users/pages/ProfilePage";
import BlogHome from './pages/Blog/BlogHome';
import BlogDetail from './pages/Blog/BlogDetail';
import StoreList from './features/stores/pages/StoreList';
import StoreDetail from './features/stores/pages/StoreDetail';
import AboutPage from "./pages/about/about";
import SupportPage from "./features/admin/pages/SupportPage";

import ShopLayout from "./features/admin/components/ShopAdmin/ShopLayout";
import ShopPrivateRoute from "./features/login_register/components/ShopPrivateRoute";
import ShopDashboardPage from "./features/admin/pages/ShopAdmin/ShopDashboardPage";
import ShopProductsPage from "./features/admin/pages/ShopAdmin/ShopProductsPage";
import ShopOrdersPage from "./features/admin/pages/ShopAdmin/ShopOrdersPage";
import ShopCustomersPage from "./features/admin/pages/ShopAdmin/ShopCustomersPage";
import ShopVouchersPage from "./features/admin/pages/ShopAdmin/ShopVouchersPage";
import ShopWalletPage from "./features/admin/pages/ShopAdmin/ShopWalletPage";
import ShopReportsPage from "./features/admin/pages/ShopAdmin/ShopReportsPage";


function App() {
  return (
    <BrowserRouter> {/* ✅ Đây là wrapper bên ngoài */}
      <AuthProvider> {/* ✅ Auth context wrapper */}
        <CartProvider> {/* ✅ Bên trong, có thể dùng useLocation */}
          <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="/blog" element={<BlogHome />} />
            <Route path="/blog/:slug" element={<BlogDetail />} />
            <Route element={<PrivateRoute />}>
              <Route path="me" element={<UserProfile />} />
              <Route path="orders" element={<Orders />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="profile/" element={<ProfilePage />} />
            </Route>
            <Route path="abouts" element={<AboutPage/>} />
            <Route path="productuser" element={<UserProductPage />} />
            <Route path="products/:id" element={<ProductDetailPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="manage-products" element={<ManageStore />} />
            <Route path="store" element={<StoreList />} />
            <Route path="store/:id" element={<StoreDetail />} />
          </Route>
          {/* Admin routes with authentication protection */}
          <Route element={<AdminPrivateRoute />}>
            <Route path="/admin/" element={<AdminLayout />}>
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
              <Route path="supports" element={<SupportPage />} />
            </Route>
          </Route>
          <Route element={<ShopPrivateRoute />}>
            <Route path="/ShopAdmin/" element={<ShopLayout />}>
              <Route index element={<ShopDashboardPage />} />
              <Route path="products" element={<ShopProductsPage />} />
              <Route path="orders" element={<ShopOrdersPage />} />
              <Route path="customers" element={<ShopCustomersPage />} />
              <Route path="vouchers" element={<ShopVouchersPage />} />
              <Route path="wallet" element={<ShopWalletPage />} />
              <Route path="reports" element={<ShopReportsPage />} />
            </Route>
          </Route>
          <Route path="/login" element={<LoginForm />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;