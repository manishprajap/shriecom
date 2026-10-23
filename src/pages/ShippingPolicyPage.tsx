import { IonPage, IonContent, IonIcon } from "@ionic/react";
import { arrowBackOutline } from "ionicons/icons";
///import { useHistory } from "react-router";
import { useLocation, useHistory } from "react-router";

const ShippingPolicyPage: React.FC = () => {
  const history = useHistory();
	const location = useLocation<any>();
	
const handleBack = () => {
  if (location.state?.from) {
    history.replace(location.state.from);
  } else {
    history.replace("/"); // fallback (homepage)
  }
};
  const sections = [
    {
      title: "1. Delivery Areas",
      content:
        "You can check whether our delivery service is available in your area by entering your PIN code on the checkout page. We are continuously expanding our delivery areas to reach as many customers as possible.",
    },
    {
      title: "2. Delivery Timeframes",
      content:
        "For Standard Delivery, the timeframe depends on your location and current demand following order confirmation. During peak periods or adverse weather conditions, delivery may take slightly longer. You will receive real-time updates regarding the status of your order.",
    },
    {
      title: "3. Delivery Charges",
      content:
        "Additional surge charges may apply during peak hours or adverse weather conditions, and you will always be informed of this before placing your order.",
    },
    {
      title: "4. Order Tracking",
      content:
        "Once your order is dispatched, you can track your delivery rider in real time through the app. You will also receive SMS and push notifications at key stages — order confirmed, out for delivery, and delivered.",
    },
    {
      title: "5. Failed Deliveries",
      content:
        "If a delivery attempt fails due to an incorrect address or unavailability of the recipient, our delivery rider will try to contact you. If we are unable to reach you, the order may be cancelled and a refund will be processed as per our refund policy.",
    },
    {
      title: "6. Damaged or Missing Items",
      content:
        "If you receive a damaged product or find that an item is missing from your order, please report it immediately—either via the app in the presence of the delivery personnel or by contacting our support team. We will promptly arrange for a replacement or issue a refund.",
    },
    {
      title: "7. Special Handling",
      content:
        "Fragile, perishable, or temperature-sensitive items (such as dairy products, frozen goods, and fresh fruits and vegetables) are handled with extreme care, and appropriate measures are taken to maintain their quality during transit.",
    },
    {
      title: "8. Holidays & Disruptions",
      content:
        "We strive to deliver seven days a week, even on public holidays. However, services may be limited or unavailable during periods of inclement weather, local disruptions, or unforeseen events. If an unforeseen event causes any interruption to our services, we will notify you via the app.",
    },
  ];

  return (
    <IonPage>
      <IonContent fullscreen>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
          * { box-sizing:border-box; margin:0; padding:0; font-family:'Nunito',sans-serif; }
          :root { --amber:#E07B00; --charcoal:#1A1714; --muted:#9B8E84; --bg:#FFFBEB; --border:#EAE5DF; }

          .ship-root { background:var(--bg); min-height:100vh; padding-bottom:40px; }
          .ship-header { position:sticky; top:0; z-index:100; background:#FFFBEB; border-bottom:1px solid #F0E8C0; padding:12px 16px; display:flex; align-items:center; gap:12px; }
          .ship-back { width:38px; height:38px; border-radius:12px; background:white; border:1.5px solid #E8DFC0; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; }
          .ship-header h2 { font-size:17px; font-weight:900; color:var(--charcoal); }

          .ship-hero { background:linear-gradient(135deg,#1A1714,#2D2520); padding:28px 20px; text-align:center; }
          .ship-hero h1 { font-size:22px; font-weight:900; color:white; }
          .ship-hero p  { font-size:12px; color:rgba(255,255,255,0.55); margin-top:6px; font-weight:600; }

          .ship-body { padding:20px 16px; }
          .ship-updated { font-size:11px; color:var(--muted); font-weight:700; margin-bottom:16px; background:white; padding:8px 12px; border-radius:10px; border:1px solid var(--border); display:inline-block; }

          .ship-section { margin-bottom:16px; background:white; border-radius:16px; padding:16px; border:1px solid var(--border); }
          .ship-section-title { font-size:14px; font-weight:900; color:var(--charcoal); margin-bottom:8px; }
          .ship-section-text  { font-size:13px; color:#5C4A2A; line-height:1.75; font-weight:600; }

          .ship-contact { background:linear-gradient(135deg,rgba(224,123,0,0.08),rgba(180,83,9,0.06)); border:1px solid rgba(224,123,0,0.2); border-radius:16px; padding:16px; text-align:center; }
          .ship-contact p { font-size:13px; color:var(--charcoal); font-weight:700; line-height:1.6; }
          .ship-contact a { color:var(--amber); font-weight:800; }
        `}</style>

        <div className="ship-root">
          <div className="ship-header">
            <div className="ship-back" onClick={handleBack}>
              <IonIcon icon={arrowBackOutline} style={{ fontSize: 20, color: "#1A1714" }} />
            </div>
            <h2>Shipping Policy</h2>
          </div>

          <div className="ship-hero">
            <h1>🚚 Fast & Reliable Delivery</h1>
            <p>Everything you need to know about how we deliver to you</p>
          </div>

          <div className="ship-body">
           
            {sections.map((s) => (
              <div key={s.title} className="ship-section">
                <div className="ship-section-title">{s.title}</div>
                <div className="ship-section-text">{s.content}</div>
              </div>
            ))}

            <div className="ship-contact">
              <p>
                Have questions about your delivery? Reach our support team at{" "}
                <a href="mailto:shrient.99@gmail.com">shrient.99@gmail.com</a>{" "}
                or contact us at Shri Enterprises , Lucknow, Uttar Pradesh - 226004.
              </p>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ShippingPolicyPage;