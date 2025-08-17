import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./header";
import Footer from "./footer";

export default function Layout() {
  return (
    <>
      <Header />
      <main className="py-0">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
