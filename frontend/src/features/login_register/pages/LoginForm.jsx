import { useState, useEffect } from "react";
import { login } from "../services/auth";
import { useNavigate } from "react-router-dom";
import "../styles/LoginForm.css";
// import loginIcon from "../../../assets/login.png";
// import homeIcon from "../../../assets/homefarm.png";
import logo from "../assets/imagelogo.png";

function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // State cho Đăng ký
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPassword2, setRegPassword2] = useState("");
  const [isSeller, setIsSeller] = useState(false);
  // State cho Quên mật khẩu
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotEmailError, setForgotEmailError] = useState("");

  // State cho nhập mã xác thực
  const [verificationCode, setVerificationCode] = useState(Array(6).fill(""));
  const [showVerifyCodeForm, setShowVerifyCodeForm] = useState(false);

  // State cho cấp lại mật khẩu
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showResetPasswordForm, setShowResetPasswordForm] = useState(false);

  const [countdown, setCountdown] = useState(60); // 60 giây
  const [intervalId, setIntervalId] = useState(null);
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    /* global google */
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: "638143772671-m6e09jr0o9smb5l1n24bhv7tpeskmvu3.apps.googleusercontent.com",
        callback: handleGoogleResponse,
      });

      window.google.accounts.id.renderButton(
        document.getElementById("googleSignInDiv"),
        { theme: "outline", size: "large" }
      );
    }
  }, []);
  const handleGoogleResponse = (response) => {
    console.log(response.credential);
    sendTokenToBackend(response.credential);
  };

  const sendTokenToBackend = async (token) => {
    console.log("[DEBUG] Sending token to backend:", token);
    try {
      const res = await fetch("/api/users/google-login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        if (data.username) {
          localStorage.setItem("username", data.username);
        }
        // alert('Đăng nhập Google thành công!');
        if (data.role === "seller") {
          navigate("/seller-dashboard");
        } else if (data.role === "admin") {
          navigate("/admin-dashboard");
        } else {
          navigate("/");
        }
      } else {
        alert(data.error || "Đăng nhập thất bại!");
      }
    } catch (err) {
      alert("Lỗi kết nối!");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(username, password);

    if (result.success) {
      localStorage.setItem("token", result.token);
      localStorage.setItem("role", result.role);
      localStorage.setItem("username", username);
      // alert('Đăng nhập thành công!');
      // Đăng nhập thường luôn vào trang user (trang chủ)
      navigate("/");
    } else {
      setError(result.error);
    }
  };

  const handleRegister = async () => {
    if (!regUsername || !regEmail || !regPassword || !regPassword2) {
      alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    const passwordRegex = /^(?=.*[A-Z]).{8,}$/;
    if (!passwordRegex.test(regPassword)) {
      alert("Mật khẩu phải có ít nhất 8 ký tự và chứa ít nhất 1 chữ viết hoa!");
      return;
    }

    if (regPassword !== regPassword2) {
      alert("Mật khẩu nhập lại không khớp!");
      return;
    }

    try {
      const response = await fetch("/api/users/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: regUsername,
          email: regEmail,
          password: regPassword,
          password2: regPassword2,
          is_seller: isSeller,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Đăng ký thành công!");
        setShowRegisterModal(false);
        // Tự động đăng nhập sau khi đăng ký
        const loginResult = await login(regUsername, regPassword);
        if (loginResult.success) {
          localStorage.setItem("token", loginResult.token);
          localStorage.setItem("role", loginResult.role);
          localStorage.setItem("username", regUsername);
          if (loginResult.role === "seller") {
            navigate("/seller-dashboard");
          } else if (loginResult.role === "admin") {
            navigate("/admin-dashboard");
          } else {
            navigate("/");
          }
        } else {
          alert("Đăng ký thành công nhưng đăng nhập tự động thất bại!");
        }
        setRegUsername("");
        setRegEmail("");
        setRegPassword("");
        setRegPassword2("");
        setIsSeller(false);
      } else {
        // Hiển thị lỗi chi tiết từ backend
        alert(
          data && typeof data === "object"
            ? JSON.stringify(data)
            : data.error || "Đăng ký thất bại!"
        );
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ!");
    }
  };

  const handleForgotPassword = async () => {
    // Kiểm tra định dạng email hợp lệ
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!forgotEmail || !emailPattern.test(forgotEmail)) {
      setForgotEmailError("Vui lòng nhập đúng định dạng email!");
      return;
    }
    setForgotEmailError("");
    try {
      const response = await fetch("/api/users/forgot-password/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await response.json();
      if (response.ok) {
        alert("Mã khôi phục đã được gửi về email!");
        setShowVerifyCodeForm(true);
        startCountdown();
        // KHÔNG reset forgotEmail ở đây để giữ lại email cho bước xác thực mã và đặt lại mật khẩu
      } else {
        alert(data.error || "Gửi email thất bại!");
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ!");
    }
  };
  const startCountdown = () => {
    setCountdown(60); // Bắt đầu từ 60 giây
    if (intervalId) clearInterval(intervalId); // Clear nếu có đếm trước đó
    const newInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(newInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setIntervalId(newInterval);
  };

  const validatePasswordRealtime = (password) => {
    const passwordRegex = /^(?=.*[A-Z]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setPasswordError(
        "Mật khẩu phải có ít nhất 8 ký tự và chứa ít nhất 1 chữ viết hoa!"
      );
    } else {
      setPasswordError("");
    }
  };
  const handleVerifyCode = async () => {
    // Đảm bảo gửi code là chuỗi, không phải mảng
    const codeString = Array.isArray(verificationCode)
      ? verificationCode.join("")
      : verificationCode;
    if (!codeString || codeString.length < 6) {
      alert("Vui lòng nhập đầy đủ mã xác thực!");
      return;
    }
    try {
      const response = await fetch("/api/users/verify-code/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, code: codeString }),
      });
      const data = await response.json();
      if (response.ok) {
        setShowResetPasswordForm(true); // Hiện form cấp lại mật khẩu
        setShowVerifyCodeForm(false);
      } else {
        alert(data.error || "Mã xác thực không đúng!");
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ!");
    }
  };
  const handleResetPassword = async () => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!forgotEmail || !emailPattern.test(forgotEmail)) {
      alert(
        "Email không hợp lệ, vui lòng thực hiện lại quy trình quên mật khẩu!"
      );
      setShowResetPasswordForm(false);
      return;
    }
    if (!newPassword || !confirmNewPassword) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }
    const passwordRegex = /^(?=.*[A-Z]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      alert("Mật khẩu phải có ít nhất 8 ký tự và chứa ít nhất 1 chữ viết hoa!");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      alert("Mật khẩu nhập lại không khớp!");
      return;
    }
    try {
      const response = await fetch("/api/users/reset-password/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail,
          password: newPassword,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setShowForgotModal(false);
        setShowResetPasswordForm(false);
        setForgotEmail("");
        setVerificationCode("");
        setNewPassword("");
        setConfirmNewPassword("");
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ!");
    }
  };
  const handleOtpChange = (e, index) => {
    const value = e.target.value.replace(/[^0-9a-zA-Z]/g, ""); // Chỉ cho phép chữ và số
    if (value.length > 1) return;

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Tự động focus ô tiếp theo nếu có giá trị
    if (value && index < 5) {
      const nextInput = document.querySelectorAll(".otp-input")[index + 1];
      nextInput && nextInput.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      const prevInput = document.querySelectorAll(".otp-input")[index - 1];
      prevInput && prevInput.focus();
    }
  };

  return (
    <div className="login-container">
      <div className="login-page login-right">
        <form onSubmit={handleSubmit} className="login-form">
          <img src={logo} alt="Logo" className="login-logo" />
          <h2>
            {/* <img src={loginIcon} alt="icon" className="login-icon" /> */}
            Đăng nhập
          </h2>
          {error && <p style={{ color: "red" }}>{error}</p>}
          <i className="fas fa-user input-icon-user"></i>
          <input
            type="text"
            placeholder="Tên đăng nhập"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <br />
          <i className="fas fa-lock input-icon-lock"></i>
          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <br />
          <button type="submit" className="login-btn">
            {/* <img src={homeIcon} alt="icon" className="login-icon home-icon"/> */}
            Đăng nhập
          </button>
          <div className="extra-options">
            <button
              type="button"
              className="register-btn"
              onClick={() => setShowRegisterModal(true)}
            >
              Đăng ký
            </button>
            <span
              className="forgot-link"
              onClick={() => setShowForgotModal(true)}
            >
              Quên mật khẩu?
            </span>
          </div>
        </form>
        {/* Modal Đăng ký */}
        {showRegisterModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Đăng ký tài khoản</h3>
              <input
                type="text"
                placeholder="Tên đăng nhập"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
              />
              <input
                type="email"
                placeholder="Email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Mật khẩu"
                value={regPassword}
                onChange={(e) => {
                  setRegPassword(e.target.value);
                  validatePasswordRealtime(e.target.value);
                }}
              />
              <input
                type="password"
                placeholder="Nhập lại mật khẩu"
                value={regPassword2}
                onChange={(e) => setRegPassword2(e.target.value)}
              />

              {/* <div style={{ margin: '10px 0' }}>
              <label>
                <input
                  type="checkbox"
                  checked={isSeller}
                  onChange={(e) => setIsSeller(e.target.checked)}
                />
                Seller
              </label>
            </div> */}

              <button onClick={handleRegister}>Đăng ký</button>
              <button
                className="close-btn"
                onClick={() => setShowRegisterModal(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        )}
        {/* Modal Quên mật khẩu */}
        {showForgotModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Quên mật khẩu</h3>
              <input
                type="email"
                placeholder="Nhập email của bạn"
                value={forgotEmail}
                autoComplete="off"
                onChange={(e) => {
                  // Chỉ nhận email hợp lệ, không nhận username
                  const value = e.target.value;
                  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (!value || !emailPattern.test(value)) {
                    setForgotEmailError("Vui lòng nhập đúng định dạng email!");
                    setForgotEmail(value); // vẫn cho nhập để hiện lỗi
                  } else {
                    setForgotEmailError("");
                    setForgotEmail(value);
                  }
                }}
                className={forgotEmailError ? "input-error" : ""}
                inputMode="email"
                pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
              />
              {forgotEmailError && (
                <div className="email-error">{forgotEmailError}</div>
              )}
              <button
                onClick={handleForgotPassword}
                disabled={
                  !!forgotEmailError ||
                  !forgotEmail ||
                  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)
                }
              >
                Gửi yêu cầu
              </button>
              <button
                className="close-btn"
                onClick={() => setShowForgotModal(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        )}
        {showVerifyCodeForm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Nhập mã xác thực</h3>
              <p className="countdown-text">
                {countdown > 0
                  ? `Vui lòng nhập mã trong ${countdown} giây`
                  : "Bạn có thể yêu cầu gửi lại mã"}
              </p>
              <div className="otp-input-container">
                {Array(6)
                  .fill(0)
                  .map((_, index) => (
                    <input
                      key={index}
                      type="text"
                      maxLength="1"
                      className="otp-input"
                      value={verificationCode[index] || ""}
                      onChange={(e) => handleOtpChange(e, index)}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    />
                  ))}
              </div>
              <button onClick={handleVerifyCode}>Xác thực</button>
              <button
                className="close-btn"
                onClick={() => setShowVerifyCodeForm(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        )}
        {showResetPasswordForm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Đặt lại mật khẩu</h3>
              <div
                style={{
                  marginBottom: "10px",
                  color: "gray",
                  fontSize: "14px",
                }}
              >
                <b>Email:</b>{" "}
                {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail) ? (
                  forgotEmail
                ) : (
                  <span style={{ color: "red" }}>Không có email hợp lệ!</span>
                )}
              </div>
              <input
                type="password"
                placeholder="Mật khẩu mới"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  validatePasswordRealtime(e.target.value);
                }}
              />
              {passwordError && (
                <p className="password-error">{passwordError}</p>
              )}
              <input
                type="password"
                placeholder="Nhập lại mật khẩu"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
              <button
                onClick={() => {
                  if (
                    !forgotEmail ||
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)
                  ) {
                    alert(
                      "Không tìm thấy email hợp lệ để đặt lại mật khẩu. Vui lòng thực hiện lại quy trình quên mật khẩu!"
                    );
                    setShowResetPasswordForm(false);
                    return;
                  }
                  handleResetPassword();
                }}
              >
                Đặt lại mật khẩu
              </button>
              <button
                className="close-btn"
                onClick={() => setShowResetPasswordForm(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="google-login-container">
        <div id="googleSignInDiv"></div>
      </div>
    </div>
  );
}

export default LoginForm;
