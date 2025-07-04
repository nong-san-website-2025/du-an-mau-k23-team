import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
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
  );
}

export default App;
