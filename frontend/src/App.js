import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import MainLayout from "./layouts/MainLayout";
import UserProfile from "./pages/UserProfile";
import LoginForm from "./pages/LoginForm";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/me" element={<UserProfile />} />
        </Route>
        <Route path="/login" element={<LoginForm />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;
