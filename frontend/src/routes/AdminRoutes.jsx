import { Route } from "react-router-dom";
import AdminLayout from "../features/admin/components/AdminLayout.jsx";
import AdminPrivateRoute from "../components/PrivateRoutes/AdminPrivateRoute.jsx";

// Admin pages
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
import ReportRevenuePage from "../features/admin/pages/ReportRevenuePage";  // ✅ thêm ở đây
import SupportPage from "../features/admin/pages/SupportPage";
import StatisticsPage from "../features/admin/pages/StatisticsPage";
import SettingsPage from "../features/admin/pages/SettingsPage";
import ReportTopProductsPage from "../features/admin/pages/ReportTopProductsPage.jsx";


// Shop management
import SellersPage from "../features/admin/pages/Sellers/SellersPage";
import ActiveLockedSellersPage from "../features/admin/pages/ShopPage/ActiveLockedSellersPage.jsx";
import ApprovalSellersPage from "../features/admin/pages/ShopPage/ApprovalSellersPage.jsx";

// Product management
import ApprovalProductsPage from "../features/admin/pages/ProductPage/ApprovalProductsPage.jsx";
import CategoryManagementPage from "../features/admin/pages/ProductPage/CategoryManagement.jsx";
import UserReports from "../features/admin/pages/ComplaintAdmin/UserReports.jsx";
import Coupons from "../features/admin/pages/ComplaintAdmin/Coupons.jsx";
import Promotions from "../features/admin/pages/Promotions/Promotionsall.jsx";
import FlashSale from "../features/admin/pages/Promotions/FlashSale.jsx";

export const adminRoutes = [
  <Route element={<AdminPrivateRoute />} key="admin-protect">
    <Route path="/admin" element={<AdminLayout />}>
      <Route index element={<DashboardPage />} />
      <Route path="users" element={<UsersPage />} />

      {/* Shop management */}
      <Route path="sellers/business" element={<ActiveLockedSellersPage />} />
      <Route path="sellers/approval" element={<ApprovalSellersPage />} />
      <Route path="sellers/pending" element={<SellersPage />} />

      {/* Product management */}
      <Route path="products/approval" element={<ApprovalProductsPage />} />
      <Route path="products/categories" element={<CategoryManagementPage />} />
       {/* Complaint management */}
      <Route path="/admin/complaints/user-reports" element={<UserReports />} />
       {/* Complaint Coupons */}
  <Route path="/admin/promotions/coupons" element={<Coupons />} />

      {/* Other features */}
      <Route path="orders" element={<OrdersPage />} />
      <Route path="complaints" element={<ComplaintsPage />} />
      <Route path="vouchers" element={<VouchersPage />} />
      <Route path="wallet" element={<WalletPage />} />
      <Route path="banners" element={<BannersPage />} />
      <Route path="notifications" element={<NotificationsPage />} />
      <Route path="staff" element={<StaffPage />} />

      {/* Reports */}
      <Route path="reports" element={<ReportsPage />} />
      <Route path="report-revenue" element={<ReportRevenuePage />} /> {/* ✅ thêm route con */}
      <Route path="report-top-products" element={<ReportTopProductsPage />} />
      <Route path="supports" element={<SupportPage />} />

      {/* New pages */}
      <Route path="statistics" element={<StatisticsPage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="sellers/pending" element={<SellersPage />} />
      <Route path="promotions/" element={<Promotions />} />
      <Route path="promotions/flashsale" element={<FlashSale />} />
    </Route>
  </Route>
];
