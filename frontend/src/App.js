import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./features/login_register/services/AuthContext";
import { CartProvider } from "./features/cart/services/CartContext.js";
import LoginForm from "./features/login_register/pages/LoginForm";
import { userRoutes } from "./routes/UserRoutes";
import { adminRoutes } from "./routes/AdminRoutes";
import { sellerRoutes } from "./routes/SellerRoutes.jsx";
import VerifyEmailPage from "./features/login_register/components/VerifyEmailPage.jsx";
import VnpayReturn from "./pages/VnpayReturn";
import ScrollToTop from "./utils/ScrollToTop.js";
import { useEffect } from "react";

function App() {
  useEffect(() => {
    const navigationEntries = performance.getEntriesByType("navigation");
    const isReload =
      navigationEntries.length > 0 && navigationEntries[0].type === "reload";

    if (isReload) {
      localStorage.removeItem("searchValue");
    }
  }, []);

  return (
    <div className="main-container">
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <ScrollToTop />
            <Routes>
              <Route path="/login" element={<LoginForm />} />
              {userRoutes}
              {adminRoutes}
              {sellerRoutes}
              {/* Handle backend redirect with tokens as query params */}
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              {/* Optional legacy route (if ever linked directly from email) */}
              <Route
                path="/verify-email/:uid/:token"
                element={<VerifyEmailPage />}
              />
              {/* VNPAY return handler */}
              <Route path="/vnpay-return" element={<VnpayReturn />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
