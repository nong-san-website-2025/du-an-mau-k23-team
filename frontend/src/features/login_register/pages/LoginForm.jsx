import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Link,
  CircularProgress,
  Divider,
} from "@mui/material";
import {
  FaFacebook,
  FaGoogle,
  FaBell,
  FaQuestionCircle,
  FaCog,
} from "react-icons/fa";
import { useCart } from "../../cart/services/CartContext";
import { useAuth } from "../services/AuthContext";
import ModalWrapper from "../components/ModalWrapper";
import RegisterForm from "../components/RegisterForm";
import ForgotPasswordForm from "../components/ForgotPasswordForm";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import GoogleLoginButton from "../components/GoogleLoginButton";
import FacebookLoginButton from "../components/FacebookLoginButton";
import "../styles/FacebookLoginButton.css";

const GOOGLE_CLIENT_ID =
  "765405716910-dpln310rbdfot1qkh8gjb2hlu9rkqc4a.apps.googleusercontent.com";

export default function LoginForm() {
  const navigate = useNavigate();
  const { fetchCart } = useCart();
  const { login } = useAuth();
  const location = useLocation();

  // State quản lý form
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // State quản lý modal
  const [showRegister, setShowRegister] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const { googleLogin } = useAuth();

  // Điều hướng theo vai trò
  const navigateByRole = (role) => {
    switch (role) {
      case "admin":
        navigate("/admin");
        break;
      case "seller":
        navigate("/seller-center");
        break;
      default:
        navigate("/");
    }
  };

  const handleGoogleLogin = async (response) => {
    try {
      console.log("Google OAuth raw response:", response);

      if (!response || !response.credential) {
        throw new Error("Không nhận được Google credential token");
      }

      // Gửi token Google lên Django để xác thực
      const res = await fetch(
        "http://localhost:8000/api/users/auth/google-login/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: response.credential }),
        }
      );

      const data = await res.json();
      console.log("Google backend response:", data);

      if (!res.ok) {
        throw new Error(data.error || "Google login thất bại");
      }

      // Lưu dữ liệu vào AuthProvider
      const result = await googleLogin(data);

      if (result.success) {
        await fetchCart();

        const params = new URLSearchParams(location.search);
        const redirectPath = params.get("redirect");

        if (redirectPath) {
          navigate(redirectPath);
        } else {
          navigate("/"); // hoặc navigateByRole nếu Google trả về role
        }
      } else {
        throw new Error(result.error || "Xử lý Google login thất bại");
      }
    } catch (error) {
      console.error("Google login error:", error);
      alert(error.message || "Có lỗi khi đăng nhập Google.");
    }
  };

  const handleFacebookLogin = async (accessToken) => {
    try {
      const res = await fetch(
        "http://localhost:8000/api/users/auth/facebook-login/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken }),
        }
      );

      const data = await res.json();
      console.log("Facebook backend response:", data);

      if (!res.ok) {
        throw new Error(data.error || "Đăng nhập Facebook thất bại");
      }

      await googleLogin(data);
      await fetchCart();

      const params = new URLSearchParams(location.search);
      const redirectPath = params.get("redirect");

      if (redirectPath) {
        navigate(redirectPath);
      } else {
        navigate("/"); // hoặc navigateByRole
      }
    } catch (error) {
      console.error("Facebook login error:", error);
      alert(error.message);
    }
  };

  // Xử lý đăng nhập
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(username, password);
      if (result.success) {
        await fetchCart();

        // 👇 Lấy redirect từ URL
        const params = new URLSearchParams(location.search);
        const redirectPath = params.get("redirect");

        if (redirectPath) {
          navigate(redirectPath); // Chuyển đến trang yêu cầu
        } else {
          navigateByRole(result.role); // Điều hướng theo vai trò
        }
      } else {
        setError(result.error || "Đăng nhập thất bại, vui lòng thử lại.");
      }
    } catch (err) {
      setError("Có lỗi xảy ra, vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="container-fluid vh-100 d-flex flex-column p-0">
        {/* ========== HEADER ========== */}
        <header
          className="d-flex justify-content-between align-items-center px-4 p-2 shadow-sm"
          style={{
            backgroundColor: "#ffffff",
            borderBottom: "1px solid #e0e0e0",
          }}
        >
          {/* Bên trái: Logo + Tiêu đề */}

          <Link
            to="/"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <img
              src="/assets/logo/defaultLogo.png"
              alt="GreenFarm"
              style={{
                width: 40,
                height: 40,
                objectFit: "cover",
                cursor: "pointer",
              }}
            />
            <Typography
              variant="h6"
              sx={{ fontWeight: "bold", color: "#4caf50", cursor: "pointer" }}
            >
              GreenFarm
            </Typography>
          </Link>

          {/* Bên phải: Các icon hỗ trợ */}
          <div className="d-flex align-items-center gap-3">
            <FaQuestionCircle
              size={22}
              style={{ cursor: "pointer", color: "#4caf50" }}
              title="Hỗ trợ"
            />
          </div>
        </header>

        {/* ========== MAIN CONTENT ========== */}
        <div
          className="row flex-grow-1 m-0"
          style={{ backgroundColor: "#4caf50" }}
        >
          {/* Bên trái: Logo + slogan */}
          <div
            className="col-12 col-md-7 d-flex flex-column justify-content-center align-items-center text-center text-white p-4"
            style={{
              backgroundImage:
                "linear-gradient(rgba(76,175,80,0.85), rgba(76,175,80,0.85))",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <Box>
              {/* Logo */}
              <Box
                component="img"
                src="assets/logo/whitelogo1.png"
                alt="GreenFarm Logo"
                sx={{
                  width: 160,
                  height: 180,
                }}
              />

              {/* Tiêu đề */}
              <Typography variant="h2" fontWeight="bold" sx={{ mb: 1 }}>
                GreenFarm
              </Typography>

              {/* Slogan */}
              <Typography
                variant="h5"
                sx={{
                  maxWidth: 500,
                  mx: "auto",
                  mb: 4,
                  fontStyle: "italic",
                  fontWeight: 400,
                }}
              >
                Nông sản chuẩn sạch, nguồn gốc minh bạch
              </Typography>

              {/* Hình minh họa rau củ */}
              {/* <Box
                component="img"
                src="/assets/images/vegetables.png"
                alt="AgroMart"
                sx={{
                  maxWidth: 300,
                  width: "100%",
                  borderRadius: 2,
                  boxShadow: 3,
                }}
              /> */}
            </Box>
          </div>

          {/* Bên phải: Form đăng nhập */}
          <div
            className="col-12 col-md-3 d-flex justify-content-center align-items-center"
            style={{
              padding: "20px",
              backgroundColor: "#4caf50",
              width: "500px",
            }}
          >
            <Paper
              elevation={6}
              sx={{
                p: 4,
                width: "600px",
                borderRadius: 3,
              }}
            >
              {/* Tiêu đề */}
              <Typography
                variant="h4"
                fontWeight="normal"
                align="center"
                sx={{ color: "black", mb: 2 }}
              >
                Đăng nhập
              </Typography>

              <Typography
                variant="body1"
                align="center"
                color="text.secondary"
                mb={3}
              >
                Chào mừng bạn trở lại với GreenFarm
              </Typography>

              {/* Form đăng nhập */}
              <form onSubmit={handleSubmit}>
                <TextField
                  label="Tên đăng nhập"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                  required
                />

                <TextField
                  label="Mật khẩu"
                  type="password"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                {error && (
                  <Typography color="error" variant="body2" mt={1} mb={2}>
                    {error}
                  </Typography>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  sx={{
                    mt: 2,
                    py: 1.2,
                    fontWeight: "bold",
                    backgroundColor: "#4caf50",
                    "&:hover": { backgroundColor: "#43a047" },
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Đăng nhập"
                  )}
                </Button>
              </form>

              {/* Quên mật khẩu + Đăng ký */}
              <Box display="flex" justifyContent="space-between" mt={2}>
                <Link
                  component="button"
                  variant="body2"
                  underline="hover"
                  onClick={() => setShowForgot(true)}
                >
                  Quên mật khẩu?
                </Link>
                <Link
                  component="button"
                  variant="body2"
                  underline="hover"
                  onClick={() => setShowRegister(true)}
                >
                  Đăng ký
                </Link>
              </Box>

              {/* Divider */}
              <Divider sx={{ my: 3 }}>Hoặc</Divider>

              <div className="row g-2">
                <div
                  className="col-12 col-sm-6 d-flex align-items-center "
                  style={{ justifyContent: "end", paddingRight: "20px" }}
                >
                  <GoogleLoginButton onSuccess={handleGoogleLogin} />
                </div>
                <div className="col-12 col-sm-6 d-flex align-items-center justify-content-start ">
                  <div>
                    <FacebookLoginButton onSuccess={handleFacebookLogin} />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <Typography
                variant="caption"
                color="text.secondary"
                align="center"
                display="block"
                mt={3}
              >
                © 2025 GreenFarm. Tất cả quyền được bảo lưu.
              </Typography>
            </Paper>
          </div>
        </div>

        {/* Modal Đăng ký */}
        {showRegister && (
          <ModalWrapper title="Đăng ký" onClose={() => setShowRegister(false)}>
            <RegisterForm onClose={() => setShowRegister(false)} />
          </ModalWrapper>
        )}

        {/* Modal Quên mật khẩu */}
        {showForgot && (
          <ModalWrapper onClose={() => setShowForgot(false)}>
            <ForgotPasswordForm
              onClose={() => setShowForgot(false)}
              onSuccess={(email) => console.log("Email quên mật khẩu:", email)}
            />
          </ModalWrapper>
        )}
      </div>
    </GoogleOAuthProvider>
  );
}
