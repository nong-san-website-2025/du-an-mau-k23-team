import React from "react";
import { Link } from "react-router-dom";

export default function Logo({ greenText }) {
  return (
    <Link
      to="/"
      className="navbar-brand d-flex align-items-center"
      style={{ ...greenText, fontSize: 70 }}
    >
      <img src="/assets/logo/whitelogo1.png" alt="Logo" style={{ height: 62}} />
    </Link>
  );
}