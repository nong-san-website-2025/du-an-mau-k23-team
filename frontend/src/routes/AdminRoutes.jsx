import { Route } from "react-router-dom";
import AdminLayout from "../features/admin/components/AdminLayout";
import AdminPrivateRoute from "../components/PrivateRoutes/AdminPrivateRoute.jsx";

// Dashboard
import DashboardPage from "../features/admin/pages/DashboardPage";

// Users & Staff
import UsersPage from "../features/admin/pages/UsersPage";
import ProfilePage from "../features/admin/pages/Users/ProfilePage";
import ChangePasswordPage from "../features/admin/pages/Users/ChangePasswordPage";
import StaffPage from "../features/admin/pages/StaffPage";

// Orders & Complaints
import OrdersPage from "../features/admin/pages/OrdersPage";
import ComplaintsPage from "../features/admin/pages/ComplaintsPage";
import UserReports from "../features/admin/pages/ComplaintAdmin/UserReports.jsx";
import Coupons from "../features/admin/pages/ComplaintAdmin/Coupons.jsx";

// Vouchers & Wallet
import VouchersPage from "../features/admin/pages/VouchersPage";
import WalletPage from "../features/admin/pages/WalletPage";

// Marketing & Promotions
<<<<<<< HEAD
import NotificationsPage from "../pages/NotificationsPage.jsx";
=======
import BannersPage from "../features/admin/pages/BannersPage";
import NotificationsPage from "../features/admin/pages/NotificationsPage.jsx"; // ✅ fix path
import AdvertisementList from "../features/admin/pages/MarketingAdmin/AdvertisementList.jsx";
>>>>>>> origin/TungDuong

// Reports
import ReportsPage from "../features/admin/pages/ReportsPage";
import ReportRevenuePage from "../features/admin/pages/ReportRevenuePage";
import ReportProductsPage from "../features/admin/pages/ReportProductsPage";  
import ReportCancelRatePage from "../features/admin/pages/ReportCancelRatePage";
import ReportCustomersPage from "../features/admin/pages/ReportCustomersPage";
import ReportAgriculturePage from "../features/admin/pages/ReportAgriculturePage";
import ReportOrdersPage from "../features/admin/pages/ReportOrdersPage";





// Support & Statistics
import SupportPage from "../features/admin/pages/SupportPage";
import StatisticsPage from "../features/admin/pages/StatisticsPage";

// Shop management
import SellersPage from "../features/admin/pages/Sellers/SellersPage";
import ActiveLockedSellersPage from "../features/admin/pages/ShopPage/ActiveLockedSellersPage.jsx"; // ✅ bỏ .jsx thừa
import ApprovalSellersPage from "../features/admin/pages/ShopPage/ApprovalSellersPage.jsx";
import ApprovalProductsPage from "../features/admin/pages/ProductPage/ApprovalProductsPage.jsx";
import CategoryManagementPage from "../features/admin/pages/ProductPage/CategoryManagement.jsx";
import Promotions from "../features/admin/pages/Promotions/PromotionsPage.jsx";
import FlashSale from "../features/admin/pages/Promotions/FlashSalePage.jsx";

// ✅ Settings (5 chức năng mới)
import ShippingSettingsPage from "../features/admin/pages/Setting/ShippingSettingsPage";
import ReturnPolicyPage from "../features/admin/pages/Setting/ReturnPolicyPage";
import MarketingAutomationPage from "../features/admin/pages/Setting/MarketingAutomationPage";
import LoyaltySettingsPage from "../features/admin/pages/Setting/LoyaltySettingsPage";
import ThemeSettingsPage from "../features/admin/pages/Setting/ThemeSettingsPage";
import MarketingAdminPage from './../features/admin/pages/MarketingAdmin/AdminMarketingPage';

export const adminRoutes = [
  <Route element={<AdminPrivateRoute />} key="admin-protect">
    <Route path="/admin" element={<AdminLayout />}>
      {/* Dashboard */}
      <Route index element={<DashboardPage />} />
      <Route path="dashboard" element={<DashboardPage />} />

      {/* Users */}
      <Route path="users" element={<UsersPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="change-password" element={<ChangePasswordPage />} />

      {/* Staff */}
      <Route path="staff" element={<StaffPage />} />

      {/* Orders & Complaints */}
      <Route path="orders" element={<OrdersPage />} />
      <Route path="complaints" element={<ComplaintsPage />} />
      <Route path="complaints/user-reports" element={<UserReports />} />

      {/* Vouchers & Wallet */}
      <Route path="vouchers" element={<VouchersPage />} />
      <Route path="wallet" element={<WalletPage />} />

      {/* Marketing & Promotions */}
      <Route path="notifications" element={<NotificationsPage />} />
      <Route path="promotions" element={<Promotions />} />
      <Route path="promotions/flashsale" element={<FlashSale />} />
      <Route path="marketing/banners" element={<MarketingAdminPage />} />
      <Route path="promotions/coupons" element={<Coupons />} />

      {/* Reports */}
      <Route path="reports" element={<ReportsPage />} />
      <Route path="reports/revenue" element={<ReportRevenuePage />} />
      <Route path="reports/products" element={<ReportProductsPage />} />
      <Route path="reports/cancel-rate" element={<ReportCancelRatePage />} />
      <Route path="reports/customers" element={<ReportCustomersPage />} />
      <Route path="reports/agriculture" element={<ReportAgriculturePage />} />
      <Route path="reports/orders" element={<ReportOrdersPage />} />   {/* ✅ thêm */}


      {/* Support & Statistics */}
      <Route path="supports" element={<SupportPage />} />
      <Route path="statistics" element={<StatisticsPage />} />

      {/* Shop management */}
      <Route path="sellers/business" element={<ActiveLockedSellersPage />} />
      <Route path="sellers/approval" element={<ApprovalSellersPage />} />
      <Route path="sellers/pending" element={<SellersPage />} />
      <Route path="products/approval" element={<ApprovalProductsPage />} />
      <Route path="products/categories" element={<CategoryManagementPage />} />

      {/* ✅ Settings routes */}
      <Route path="settings/shipping" element={<ShippingSettingsPage />} />
      <Route path="settings/return-policy" element={<ReturnPolicyPage />} />
      <Route path="settings/marketing" element={<MarketingAutomationPage />} />
      <Route path="settings/loyalty" element={<LoyaltySettingsPage />} />
      <Route path="settings/theme" element={<ThemeSettingsPage />} />
    </Route>
  </Route>,
];
