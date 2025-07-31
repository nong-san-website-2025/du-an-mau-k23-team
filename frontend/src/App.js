
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import CartPage from "./features/cart/pages/CartPage";
import './App.css';
import Layout from "./layouts/layout"; // Sử dụng layout có Header/Footer
import UserProductPage from './features/products/pages/UserProductPage';
import ProductDetailPage from './features/products/pages/ProductDetailPage';
import { CartProvider } from "./features/cart/services/CartContext";
import UserProfile from "./features/login_register/pages/UserProfile";
import LoginForm from "./features/login_register/pages/LoginForm";
import ManageStore from "./features/login_register/pages/ManageStore";
import CheckoutPage from './features/cart/pages/CheckoutPage';
import Orders from './features/orders/pages/Orders';

function App() {
  return (
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="/me" element={<UserProfile />} />
              <Route path="productuser" element={<UserProductPage />} />
              <Route path="products/:id" element={<ProductDetailPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/manage-products" element={<ManageStore />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/checkout" element={<CheckoutPage />} />
            </Route>
            <Route path="/login" element={<LoginForm />} /> 
          </Routes>
        </BrowserRouter>
      </CartProvider>
  );
}
export default App;
