import React from "react";

export default function Logo({ greenText }) {
  const handleLogoClick = () => {
    window.location.href = "/";
    localStorage.removeItem("searchValue");
  };

  return (
    <div
      className="navbar-brand d-flex align-items-center"
      onClick={handleLogoClick}
      style={{ ...greenText, fontSize: 70, cursor: "pointer" }}
    >
      <img 
        src="/assets/logo/whitelogo1.png" 
        alt="Logo" 
        style={{ height: 40 }} 
      />
      <h4 style={{ color: "#fff", fontWeight: 'bold', margin: "10px" }}>
        GreenFarm
      </h4>
    </div>
  );
}