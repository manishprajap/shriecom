import {
  IonPage,
  IonContent,
  IonIcon,
} from "@ionic/react";
import {
  arrowBackOutline,
  addOutline,
  cameraOutline,
  documentTextOutline,
  timeOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  hourglassOutline,
  downloadOutline,
  trashOutline,
  alertCircleOutline,
} from "ionicons/icons";
import { useState } from "react";
import { useHistory } from "react-router";

interface Prescription {
  id: number;
  doctorName: string;
  hospital: string;
  date: string;
  validTill: string;
  medicines: string[];
  status: "active" | "expired" | "processing";
  refills: number;
  image: string; // emoji stand-in
}

const prescriptions: Prescription[] = [
  {
    id: 1,
    doctorName: "Dr. Priya Sharma",
    hospital: "Apollo Clinic, Patna",
    date: "10 Jul 2025",
    validTill: "10 Jan 2026",
    medicines: ["Amoxicillin 500mg", "Paracetamol 650mg", "Vitamin D3"],
    status: "active",
    refills: 2,
    image: "💊",
  },
  {
    id: 2,
    doctorName: "Dr. Rajesh Kumar",
    hospital: "City Health Centre",
    date: "3 Jun 2025",
    validTill: "3 Dec 2025",
    medicines: ["Metformin 500mg", "Atorvastatin 10mg"],
    status: "active",
    refills: 1,
    image: "🩺",
  },
  {
    id: 3,
    doctorName: "Dr. Anita Verma",
    hospital: "PMCH, Patna",
    date: "15 Jan 2025",
    validTill: "15 Jul 2025",
    medicines: ["Cetirizine 10mg", "Montelukast 5mg"],
    status: "expired",
    refills: 0,
    image: "📋",
  },
  {
    id: 4,
    doctorName: "Uploaded Prescription",
    hospital: "Self uploaded",
    date: "12 Jul 2025",
    validTill: "Pending review",
    medicines: ["Under verification…"],
    status: "processing",
    refills: 0,
    image: "📸",
  },
];

