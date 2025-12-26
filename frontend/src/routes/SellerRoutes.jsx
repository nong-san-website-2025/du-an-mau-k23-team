import React, { lazy, Suspense } from "react";
import { Route } from "react-router-dom";
import { Spin } from "antd";
import SellerLayout from "../features/seller_center/components/SellerLayout";
import SellerPrivateRoute from "../components/PrivateRoutes/SellerPrivateRoute";

// Loading component
const LoadingScreen = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <Spin size="large" tip="Đang tải..." />
  </div>
);

// Import các component pages cần thiết (Sử dụng lazy)
const Dashboard = lazy(() => import("../features/seller_center/pages/Dashboard"));
const ProductsPage = lazy(() => import("../features/seller_center/pages/ProductsPage"));
const Finance = lazy(() => import("../features/seller_center/pages/Finance"));
const Analytics = lazy(() => import("../features/seller_center/pages/Analytics"));
const OrdersNew = lazy(() => import("../features/seller_center/pages/OrderSeller/OrdersNew"));
const OrdersProcessing = lazy(() => import("../features/seller_center/pages/OrderSeller/OrdersProcessing"));
const StoreInfo = lazy(() => import("../features/seller_center/pages/StoreInfo"));
const ProductReviews = lazy(() => import("../features/seller_center/pages/Reviews"));
const SellerComplaintsPage = lazy(() => import("../features/seller_center/pages/ComplaintSeller/ComplaintPage"));
const SellerMessages = lazy(() => import("../features/seller_center/pages/SellerMessages"));
const PromotionSeller = lazy(() => import("../features/seller_center/pages/PromotionSeller/PromotionPage"));
const OrdersDelivered = lazy(() => import("./../features/seller_center/pages/OrderSeller/OrdersDelivered"));
const OrdersCancelled = lazy(() => import("./../features/seller_center/pages/OrderSeller/OrdersCancelled"));
const SellerWallet = lazy(() => import("../features/seller_center/pages/SellerWallet"));
const SellerOrderPage = lazy(() => import("../features/seller_center/pages/SellerOrderPage"));
const NotificationsPage = lazy(() => import("../features/seller_center/pages/NotificationsPage"));

const wrapSuspense = (element) => (
  <Suspense fallback={<LoadingScreen />}>
    {element}
  </Suspense>
);

export const sellerRoutes = [
  <Route element={<SellerPrivateRoute />} key="seller-protect">
    <Route path="/seller-center" element={<SellerLayout />}>
      {/* Route mặc định */}
      <Route index element={wrapSuspense(<Dashboard />)} />

      {/* Các route khác */}
      <Route path="dashboard" element={wrapSuspense(<Dashboard />)} />
      <Route path="messages" element={wrapSuspense(<SellerMessages />)} />
      <Route path="store/info" element={wrapSuspense(<StoreInfo />)} />
      <Route path="products" element={wrapSuspense(<ProductsPage />)} />
      <Route path="wallet" element={wrapSuspense(<SellerWallet />)} />

      <Route path="finance" element={wrapSuspense(<Finance />)} />
      <Route path="analytics" element={wrapSuspense(<Analytics />)} />
      <Route path="orders" element={wrapSuspense(<SellerOrderPage />)} />
      <Route path="orders/new" element={wrapSuspense(<OrdersNew />)} />
      <Route path="orders/processing" element={wrapSuspense(<OrdersProcessing />)} />
      <Route path="orders/delivered" element={wrapSuspense(<OrdersDelivered />)} />
      <Route path="orders/cancelled" element={wrapSuspense(<OrdersCancelled />)} />
      <Route path="reviews" element={wrapSuspense(<ProductReviews />)} />
      <Route path="complaints" element={wrapSuspense(<SellerComplaintsPage />)} />

      {/* === ROUTE DUY NHẤT CHO TOÀN BỘ CHỨC NĂNG KHUYẾN MÃI === */}
      <Route path="promotions" element={wrapSuspense(<PromotionSeller />)} />

      <Route
        path="/seller-center/notifications"
        element={wrapSuspense(<NotificationsPage />)}
      />
    </Route>
  </Route>,
];
