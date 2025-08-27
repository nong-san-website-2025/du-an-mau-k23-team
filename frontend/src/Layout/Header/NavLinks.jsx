import React from "react";
import { Link } from "react-router-dom";

export default function NavLinks() {
  return (
    <>
      <Link
        to="/featured"
        className="btn btn-link fw-medium px-3 py-2 text-decoration-none text-dark d-none d-lg-inline-block"
        style={{ whiteSpace: "nowrap", fontSize: 14 }}
      >
        Sản phẩm nổi bật
      </Link>
      <Link
        to="/store"
        className="btn btn-link fw-medium px-3 py-2 text-decoration-none text-dark d-none d-xl-inline-block"
        style={{ whiteSpace: "nowrap", fontSize: 14 }}
      >
        Cửa hàng
      </Link>
      <Link
        to="/blog"
        className="btn btn-link fw-medium px-3 py-2 text-decoration-none text-dark d-none d-xl-inline-block"
        style={{ whiteSpace: "nowrap", fontSize: 14 }}
      >
        Bài viết
      </Link>
      <Link
        to="/abouts"
        className="btn btn-link fw-medium px-3 py-2 text-decoration-none text-dark d-none d-xl-inline-block"
        style={{ whiteSpace: "nowrap", fontSize: 14 }}
      >
        Về chúng tôi
      </Link>
    </>
  );
}