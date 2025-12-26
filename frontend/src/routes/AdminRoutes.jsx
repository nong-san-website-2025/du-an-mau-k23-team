import React, { lazy, Suspense } from "react";
import { Route } from "react-router-dom";
import AdminLayout from "../features/admin/components/AdminLayout";
import AdminPrivateRoute from "../components/PrivateRoutes/AdminPrivateRoute.jsx";
import { Spin } from "antd";

// Loading component
const LoadingScreen = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
    <Spin size="large" tip="Đang tải trang..." />
  </div>
);

// Dashboard
const DashboardPage = lazy(() => import("../features/admin/pages/DashboardPage"));

// Users & Staff
const UsersPage = lazy(() => import("../features/admin/pages/UsersPage"));
const ProfilePage = lazy(() => import("../features/admin/pages/Users/ProfilePage"));
const ChangePasswordPage = lazy(() => import("../features/admin/pages/Users/ChangePasswordPage"));

// Orders & Complaints
const OrdersPage = lazy(() => import("../features/admin/pages/OrdersPage"));
const ComplaintsPage = lazy(() => import("../features/admin/pages/ComplaintsPage"));
const UserReports = lazy(() => import("../features/admin/pages/ComplaintAdmin/UserReports.jsx"));
const Coupons = lazy(() => import("../features/admin/pages/ComplaintAdmin/Coupons.jsx"));
const ReviewsPage = lazy(() => import("../features/admin/pages/ReviewsPage"));

// Vouchers & Wallet
const VouchersPage = lazy(() => import("../features/admin/pages/VouchersPage"));
const WalletPage = lazy(() => import("../features/admin/pages/WalletPage"));

// Marketing & Promotions
const NotificationsPage = lazy(() => import("../pages/NotificationsPage.jsx"));
const MarketingAdminPage = lazy(() => import('../features/admin/pages/MarketingAdmin/AdminMarketingPage'));
const AdminBlogs = lazy(() => import("../features/admin/pages/BlogAdmin/AdminBlogs.jsx"));
const Promotions = lazy(() => import("../features/admin/pages/Promotions/PromotionsPage.jsx"));
const FlashSale = lazy(() => import("../features/admin/pages/Promotions/FlashSalePage.jsx"));
const PromotionUse = lazy(() => import("../features/admin/pages/Promotions/PromotionUse.jsx")); 

// Reports
const ReportsPage = lazy(() => import("../features/admin/pages/ReportsPage"));
const ReportRevenuePage = lazy(() => import("../features/admin/pages/StatisticAdmin/ReportRevenuePage.jsx"));
const ReportProductsPage = lazy(() => import("../features/admin/pages/StatisticAdmin/ReportProductsPage.jsx"));  
const ReportCancelRatePage = lazy(() => import("../features/admin/pages/StatisticAdmin/ReportCancelRatePage.jsx"));
const ReportCustomersPage = lazy(() => import("../features/admin/pages/StatisticAdmin/ReportCustomersPage.jsx"));
const ReportAgriculturePage = lazy(() => import("../features/admin/pages/StatisticAdmin/ReportAgriculturePage.jsx"));
const ReportOrdersPage = lazy(() => import("../features/admin/pages/StatisticAdmin/ReportOrdersPage.jsx"));

const StatisticsPage = lazy(() => import("../features/admin/pages/StatisticsPage"));

// Shop management
const SellersPage = lazy(() => import("../features/admin/pages/Sellers/SellersPage"));
const ActiveLockedSellersPage = lazy(() => import("../features/admin/pages/SellerPage/ActiveLockedSellersPage.jsx")); 
const ApprovalSellersPage = lazy(() => import("../features/admin/pages/SellerPage/ApprovalSellersPage.jsx"));
const ApprovalProductsPage = lazy(() => import("../features/admin/pages/ProductAdmin/ApprovalProductsPage.jsx"));
const CategoryManagementPage = lazy(() => import("../features/admin/pages/ProductAdmin/CategoryManagement.jsx"));

// Settings
const ShippingSettingsPage = lazy(() => import("../features/admin/pages/Setting/ShippingSettingsPage"));
const ReturnPolicyPage = lazy(() => import("../features/admin/pages/Setting/ReturnPolicyPage"));
const MarketingAutomationPage = lazy(() => import("../features/admin/pages/Setting/MarketingAutomationPage"));
const LoyaltySettingsPage = lazy(() => import("../features/admin/pages/Setting/LoyaltySettingsPage"));
const ThemeSettingsPage = lazy(() => import("../features/admin/pages/Setting/ThemeSettingsPage"));

