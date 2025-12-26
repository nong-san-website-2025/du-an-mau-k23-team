import React, { lazy, Suspense } from "react";
import { Route } from "react-router-dom";
import { Spin } from "antd";
import AdminLayout from "../features/admin/components/AdminLayout";
import AdminPrivateRoute from "../components/PrivateRoutes/AdminPrivateRoute.jsx";

// 1. Loading component
const LoadingScreen = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
    <Spin size="large" tip="Đang tải trang..." />
  </div>
);

// 2. Helper function để bọc Suspense tự động
const load = (Component) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component />
  </Suspense>
);

// 3. Lazy Imports (Đã giải quyết xung đột và đồng bộ tất cả về lazy load)
const DashboardPage = lazy(() => import("../features/admin/pages/DashboardPage"));
const UsersPage = lazy(() => import("../features/admin/pages/UsersPage"));
const ProfilePage = lazy(() => import("../features/admin/pages/Users/ProfilePage"));
const ChangePasswordPage = lazy(() => import("../features/admin/pages/Users/ChangePasswordPage"));
const OrdersPage = lazy(() => import("../features/admin/pages/OrdersPage"));
const ComplaintsPage = lazy(() => import("../features/admin/pages/ComplaintsPage"));
const UserReports = lazy(() => import("../features/admin/pages/ComplaintAdmin/UserReports.jsx"));
const Coupons = lazy(() => import("../features/admin/pages/ComplaintAdmin/Coupons.jsx"));
const ReviewsPage = lazy(() => import("../features/admin/pages/ReviewsPage"));
const VouchersPage = lazy(() => import("../features/admin/pages/VouchersPage"));
const WalletPage = lazy(() => import("../features/admin/pages/WalletPage"));
const NotificationsPage = lazy(() => import("../pages/NotificationsPage.jsx"));
const MarketingAdminPage = lazy(() => import('../features/admin/pages/MarketingAdmin/AdminMarketingPage'));
const AdminBlogs = lazy(() => import("../features/admin/pages/BlogAdmin/AdminBlogs.jsx"));
const Promotions = lazy(() => import("../features/admin/pages/Promotions/PromotionsPage.jsx"));
const FlashSale = lazy(() => import("../features/admin/pages/Promotions/FlashSalePage.jsx"));
const PromotionUse = lazy(() => import("../features/admin/pages/Promotions/PromotionUse.jsx")); 
const ReportsPage = lazy(() => import("../features/admin/pages/ReportsPage"));
const ReportRevenuePage = lazy(() => import("../features/admin/pages/StatisticAdmin/ReportRevenuePage.jsx"));
const ReportProductsPage = lazy(() => import("../features/admin/pages/StatisticAdmin/ReportProductsPage.jsx"));  
const ReportCancelRatePage = lazy(() => import("../features/admin/pages/StatisticAdmin/ReportCancelRatePage.jsx"));
const ReportCustomersPage = lazy(() => import("../features/admin/pages/StatisticAdmin/ReportCustomersPage.jsx"));
const ReportAgriculturePage = lazy(() => import("../features/admin/pages/StatisticAdmin/ReportAgriculturePage.jsx"));
const ReportOrdersPage = lazy(() => import("../features/admin/pages/StatisticAdmin/ReportOrdersPage.jsx"));
const StatisticsPage = lazy(() => import("../features/admin/pages/StatisticsPage"));
const SellersPage = lazy(() => import("../features/admin/pages/Sellers/SellersPage"));
const ActiveLockedSellersPage = lazy(() => import("../features/admin/pages/SellerPage/ActiveLockedSellersPage.jsx")); 
const ApprovalSellersPage = lazy(() => import("../features/admin/pages/SellerPage/ApprovalSellersPage.jsx"));
const ApprovalProductsPage = lazy(() => import("../features/admin/pages/ProductAdmin/ApprovalProductsPage.jsx"));
const CategoryManagementPage = lazy(() => import("../features/admin/pages/ProductAdmin/CategoryManagement.jsx"));

