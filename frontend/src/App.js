
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import MainLayout from "./layouts/MainLayout";

function App() {
  return (
    <BrowserRouter>
        <Routes element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
        </Routes>
    </BrowserRouter>
  );
}
export default App;
