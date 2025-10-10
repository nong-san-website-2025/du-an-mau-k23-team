import React from "react";
import { Redirect, Route } from "react-router-dom";
import { IonRouterOutlet } from "@ionic/react";
import Tab1 from "../pages/Tab1";
import Tab2 from "../pages/Tab2";
import Tab3 from "../pages/Tab3";
import Tab4 from "../pages/Tab4";
import Tab5 from "../pages/Tab5";
import CartPage from "../pages/CartPage";

const AppRoutes: React.FC = () => {
  return (
    <IonRouterOutlet>
      <Route exact path="/tab1" component={Tab1} />
      <Route exact path="/tab2" component={Tab2} />
      <Route path="/tab3" component={Tab3} />
      <Route path="/tab4" component={Tab4} />
      <Route path="/tab5" component={Tab5} />
      <Route path="/cart" component={CartPage} />
      <Route exact path="/">
        <Redirect to="/tab1" />
      </Route>
    </IonRouterOutlet>
  );
};

export default AppRoutes;
