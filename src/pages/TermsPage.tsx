import React, { useEffect, useState } from "react";
import { IonPage, IonContent, IonIcon, IonSpinner } from "@ionic/react";
import { arrowBackOutline } from "ionicons/icons";
import { useHistory, useLocation } from "react-router";

// API End-Point Configuration Matrix for Customer Terms
const BASE_URL = "https://shriecom.in/appapis/shreefood/public/api/legal/terms/{role}?role=customer";

interface ClauseItem {
  title: string;
  content: string;
}

const TermsPage: React.FC = () => {
  const history = useHistory();
  const location = useLocation<any>();

  // State Pipeline for Runtime API Syncing
  const [sections, setSections] = useState<ClauseItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Trigger Asynchronous API pipeline on component mount
  useEffect(() => {
    const fetchTermsOfService = async () => {
      try {
        setLoading(true);
        const response = await fetch(BASE_URL);
        const result = await response.json();

        if (result.success) {
          // Model automatic field cast output ('clauses') parsing
          setSections(result.clauses || []);
        } else {
          setError(result.message || "Failed to retrieve terms matrix from engine.");
        }
      } catch (err) {
        console.error("Terms API Integration Anomaly:", err);
        setError("Network structure timeout while pulling terms data streams.");
      } finally {
        setLoading(false);
      }
    };

    fetchTermsOfService();
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

          .tos-root { background:var(--bg); min-height:100vh; padding-bottom:40px; }
          .tos-header { position:sticky; top:0; z-index:100; background:#FFFBEB; border-bottom:1px solid #F0E8C0; padding:12px 16px; display:flex; align-items:center; gap:12px; }
          .tos-back { width:38px; height:38px; border-radius:12px; background:white; border:1.5px solid #E8DFC0; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; }
          .tos-header h2 { font-size:17px; font-weight:900; color:var(--charcoal); }

          .tos-hero { background:linear-gradient(135deg,#1A1714,#2D2520); padding:28px 20px; text-align:center; }
          .tos-hero h1 { font-size:22px; font-weight:900; color:white; }
          .tos-hero p  { font-size:12px; color:rgba(255,255,255,0.55); margin-top:6px; font-weight:600; }

          .tos-body { padding:20px 16px; }
          
          /* Asynchronous Pipeline Loader State Design */
          .tos-center-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; text-align: center; }
          .tos-error-msg { color: #dc2626; font-weight: 700; font-size: 14px; }

          .tos-section { margin-bottom:16px; background:white; border-radius:16px; padding:16px; border:1px solid var(--border); }
          .tos-section-title { font-size:14px; font-weight:900; color:var(--charcoal); margin-bottom:8px; }
          .tos-section-text  { font-size:13px; color:#5C4A2A; line-height:1.75; font-weight:600; white-space:pre-line; }

          .tos-contact { background:linear-gradient(135deg,rgba(224,123,0,0.08),rgba(180,83,9,0.06)); border:1px solid rgba(224,123,0,0.2); border-radius:16px; padding:16px; text-align:center; margin-top: 20px; }
          .tos-contact p { font-size:13px; color:var(--charcoal); font-weight:700; line-height:1.6; }
          .tos-contact a { color:var(--amber); font-weight:800; text-decoration: none; }
        `}</style>

        <div className="tos-root">
          <div className="tos-header">
            <div className="tos-back" onClick={handleBack}>
              <IonIcon icon={arrowBackOutline} style={{ fontSize: 20, color: "#1A1714" }} />
            </div>
            <h2>Terms of Service</h2>
          </div>

          <div className="tos-hero">
            <h1>📋 Terms of Service</h1>
            <p>Please read these terms carefully before using our services</p>
          </div>

          <div className="tos-body">
            {/* 1. API Async Processing Loader Active */}
            {loading && (
              <div className="tos-center-state">
                <IonSpinner name="crescent" color="warning" />
                <p style={{ marginTop: 10, color: "var(--charcoal)", fontWeight: 600 }}>Syncing active documentation...</p>
              </div>
            )}

            {/* 2. Error Fallback Engine Feedback */}
            {!loading && error && (
              <div className="tos-center-state">
                <p className="tos-error-msg">⚠️ {error}</p>
              </div>
            )}

            {/* 3. Node Loop Rendering Mapping Dynamic Array Blocks */}
            {!loading && !error && sections.length > 0 && (
              sections.map((s, index) => (
                <div key={index} className="tos-section">
                  <div className="tos-section-title">{s.title}</div>
                  <div className="tos-section-text">{s.content}</div>
                </div>
              ))
            )}

            {/* 4. Empty Table Structural Safe State Fallback */}
            {!loading && !error && sections.length === 0 && (
              <div className="tos-center-state">
                <p style={{ color: "var(--muted)" }}>No terms of services available for this configuration footprint.</p>
              </div>
            )}

            <div className="tos-contact">
              <p>
                Questions about our terms? Contact us at{" "}
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

export default TermsPage;