import React, { useEffect, useState } from "react";
import { IonPage, IonContent, IonIcon, IonSpinner } from "@ionic/react";
import { arrowBackOutline } from "ionicons/icons";
import { useHistory, useLocation } from "react-router";

// API Root URL Path Configuration Matrix
const BASE_URL = "https://shriecom.in/appapis/shreefood/public/api/legal/privacy/{role}?role=customer";

interface ClauseItem {
  title: string;
  content: string;
}

const PrivacyPage: React.FC = () => {
  const history = useHistory();
  const location = useLocation<any>();

  // State Pipeline for API Data Integration
  const [sections, setSections] = useState<ClauseItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data dynamically on component mount
  useEffect(() => {
    const fetchPrivacyPolicy = async () => {
      try {
        setLoading(true);
        const response = await fetch(BASE_URL);
        const result = await response.json();

        if (result.success) {
          // Laravel JSON response se clauses matrix state me save karein
          setSections(result.clauses || []);
        } else {
          setError(result.message || "Failed to parse system legal documents.");
        }
      } catch (err) {
        console.error("API Integration Error:", err);
        setError("Network anomaly detected while connecting to backend cluster.");
      } finally {
        setLoading(false);
      }
    };

    fetchPrivacyPolicy();
  }, []);

  const handleBack = () => {
    if (location.state?.from) {
      history.replace(location.state.from);
    } else {
      history.replace("/"); // fallback (homepage)
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Nunito:wght=400;600;700;800;900&display=swap');
          * { box-sizing:border-box; margin:0; padding:0; font-family:'Nunito',sans-serif; }
          :root { --amber:#E07B00; --charcoal:#1A1714; --muted:#9B8E84; --bg:#FFFBEB; --border:#EAE5DF; }

          .priv-root { background:var(--bg); min-height:100vh; padding-bottom:40px; }
          .priv-header { position:sticky; top:0; z-index:100; background:#FFFBEB; border-bottom:1px solid #F0E8C0; padding:12px 16px; display:flex; align-items:center; gap:12px; }
          .priv-back { width:38px; height:38px; border-radius:12px; background:white; border:1.5px solid #E8DFC0; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; }
          .priv-header h2 { font-size:17px; font-weight:900; color:var(--charcoal); }

          .priv-hero { background:linear-gradient(135deg,#1A1714,#2D2520); padding:28px 20px; text-align:center; }
          .priv-hero h1 { font-size:22px; font-weight:900; color:white; }
          .priv-hero p  { font-size:12px; color:rgba(255,255,255,0.55); margin-top:6px; font-weight:600; }

          .priv-body { padding:20px 16px; }
          
          /* Loading & Error Center Matrix */
          .priv-center-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; text-align: center; }
          .priv-error-msg { color: #dc2626; font-weight: 700; font-size: 14px; }

          .priv-section { margin-bottom:16px; background:white; border-radius:16px; padding:16px; border:1px solid var(--border); }
          .priv-section-title { font-size:14px; font-weight:900; color:var(--charcoal); margin-bottom:8px; }
          .priv-section-text  { font-size:13px; color:#5C4A2A; line-height:1.75; font-weight:600; white-space:pre-line; }

          .priv-contact { background:linear-gradient(135deg,rgba(224,123,0,0.08),rgba(180,83,9,0.06)); border:1px solid rgba(224,123,0,0.2); border-radius:16px; padding:16px; text-align:center; margin-top: 20px; }
          .priv-contact p { font-size:13px; color:var(--charcoal); font-weight:700; line-height:1.6; }
          .priv-contact a { color:var(--amber); font-weight:800; }
        `}</style>

        <div className="priv-root">
          <div className="priv-header">
            <div className="priv-back" onClick={handleBack}>
              <IonIcon icon={arrowBackOutline} style={{ fontSize: 20, color: "#1A1714" }} />
            </div>
            <h2>Privacy Policy</h2>
          </div>

          <div className="priv-hero">
            <h1>🔒 Your Privacy Matters</h1>
            <p>We are committed to protecting your personal information</p>
          </div>

          <div className="priv-body">
            {/* 1. Show Spinner loader when API processing is active */}
            {loading && (
              <div className="priv-center-state">
                <IonSpinner name="crescent" color="warning" />
                <p style={{ marginTop: 10, color: "var(--charcoal)", fontWeight: 600 }}>Syncing active documentation...</p>
              </div>
            )}

            {/* 2. Show runtime exception if connection drops */}
            {!loading && error && (
              <div className="priv-center-state">
                <p className="priv-error-msg">⚠️ {error}</p>
              </div>
            )}

            {/* 3. Render dynamically generated layout nodes */}
            {!loading && !error && sections.length > 0 && (
              sections.map((s, index) => (
                <div key={index} className="priv-section">
                  <div className="priv-section-title">{s.title}</div>
                  <div className="priv-section-text">{s.content}</div>
                </div>
              ))
            )}

            {/* Empty fallback descriptor */}
            {!loading && !error && sections.length === 0 && (
              <div className="priv-center-state">
                <p style={{ color: "var(--muted)" }}>No legal clauses available for this role mapping.</p>
              </div>
            )}

            <div className="priv-contact">
              <p>
                Questions about our privacy practices? Contact our Privacy Officer at{" "}
                <a href="mailto:shrient.99@gmail.com">shrient.99@gmail.com</a>{" "}
                or write to us at Shri Enterprises, Lucknow, Uttar Pradesh - 226004.
              </p>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default PrivacyPage;