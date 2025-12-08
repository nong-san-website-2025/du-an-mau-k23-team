// src/pages/Login.tsx
import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput,
  IonButton,
  IonItem,
  IonLabel,
  IonText,
  IonLoading,
  useIonRouter,
  useIonToast,
} from "@ionic/react";
import { useAuth } from "../context/AuthContext";

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useIonRouter();
  const [presentToast] = useIonToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      presentToast({ message: "Vui lòng nhập đầy đủ thông tin", duration: 2000 });
      return;
    }

    setLoading(true);
    const result = await login(username, password);
    setLoading(false);

    if (result.success) {
      router.push("/", "root");
    } else {
      presentToast({ message: result.error || "Đăng nhập thất bại", duration: 2000 });
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Đăng Nhập</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <form onSubmit={handleLogin}>
          <IonItem>
            <IonLabel position="stacked">Tên đăng nhập</IonLabel>
            <IonInput
              value={username}
              onIonInput={(e) => setUsername(e.detail.value?.toString() || "")}
              type="text"
              clearInput
            />
          </IonItem>

          <IonItem className="ion-margin-top">
            <IonLabel position="stacked">Mật khẩu</IonLabel>
            <IonInput
              value={password}
              onIonInput={(e) => setPassword(e.detail.value?.toString() || "")}
              type="password"
              clearInput
            />
          </IonItem>

          <IonButton
            expand="block"
            type="submit"
            className="ion-margin-top"
            disabled={loading}
          >
            Đăng Nhập
          </IonButton>

          <IonText
            color="medium"
            onClick={() => router.push("/register")}
            className="ion-margin-top ion-padding-start"
            style={{ display: "block", cursor: "pointer" }}
          >
            Chưa có tài khoản? Đăng ký
          </IonText>
        </form>

        <IonLoading isOpen={loading} message="Đang đăng nhập..." />
      </IonContent>
    </IonPage>
  );
};

export default LoginPage;