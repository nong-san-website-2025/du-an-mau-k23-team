import React from "react";

export default function AdminHeader() {
  return (
    <nav className="navbar navbar-light bg-white border-bottom px-4" style={{height:64, marginLeft: 0}}>
      <div className="d-flex align-items-center w-100 justify-content-between">
        <form className="d-flex" style={{maxWidth:320}}>
          <input className="form-control me-2" type="search" placeholder="Search" aria-label="Search" />
        </form>
        <div className="d-flex align-items-center gap-3">
          <button className="btn btn-light rounded-circle p-2">
            <span className="bi bi-bell"></span>
          </button>
          <img src="/avatar.png" alt="avatar" style={{width:40, height:40, borderRadius:'50%'}} />
        </div>
      </div>
    </nav>
  );
}
