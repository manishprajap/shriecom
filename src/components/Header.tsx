import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonSearchbar,
} from "@ionic/react";
import { cartOutline, personOutline } from "ionicons/icons";

const Header = () => {
  return (
    <IonHeader>
      <IonToolbar>

        {/* App Name */}
        <IonTitle>Shri Enterprises</IonTitle>

        {/* Right Side Buttons */}
        <IonButtons slot="end">
          <IonButton>
            <IonIcon icon={personOutline} />
          </IonButton>

          <IonButton>
            <IonIcon icon={cartOutline} />
          </IonButton>
        </IonButtons>
      </IonToolbar>

      {/* Search Bar */}
      <IonToolbar>
        <IonSearchbar placeholder="Search products..." />
      </IonToolbar>

    </IonHeader>
  );
};

export default Header;