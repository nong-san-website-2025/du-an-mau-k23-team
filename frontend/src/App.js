
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import CartPage from "./features/cart/pages/CartPage";
import './App.css';
import Layout from "./layouts/layout"; // Sử dụng layout có Header/Footer
import UserProductPage from './features/products/pages/UserProductPage';
import SellerProductDashboard from './features/products/pages/SellerProductDashboard';
import ProductDetailPage from './features/products/pages/ProductDetailPage';
import { CartProvider } from "./features/cart/services/CartContext";
//
import UserProfile from "./features/login_register/pages/UserProfile";
import LoginForm from "./features/login_register/pages/LoginForm";
import SellerDashboard from "./features/login_register/pages/SellerDashboard";
import ManageStore from "./features/login_register/pages/ManageStore";
import Orders from "./features/login_register/pages/Orders";
import SellerChatPage from "./features/login_register/pages/SellerChatPage";


function App() {
  return (
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="/me" element={<UserProfile />} />
              <Route path="productuser" element={<UserProductPage />} />
              <Route path="sellerDashboard" element={<SellerProductDashboard />} />
              <Route path="products/:id" element={<ProductDetailPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/seller-dashboard" element={<SellerDashboard />} />
              <Route path="/manage-products" element={<ManageStore />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/seller-chat" element={<SellerChatPage />} />
            </Route>
            <Route path="/seller-chat" element={<SellerChatPage />} />
            <Route path="/login" element={<LoginForm />} /> 
          </Routes>
        </BrowserRouter>
      </CartProvider>
  );
}
export default App;
