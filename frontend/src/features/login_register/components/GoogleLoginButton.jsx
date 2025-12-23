import "../styles/GoogleLoginButton.css";
import { useEffect } from "react";

export default function GoogleLoginButton({ onSuccess }) {
  useEffect(() => {
    /* global google */
    const clientId =
      process.env.REACT_APP_GOOGLE_CLIENT_ID ||
      "359567482339-sbb0fd027fl35meo6prc9rbfpnl7b1e7.apps.googleusercontent.com";

    if (!clientId) {
      console.error("Thiếu REACT_APP_GOOGLE_CLIENT_ID trong môi trường.");
      return;
    }

    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          onSuccess(response); // gửi toàn bộ object response về LoginForm
        },
      });

      window.google.accounts.id.renderButton(
        document.getElementById("google-login-btn"),
        { theme: "outline", size: "large" }
      );
    } else {
      console.error("Google Identity script chưa được load!");
    }
  }, [onSuccess]);

  return <div id="google-login-btn"></div>;
}
