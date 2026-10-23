import { useEffect } from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact, useIonRouter } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { App as CapacitorApp } from '@capacitor/app';

import Home from './pages/Home';
import CategoryPage from './pages/CategoryPage';
import Store from './pages/Store';
import CartPage from './pages/CartPage';
import ProductDetail from './pages/ProductDetail';
import RecipeDetail from './pages/RecipeDetail';
import SkillPage from './pages/SkillPage';
import MyOrders from './pages/Myorders';
import SavedAddresses from './pages/Savedaddresses';
import AccountPrivacy from './pages/Accountprivacy';
import WalletPage from './pages/Walletpage';
import PrescriptionsPage from './pages/Prescriptionspage';
import GiftCardPage from './pages/Giftcardpage';
import CheckoutPage from './pages/Checkoutpage';
import SearchResults from './pages/SearchResults';
import ListPage from './pages/ListPage';
import AboutPage from './pages/AboutPage';
import PartnerPage from './pages/PartnerPage';
import SupportPage from './pages/SupportPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import RefundPage from './pages/RefundPage';
import ShippingPage from './pages/ShippingPolicyPage';
import OrderTracking from './pages/OrderTracking';
import EditProfile from './pages/EditProfile';
import MyEnquiries from './pages/MyEnquiries';

/* Ionic Core CSS */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import '@ionic/react/css/palettes/dark.system.css';
import './theme/variables.css';

setupIonicReact();

const BackButtonHandler: React.FC = () => {
  const router = useIonRouter();

  useEffect(() => {
    const handlerPromise = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack && router.canGoBack()) {
        router.goBack();
      } else {
        CapacitorApp.exitApp();
      }
    });
    return () => {
      handlerPromise.then((handle) => handle.remove());
    };
  }, [router]);

  return null;
};

/* ══════════════════════════════════════════
   Main App
══════════════════════════════════════════ */
const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <BackButtonHandler />
      <IonRouterOutlet>
        <Route exact path="/" component={Home} />
        <Route exact path="/category/:id" component={CategoryPage} />
        <Route exact path="/store" component={Store} />
        <Route exact path="/cart" component={CartPage} />
        <Route exact path="/product/:id" component={ProductDetail} />
        <Route exact path="/recipe/:id" component={RecipeDetail} />
        <Route exact path="/skill-page" component={SkillPage} />
        <Route exact path="/orders" component={MyOrders} />
        <Route exact path="/addresses" component={SavedAddresses} />
        <Route exact path="/wallet" component={WalletPage} />
        <Route exact path="/prescriptions" component={PrescriptionsPage} />
        <Route exact path="/giftcard" component={GiftCardPage} />
        <Route exact path="/checkout" component={CheckoutPage} />
        <Route exact path="/search" component={SearchResults} />
        <Route exact path="/order-tracking/:id" component={OrderTracking} />

        <Route exact path="/all-categories" component={ListPage} />
        <Route exact path="/all-deals" component={ListPage} />
        <Route exact path="/all-fresh" component={ListPage} />
        <Route exact path="/all-recipes" component={ListPage} />

        <Route exact path="/about" component={AboutPage} />
        <Route exact path="/partner" component={PartnerPage} />
        <Route exact path="/privacy" component={PrivacyPage} />
        <Route exact path="/support" component={SupportPage} />
        <Route exact path="/terms" component={TermsPage} />
        <Route exact path="/refunds" component={RefundPage} />
        <Route exact path="/shipping" component={ShippingPage} />
        <Route exact path="/account-privacy" component={AccountPrivacy} />
        <Route exact path="/edit-profile" component={EditProfile} />
        <Route exact path="/my-enquiries" component={MyEnquiries} />

        {/* Fallback for unmatched routes */}
        <Route render={() => <Redirect to="/" />} />
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;