import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./features/login_register/services/AuthContext";
import { CartProvider } from "./features/cart/services/CartContext";
import { BannerProvider } from "./features/admin/contexts/BannerContext";
import LoginForm from "./features/login_register/pages/LoginForm";
import { userRoutes } from "./routes/UserRoutes";
import { adminRoutes } from "./routes/AdminRoutes";
import { sellerRoutes } from "./routes/SellerRoutes.jsx";


function App() {
  return (
    <div className="main-container">
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <BannerProvider>
              <Routes>
                <Route path="/login" element={<LoginForm />} />
                {userRoutes}
                {adminRoutes}
                {sellerRoutes}
              </Routes>
          </BannerProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
    </div>
  );
}


export default App;
