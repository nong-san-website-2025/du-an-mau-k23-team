import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import CartPage from "./pages/CartPage";
import './AppCart.css';
import Layout from "./layouts/layout"; // Sử dụng layout có Header/Footer
import UserProductPage from './pages/UserProductPage';
import SellerProductDashboard from './pages/SellerProductDashboard';
import { CartProvider } from "./CartContext";


function App() {
  return (
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="productuser" element={<UserProductPage />} />
              <Route path="sellerDashboard" element={<SellerProductDashboard />} />
              <Route path="/cart" element={<CartPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
  );
}
export default App;
