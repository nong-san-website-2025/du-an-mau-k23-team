import React from "react";
import { Link } from "react-router-dom";

export default function Logo({ greenText }) {
  return (
    <Link
      to="/"
      className="navbar-brand d-flex align-items-center"
      style={{ ...greenText, fontSize: 32 }}
    >
      <img src="/assets/logo/imagelogo.png" alt="Logo" style={{ height: 62, borderRadius: 12 }} />
    </Link>
  );
}