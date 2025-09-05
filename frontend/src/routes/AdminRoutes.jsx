import { Route } from "react-router-dom";
import AdminLayout from "../features/admin/components/AdminLayout";
import AdminPrivateRoute from "../components/PrivateRoutes/AdminPrivateRoute.jsx";
import DashboardPage from "../features/admin/pages/DashboardPage";
import UsersPage from "../features/admin/pages/UsersPage";
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
import ActiveLockedSellersPage from "../features/admin/pages/ShopPage/ActiveLockedSellersPage.jsx.jsx";
import ApprovalSellersPage from "../features/admin/pages/ShopPage/ApprovalSellersPage.jsx";
import ApprovalProductsPage from "../features/admin/pages/ProductPage/ApprovalProductsPage.jsx";
import CategoryManagementPage from "../features/admin/pages/ProductPage/CategoryManagement.jsx";
import UserReports from "../features/admin/pages/ComplaintAdmin/UserReports.jsx";
import Coupons from "../features/admin/pages/ComplaintAdmin/Coupons.jsx";

export const adminRoutes = [
  <Route element={<AdminPrivateRoute />} key="admin-protect">
    <Route path="/admin" element={<AdminLayout />}>
      <Route index element={<DashboardPage />} />
      <Route path="users" element={<UsersPage />} />
      {/* Shop management */}
      <Route path="sellers/business" element={<ActiveLockedSellersPage />} />
      <Route path="sellers/approval" element={<ApprovalSellersPage />} />
      {/* Product management */}
      <Route path="products/approval" element={<ApprovalProductsPage />} />
      <Route path="products/categories" element={<CategoryManagementPage />} />
       {/* Complaint management */}
      <Route path="/admin/complaints/user-reports" element={<UserReports />} />
       {/* Complaint Coupons */}
  <Route path="/admin/promotions/coupons" element={<Coupons />} />

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
