import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

import GlobalChat from "../features/stores/components/GlobalChat.jsx";

export default function Layout() {
  const location = useLocation();

  // Các trang CÔNG KHAI — không cần thông tin user
  const publicRoutes = [
    "/checkout",
    "/cart",
    "/login",
    "/register",
    "/products",
    "/",
  ];

  const shouldFetchProfile = !publicRoutes.some(
    (route) =>
      location.pathname === route || location.pathname.startsWith(route + "/")
  );

  return (
    <>
      <Header shouldFetchProfile={shouldFetchProfile} />
      <main className="py-0">
        <Outlet />
      </main>
      <Footer />
      {/* Global chat bubble persists across routes */}
      <GlobalChat />
    </>
  );
}
