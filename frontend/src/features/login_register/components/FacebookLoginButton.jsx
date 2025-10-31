import React from "react";
import { FaFacebook } from "react-icons/fa";

export default function FacebookLoginIcon({ onSuccess }) {
  const handleFacebookLogin = () => {
    if (!window.FB) {
      alert("Facebook SDK chưa load!");
      return;
    }

    window.FB.login(
      (response) => {
        if (response.authResponse?.accessToken) {
          onSuccess(response.authResponse.accessToken);
        } else {
          alert("Login thất bại");
        }
      },
      { scope: "email" }
    );
  };

  return (
    <div
      className="facebook-login-container"
      onClick={handleFacebookLogin}
      style={{ width: 50, height: 50 }}
    >
      <FaFacebook className="facebook-icon" />
    </div>
  );
}
