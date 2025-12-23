import React from "react";
import { Route } from "react-router-dom";
import SellerLayout from "../features/seller_center/components/SellerLayout";
import SellerPrivateRoute from "../components/PrivateRoutes/SellerPrivateRoute";

// Import các component pages cần thiết
import Dashboard from "../features/seller_center/pages/Dashboard";
import ProductsPage from "../features/seller_center/pages/ProductsPage";
import Finance from "../features/seller_center/pages/Finance";
import Analytics from "../features/seller_center/pages/Analytics";
import OrdersNew from "../features/seller_center/pages/OrderSeller/OrdersNew";
import OrdersProcessing from "../features/seller_center/pages/OrderSeller/OrdersProcessing";
import StoreInfo from "../features/seller_center/pages/StoreInfo";
import ProductReviews from "../features/seller_center/pages/Reviews"; // Giả sử file chính là index.jsx hoặc Reviews.jsx
import SellerComplaintsPage from "../features/seller_center/pages/ComplaintSeller/ComplaintPage";
import SellerMessages from "../features/seller_center/pages/SellerMessages";

// CHỈ IMPORT DUY NHẤT COMPONENT NÀY CHO TRANG KHUYẾN MÃI
import PromotionSeller from "../features/seller_center/pages/PromotionSeller/PromotionPage";
import OrdersDelivered from "./../features/seller_center/pages/OrderSeller/OrdersDelivered";
import OrdersCancelled from "./../features/seller_center/pages/OrderSeller/OrdersCancelled";
import SellerWallet from "../features/seller_center/pages/SellerWallet";
import SellerOrderPage from "../features/seller_center/pages/SellerOrderPage";
import NotificationsPage from "../features/seller_center/pages/NotificationsPage";

export const sellerRoutes = [
  <Route element={<SellerPrivateRoute />} key="seller-protect">
    <Route path="/seller-center" element={<SellerLayout />}>
      {/* Route mặc định */}
      <Route index element={<Dashboard />} />

      {/* Các route khác */}
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="messages" element={<SellerMessages />} />
      <Route path="store/info" element={<StoreInfo />} />
      <Route path="products" element={<ProductsPage />} />
      <Route path="wallet" element={<SellerWallet />} />

      <Route path="finance" element={<Finance />} />
      <Route path="analytics" element={<Analytics />} />
      <Route path="orders" element={<SellerOrderPage />} />
      <Route path="orders/new" element={<OrdersNew />} />
      <Route path="orders/processing" element={<OrdersProcessing />} />
      <Route path="orders/delivered" element={<OrdersDelivered />} />
      <Route path="orders/cancelled" element={<OrdersCancelled />} />
      {/* <Route path="/flash-sales" element={<FlashSales />} /> */}
      <Route path="reviews" element={<ProductReviews />} />
      <Route path="complaints" element={<SellerComplaintsPage />} />

      {/* === ROUTE DUY NHẤT CHO TOÀN BỘ CHỨC NĂNG KHUYẾN MÃI === */}
      <Route path="promotions" element={<PromotionSeller />} />

      <Route
        path="/seller-center/notifications"
        element={<NotificationsPage />}
      />
    </Route>
  </Route>,
];
