import { IonPage, IonContent, IonIcon } from "@ionic/react";
import { arrowBackOutline } from "ionicons/icons";
import { useHistory } from "react-router";
import logo from "../assets/shrilogo.jpeg";

const AboutPage: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonContent fullscreen>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
          * { box-sizing:border-box; margin:0; padding:0; font-family:'Nunito',sans-serif; }
          :root { --amber:#E07B00; --charcoal:#1A1714; --muted:#9B8E84; --bg:#FFFBEB; --border:#EAE5DF; }
          @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
          @keyframes fadeInUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }

          .ap-root { background:var(--bg); min-height:100vh; padding-bottom:40px; }

          .ap-header {
            position:sticky; top:0; z-index:100;
            background:#FFFBEB; border-bottom:1px solid #F0E8C0;
            padding:12px 16px; display:flex; align-items:center; gap:12px;
          }
          .ap-back {
            width:38px; height:38px; border-radius:12px; background:white;
            border:1.5px solid #E8DFC0; display:flex; align-items:center;
            justify-content:center; cursor:pointer;
            box-shadow:0 2px 6px rgba(0,0,0,0.06); flex-shrink:0;
          }
          .ap-header h2 { font-size:17px; font-weight:900; color:var(--charcoal); }

          /* ── Hero with background image ── */
          .ap-hero {
            position: relative;
            min-height: 220px;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            overflow: hidden;
            animation: fadeIn 0.4s ease;
          }

          /* Actual background image */
          .ap-hero-bg {
            position: absolute;
            inset: 0;
            background-image: url(${logo});
            background-size: cover;
            background-position: center;
            z-index: 0;
          }

          /* Dark gradient overlay so text is readable */
          .ap-hero-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(160deg, rgb(39 37 36 / 53%) 0%, rgba(20, 12, 4, 0.78) 100%);
            z-index: 1;
          }

          /* Text content sits above overlay */
          .ap-hero-content {
            position: relative;
            z-index: 2;
            padding: 40px 24px;
            animation: fadeInUp 0.5s ease 0.1s both;
          }

          .ap-hero-badge {
            display: inline-block;
            background: rgba(255,255,255,0.15);
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 20px;
            padding: 4px 14px;
            font-size: 11px;
            font-weight: 700;
            color: rgba(255,255,255,0.9);
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-bottom: 12px;
          }

          .ap-hero h1 {
            font-size: 28px;
            font-weight: 900;
            color: white;
            letter-spacing: -0.5px;
            line-height: 1.2;
            text-shadow: 0 2px 12px rgba(0,0,0,0.4);
          }

          .ap-hero p {
            font-size: 13px;
            color: rgba(255,255,255,0.85);
            margin-top: 10px;
            line-height: 1.65;
            max-width: 280px;
            margin-left: auto;
            margin-right: auto;
            font-weight: 600;
          }

          /* Founded pill */
          .ap-hero-founded {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            margin-top: 16px;
            background: rgba(255,255,255,0.12);
            border: 1px solid rgba(255,255,255,0.25);
            border-radius: 20px;
            padding: 6px 14px;
            font-size: 12px;
            font-weight: 700;
            color: #e07b00;
          }

          .ap-section { padding:24px 16px; animation:fadeIn 0.4s ease; }
          .ap-section-title {
            font-size:16px; font-weight:900; color:var(--charcoal);
            margin-bottom:14px; display:flex; align-items:center; gap:8px;
          }

          .ap-card {
            background:white; border-radius:16px; padding:16px;
            border:1px solid var(--border); margin-bottom:12px;
            box-shadow:0 2px 8px rgba(0,0,0,0.04);
          }
          .ap-card p { font-size:13px; color:#5C4A2A; line-height:1.7; font-weight:600; }

          .ap-value-list { display:flex; flex-direction:column; gap:10px; }
          .ap-value-item {
            display:flex; align-items:center; gap:12px; background:white;
            border-radius:14px; padding:14px; border:1px solid var(--border);
          }
          .ap-value-icon {
            width:40px; height:40px; border-radius:12px;
            background:linear-gradient(135deg,#FEF3C7,#FDE68A);
            display:flex; align-items:center; justify-content:center;
            font-size:20px; flex-shrink:0;
          }
          .ap-value-text strong { display:block; font-size:13px; font-weight:800; color:var(--charcoal); }
          .ap-value-text span   { font-size:11px; color:var(--muted); font-weight:600; }
        `}</style>

        <div className="ap-root">

          {/* Header */}
          <div className="ap-header">
            <div className="ap-back" onClick={() => history.goBack()}>
              <IonIcon icon={arrowBackOutline} style={{ fontSize: 20, color: "#1A1714" }} />
            </div>
            <h2>About Us</h2>
          </div>

          {/* Hero — background image with overlay + text on top */}
          <div className="ap-hero">
            <div className="ap-hero-bg" />
            <div className="ap-hero-overlay" />
            <div className="ap-hero-content">
              <h1>Shri Enterprises</h1>
              <p>India's fastest grocery and all sales merchandise made available for doorstep delivery</p>
              <div className="ap-hero-founded">
                <span>📦</span>
                <span>Trusted by thousands across Lucknow</span>
              </div>
            </div>
          </div>

          {/* Our Story */}
          <div className="ap-section">
            <div className="ap-section-title">📖 Our Story</div>
            <div className="ap-card">
		<p>
		   The “Shree Bazaar App” serves as the digital marketplace for your city and locality, allowing you to conveniently order goods from the comfort of your home. Our objective is to consolidate all customer needs within a single, unified application.
		  </p> 
		  </div>
            
            <div className="ap-card">
              <p>
			   We prioritize trust, security, and convenience above all else. On the Shree Bazaar App, you benefit from fair pricing, accurate weights and quantities, fast delivery, and secure online payment options. Our team is constantly introducing new features and services to ensure that every customer enjoys an excellent and hassle-free shopping experience.
			  </p>
			  </div>
						<div className="ap-card">
			  <p>
			   The goal of the Shree Bazaar App extends beyond merely offering affordable products; it aims to create a trustworthy digital marketplace that makes you feel as though you are shopping directly with your favorite local shopkeeper.
			  </p>
			  </div>
            
          </div>

          {/* Our Values */}
          <div className="ap-section" style={{ paddingTop: 0 }}>
            <div className="ap-section-title">💡 Our Values</div>
            <div className="ap-value-list">
              {[
                { icon: "⚡", title: "Speed First",    desc: "Fast delivery, every time" },
                { icon: "🌿", title: "Always Fresh",   desc: "Sourced daily from local farms" },
                { icon: "💰", title: "Best Prices",    desc: "No hidden fees, ever" },
                { icon: "❤️", title: "Community",      desc: "Supporting local farmers & vendors" },
              ].map((v) => (
                <div key={v.title} className="ap-value-item">
                  <div className="ap-value-icon">{v.icon}</div>
                  <div className="ap-value-text">
                    <strong>{v.title}</strong>
                    <span>{v.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default AboutPage;