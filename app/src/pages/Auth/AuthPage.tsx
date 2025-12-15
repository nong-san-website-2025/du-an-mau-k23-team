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
import { useAuth } from "../../context/AuthContext";
import { useLocation } from "react-router-dom";
import "../../styles/AuthPage.css"; // Đổi tên file css tương ứng

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
    confirmPassword: "", // Chỉ dùng cho đăng ký
    email: "", // Chỉ dùng cho đăng ký
    phone: "", // Chỉ dùng cho đăng ký
  });

  const { login } = useAuth(); // Giả sử bạn sẽ có thêm hàm register trong context sau này
  const router = useIonRouter();
  const [presentToast] = useIonToast();

  // --- LOGIC XỬ LÝ ---

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validate chung
    if (!formData.username || !formData.password) {
      presentToast({
        message: "Vui lòng nhập đầy đủ thông tin!",
        duration: 2000,
        color: "warning",
      });
      return;
    }

    // 2. Logic riêng cho Đăng ký
    if (!isLoginView) {
      if (formData.password !== formData.confirmPassword) {
        presentToast({
          message: "Mật khẩu nhập lại không khớp!",
          duration: 2000,
          color: "danger",
        });
        return;
      }
      // TODO: Gọi hàm register từ AuthContext ở đây
      // await register(...)
      presentToast({
        message: "Tính năng đăng ký đang phát triển",
        duration: 2000,
        color: "secondary",
      });
      return;
    }

    // 3. Logic Đăng nhập
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
        message: result.error || "Lỗi xác thực",
        duration: 3000,
        color: "danger",
      });
    }
  };

  // Hàm chuyển đổi view và reset form
  const toggleView = () => {
    setIsLoginView(!isLoginView);
    // Tuỳ chọn: Reset form khi chuyển tab để sạch sẽ
    // setFormData({ username: "", password: "", confirmPassword: "", email: "", phone: "" });
  };

  return (
    <IonPage className="auth-page">
      <IonContent fullscreen scrollY={false}>
        {/* HEADER (Giữ nguyên) */}
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
            {/* Title & Toggle */}
            <div className="ion-text-center ion-margin-bottom">
              <h2 className="auth-title">
                {isLoginView ? "Đăng Nhập" : "Đăng Ký Tài Khoản"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="fade-in-animation">
              {/* --- CÁC TRƯỜNG CHUNG --- */}
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

              {/* --- CÁC TRƯỜNG CHỈ CÓ Ở ĐĂNG KÝ --- */}
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

              {/* Confirm Password cho Đăng ký */}
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

              {/* Forgot Password (Chỉ hiện khi Login) */}
              {isLoginView && (
                <div className="forgot-password ion-text-end">
                  <IonButton
                    fill="clear"
                    size="small"
                    color="medium"
                    className="no-ripple"
                  >
                    Quên mật khẩu?
                  </IonButton>
                </div>
              )}

              {/* Action Button */}
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

            {/* Social Divider (Chỉ hiện khi Login cho gọn) */}
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
          message="Đang xử lý..."
          spinner="crescent"
          cssClass="custom-loading"
        />
      </IonContent>
    </IonPage>
  );
};

export default AuthPage;
