import React, { lazy, Suspense } from "react";
import { Route } from "react-router-dom";
import { Spin } from "antd";
import Layout from "../layout/Layout";

// Loading component
const LoadingScreen = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <Spin size="large" tip="Đang tải..." />
  </div>
);

const HomePage = lazy(() => import("../pages/HomePage"));
const UserProductPage = lazy(() => import("../features/products/pages/UserProductPage"));
const ProductDetailPage = lazy(() => import("../features/products/pages/ProductDetailPage"));
const CartPage = lazy(() => import("../features/cart/pages/CartPage"));
const CheckoutPage = lazy(() => import("../features/cart/pages/CheckoutPage"));
const AboutPage = lazy(() => import("../pages/About/About"));
const StoreList = lazy(() => import("../features/stores/pages/StoreList"));
const StoreDetail = lazy(() => import("../features/stores/pages/StoreDetail"));
const FeaturedProductsPage = lazy(() => import("../features/featured/pages/FeaturedProductsPage"));
const PrivateRoute = lazy(() => import("../components/PrivateRoutes/PrivateRoute"));
const UserProfile = lazy(() => import("../features/login_register/pages/UserProfile"));
const Orders = lazy(() => import("../features/orders/pages/Orders"));
const ProfilePage = lazy(() => import("../features/users/pages/ProfilePage"));
const SellerRegisterPage = lazy(() => import("../features/sellers/pages/SellerRegisterPage"));
const Wishlist = lazy(() => import("../pages/Wishlist/Wishlist"));
const NotificationPage = lazy(() => import("../features/users/pages/NotificationPage"));
const PaymentResultPage = lazy(() => import("../features/cart/pages/PaymentResultPage"));
const SearchResultsPage = lazy(() => import("../pages/SearchResultPage"));
const ResetPasswordPage = lazy(() => import("../features/login_register/components/ResetPasswordForm"));
const PreorderPage = lazy(() => import("../pages/PreorderPage"));

// Customer Service Pages
const BuyingGuide = lazy(() => import("../pages/CustomerService/BuyingGuide"));
const WarrantyPolicy = lazy(() => import("../pages/CustomerService/WarrantyPolicy"));
const ReturnPolicy = lazy(() => import("../pages/CustomerService/ReturnPolicy"));
const ContactSupport = lazy(() => import("../pages/CustomerService/ContactSupport"));
const SellingGuide = lazy(() => import("../pages/CustomerService/SellingGuide"));
const NewProductsPage = lazy(() => import("../pages/NewProductsPage"));
const ComingSoonProductsPage = lazy(() => import("../pages/ComingSoonProductsPage"));
const PrimarySecurity = lazy(() => import("../pages/CustomerService/PrimarySecurity"));
const Recruitment = lazy(() => import("../pages/CustomerService/Recruitment"));
const Termsofservice = lazy(() => import("../pages/CustomerService/Termsofservice"));
const RturnmoNey = lazy(() => import("../pages/CustomerService/RturnmoNey"));
const GreenFarmwallet = lazy(() => import("../pages/CustomerService/GreenFarmwallet"));
const Frequentlyaskedquestions = lazy(() => import("../pages/CustomerService/FAQ"));
const BlogListPage = lazy(() => import("../features/blog/pages/BlogListPage"));
const BlogDetailPage = lazy(() => import("../features/blog/pages/BlogDetailPage"));
const LegalPage = lazy(() => import("../pages/LegalPage"));
const BestSellersPage = lazy(() => import("../pages/BestSellersPage"));

const wrapSuspense = (element) => (
  <Suspense fallback={<LoadingScreen />}>
    {element}
  </Suspense>
);

export const userRoutes = [
  <Route path="/" element={<Layout />} key="layout">
    <Route index element={wrapSuspense(<HomePage />)} />
    <Route path="portal" element={wrapSuspense(<LegalPage />)} />
    <Route path="selling-guide" element={wrapSuspense(<SellingGuide />)} />
    <Route path="blog" element={wrapSuspense(<BlogListPage />)} />
    <Route path="blog/:slug" element={wrapSuspense(<BlogDetailPage />)} />
    <Route path="products" element={wrapSuspense(<UserProductPage />)} />
    <Route path="products/:id" element={wrapSuspense(<ProductDetailPage />)} />
    <Route path="cart" element={wrapSuspense(<CartPage />)} />
    <Route path="featured" element={wrapSuspense(<FeaturedProductsPage />)} />
    <Route path="buying-guide" element={wrapSuspense(<BuyingGuide />)} />
    <Route path="warrantypolicy" element={wrapSuspense(<WarrantyPolicy />)} />
    <Route path="returnpolicy" element={wrapSuspense(<ReturnPolicy />)} />
    <Route path="contactsupport" element={wrapSuspense(<ContactSupport />)} />
    <Route path="primarysecurity" element={wrapSuspense(<PrimarySecurity />)} />
    <Route path="recruitment" element={wrapSuspense(<Recruitment />)} />
    <Route path="terms-of-service" element={wrapSuspense(<Termsofservice />)} />
    <Route path="wishlist" element={wrapSuspense(<Wishlist />)} />
    <Route path="abouts" element={wrapSuspense(<AboutPage />)} />
    <Route path="store" element={wrapSuspense(<StoreList />)} />
    <Route path="store/:id" element={wrapSuspense(<StoreDetail />)} />
    <Route path="search/" element={wrapSuspense(<SearchResultsPage />)} />
    <Route path="new-products" element={wrapSuspense(<NewProductsPage />)} />
    <Route path="best-sellers" element={wrapSuspense(<BestSellersPage />)} />

    <Route
      path="/reset-password/:uidb64/:token/"
      element={wrapSuspense(<ResetPasswordPage />)}
    />
    <Route path="checkout" element={wrapSuspense(<CheckoutPage />)} />
    <Route path="/products/new" element={wrapSuspense(<NewProductsPage />)} />
    <Route path="/products/coming-soon" element={wrapSuspense(<ComingSoonProductsPage />)} />

    {/* Private routes */}
    <Route element={<PrivateRoute />}>
      <Route path="me" element={wrapSuspense(<UserProfile />)} />
      <Route path="orders" element={wrapSuspense(<Orders />)} />
      <Route path="profile" element={wrapSuspense(<ProfilePage />)} />
      <Route path="register-seller" element={wrapSuspense(<SellerRegisterPage />)} />
      <Route path="/payment/result" element={wrapSuspense(<PaymentResultPage />)} />
      <Route path="/notifications" element={wrapSuspense(<NotificationPage />)} />
      <Route path="/preorders" element={wrapSuspense(<PreorderPage />)} />
      <Route path="rturnmoney" element={wrapSuspense(<RturnmoNey />)} />
      <Route path="GreenFarmwallet" element={wrapSuspense(<GreenFarmwallet />)} />
      <Route path="faq" element={wrapSuspense(<Frequentlyaskedquestions />)} />
    </Route>
  </Route>,
  <Route
    path="/selling-guide"
    element={wrapSuspense(<SellingGuide />)}
    key="/selling-guide"
  />,
];
