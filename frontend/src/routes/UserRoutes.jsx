import { Route } from "react-router-dom";
import Layout from "../Layout/Layout";
import HomePage from "../pages/HomePage";
import BlogHome from "../pages/Blog/BlogHome";
import BlogDetail from "../pages/Blog/BlogDetail";
import UserProductPage from '../features/products/pages/UserProductPage';
import ProductDetailPage from '../features/products/pages/ProductDetailPage';
import CartPage from '../features/cart/pages/CartPage';
import CheckoutPage from '../features/cart/pages/CheckoutPage';
import AboutPage from "../pages/about/about";
import StoreList from '../features/stores/pages/StoreList';
import StoreDetail from '../features/stores/pages/StoreDetail';
import FeaturedProductsPage from "../features/featured/pages/FeaturedProductsPage";
import PrivateRoute from "../components/PrivateRoutes/PrivateRoute";
import UserProfile from "../features/login_register/pages/UserProfile";
import Orders from '../features/orders/pages/Orders';
import ProfilePage from "../features/users/pages/ProfilePage";
import SellerRegisterPage from "../features/sellers/pages/SellerRegisterPage";
import ManageStore from "../features/login_register/pages/ManageStore";
import Wishlist from "../pages/Wishlist/Wishlist";
import NotificationPage from "../features/users/pages/NotificationPage";
import PaymentResultPage from "../features/cart/pages/PaymentResultPage";

export const userRoutes = [
  <Route path="/" element={<Layout />} key="layout">
    <Route index element={<HomePage />} />
    <Route path="blog" element={<BlogHome />} />
    <Route path="blog/:slug" element={<BlogDetail />} />
    <Route path="productuser" element={<UserProductPage />} />
    <Route path="products/:id" element={<ProductDetailPage />} />
    <Route path="cart" element={<CartPage />} />
    <Route path="featured" element={<FeaturedProductsPage />} />
    <Route path="wishlist" element={<Wishlist />} />
    <Route path="abouts" element={<AboutPage />} />
    <Route path="store" element={<StoreList />} />
    <Route path="store/:id" element={<StoreDetail />} />

    {/* Private routes */}
    <Route element={<PrivateRoute />}>
      <Route path="me" element={<UserProfile />} />
      <Route path="orders" element={<Orders />} />
      <Route path="checkout" element={<CheckoutPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="manage-products" element={<ManageStore />} />
      <Route path="register-seller" element={<SellerRegisterPage />} />
      <Route path="/payment/result" element={<PaymentResultPage />} />
      <Route path="/payment/NotificationPage" element={<NotificationPage />} />
    </Route>
  </Route>
];