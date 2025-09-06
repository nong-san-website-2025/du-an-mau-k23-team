// src/routes/SellerRoutes.jsx
import React from "react";
import { Route } from "react-router-dom";
import SellerLayout from "../features/seller_center/components/SellerLayout";
import SellerPrivateRoute from "../components/PrivateRoutes/SellerPrivateRoute";
import Dashboard from "../features/seller_center/pages/Dashboard";
import ProductsPage from "../features/seller_center/pages/ProductsPage";
import FlashSales from "../features/seller_center/pages/PromotionSeller/FlashSales";
import Promotions from "../features/seller_center/pages/PromotionSeller/Promotions";
import PromotionList from "../features/seller_center/pages/PromotionSeller/PromotionList";
import PromotionForm from "../features/seller_center/pages/PromotionSeller/PromotionForm";
import EditPromotion from "../features/seller_center/pages/PromotionSeller/EditPromotion";
import ViewPromotion from "../features/seller_center/pages/PromotionSeller/ViewPromotion";

import StoreVouchers from "../features/seller_center/pages/PromotionSeller/StoreVouchers";
import ProductReviews from "../features/seller_center/pages/Reviews/ProductReviews";
import CustomerSupport from "../features/seller_center/pages/Reviews/CustomerSupport";


export const sellerRoutes = [
  <Route element={<SellerPrivateRoute />} key="seller-protect">
    <Route path="/seller-center" element={<SellerLayout />}>
      {/* index route: khi vào /seller-center thì mặc định hiển thị dashboard */}
      <Route index element={<Dashboard />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="products" element={<ProductsPage />} />
      {/* <Route path="/flash-sales" element={<FlashSales />} /> */}
      <Route path="promotions" element={<Promotions />} />
      <Route path="store-vouchers" element={<StoreVouchers />} />
      <Route path="products/:id/reviews" element={<ProductReviews productId={1} />} />
      <Route path="support" element={<CustomerSupport />} />
      <Route path="promotions" element={<Promotions />} />
      <Route path="/seller-center/reviews" element={<ProductReviews />} />
      <Route path="/seller-center/support" element={<CustomerSupport />} />
      <Route path="/seller-center/promotions" element={<PromotionList />} />
      <Route path="/seller-center/promotions/add" element={<PromotionForm />} />
      <Route path="/seller-center/promotions/edit/:id" element={<EditPromotion />} />
      <Route path="/seller-center/promotions/view/:id" element={<ViewPromotion />} />
    
      
    
    </Route>
  </Route>,
];
