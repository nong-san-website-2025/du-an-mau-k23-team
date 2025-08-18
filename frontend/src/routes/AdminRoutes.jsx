import { Route } from "react-router-dom";
import AdminLayout from "../features/admin/components/AdminLayout";
import AdminPrivateRoute from "../features/login_register/components/AdminPrivateRoute";
import DashboardPage from "../features/admin/pages/DashboardPage";
import UsersPage from "../features/admin/pages/UsersPage";
import ShopsPage from "../features/admin/pages/ShopsPage";
import ProductsPage from "../features/admin/pages/ProductsPage";
import OrdersPage from "../features/admin/pages/OrdersPage";
import ComplaintsPage from "../features/admin/pages/ComplaintsPage";
import VouchersPage from "../features/admin/pages/VouchersPage";
import WalletPage from "../features/admin/pages/WalletPage";
import BannersPage from "../features/admin/pages/BannersPage";
import NotificationsPage from "../features/admin/pages/NotificationsPage";
import StaffPage from "../features/admin/pages/StaffPage";
import ReportsPage from "../features/admin/pages/ReportsPage";
import SupportPage from "../features/admin/pages/SupportPage";
import SellersPage from "../features/admin/pages/Sellers/SellersPage";

export const adminRoutes = [
  <Route element={<AdminPrivateRoute />} key="admin-protect">
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
      <Route path="supports" element={<SupportPage />} />
      <Route path="sellers/pending" element={<SellersPage />} />
    </Route>
  </Route>
];
