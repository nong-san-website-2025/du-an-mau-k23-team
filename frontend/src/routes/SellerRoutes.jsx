// src/routes/SellerRoutes.jsx
import React from "react";
import { Route } from "react-router-dom";
import SellerLayout from "../features/seller_center/components/SellerLayout";

import Dashboard from "../features/seller_center/pages/Dashboard.jsx";
import ProductsPage from "../features/seller_center/pages/ProductsPage.jsx";

import Finance from "../features/seller_center/pages/Finance";

import SellerPrivateRoute from "../components/PrivateRoutes/SellerPrivateRoute.jsx";

export const sellerRoutes = [
  <Route element={<SellerPrivateRoute />} key="seller-protect">
    <Route path="/seller-center" element={<SellerLayout />}>
      {/* index route: khi vào /seller-center thì mặc định hiển thị dashboard */}
      <Route index element={<Dashboard />} />
      <Route path="products" element={<ProductsPage />} />
      <Route path="finance" element={<Finance />} />
    </Route>
  </Route>
];
