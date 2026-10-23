import { IonPage, IonContent, IonIcon } from "@ionic/react";
import { arrowBackOutline, checkmarkCircleOutline } from "ionicons/icons";
import { useState } from "react";
import { useHistory } from "react-router";

const PartnerPage: React.FC = () => {
  const history = useHistory();
  const [form, setForm] = useState({ name: "", business: "", city: "", phone: "", type: "vendor" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!form.name || !form.phone) return;
    setSubmitted(true);
  };

  const benefits = [
    { icon: "📦", title: "Instant Onboarding",   desc: "Go live in under 48 hours" },
    { icon: "💳", title: "Weekly Payouts",        desc: "Guaranteed on-time payments" },
    { icon: "📊", title: "Live Dashboard",        desc: "Track orders & earnings real-time" },
    { icon: "🚀", title: "Growth Support",        desc: "Marketing & promotions included" },
  ];

  return (
    <IonPage>
      <IonContent fullscreen>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
          * { box-sizing:border-box; margin:0; padding:0; font-family:'Nunito',sans-serif; }
          :root { --amber:#E07B00; --charcoal:#1A1714; --muted:#9B8E84; --bg:#FFFBEB; --border:#EAE5DF; --green:#0C831F; }
          @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
          @keyframes pop    { from{transform:scale(0.7);opacity:0} to{transform:scale(1);opacity:1} }

          .pp-root { background:var(--bg); min-height:100vh; padding-bottom:40px; }
          .pp-header { position:sticky; top:0; z-index:100; background:#FFFBEB; border-bottom:1px solid #F0E8C0; padding:12px 16px; display:flex; align-items:center; gap:12px; }
          .pp-back { width:38px; height:38px; border-radius:12px; background:white; border:1.5px solid #E8DFC0; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; }
          .pp-header h2 { font-size:17px; font-weight:900; color:var(--charcoal); }

          .pp-hero { background:linear-gradient(135deg,#1A1714,#2D2520); padding:32px 20px; text-align:center; }
          .pp-hero-icon { font-size:48px; margin-bottom:10px; }
          .pp-hero h1 { font-size:22px; font-weight:900; color:white; }
          .pp-hero p  { font-size:13px; color:rgba(255,255,255,0.65); margin-top:8px; line-height:1.6; font-weight:600; }

          .pp-section { padding:22px 16px; animation:fadeIn 0.4s ease; }
          .pp-section-title { font-size:15px; font-weight:900; color:var(--charcoal); margin-bottom:14px; }

          .pp-benefits { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; margin-bottom:22px; }
          .pp-benefit-card { background:white; border-radius:14px; padding:14px; border:1px solid var(--border); text-align:center; }
          .pp-benefit-icon  { font-size:26px; margin-bottom:8px; }
          .pp-benefit-title { font-size:12px; font-weight:800; color:var(--charcoal); }
          .pp-benefit-desc  { font-size:11px; color:var(--muted); font-weight:600; margin-top:2px; }

          .pp-type-row { display:flex; gap:8px; margin-bottom:16px; }
          .pp-type-btn { flex:1; padding:10px; border-radius:12px; border:1.5px solid var(--border); background:white; font-size:12px; font-weight:800; color:var(--muted); cursor:pointer; text-align:center; transition:all 0.15s; }
          .pp-type-btn.active { border-color:var(--amber); background:rgba(224,123,0,0.08); color:var(--amber); }

          .pp-field { margin-bottom:12px; }
          .pp-label { font-size:11px; font-weight:800; color:var(--charcoal); margin-bottom:5px; display:block; text-transform:uppercase; letter-spacing:0.05em; }
          .pp-input { width:100%; padding:12px 14px; border-radius:12px; border:1.5px solid var(--border); background:white; font-size:14px; font-weight:600; color:var(--charcoal); outline:none; font-family:'Nunito',sans-serif; transition:border-color 0.2s; }
          .pp-input:focus { border-color:var(--amber); box-shadow:0 0 0 3px rgba(224,123,0,0.1); }

          .pp-submit { width:100%; padding:14px; background:var(--amber); color:white; border:none; border-radius:14px; font-size:15px; font-weight:900; cursor:pointer; font-family:'Nunito',sans-serif; margin-top:6px; box-shadow:0 4px 14px rgba(224,123,0,0.35); transition:transform 0.15s; }
          .pp-submit:active { transform:scale(0.97); }

          .pp-success { display:flex; flex-direction:column; align-items:center; padding:60px 24px; text-align:center; animation:pop 0.35s ease; }
          .pp-success-icon { font-size:64px; margin-bottom:16px; }
          .pp-success h3 { font-size:20px; font-weight:900; color:var(--charcoal); margin-bottom:8px; }
          .pp-success p  { font-size:13px; color:var(--muted); font-weight:600; line-height:1.6; }
        `}</style>

        <div className="pp-root">
          <div className="pp-header">
            <div className="pp-back" onClick={() => history.goBack()}>
              <IonIcon icon={arrowBackOutline} style={{ fontSize: 20, color: "#1A1714" }} />
            </div>
            <h2>Partner with Us</h2>
          </div>

          <div className="pp-hero">
            <div className="pp-hero-icon">🤝</div>
            <h1>Grow with FoodDeliver</h1>
            <p>Join 500+ vendors and delivery partners earning more with our platform</p>
          </div>

          {submitted ? (
            <div className="pp-success">
              <div className="pp-success-icon">🎉</div>
              <h3>Application Received!</h3>
              <p>Our team will contact you within 24 hours. Get ready to start your journey with FoodDeliver!</p>
            </div>
          ) : (
            <div className="pp-section">
              <div className="pp-benefits">
                {benefits.map((b) => (
                  <div key={b.title} className="pp-benefit-card">
                    <div className="pp-benefit-icon">{b.icon}</div>
                    <div className="pp-benefit-title">{b.title}</div>
                    <div className="pp-benefit-desc">{b.desc}</div>
                  </div>
                ))}
              </div>

              <div className="pp-section-title">📝 Apply Now</div>

              <div className="pp-type-row">
                {[
                  { val: "vendor",   label: "🏪 Vendor"   },
                  { val: "delivery", label: "🛵 Delivery" },
                  { val: "brand",    label: "🏷️ Brand"    },
                ].map((t) => (
                  <div key={t.val} className={`pp-type-btn${form.type === t.val ? " active" : ""}`}
                    onClick={() => setForm({ ...form, type: t.val })}
                  >{t.label}</div>
                ))}
              </div>

              {[
                { key: "name",     label: "Full Name",      placeholder: "Your full name"     },
                { key: "business", label: "Business Name",  placeholder: "Shop / brand name"  },
                { key: "city",     label: "City",           placeholder: "Your city"          },
                { key: "phone",    label: "Phone Number",   placeholder: "+91 9XXXXXXXXX"     },
              ].map((f) => (
                <div key={f.key} className="pp-field">
                  <label className="pp-label">{f.label}</label>
                  <input
                    className="pp-input"
                    placeholder={f.placeholder}
                    value={(form as any)[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  />
                </div>
              ))}

              <button className="pp-submit" onClick={handleSubmit}>
                Submit Application →
              </button>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default PartnerPage;