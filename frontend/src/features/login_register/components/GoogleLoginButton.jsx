import "../styles/GoogleLoginButton.css"
import { useEffect } from "react";

export default function GoogleLoginButton({ onSuccess }) {
  useEffect(() => {
    /* global google */
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: "359567482339-sbb0fd027fl35meo6prc9rbfpnl7b1e7.apps.googleusercontent.com",
        callback: (response) => {
          console.log("Google credential:", response);
          onSuccess(response); // gửi toàn bộ object response về LoginForm
        },
      });

      window.google.accounts.id.renderButton(
        document.getElementById("google-login-btn"),
        { theme: "outline", size: "large", }
      );
    } else {
      console.error("Google Identity script chưa được load!");
    }
  }, [onSuccess]);

  return <div id="google-login-btn"></div>;
}
