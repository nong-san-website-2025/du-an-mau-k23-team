import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

export default function Layout() {
  return (
    <>
      <Header />
      <main className="py-4">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
