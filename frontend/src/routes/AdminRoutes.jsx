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
import ReportRevenuePage from "../features/admin/pages/ReportRevenuePage";  
import ReportTopProductsPage from "../features/admin/pages/ReportTopProductsPage.jsx";
import ReportCancelRatePage from "../features/admin/pages/ReportCancelRatePage.jsx"; // ✅ thêm import
import SupportPage from "../features/admin/pages/SupportPage";
import StatisticsPage from "../features/admin/pages/StatisticsPage";
import SettingsPage from "../features/admin/pages/SettingsPage";

// Shop management
import SellersPage from "../features/admin/pages/Sellers/SellersPage";
import ActiveLockedSellersPage from "../features/admin/pages/ShopPage/ActiveLockedSellersPage.jsx.jsx";
import ApprovalSellersPage from "../features/admin/pages/ShopPage/ApprovalSellersPage.jsx";
import ApprovalProductsPage from "../features/admin/pages/ProductPage/ApprovalProductsPage.jsx";
import CategoryManagementPage from "../features/admin/pages/ProductPage/CategoryManagement.jsx";
import Promotions from "../features/admin/pages/Promotions/PromotionsPage.jsx";
import FlashSale from "../features/admin/pages/Promotions/AdminFlashSalePanelPage.jsx";
import AdvertisementList from "../features/admin/pages/MarketingAdmin/AdvertisementList.jsx";
// import StatisticsPage from "../features/admin/pages/StatisticsPage";
import AccountPage from "../features/admin/pages/Setting/AccountPage";
import RolesPage from "../features/admin/pages/Setting/RolesPage";
import SystemConfigPage from "../features/admin/pages/Setting/SystemConfigPage";
import SystemLogsPage from "../features/admin/pages/Setting/SystemLogsPage";
import ProfilePage from "../features/admin/pages/Users/ProfilePage";
import ChangePasswordPage from "../features/admin/pages/Users/ChangePasswordPage";


// Complaints & Promotions
import UserReports from "../features/admin/pages/ComplaintAdmin/UserReports.jsx";
import Coupons from "../features/admin/pages/ComplaintAdmin/Coupons.jsx";

export const adminRoutes = [
  <Route element={<AdminPrivateRoute />} key="admin-protect">
    <Route path="/admin" element={<AdminLayout />}>
      {/* Dashboard */}
      <Route index element={<DashboardPage />} />

      {/* Users */}
      <Route path="users" element={<UsersPage />} />
      {/* Shop management */}
      <Route path="sellers/business" element={<ActiveLockedSellersPage />} />
      <Route path="sellers/approval" element={<ApprovalSellersPage />} />
      {/* Product management */}
      <Route path="products/approval" element={<ApprovalProductsPage />} />
      <Route path="products/categories" element={<CategoryManagementPage />} />

      {/* Complaint management */}
      <Route path="/admin/complaints/user-reports" element={<UserReports />} />

      {/* Promotions */}
      <Route path="/admin/promotions/coupons" element={<Coupons />} />

      {/* Other features */}
      <Route path="orders" element={<OrdersPage />} />
      <Route path="complaints" element={<ComplaintsPage />} />
      <Route path="vouchers" element={<VouchersPage />} />
      <Route path="wallet" element={<WalletPage />} />
      <Route path="banners" element={<BannersPage />} />
      <Route path="notifications" element={<NotificationsPage />} />
      <Route path="staff" element={<StaffPage />} />
      <Route path="reports" element={<ReportsPage />} />
      <Route path="supports" element={<SupportPage />} />
      {/* New pages */}
      {/* <Route path="statistics" element={<StatisticsPage />} />
      <Route path="settings" element={<SettingsPage />} /> */}
      <Route path="sellers/pending" element={<SellersPage />} />
      <Route path="promotions/" element={<Promotions />} />
      <Route path="promotions/flashsale" element={<FlashSale />} />
      {/* Marketing pages */}
      <Route path="marketing/banners" element={<AdvertisementList />} />
      <Route index element={<DashboardPage />} /> {/* /admin */}
      <Route path="dashboard" element={<DashboardPage />} />{" "}
      {/* /admin/dashboard */}
      <Route path="settings" element={<SettingsPage />} />{" "}
      {/* /admin/settings */}
      <Route path="account" element={<AccountPage />} /> {/* /admin/account */}
      <Route path="roles" element={<RolesPage />} /> {/* /admin/roles */}
      <Route path="system-config" element={<SystemConfigPage />} />{" "}
      {/* /admin/system-config */}
      <Route path="system-logs" element={<SystemLogsPage />} />{" "}
      {/* /admin/system-logs */}
      <Route path="profile" element={<ProfilePage />} /> {/* /admin/profile */}
      <Route path="change-password" element={<ChangePasswordPage />} />{" "}
      {/* /admin/change-password */}
      <Route path="reports/revenue" element={<ReportRevenuePage />} />
      <Route path="reports/top-products" element={<ReportTopProductsPage />} />
      <Route path="reports/cancel-rate" element={<ReportCancelRatePage />} /> {/* ✅ route mới */}

      {/* Support */}
      <Route path="supports" element={<SupportPage />} />

      {/* Other pages */}
      <Route path="statistics" element={<StatisticsPage />} />
      <Route path="settings" element={<SettingsPage />} />
    </Route>
  </Route>,
];
