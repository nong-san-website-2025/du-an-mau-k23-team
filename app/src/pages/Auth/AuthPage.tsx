import React, { useState } from "react";
import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  IonText,
  IonLoading,
  useIonRouter,
  useIonToast,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
} from "@ionic/react";
import {
  logInOutline,
  personAddOutline,
  leaf,
  lockClosedOutline,
  personOutline,
  eyeOutline,
  eyeOffOutline,
  logoGoogle,
  logoFacebook,
  mailOutline,
  callOutline,
} from "ionicons/icons";
import { useAuth } from "../../context/AuthContext"; // Đảm bảo đường dẫn đúng
import { useLocation } from "react-router-dom";
import "../../styles/AuthPage.css";

const AuthPage: React.FC = () => {
  const location = useLocation();
  const isRegisterRoute = location.pathname === "/register";
  
  // --- STATE QUẢN LÝ ---
  const [isLoginView, setIsLoginView] = useState(!isRegisterRoute);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    phone: "",
  });

  // Lấy cả login và register từ Context
  const { login, register } = useAuth(); 
  const router = useIonRouter();
  const [presentToast] = useIonToast();

  // --- LOGIC HELPER ---

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Validate form đăng ký (Logic chuẩn Senior: Validate Client trước)
  const validateRegisterForm = () => {
    const { username, email, password, confirmPassword } = formData;
    
    if (!username || !email || !password || !confirmPassword) {
      return "Vui lòng điền đầy đủ thông tin bắt buộc!";
    }

    // Validate Email cơ bản
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Email không hợp lệ!";
    }

    if (password !== confirmPassword) {
      return "Mật khẩu nhập lại không khớp!";
    }

    if (password.length < 8) {
      return "Mật khẩu phải có ít nhất 8 ký tự!";
    }

    if (!/[A-Z]/.test(password)) {
      return "Mật khẩu phải chứa ít nhất 1 ký tự in hoa!";
    }

    if (!/\d/.test(password)) {
      return "Mật khẩu phải chứa ít nhất 1 số!";
    }

    return null; // Không có lỗi
  };

  // --- XỬ LÝ SUBMIT ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Xử lý ĐĂNG KÝ
    if (!isLoginView) {
      const validationError = validateRegisterForm();
      if (validationError) {
        presentToast({
          message: validationError,
          duration: 3000,
          color: "warning",
          position: "top",
        });
        return;
      }

      setLoading(true);
      
      // Map data cho khớp với Serializer của Django (thường cần password2 hoặc confirm_password)
      const registerPayload = {
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        password2: formData.confirmPassword, // Gửi field này để backend validate khớp pass
      };

      const res = await register(registerPayload);
      setLoading(false);

      if (res.success) {
        presentToast({
          message: "Đăng ký thành công! Chào mừng đến GreenFarm.",
          duration: 2000,
          color: "success",
        });
        // Vì AuthContext.register đã tự gọi login bên trong, ta chỉ cần redirect
        router.push("/", "root", "replace");
      } else {
        // Hiển thị lỗi cụ thể từ Server (VD: Username đã tồn tại)
        presentToast({
          message: res.error || "Đăng ký thất bại. Vui lòng thử lại.",
          duration: 3000,
          color: "danger",
        });
      }
      return;
    }

    // 2. Xử lý ĐĂNG NHẬP
    if (!formData.username || !formData.password) {
        presentToast({
            message: "Vui lòng nhập tên đăng nhập và mật khẩu!",
            duration: 2000,
            color: "warning",
        });
        return;
    }

    setLoading(true);
    const result = await login(formData.username, formData.password);
    setLoading(false);

    if (result.success) {
      presentToast({
        message: "Đăng nhập thành công!",
        duration: 1500,
        color: "success",
      });
      router.push("/", "root", "replace");
    } else {
      presentToast({
        message: result.error || "Sai tên đăng nhập hoặc mật khẩu",
        duration: 3000,
        color: "danger",
      });
    }
  };

  const toggleView = () => {
    setIsLoginView(!isLoginView);
    // Reset nhẹ các field nhạy cảm khi chuyển tab, giữ lại username nếu có
    setFormData(prev => ({ ...prev, password: "", confirmPassword: "" }));
  };

  return (
    <IonPage className="auth-page">
      <IonContent fullscreen scrollY={false}>
        {/* HEADER */}
        <div className="auth-header-bg">
          <div className="brand-container">
            <div className="logo-circle">
              <IonIcon icon={leaf} />
            </div>
            <h1>GreenFarm</h1>
            <p>Nông sản sạch cho mọi nhà</p>
          </div>
        </div>

        {/* FORM CONTAINER */}
        <div
          className={`auth-form-container ${
            !isLoginView ? "register-mode" : ""
          }`}
        >
          <div className="form-content">
            <div className="ion-text-center ion-margin-bottom">
              <h2 className="auth-title">
                {isLoginView ? "Đăng Nhập" : "Đăng Ký Tài Khoản"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="fade-in-animation">
              {/* Username */}
              <div className="input-group">
                <IonInput
                  className="custom-input"
                  fill="outline"
                  label="Tên đăng nhập"
                  labelPlacement="floating"
                  value={formData.username}
                  onIonInput={(e) =>
                    handleInputChange("username", e.detail.value!)
                  }
                  shape="round"
                >
                  <IonIcon
                    slot="start"
                    icon={personOutline}
                    aria-hidden="true"
                  />
                </IonInput>
              </div>

              {/* Các trường Đăng ký thêm */}
              {!isLoginView && (
                <>
                  <div className="input-group slide-in">
                    <IonInput
                      className="custom-input"
                      fill="outline"
                      label="Email"
                      type="email"
                      labelPlacement="floating"
                      value={formData.email}
                      onIonInput={(e) =>
                        handleInputChange("email", e.detail.value!)
                      }
                      shape="round"
                    >
                      <IonIcon
                        slot="start"
                        icon={mailOutline}
                        aria-hidden="true"
                      />
                    </IonInput>
                  </div>
                  <div className="input-group slide-in">
                    <IonInput
                      className="custom-input"
                      fill="outline"
                      label="Số điện thoại"
                      type="tel"
                      labelPlacement="floating"
                      value={formData.phone}
                      onIonInput={(e) =>
                        handleInputChange("phone", e.detail.value!)
                      }
                      shape="round"
                    >
                      <IonIcon
                        slot="start"
                        icon={callOutline}
                        aria-hidden="true"
                      />
                    </IonInput>
                  </div>
                </>
              )}

              {/* Password */}
              <div className="input-group">
                <IonInput
                  className="custom-input"
                  fill="outline"
                  label="Mật khẩu"
                  labelPlacement="floating"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onIonInput={(e) =>
                    handleInputChange("password", e.detail.value!)
                  }
                  shape="round"
                >
                  <IonIcon
                    slot="start"
                    icon={lockClosedOutline}
                    aria-hidden="true"
                  />
                  <IonButton
                    fill="clear"
                    slot="end"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <IonIcon
                      icon={showPassword ? eyeOffOutline : eyeOutline}
                      slot="icon-only"
                    />
                  </IonButton>
                </IonInput>
              </div>

              {/* Confirm Password */}
              {!isLoginView && (
                <div className="input-group slide-in">
                  <IonInput
                    className="custom-input"
                    fill="outline"
                    label="Nhập lại mật khẩu"
                    labelPlacement="floating"
                    type={showPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onIonInput={(e) =>
                      handleInputChange("confirmPassword", e.detail.value!)
                    }
                    shape="round"
                  >
                    <IonIcon
                      slot="start"
                      icon={lockClosedOutline}
                      aria-hidden="true"
                    />
                  </IonInput>
                </div>
              )}

              {/* Forgot Password Link */}
              {isLoginView && (
                <div className="forgot-password ion-text-end">
                  <IonButton
                    fill="clear"
                    size="small"
                    color="medium"
                    className="no-ripple"
                    // Thêm action quên mật khẩu sau này
                  >
                    Quên mật khẩu?
                  </IonButton>
                </div>
              )}

              {/* Submit Button */}
              <IonButton
                expand="block"
                type="submit"
                className="auth-btn ion-margin-top"
                disabled={loading}
                shape="round"
              >
                {loading
                  ? "Đang xử lý..."
                  : isLoginView
                  ? "Đăng Nhập"
                  : "Đăng Ký"}
                {!loading && (
                  <IonIcon
                    slot="end"
                    icon={isLoginView ? logInOutline : personAddOutline}
                  />
                )}
              </IonButton>
            </form>

            {/* Social Login (Giữ nguyên) */}
            {isLoginView && (
              <>
                <div className="divider">
                  <span>Hoặc tiếp tục với</span>
                </div>
                <IonGrid>
                  <IonRow>
                    <IonCol>
                      <IonButton
                        expand="block"
                        fill="outline"
                        color="danger"
                        className="social-btn"
                        // Thêm logic Google login
                      >
                        <IonIcon icon={logoGoogle} />
                      </IonButton>
                    </IonCol>
                    <IonCol>
                      <IonButton
                        expand="block"
                        fill="outline"
                        color="primary"
                        className="social-btn"
                      >
                        <IonIcon icon={logoFacebook} />
                      </IonButton>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </>
            )}

            {/* Toggle View Footer */}
            <div className="auth-footer ion-text-center">
              <IonText color="medium">
                {isLoginView ? "Bạn chưa có tài khoản?" : "Đã có tài khoản?"}
              </IonText>
              <IonButton
                fill="clear"
                size="small"
                onClick={toggleView}
                className="toggle-view-btn"
              >
                {isLoginView ? "Đăng ký ngay" : "Đăng nhập ngay"}
              </IonButton>
            </div>
          </div>
        </div>

        <IonLoading
          isOpen={loading}
          message="Vui lòng chờ..."
          spinner="crescent"
          cssClass="custom-loading"
        />
      </IonContent>
    </IonPage>
  );
};

export default AuthPage;