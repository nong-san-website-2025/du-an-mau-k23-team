import {
  IonApp,
  IonTabs,
  IonRouterOutlet,
  setupIonicReact,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import AppRoutes from "./routes/AppRoutes";
import TabNavigation from "./components/TabNavigation";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";

import "@ionic/react/css/core.css";
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";
import "@ionic/react/css/palettes/dark.system.css";
import "./theme/variables.css";
import { CartProvider } from "./context/CartContext";
import { ToastContainer } from "react-toastify";

setupIonicReact();

if (Capacitor.isNativePlatform()) {
  StatusBar.setOverlaysWebView({ overlay: false });
  StatusBar.setBackgroundColor({ color: "#4caf50" }); // trùng màu header
  StatusBar.setStyle({ style: Style.Light }); // biểu tượng trắng
}

const App: React.FC = () => (
  <CartProvider>
    <IonApp>
      <IonReactRouter>
        <IonTabs>
          <IonRouterOutlet>
            <AppRoutes />
          </IonRouterOutlet>
          <TabNavigation />
        </IonTabs>
      </IonReactRouter>
    </IonApp>
    <ToastContainer
      position="bottom-right"
      autoClose={2000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      
    />
  </CartProvider>
);

export default App;
