import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
// Import Ant Design components
import { message, notification } from "antd";
import { API_CONFIG } from "../../../constants/apiConstants";
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
import { FaQuestionCircle } from "react-icons/fa";
import { useCart } from "../../cart/services/CartContext";
import { useAuth } from "../services/AuthContext";
import ModalWrapper from "../components/ModalWrapper";
import ForgotPasswordForm from "../components/ForgotPasswordForm";
import { GoogleOAuthProvider } from "@react-oauth/google";
import GoogleLoginButton from "../components/GoogleLoginButton";
import FacebookLoginButton from "../components/FacebookLoginButton";
import "../styles/FacebookLoginButton.css";

const GOOGLE_CLIENT_ID = "765405716910-dpln310rbdfot1qkh8gjb2hlu9rkqc4a.apps.googleusercontent.com";

export default function LoginForm() {
  const navigate = useNavigate();
  const { fetchCart } = useCart();
  const { login, register, googleLogin } = useAuth(); // AuthContext đã xử lý message API
  const location = useLocation();

  // State quản lý form đăng nhập
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [lockedMsg, setLockedMsg] = useState("");

  // State quản lý modal
  const [showForgot, setShowForgot] = useState(false);

  // State quản lý chế độ login/register
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // State quản lý form đăng ký
  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    password: "",
    password2: "",
  });

  // Cấu hình hiển thị notification (dùng cho các lỗi hệ thống phức tạp)
  const [api, contextHolder] = notification.useNotification();

  // Điều hướng theo vai trò
  const navigateByRole = (role) => {
    if (!role) return navigate("/");
    switch (role) { // role trả về từ context thường là string (VD: "admin") hoặc object tùy backend của bạn
      case "admin": navigate("/admin/dashboard"); break;
      case "seller": navigate("/seller-center"); break;
      default: navigate("/");
    }
  };

  // Hàm xử lý chung sau khi Login thành công
  const handleLoginSuccess = async (data) => {
    // Lưu ý: Message "Đăng nhập thành công" đã được AuthContext hiển thị, không cần gọi lại ở đây.
    
    await fetchCart(); // Cập nhật giỏ hàng

    const params = new URLSearchParams(location.search);
    const redirectPath = params.get("redirect");

    if (redirectPath) {
      navigate(redirectPath);
    } else {
      // Kiểm tra cấu trúc role trả về (data.role có thể là object hoặc string)
      const roleName = data.role?.name || data.role; 
      navigateByRole(roleName);
    }
  };

  // --- XỬ LÝ LOGIN GOOGLE ---
  const handleGoogleLogin = async (response) => {
    try {
      if (!response || !response.credential) {
        throw new Error("Không nhận được Google credential token");
      }

      const hideLoading = message.loading("Đang xác thực với Google...", 0);

      const res = await fetch(`${API_CONFIG.BASE_URL}/users/auth/google/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: response.credential }),
      });

      const data = await res.json();
      hideLoading(); // Tắt loading

      if (!res.ok) {
        throw new Error(data.error || "Google login thất bại");
      }

      // Gọi vào context (Context sẽ set User và Token)
      const result = await googleLogin(data);

      if (result.success) {
        await handleLoginSuccess(result.user || data);
      } 
      // Nếu thất bại, Context đã hiện lỗi, không cần làm gì thêm
    } catch (error) {
      console.error("Google login error:", error);
      api.error({
        message: "Đăng nhập Google thất bại",
        description: error.message || "Có lỗi xảy ra khi kết nối tới Google.",
        placement: "topRight",
      });
    }
  };

  // --- XỬ LÝ LOGIN FACEBOOK ---
  const handleFacebookLogin = async (accessToken) => {
    try {
      const hideLoading = message.loading("Đang xác thực với Facebook...", 0);

      const res = await fetch(`${API_CONFIG.BASE_URL}/users/auth/facebook/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken }),
      });

      const data = await res.json();
      hideLoading();

      if (!res.ok) {
        throw new Error(data.error || "Đăng nhập Facebook thất bại");
      }

      const result = await googleLogin(data); // Tái sử dụng logic login token
      if (result.success) {
        await handleLoginSuccess(result.user || data);
      }
    } catch (error) {
      console.error("Facebook login error:", error);
      api.error({
        message: "Đăng nhập Facebook thất bại",
        description: error.message,
        placement: "topRight",
      });
    }
  };

  // --- XỬ LÝ LOGIN THƯỜNG ---
  const handleSubmit = async (e) => {
    // 🔥 QUAN TRỌNG: Chặn reload trang
    e.preventDefault();

    // Validate phía Client (những cái cơ bản)
    if (!username || !password) {
      message.warning("Vui lòng nhập tên đăng nhập và mật khẩu!");
      return;
    }

    setLoading(true);

    try {
      // Gọi hàm login từ AuthContext
      // AuthContext sẽ tự hiện message.success hoặc message.error
      const result = await login(username, password);

      if (result.success) {
        // Chỉ điều hướng khi thành công
        await handleLoginSuccess({ role: result.role });
      } else {
        // Nếu thất bại:
        // 1. AuthContext đã hiện thông báo lỗi.
        // 2. Trang KHÔNG reload nhờ e.preventDefault()
        // 3. Form vẫn giữ nguyên dữ liệu để người dùng nhập lại.
        if (result.code === "account_locked" || result.code === "seller_locked") {
          setLockedMsg("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
        } else if (typeof result.error === "string" && /khóa|locked|inactive/i.test(result.error)) {
          setLockedMsg("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
        } else {
          setLockedMsg("");
        }
      }
    } catch (err) {
      // Lỗi sập mạng hoặc crash code
      api.error({
        message: "Lỗi hệ thống",
        description: "Không thể kết nối. Vui lòng thử lại sau.",
      });
    } finally {
      setLoading(false);
    }
  };

  // --- XỬ LÝ ĐĂNG KÝ ---
  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault(); // 🔥 Chặn reload

    // Validate input
    if (!registerForm.username || !registerForm.email || !registerForm.password || !registerForm.password2) {
      message.warning("Vui lòng điền đầy đủ thông tin đăng ký!");
      return;
    }

    if (registerForm.password !== registerForm.password2) {
      message.error("Mật khẩu nhập lại không khớp!");
      return;
    }

    if (registerForm.password.length < 6) {
      message.warning("Mật khẩu nên có ít nhất 6 ký tự.");
      return;
    }

    setLoading(true);
    try {
      // AuthContext handles success/error messages
      const res = await register({
        username: registerForm.username,
        email: registerForm.email,
        password: registerForm.password,
        password2: registerForm.password2,
      });

      if (res?.success) {
        // Đăng ký thành công -> Đã tự động login bên trong register (nếu logic AuthContext viết vậy)
        // Hoặc redirect về trang chủ
        await fetchCart();
        navigate("/");
      }
      // Nếu lỗi, AuthContext đã hiện Notification lỗi.
    } catch (err) {
       // Fallback error
       console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {/* Context Holder để hiển thị notification của Component này (nếu có dùng riêng) */}
      {contextHolder}

      <div className="container-fluid vh-100 d-flex flex-column p-0">
        {/* HEADER */}
        <header className="d-flex justify-content-between align-items-center px-4 p-2 shadow-sm" style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #e0e0e0" }}>
          <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", cursor: "pointer" }}>
            <img src="/assets/logo/defaultLogo.png" alt="GreenFarm" style={{ width: 40, height: 40, objectFit: "cover" }} />
            <Typography variant="h6" sx={{ fontWeight: "bold", color: "#195a34", ml: 1 }}>GreenFarm</Typography>
          </a>
          <div className="d-flex align-items-center gap-3">
            <FaQuestionCircle size={22} style={{ cursor: "pointer", color: "#4caf50" }} title="Hỗ trợ" />
          </div>
        </header>

        {/* MAIN CONTENT */}
        <div className="row flex-grow-1 m-0" style={{ backgroundColor: "#4caf50" }}>
          {/* LEFT SIDE: LOGO & SLOGAN */}
          <div className="col-12 col-md-7 d-flex flex-column justify-content-center align-items-center text-center text-white p-4"
            style={{ backgroundImage: "linear-gradient(rgba(76,175,80,0.85), rgba(76,175,80,0.85))", backgroundSize: "cover", backgroundPosition: "center" }}>
            <Box>
              <Box component="img" src="assets/logo/whitelogo1.png" alt="GreenFarm Logo" sx={{ width: 160, height: 180 }} />
              <Typography variant="h2" fontWeight="bold" sx={{ mb: 1 }}>GreenFarm</Typography>
              <Typography variant="h5" sx={{ maxWidth: 500, mx: "auto", mb: 4, fontStyle: "italic", fontWeight: 400 }}>
                Nông sản chuẩn sạch, nguồn gốc minh bạch
              </Typography>
            </Box>
          </div>

          {/* RIGHT SIDE: FORM */}
          <div className="col-12 col-md-3 d-flex justify-content-center align-items-center" style={{ padding: "20px", backgroundColor: "#4caf50", width: "500px" }}>
            <Paper elevation={6} sx={{ p: 4, width: "600px", borderRadius: 3 }}>
              <Typography variant="h4" fontWeight="normal" align="center" sx={{ color: "black", mb: 2 }}>
                {isRegisterMode ? "Đăng ký" : "Đăng nhập"}
              </Typography>

              <Typography variant="body1" align="center" color="text.secondary" mb={3}>
                {isRegisterMode ? "Tạo tài khoản GreenFarm" : "Chào mừng bạn trở lại với GreenFarm"}
              </Typography>

              {/* Inline alert khi tài khoản bị khóa */}
              {!isRegisterMode && lockedMsg && (
                <Box mb={2}>
                  <Paper elevation={0} sx={{ p: 1.5, border: "1px solid #ffcdd2", background: "#ffebee" }}>
                    <Typography variant="body2" sx={{ color: "#d32f2f" }}>{lockedMsg}</Typography>
                  </Paper>
                </Box>
              )}

              {/* LOGIN FORM */}
              {!isRegisterMode ? (
                <form onSubmit={handleSubmit}>
                  <TextField label="Tên đăng nhập" variant="outlined" fullWidth margin="normal"
                    value={username} onChange={(e) => setUsername(e.target.value)} autoFocus required />
                  <TextField label="Mật khẩu" type="password" variant="outlined" fullWidth margin="normal"
                    value={password} onChange={(e) => setPassword(e.target.value)} required />

                  <Button type="submit" variant="contained" fullWidth
                    sx={{ mt: 2, py: 1.2, fontWeight: "bold", backgroundColor: "#4caf50", "&:hover": { backgroundColor: "#43a047" } }}
                    disabled={loading}>
                    {loading ? <CircularProgress size={24} color="inherit" /> : "Đăng nhập"}
                  </Button>
                </form>
              ) : (
                /* REGISTER FORM */
                <form onSubmit={handleRegisterSubmit}>
                  <TextField label="Tên đăng nhập" name="username" variant="outlined" fullWidth margin="normal"
                    value={registerForm.username} onChange={handleRegisterChange} required />
                  <TextField label="Email" name="email" type="email" variant="outlined" fullWidth margin="normal"
                    value={registerForm.email} onChange={handleRegisterChange} required />
                  <TextField label="Mật khẩu" name="password" type="password" variant="outlined" fullWidth margin="normal"
                    value={registerForm.password} onChange={handleRegisterChange} required />
                  <TextField label="Nhập lại mật khẩu" name="password2" type="password" variant="outlined" fullWidth margin="normal"
                    value={registerForm.password2} onChange={handleRegisterChange} required />

                  <Button type="submit" variant="contained" fullWidth
                    sx={{ mt: 2, py: 1.2, fontWeight: "bold", backgroundColor: "#4caf50", "&:hover": { backgroundColor: "#43a047" } }}
                    disabled={loading}>
                    {loading ? <CircularProgress size={24} color="inherit" /> : "Đăng ký"}
                  </Button>
                </form>
              )}

              {/* FOOTER ACTIONS */}
              <Box display="flex" justifyContent="space-between" mt={2}>
                {!isRegisterMode ? (
                  <>
                    <Link component="button" variant="body2" underline="hover" onClick={() => setShowForgot(true)}>
                      Quên mật khẩu?
                    </Link>
                    <Link component="button" variant="body2" underline="hover" onClick={() => { setIsRegisterMode(true); }}>
                      Đăng ký
                    </Link>
                  </>
                ) : (
                  <Link component="button" variant="body2" underline="hover" onClick={() => { setIsRegisterMode(false); setRegisterForm({ username: "", email: "", password: "", password2: "" }); }} fullWidth sx={{ textAlign: "center" }}>
                    Quay lại đăng nhập
                  </Link>
                )}
              </Box>

              <Divider sx={{ my: 3 }}>Hoặc</Divider>

              {/* SOCIAL LOGIN */}
              <div className="row g-2">
                <div className="col-12 col-sm-6 d-flex align-items-center " style={{ justifyContent: "end", paddingRight: "20px" }}>
                  <GoogleLoginButton onSuccess={handleGoogleLogin} />
                </div>
                <div className="col-12 col-sm-6 d-flex align-items-center justify-content-start ">
                  <div>
                    <FacebookLoginButton onSuccess={handleFacebookLogin} />
                  </div>
                </div>
              </div>

              <Typography variant="caption" color="text.secondary" align="center" display="block" mt={3}>
                © 2025 GreenFarm. Tất cả quyền được bảo lưu.
              </Typography>
            </Paper>
          </div>
        </div>

        {/* MODAL FORGOT PASSWORD */}
        {showForgot && (
          <ModalWrapper onClose={() => setShowForgot(false)}>
            <ForgotPasswordForm onClose={() => setShowForgot(false)} onSuccess={(email) => message.success(`Email khôi phục đã được gửi tới ${email}`)} />
          </ModalWrapper>
        )}
      </div>
    </GoogleOAuthProvider>
  );
}