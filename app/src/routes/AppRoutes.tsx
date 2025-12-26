// src/AppRoutes.tsx
import React from "react";
import { Redirect, Route } from "react-router-dom";
import { IonRouterOutlet } from "@ionic/react";
import Tab1 from "../pages/Home";
import Tab2 from "../pages/Category";
import Tab3 from "../pages/Favorite";
import Tab4 from "../pages/Notification";
import Tab5 from "../pages/Profile";
import CartPage from "../pages/CartPage";
import Subcategory from "../components/Product/SubCategory";
import ProductList from "../components/Product/ProductList";
import ProductDetail from "../components/Product/ProductDetail";
import LoginPage from "../pages/Auth/AuthPage";
import CheckoutPage from "../pages/CheckoutPage";
import AuthPage from "../pages/Auth/AuthPage";
import AddressBookPage from "../pages/User/AddressBookPage";

// 👇 1. Import trang OrderHistoryPage mới tạo
import OrderHistoryPage from "../pages/Orders/OrderHistoryPage";
import OrderDetail from "../components/Orders/OrderDetail";

const AppRoutes: React.FC = () => {
  return (
    <IonRouterOutlet>
      <Route exact path="/home" component={Tab1} />
      <Route exact path="/category" component={Tab2} />
      <Route exact path="/category/:categoryId" component={Subcategory} />

      <Route
        exact
        path="/subcategory/:subcategoryId/products"
        component={ProductList}
      />

      <Route exact path="/checkout">
        <CheckoutPage />
      </Route>

      {/* 👇 2. THÊM ROUTE CHO LỊCH SỬ ĐƠN HÀNG Ở ĐÂY */}
      <Route exact path="/orders" component={OrderHistoryPage} />

      <Route path="/orders/:id">
        <OrderDetail />
      </Route>


      <Route exact path="/product/:id" component={ProductDetail} />
      <Route exact path="/login" component={LoginPage} />
      <Route exact path="/register">
        <AuthPage />
      </Route>
      <Route path="/address-book" exact={true}>
        <AddressBookPage />
      </Route>
      <Route path="/favorite" component={Tab3} />
      <Route path="/notification" component={Tab4} />
      <Route path="/profile" component={Tab5} />
      <Route path="/cart" component={CartPage} />
      <Route exact path="/">
        <Redirect to="/home" />
      </Route>
    </IonRouterOutlet>
  );
};

export default AppRoutes;