const PrescriptionsPage: React.FC = () => {
  const history = useHistory();
  const [activeTab, setActiveTab] = useState<"all" | "active" | "expired">("all");
  const [showUpload, setShowUpload] = useState(false);

  const filtered = prescriptions.filter((p) =>
    activeTab === "all" ? true : activeTab === "active" ? p.status !== "expired" : p.status === "expired"
  );

  const statusConfig = {
    active:     { label: "Active",     bg: "#DCFCE7", color: "#16A34A", icon: checkmarkCircleOutline },
    expired:    { label: "Expired",    bg: "#FEE2E2", color: "#DC2626", icon: closeCircleOutline     },
    processing: { label: "Processing", bg: "#FEF3C7", color: "#D97706", icon: hourglassOutline       },
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          .rx-root { font-family: 'DM Sans', sans-serif; background: #FFFBEB; min-height: 100vh; }

          .rx-header {
            position: sticky; top: 0; z-index: 100;
            background: #FFFBEB; border-bottom: 1px solid #F0E8C0;
            padding: 14px 16px; display: flex; align-items: center; gap: 12px;
          }
          .rx-back-btn {
            width: 38px; height: 38px; border-radius: 12px;
            background: white; border: 1.5px solid #EAE5DF;
            display: flex; align-items: center; justify-content: center; cursor: pointer;
          }
          .rx-header-title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; color: #1A1714; flex: 1; }
          .rx-upload-btn {
            display: flex; align-items: center; gap: 6px;
            background: #E07B00; border: none; border-radius: 12px; padding: 8px 14px;
            color: white; font-size: 12px; font-weight: 700; cursor: pointer;
            font-family: 'DM Sans', sans-serif;
          }

          /* Info banner */
          .rx-info-banner {
            margin: 14px 16px; background: linear-gradient(135deg, #1A1714, #2D2520);
            border-radius: 20px; padding: 18px; display: flex; gap: 14px; align-items: center;
          }
          .rx-info-emoji { font-size: 32px; flex-shrink: 0; }
          .rx-info-text h4 { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: white; margin-bottom: 4px; }
          .rx-info-text p { font-size: 11px; color: rgba(255,255,255,0.55); line-height: 1.5; }

          /* Tabs */
          .rx-tabs { display: flex; gap: 6px; padding: 4px 16px 14px; }
          .rx-tab {
            flex: 1; padding: 9px; border-radius: 12px; border: 1.5px solid #EAE5DF;
            background: white; font-size: 12px; font-weight: 600; color: #9B8E84;
            cursor: pointer; text-align: center; font-family: 'DM Sans', sans-serif;
            transition: all 0.18s;
          }
          .rx-tab.active { background: #1A1714; border-color: #1A1714; color: white; }

          /* Cards */
          .rx-list { display: flex; flex-direction: column; gap: 12px; padding: 0 16px; }
          .rx-card { background: white; border-radius: 20px; border: 1px solid #EAE5DF; overflow: hidden; }
          .rx-card-header {
            display: flex; align-items: center; gap: 12px;
            padding: 14px 14px 12px; border-bottom: 1px solid #F5F3F0;
          }
          .rx-card-emoji { width: 46px; height: 46px; border-radius: 14px; background: #FEF3C7; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
          .rx-card-meta { flex: 1; min-width: 0; }
          .rx-doctor-name { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: #1A1714; }
          .rx-hospital { font-size: 11px; color: #9B8E84; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .rx-status-badge {
            display: inline-flex; align-items: center; gap: 4px;
            padding: 4px 8px; border-radius: 8px; font-size: 10px; font-weight: 700;
            flex-shrink: 0;
          }

          /* Medicines section */
          .rx-medicines { padding: 12px 14px; }
          .rx-medicines-label { font-size: 10px; color: #9B8E84; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px; }
          .rx-medicine-pills { display: flex; flex-wrap: wrap; gap: 6px; }
          .rx-med-pill { background: #F9F7F4; border: 1px solid #EAE5DF; border-radius: 8px; padding: 4px 10px; font-size: 11px; font-weight: 500; color: #1A1714; }

          /* Dates row */
          .rx-dates { display: flex; gap: 0; border-top: 1px solid #F5F3F0; }
          .rx-date-item { flex: 1; padding: 10px 14px; display: flex; flex-direction: column; gap: 3px; }
          .rx-date-item + .rx-date-item { border-left: 1px solid #F5F3F0; }
          .rx-date-lbl { font-size: 9px; color: #9B8E84; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
          .rx-date-val { font-size: 12px; font-weight: 600; color: #1A1714; }

          /* Actions */
          .rx-card-actions { display: flex; border-top: 1px solid #F5F3F0; }
          .rx-action-btn {
            flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px;
            padding: 11px; background: none; border: none; cursor: pointer;
            font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600; color: #9B8E84;
            transition: background 0.15s;
          }
          .rx-action-btn + .rx-action-btn { border-left: 1px solid #F5F3F0; }
          .rx-action-btn.primary { color: #E07B00; }
          .rx-action-btn.danger  { color: #DC2626; }
          .rx-action-btn:hover   { background: #FAFAF8; }

          /* Refill badge */
          .rx-refill { display: inline-flex; align-items: center; gap: 4px; background: #DBEAFE; color: #2563EB; border-radius: 6px; padding: 2px 7px; font-size: 10px; font-weight: 600; margin-top: 4px; }

          /* Upload sheet */
          .rx-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 999; display: flex; align-items: flex-end; }
          .rx-sheet { background: white; border-radius: 24px 24px 0 0; padding: 28px 20px 40px; width: 100%; }
          .rx-sheet-handle { width: 40px; height: 4px; background: #EAE5DF; border-radius: 99px; margin: 0 auto 22px; }
          .rx-sheet-title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; color: #1A1714; margin-bottom: 6px; }
          .rx-sheet-sub { font-size: 13px; color: #9B8E84; margin-bottom: 20px; }
          .rx-upload-options { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
          .rx-upload-option {
            display: flex; align-items: center; gap: 14px;
            background: #F9F7F4; border: 1.5px solid #EAE5DF; border-radius: 16px;
            padding: 16px; cursor: pointer; transition: border-color 0.18s;
          }
          .rx-upload-option:hover { border-color: #E07B00; }
          .rx-upload-opt-icon { width: 44px; height: 44px; border-radius: 12px; background: #FEF3C7; display: flex; align-items: center; justify-content: center; font-size: 20px; }
          .rx-upload-opt-label { font-weight: 600; font-size: 14px; color: #1A1714; }
          .rx-upload-opt-sub { font-size: 11px; color: #9B8E84; margin-top: 2px; }
          .rx-tip { display: flex; align-items: flex-start; gap: 8px; background: #FEF3C7; border-radius: 12px; padding: 12px; }
          .rx-tip-text { font-size: 11px; color: #92400E; line-height: 1.5; }

          .rx-pb { height: 30px; }
        `}</style>

        <div className="rx-root">

          {/* Header */}
          <div className="rx-header">
            <div className="rx-back-btn" onClick={() => history.goBack()}>
              <IonIcon icon={arrowBackOutline} style={{ fontSize: 19, color: "#1A1714" }} />
            </div>
            <div className="rx-header-title">My Prescriptions</div>
            <button className="rx-upload-btn" onClick={() => setShowUpload(true)}>
              <IonIcon icon={addOutline} style={{ fontSize: 16 }} />
              Upload
            </button>
          </div>

          {/* Info Banner */}
          <div className="rx-info-banner">
            <div className="rx-info-emoji">💊</div>
            <div className="rx-info-text">
              <h4>Order medicines with prescription</h4>
              <p>Upload a valid prescription to order scheduled medicines. Prescription verified by licensed pharmacists.</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="rx-tabs">
            {(["all", "active", "expired"] as const).map((t) => (
              <button key={t} className={`rx-tab${activeTab === t ? " active" : ""}`} onClick={() => setActiveTab(t)}>
                {t === "all" ? "All" : t === "active" ? "✅ Active" : "❌ Expired"}
              </button>
            ))}
          </div>

          {/* Prescription Cards */}
          <div className="rx-list">
            {filtered.map((rx) => {
              const cfg = statusConfig[rx.status];
              return (
                <div key={rx.id} className="rx-card">
                  <div className="rx-card-header">
                    <div className="rx-card-emoji">{rx.image}</div>
                    <div className="rx-card-meta">
                      <div className="rx-doctor-name">{rx.doctorName}</div>
                      <div className="rx-hospital">{rx.hospital}</div>
                      {rx.refills > 0 && (
                        <div className="rx-refill">↻ {rx.refills} refill{rx.refills > 1 ? "s" : ""} left</div>
                      )}
                    </div>
                    <div className="rx-status-badge" style={{ background: cfg.bg, color: cfg.color }}>
                      <IonIcon icon={cfg.icon} style={{ fontSize: 11 }} />
                      {cfg.label}
                    </div>
                  </div>

                  <div className="rx-medicines">
                    <div className="rx-medicines-label">Medicines</div>
                    <div className="rx-medicine-pills">
                      {rx.medicines.map((m, i) => (
                        <span key={i} className="rx-med-pill">{m}</span>
                      ))}
                    </div>
                  </div>

                  <div className="rx-dates">
                    <div className="rx-date-item">
                      <span className="rx-date-lbl">Issued</span>
                      <span className="rx-date-val">{rx.date}</span>
                    </div>
                    <div className="rx-date-item">
                      <span className="rx-date-lbl">Valid Till</span>
                      <span className="rx-date-val" style={{ color: rx.status === "expired" ? "#DC2626" : "#1A1714" }}>{rx.validTill}</span>
                    </div>
                  </div>

                  <div className="rx-card-actions">
                    <button className="rx-action-btn primary">
                      <IonIcon icon={downloadOutline} style={{ fontSize: 14 }} />
                      Download
                    </button>
                    {rx.status === "active" && (
                      <button className="rx-action-btn primary">
                        <IonIcon icon={documentTextOutline} style={{ fontSize: 14 }} />
                        Order Now
                      </button>
                    )}
                    <button className="rx-action-btn danger">
                      <IonIcon icon={trashOutline} style={{ fontSize: 14 }} />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rx-pb" />
        </div>

        {/* Upload Sheet */}
        {showUpload && (
          <div className="rx-overlay" onClick={() => setShowUpload(false)}>
            <div className="rx-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="rx-sheet-handle" />
              <div className="rx-sheet-title">Upload Prescription</div>
              <div className="rx-sheet-sub">Take a photo or choose from your gallery</div>
              <div className="rx-upload-options">
                <div className="rx-upload-option" onClick={() => setShowUpload(false)}>
                  <div className="rx-upload-opt-icon">📸</div>
                  <div>
                    <div className="rx-upload-opt-label">Take a Photo</div>
                    <div className="rx-upload-opt-sub">Use your camera to capture</div>
                  </div>
                </div>
                <div className="rx-upload-option" onClick={() => setShowUpload(false)}>
                  <div className="rx-upload-opt-icon">🖼️</div>
                  <div>
                    <div className="rx-upload-opt-label">Choose from Gallery</div>
                    <div className="rx-upload-opt-sub">Pick an existing photo</div>
                  </div>
                </div>
                <div className="rx-upload-option" onClick={() => setShowUpload(false)}>
                  <div className="rx-upload-opt-icon">📄</div>
                  <div>
                    <div className="rx-upload-opt-label">Upload PDF</div>
                    <div className="rx-upload-opt-sub">Digital prescription file</div>
                  </div>
                </div>
              </div>
              <div className="rx-tip">
                <IonIcon icon={alertCircleOutline} style={{ fontSize: 16, color: "#D97706", flexShrink: 0, marginTop: 1 }} />
                <div className="rx-tip-text">Ensure the prescription is clear, all text is readable, and the doctor's signature & date are visible.</div>
              </div>
            </div>
          </div>
        )}

      </IonContent>
    </IonPage>
  );
};

export default PrescriptionsPage;