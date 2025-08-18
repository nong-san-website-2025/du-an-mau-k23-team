import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./features/login_register/services/AuthContext";
import { CartProvider } from "./features/cart/services/CartContext";
import LoginForm from "./features/login_register/pages/LoginForm";
import { userRoutes } from "./routes/UserRoutes";
import { adminRoutes } from "./routes/AdminRoutes";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/login" element={<LoginForm />} />
            {userRoutes}
            {adminRoutes}
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