export const adminRoutes = [
  <Route element={<AdminPrivateRoute />} key="admin-protect">
    <Route path="/admin" element={<AdminLayout />}>
      {/* Bao bọc tất cả các route con trong Suspense */}
      <Route
        index
        element={
          <Suspense fallback={<LoadingScreen />}>
            <DashboardPage />
          </Suspense>
        }
      />
      <Route
        path="dashboard"
        element={
          <Suspense fallback={<LoadingScreen />}>
            <DashboardPage />
          </Suspense>
        }
      />

      {/* Users */}
      <Route
        path="users"
        element={
          <Suspense fallback={<LoadingScreen />}>
            <UsersPage />
          </Suspense>
        }
      />
      <Route
        path="profile"
        element={
          <Suspense fallback={<LoadingScreen />}>
            <ProfilePage />
          </Suspense>
        }
      />
      <Route
        path="change-password"
        element={
          <Suspense fallback={<LoadingScreen />}>
            <ChangePasswordPage />
          </Suspense>
        }
      />

      {/* Orders & Complaints */}
      <Route
        path="orders"
        element={
          <Suspense fallback={<LoadingScreen />}>
            <OrdersPage />
          </Suspense>
        }
      />
      <Route
        path="orders/:id"
        element={
          <Suspense fallback={<LoadingScreen />}>
            <OrdersPage />
          </Suspense>
        }
      />
      <Route
        path="complaints"
        element={
          <Suspense fallback={<LoadingScreen />}>
            <ComplaintsPage />
          </Suspense>
        }
      />
      <Route
        path="complaints/user-reports"
        element={
          <Suspense fallback={<LoadingScreen />}>
            <UserReports />
          </Suspense>
        }
      />
      <Route
        path="reviews"
        element={
          <Suspense fallback={<LoadingScreen />}>
            <ReviewsPage />
          </Suspense>
        }
      />

      {/* Vouchers & Wallet */}
      <Route
        path="vouchers"
        element={
          <Suspense fallback={<LoadingScreen />}>
            <VouchersPage />
          </Suspense>
        }
      />
      <Route
        path="payments/wallets"
        element={
          <Suspense fallback={<LoadingScreen />}>
            <WalletPage />
          </Suspense>
        }
      />

      {/* Marketing & Promotions */}
      <Route
        path="notifications"
        element={
          <Suspense fallback={<LoadingScreen />}>
            <NotificationsPage />
          </Suspense>
        }
      />
      <Route
        path="promotions"
        element={
          <Suspense fallback={<LoadingScreen />}>
            <Promotions />
          </Suspense>
        }
      />
      <Route
        path="promotions/usage"
        element={
          <Suspense fallback={<LoadingScreen />}>
            <PromotionUse />
          </Suspense>
        }
      />
      <Route
        path="promotions/flashsale"
        element={
          <Suspense fallback={<LoadingScreen />}>
            <FlashSale />
          </Suspense>
        }
      />
      <Route
        path="marketing/banners"
        element={
          <Suspense fallback={<LoadingScreen />}>
            <MarketingAdminPage />
          </Suspense>
        }
      />
      <Route
        path="marketing/blogs"
        element={
          <Suspense fallback={<LoadingScreen />}>
            <AdminBlogs />
          </Suspense>
        }
      />
      <Route
        path="promotions/coupons"
        element={
          <Suspense fallback={<LoadingScreen />}>
            <Coupons />
          </Suspense>
        }
      />

      {/* Reports */}
      <Route
        path="reports"
        element={
          <Suspense fallback={<LoadingScreen />}>
            <ReportsPage />
          </Suspense>
        }
      />
      <Route
        path="revenue"
        element={
          <Suspense fallback={<LoadingScreen />}>
            <ReportRevenuePage />
          </Suspense>
        }
      />
      <Route
        path="reports/products"
        element={
          <Suspense fallback={<LoadingScreen />}>
            <ReportProductsPage />
          </Suspense>
        }
      />
      <Route
        path="reports/cancel-rate"
        element={
          <Suspense fallback={<LoadingScreen />}>
            <ReportCancelRatePage />
          </Suspense>
        }
      />
      <Route
        path="reports/customers"
        element={
          <Suspense fallback={<LoadingScreen />}>
            <ReportCustomersPage />
          </Suspense>
        }
      />
      <Route
        path="reports/agriculture"
        element={
          <Suspense fallback={<LoadingScreen />}>
            <ReportAgriculturePage />
          </Suspense>
        }
      />
      <Route
        path="reports/orders"
        element={
          <Suspense fallback={<LoadingScreen />}>
            <ReportOrdersPage />
          </Suspense>
        }
      />

      {/* Support & Statistics */}
      <Route
        path="statistics"
        element={
          <Suspense fallback={<LoadingScreen />}>
            <StatisticsPage />
          </Suspense>
        }
      />

      {/* Shop management */}
      <Route
        path="sellers/business"
        element={
          <Suspense fallback={<LoadingScreen />}>
            <ActiveLockedSellersPage />
          </Suspense>
        }
      />
      <Route
        path="sellers/approval"
        element={
          <Suspense fallback={<LoadingScreen />}>
            <ApprovalSellersPage />
          </Suspense>
        }
      />
      <Route
        path="sellers/pending"
        element={
          <Suspense fallback={<LoadingScreen />}>
            <SellersPage />
          </Suspense>
        }
      />
      <Route
        path="products/approval"
        element={
          <Suspense fallback={<LoadingScreen />}>
            <ApprovalProductsPage />
          </Suspense>
        }
      />
      <Route
        path="products/categories"
        element={
          <Suspense fallback={<LoadingScreen />}>
            <CategoryManagementPage />
          </Suspense>
        }
      />

      {/* Settings routes */}
      <Route
        path="settings/shipping"
        element={
          <Suspense fallback={<LoadingScreen />}>
            <ShippingSettingsPage />
          </Suspense>
        }
      />
      <Route
        path="settings/return-policy"
        element={
          <Suspense fallback={<LoadingScreen />}>
            <ReturnPolicyPage />
          </Suspense>
        }
      />
      <Route
        path="settings/marketing"
        element={
          <Suspense fallback={<LoadingScreen />}>
            <MarketingAutomationPage />
          </Suspense>
        }
      />
      <Route
        path="settings/loyalty"
        element={
          <Suspense fallback={<LoadingScreen />}>
            <LoyaltySettingsPage />
          </Suspense>
        }
      />
      <Route
        path="settings/theme"
        element={
          <Suspense fallback={<LoadingScreen />}>
            <ThemeSettingsPage />
          </Suspense>
        }
      />

      <Route
        path="test-ui"
        element={
          <Suspense fallback={<LoadingScreen />}>
            <NotificationsPage />
          </Suspense>
        }
      />
    </Route>
  </Route>,
];