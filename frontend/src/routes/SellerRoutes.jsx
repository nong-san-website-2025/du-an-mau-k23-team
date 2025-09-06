// src/routes/SellerRoutes.jsx
import React from "react";
import { Route } from "react-router-dom";
import SellerLayout from "../features/seller_center/components/SellerLayout";
import SellerPrivateRoute from "../components/PrivateRoutes/SellerPrivateRoute";
import Dashboard from "../features/seller_center/pages/Dashboard";
import ProductsPage from "../features/seller_center/pages/ProductsPage";
import AdminLayout from "../features/admin/components/AdminLayout.jsx";


export const sellerRoutes = [
  <Route element={<SellerPrivateRoute />} key="seller-protect">
    <Route path="/seller-center" element={<SellerLayout />}>
      {/* index route: khi vào /seller-center thì mặc định hiển thị dashboard */}
      <Route index element={<Dashboard />} /> 
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="products" element={<ProductsPage />} />
    </Route>
  </Route>,
];
