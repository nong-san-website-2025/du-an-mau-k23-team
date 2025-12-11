import { Route } from "react-router-dom";
import Layout from "../Layout/Layout";
import HomePage from "../pages/HomePage";
import UserProductPage from "../features/products/pages/UserProductPage";
import ProductDetailPage from "../features/products/pages/ProductDetailPage";
import CartPage from "../features/cart/pages/CartPage";
import CheckoutPage from "../features/cart/pages/CheckoutPage";
import AboutPage from "../pages/about/about";
import StoreList from "../features/stores/pages/StoreList";
import StoreDetail from "../features/stores/pages/StoreDetail";
import FeaturedProductsPage from "../features/featured/pages/FeaturedProductsPage";
import PrivateRoute from "../components/PrivateRoutes/PrivateRoute";
import UserProfile from "../features/login_register/pages/UserProfile";
import Orders from "../features/orders/pages/Orders";
import ProfilePage from "../features/users/pages/ProfilePage";
import SellerRegisterPage from "../features/sellers/pages/SellerRegisterPage";
import Wishlist from "../pages/Wishlist/Wishlist";
import NotificationPage from "../features/users/pages/NotificationPage";
import PaymentResultPage from "../features/cart/pages/PaymentResultPage";
import SearchResultsPage from "../pages/SearchResultPage";
import ResetPasswordPage from "../features/login_register/components/ResetPasswordForm";
import PreorderPage from "../pages/PreorderPage";

// Customer Service Pages
import BuyingGuide from "../pages/CustomerService/BuyingGuide";
import WarrantyPolicy from "../pages/CustomerService/WarrantyPolicy";
import ReturnPolicy from "../pages/CustomerService/ReturnPolicy";
import ContactSupport from "../pages/CustomerService/ContactSupport";
import SellingGuide from "../pages/CustomerService/SellingGuide";
import NewProductsPage from "../pages/NewProductsPage";
import ComingSoonProductsPage from "../pages/ComingSoonProductsPage";
import PrimarySecurity from "../pages/CustomerService/Primarysecurity";
import Recruitment from "../pages/CustomerService/Recruitment";
import Termsofservice from "../pages/CustomerService/Termsofservice";
import RturnmoNey from "../pages/CustomerService/RturnmoNey";
import GreenFarmwallet from "../pages/CustomerService/GreenFarmwallet";
import Frequentlyaskedquestions from "../pages/CustomerService/FAQ";
import BlogListPage from "../features/blog/pages/BlogListPage";
import BlogDetailPage from "../features/blog/pages/BlogDetailPage";
import LegalPage from "../pages/LegalPage";

export const userRoutes = [
  <Route path="/" element={<Layout />} key="layout">
    <Route index element={<HomePage />} />
    <Route path="portal" element={<LegalPage />} />
    <Route path="selling-guide" element={<SellingGuide />} />
    <Route path="blog" element={<BlogListPage />} />
    <Route path="blog/:slug" element={<BlogDetailPage />} />
    <Route path="products" element={<UserProductPage />} />
    <Route path="products/:id" element={<ProductDetailPage />} />
    <Route path="cart" element={<CartPage />} />
    <Route path="featured" element={<FeaturedProductsPage />} />
    <Route path="buying-guide" element={<BuyingGuide />} />
    <Route path="warrantypolicy" element={<WarrantyPolicy />} />
    <Route path="returnpolicy" element={<ReturnPolicy />} />
    <Route path="contactsupport" element={<ContactSupport />} />
    <Route path="primarysecurity" element={<PrimarySecurity />} />
    <Route path="recruitment" element={<Recruitment />} />
    <Route path="terms-of-service" element={<Termsofservice />} />
    <Route path="wishlist" element={<Wishlist />} />
    <Route path="abouts" element={<AboutPage />} />
    <Route path="store" element={<StoreList />} />
    <Route path="store/:id" element={<StoreDetail />} />
    <Route path="search/" element={<SearchResultsPage />} />
    <Route
      path="/reset-password/:uidb64/:token/"
      element={<ResetPasswordPage />}
    />
    <Route path="checkout" element={<CheckoutPage />} />
    <Route path="/products/new" element={<NewProductsPage />} />
    <Route path="/products/coming-soon" element={<ComingSoonProductsPage />} />

    {/* Private routes */}
    <Route element={<PrivateRoute />}>
      <Route path="me" element={<UserProfile />} />
      <Route path="orders" element={<Orders />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="register-seller" element={<SellerRegisterPage />} />
      <Route path="/payment/result" element={<PaymentResultPage />} />
      <Route path="/notifications" element={<NotificationPage />} />
      <Route path="/preorders" element={<PreorderPage />} />
      <Route path="rturnmoney" element={<RturnmoNey />} />
      <Route path="GreenFarmwallet" element={<GreenFarmwallet />} />
      <Route path="faq" element={<Frequentlyaskedquestions />} />
    </Route>
  </Route>,
  <Route
    path="/selling-guide"
    element={<SellingGuide />}
    key="/selling-guide" // ✅ THÊM DÒNG NÀY
  />,
];
