import React from "react";

export default function AdminPageLayout({ sidebar, children, header }) {
  return (
    <div className="container-fluid py-0" style={{padding:0}}>
      {/* Header cố định */}
      {header && (
        <div style={{position:'sticky', top:0, zIndex: 100, background:'#fff', boxShadow:'0 2px 8px #f3f4f6'}}>
          {header}
        </div>
      )}
      <div className="row" style={{ minHeight: "calc(100vh - 56px)" }}>
        {sidebar ? (
          <>
            <div
              className="col-12 col-md-2 border-end bg-white p-0"
              style={{ minHeight: "100vh", position:'sticky', top: header ? 64 : 0, zIndex: 10, boxShadow:'2px 0 8px #f3f4f6', background:'#fff' }}
            >
              {sidebar}
            </div>
            <div className="col-12 col-md-10 p-0" style={{overflowY:'auto', maxHeight:'calc(100vh - 64px)'}}>
              {children}
            </div>
          </>
        ) : (
          <div className="col-12 p-0" style={{overflowY:'auto', maxHeight:'calc(100vh - 64px)'}}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
