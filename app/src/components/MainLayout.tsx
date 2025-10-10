import React from "react";
import { IonPage, IonContent } from "@ionic/react";
// import HeaderBar from "./HeaderBar";

interface MainLayoutProps {
  title: string;
  children: React.ReactNode; // nội dung từng trang
  showFooter?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  // title,
  children,
//   showFooter = true,
}) => {
  return (
    <IonPage>
      {/* <HeaderBar title={title} /> */}
      <IonContent fullscreen>{children}</IonContent>
    </IonPage>
  );
};

export default MainLayout;
