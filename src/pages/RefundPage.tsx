import { IonPage, IonContent, IonIcon } from "@ionic/react";
import { arrowBackOutline, checkmarkCircleOutline } from "ionicons/icons";
import { useHistory ,useLocation } from "react-router";

const RefundPage: React.FC = () => {
  const history = useHistory();
   const location = useLocation<any>();
	
const handleBack = () => {
  if (location.state?.from) {
    history.replace(location.state.from);
  } else {
    history.replace("/"); // fallback (homepage)
  }
};

  const steps = [
    { step: "1", title: "Report the Issue",    desc: "Go to My Orders → Select order → Tap 'Report Issue'", icon: "📱" },
    { step: "2", title: "We Review",           desc: "Our team will review your complaint as soon as possible.",    icon: "🔍" },
    { step: "3", title: "Refund Initiated",    desc: "Approved refunds are processed immediately",           icon: "✅" },
    { step: "4", title: "Money Back",          desc: "Credited to your original payment method in 24–48 hrs", icon: "💰" },
  ];

  const policies = [
    { emoji: "🥬", title: "Wrong / Missing Item",  time: "Immediately inform the company in the presence of the delivery boy.",  refund: "100% Refund",       color: "#DCFCE7", accent: "#16A34A" },
    { emoji: "🍌", title: "Damaged / Spoiled",     time: "Immediately inform the company in the presence of the delivery boy.",  refund: "100% Refund",       color: "#FEF3C7", accent: "#D97706" },
    { emoji: "⏰", title: "Late Delivery (>30 min only fast food scheme)",time: "Auto-detected",          refund: "₹30 Coupon",        color: "#DBEAFE", accent: "#2563EB" },
    { emoji: "❌", title: "Order Cancelled",       time: "Before dispatch",        refund: "Full Refund",       color: "#FCE7F3", accent: "#DB2777" },
    { emoji: "💳", title: "Payment Failure",       time: "Auto-detected",          refund: "Immediate Reversal", color: "#E0F2FE", accent: "#0284C7" },
  ];

  return (
    <IonPage>
      <IonContent fullscreen>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
          * { box-sizing:border-box; margin:0; padding:0; font-family:'Nunito',sans-serif; }
          :root { --amber:#E07B00; --charcoal:#1A1714; --muted:#9B8E84; --bg:#FFFBEB; --border:#EAE5DF; --green:#0C831F; }

          .rp-root { background:var(--bg); min-height:100vh; padding-bottom:40px; }
          .rp-header { position:sticky; top:0; z-index:100; background:#FFFBEB; border-bottom:1px solid #F0E8C0; padding:12px 16px; display:flex; align-items:center; gap:12px; }
          .rp-back { width:38px; height:38px; border-radius:12px; background:white; border:1.5px solid #E8DFC0; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; }
          .rp-header h2 { font-size:17px; font-weight:900; color:var(--charcoal); }

          .rp-hero { background:linear-gradient(135deg,#0C831F,#065F46); padding:28px 20px; text-align:center; }
          .rp-hero h1 { font-size:22px; font-weight:900; color:white; }
          .rp-hero p  { font-size:12px; color:rgba(255,255,255,0.75); margin-top:6px; font-weight:600; }

          .rp-guarantee { margin:16px; background:linear-gradient(135deg,rgba(12,131,31,0.08),rgba(6,95,70,0.06)); border:1px solid rgba(12,131,31,0.2); border-radius:16px; padding:16px; text-align:center; }
          .rp-guarantee-icon { font-size:36px; margin-bottom:8px; }
          .rp-guarantee h3   { font-size:16px; font-weight:900; color:var(--green); }
          .rp-guarantee p    { font-size:12px; color:#5C4A2A; font-weight:600; margin-top:4px; line-height:1.5; }

          .rp-section { padding:16px 16px 0; }
          .rp-title   { font-size:15px; font-weight:900; color:var(--charcoal); margin-bottom:14px; }

          /* Steps */
          .rp-steps { display:flex; flex-direction:column; gap:0; margin-bottom:20px; }
          .rp-step  { display:flex; align-items:flex-start; gap:14px; padding:14px; background:white; border-radius:0; border:1px solid var(--border); border-bottom:none; position:relative; }
          .rp-step:first-child { border-radius:16px 16px 0 0; }
          .rp-step:last-child  { border-radius:0 0 16px 16px; border-bottom:1px solid var(--border); }
          .rp-step-num { width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg,#E07B00,#B45309); color:white; font-size:14px; font-weight:900; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
          .rp-step-icon { font-size:22px; flex-shrink:0; }
          .rp-step-body strong { display:block; font-size:13px; font-weight:800; color:var(--charcoal); }
          .rp-step-body span   { font-size:12px; color:var(--muted); font-weight:600; margin-top:2px; display:block; }

          /* Policy cards */
          .rp-policy-list { display:flex; flex-direction:column; gap:8px; }
          .rp-policy-card { display:flex; align-items:center; gap:12px; background:white; border-radius:14px; padding:14px; border:1px solid var(--border); }
          .rp-pol-emoji   { font-size:24px; flex-shrink:0; }
          .rp-pol-body    { flex:1; }
          .rp-pol-title   { font-size:13px; font-weight:800; color:var(--charcoal); }
          .rp-pol-time    { font-size:11px; color:var(--muted); font-weight:600; margin-top:1px; }
          .rp-pol-badge   { flex-shrink:0; padding:5px 10px; border-radius:8px; font-size:11px; font-weight:800; }

          .rp-note { margin:16px; background:white; border-radius:14px; padding:14px; border:1px solid var(--border); font-size:12px; color:var(--muted); font-weight:600; line-height:1.7; text-align:center; }
        `}</style>

        <div className="rp-root">
          <div className="rp-header">
            <div className="rp-back" onClick={handleBack}>
              <IonIcon icon={arrowBackOutline} style={{ fontSize: 20, color: "#1A1714" }} />
            </div>
            <h2>Refund Policy</h2>
          </div>

          <div className="rp-hero">
            <h1>💚 Refund Policy</h1>
            <p>Your satisfaction is our top priority</p>
          </div>

          <div className="rp-guarantee">
            <div className="rp-guarantee-icon">🛡️</div>
            <h3>100% Satisfaction Guarantee</h3>
          </div>

          <div className="rp-section">
            <div className="rp-title">📋 Refund Scenarios</div>
            <div className="rp-policy-list">
              {policies.map((p) => (
                <div key={p.title} className="rp-policy-card">
                  <div className="rp-pol-emoji">{p.emoji}</div>
                  <div className="rp-pol-body">
                    <div className="rp-pol-title">{p.title}</div>
                    <div className="rp-pol-time">{p.time}</div>
                  </div>
                  <div className="rp-pol-badge" style={{ background: p.color, color: p.accent }}>
                    {p.refund}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rp-section" style={{ paddingTop: 20 }}>
            <div className="rp-title">🔄 How to Get a Refund</div>
            <div className="rp-steps">
              {steps.map((s) => (
                <div key={s.step} className="rp-step">
                  <div className="rp-step-num">{s.step}</div>
                  <div className="rp-step-icon">{s.icon}</div>
                  <div className="rp-step-body">
                    <strong>{s.title}</strong>
                    <span>{s.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rp-note">
		  <strong style={{ display: "block", marginBottom: 6, color: "#1A1714" }}>
			Refund Policy
		  </strong>
		  Once a refund is approved, the amount will be credited to the original
		  payment method within 7–10 working days.
		</div>

		<div className="rp-note" style={{ marginTop: 10 }}>
		  <strong style={{ display: "block", marginBottom: 6, color: "#1A1714" }}>
			Return & Exchange Policy
		  </strong>
		 Returns are accepted for grocery items within 30 minutes to 24 hours, and for other items within 5–7 business days of delivery.
		  <br /><br />
		  For replacement, exchange, or damaged products, we will process the exchange
		  within 1 days of receiving the returned product. The replacement item will be
		  delivered within 1 days thereafter(grocery items).
		</div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default RefundPage;