// Settings (Đã fix conflict: chuyển tất cả sang lazy để đồng bộ hiệu suất)
const ShippingSettingsPage = lazy(() => import("../features/admin/pages/Setting/ShippingSettingsPage"));
const ReturnPolicyPage = lazy(() => import("../features/admin/pages/Setting/ReturnPolicyPage"));
const MarketingAutomationPage = lazy(() => import("../features/admin/pages/Setting/MarketingAutomationPage"));
const LoyaltySettingsPage = lazy(() => import("../features/admin/pages/Setting/LoyaltySettingsPage"));
const ThemeSettingsPage = lazy(() => import("../features/admin/pages/Setting/ThemeSettingsPage"));
const StaticPagesAdmin = lazy(() => import("../features/admin/pages/ContentAdmin/StaticPagesAdmin.jsx"));

// 4. Định nghĩa Route
export const adminRoutes = [
  <Route element={<AdminPrivateRoute />} key="admin-protect">
    <Route path="/admin" element={<AdminLayout />}>
      <Route index element={load(DashboardPage)} />
      <Route path="dashboard" element={load(DashboardPage)} />

      {/* Users */}
      <Route path="users" element={load(UsersPage)} />
      <Route path="profile" element={load(ProfilePage)} />
      <Route path="change-password" element={load(ChangePasswordPage)} />

      {/* Orders & Complaints */}
      <Route path="orders" element={load(OrdersPage)} />
      <Route path="orders/:id" element={load(OrdersPage)} />
      <Route path="complaints" element={load(ComplaintsPage)} />
      <Route path="complaints/user-reports" element={load(UserReports)} />
      <Route path="reviews" element={load(ReviewsPage)} />

      {/* Vouchers & Wallet */}
      <Route path="vouchers" element={load(VouchersPage)} />
      <Route path="payments/wallets" element={load(WalletPage)} />

      {/* Marketing & Promotions */}
      <Route path="notifications" element={load(NotificationsPage)} />
      <Route path="promotions" element={load(Promotions)} />
      <Route path="promotions/usage" element={load(PromotionUse)} />
      <Route path="promotions/flashsale" element={load(FlashSale)} />
      <Route path="marketing/banners" element={load(MarketingAdminPage)} />
      <Route path="marketing/blogs" element={load(AdminBlogs)} />
      <Route path="promotions/coupons" element={load(Coupons)} />

      {/* Content: GreenFarm & Chính Sách */}
      <Route path="content/pages" element={load(StaticPagesAdmin)} />

      {/* Reports */}
      <Route path="reports" element={load(ReportsPage)} />
      <Route path="revenue" element={load(ReportRevenuePage)} />
      <Route path="reports/products" element={load(ReportProductsPage)} />
      <Route path="reports/cancel-rate" element={load(ReportCancelRatePage)} />
      <Route path="reports/customers" element={load(ReportCustomersPage)} />
      <Route path="reports/agriculture" element={load(ReportAgriculturePage)} />
      <Route path="reports/orders" element={load(ReportOrdersPage)} />

      {/* Support & Statistics */}
      <Route path="statistics" element={load(StatisticsPage)} />

      {/* Shop management */}
      <Route path="sellers/business" element={load(ActiveLockedSellersPage)} />
      <Route path="sellers/approval" element={load(ApprovalSellersPage)} />
      <Route path="sellers/pending" element={load(SellersPage)} />
      <Route path="products/approval" element={load(ApprovalProductsPage)} />
      <Route path="products/categories" element={load(CategoryManagementPage)} />

      {/* Settings */}
      <Route path="settings/shipping" element={load(ShippingSettingsPage)} />
      <Route path="settings/return-policy" element={load(ReturnPolicyPage)} />
      <Route path="settings/marketing" element={load(MarketingAutomationPage)} />
      <Route path="settings/loyalty" element={load(LoyaltySettingsPage)} />
      <Route path="settings/theme" element={load(ThemeSettingsPage)} />

      <Route path="test-ui" element={load(NotificationsPage)} />
    </Route>
  </Route>,
];