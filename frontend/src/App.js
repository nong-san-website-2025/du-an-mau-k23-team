
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import MainLayout from "./layouts/MainLayout";
import UserProfile from "./pages/UserProfile";
import LoginForm from "./pages/LoginForm";
import SellerDashboard from "./pages/SellerDashboard";
import ManageStore from "./pages/ManageStore";
import Orders from "./pages/Orders";
import SellerChatPage from "./pages/SellerChatPage";
// import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/me" element={<UserProfile />} />
          {/*
          <Route path="/admin-dashboard" element={role === "admin" ? <AdminDashboard /> : <Navigate to="/" />} />
          */}
          <Route path="/seller-dashboard" element={<SellerDashboard />} />
          <Route path="/manage-products" element={<ManageStore />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/seller-chat" element={<SellerChatPage />} />
        </Route>
        <Route path="/login" element={<LoginForm />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;
