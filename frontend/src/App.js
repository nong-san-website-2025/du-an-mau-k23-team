import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
<<<<<<< HEAD
import Layout from "./layouts/layout"; // Sử dụng layout có Header/Footer

import UserProductPage from './pages/UserProductPage';
import SellerProductDashboard from './pages/SellerProductDashboard';
import 'bootstrap/dist/css/bootstrap.min.css';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="productuser" element={<UserProductPage />} />
          <Route path="sellerDashboard" element={<SellerProductDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
=======
import MainLayout from "./layouts/MainLayout";
import { CartProvider } from "./CartContext";
import CartPage from "./pages/CartPage";
import './AppCart.css';

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/cart" element={<CartPage />} />
        </Routes>

      </BrowserRouter>
    </CartProvider>
>>>>>>> feature/backend_cart_NhatNguyen
  );
}

export default App;
