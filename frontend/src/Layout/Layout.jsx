import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

import GlobalChat from "../features/stores/components/GlobalChat.jsx";

export default function Layout() {
  return (
    <>
      <Header />
      <main className="py-0">
        <Outlet />
      </main>
      <Footer />
      {/* Global chat bubble persists across routes */}
      <GlobalChat />
    </>
  );
}
