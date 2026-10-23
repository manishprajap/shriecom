import { IonPage, IonContent, IonIcon, useIonRouter } from "@ionic/react";
import {
  arrowBackOutline,
  shieldCheckmarkOutline,
  eyeOffOutline,
  eyeOutline,
  lockClosedOutline,
  notificationsOutline,
  trashOutline,
  chevronForwardOutline,
  checkmarkOutline,
  phonePortraitOutline,
  mailOutline,
  informationCircleOutline,
} from "ionicons/icons";
import { useState } from "react";

/* ─── Toggle Switch ─── */
const Toggle: React.FC<{ on: boolean; onChange: (v: boolean) => void }> = ({ on, onChange }) => (
  <div
    onClick={() => onChange(!on)}
    style={{
      width: 46, height: 26, borderRadius: 13,
      background: on ? "#1A1714" : "#D1C9BE",
      position: "relative", cursor: "pointer",
      transition: "background 0.22s",
      flexShrink: 0,
    }}
  >
    <div style={{
      position: "absolute",
      top: 3, left: on ? 23 : 3,
      width: 20, height: 20,
      borderRadius: "50%", background: "white",
      transition: "left 0.22s cubic-bezier(0.34,1.56,0.64,1)",
      boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
    }} />
  </div>
);

/* ─── Change Password Modal ─── */
const ChangePasswordModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [cur,  setCur]  = useState("");
  const [nw,   setNw]   = useState("");
  const [conf, setConf] = useState("");
  const [show, setShow] = useState({ cur: false, nw: false, conf: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!cur.trim())         e.cur  = "Current password required";
    if (nw.length < 8)       e.nw   = "Min 8 characters";
    if (nw !== conf)         e.conf = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (validate()) { setSuccess(true); setTimeout(onClose, 1200); }
  };

  return (
    <div className="cp-overlay" onClick={onClose}>
      <div className="cp-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="cp-handle" />
        <div className="cp-title">Change Password</div>

        {success ? (
          <div style={{ textAlign: "center", padding: "20px 0 10px" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 17, color: "#1A1714" }}>Password Updated!</div>
          </div>
        ) : (
          <>
            {(
              [
                { key: "cur",  label: "Current Password",     val: cur,  set: setCur,  vis: show.cur,  vk: "cur"  },
                { key: "nw",   label: "New Password",         val: nw,   set: setNw,   vis: show.nw,   vk: "nw"   },
                { key: "conf", label: "Confirm New Password", val: conf, set: setConf, vis: show.conf, vk: "conf" },
              ] as { key: string; label: string; val: string; set: (v: string) => void; vis: boolean; vk: "cur"|"nw"|"conf" }[]
            ).map(({ key, label, val, set, vis, vk }) => (
              <div key={key} className="cp-field">
                <label className="cp-label">{label}</label>
                <div className="cp-input-wrap">
                  <input
                    className={`cp-input ${errors[key] ? "cp-input-err" : ""}`}
                    type={vis ? "text" : "password"}
                    value={val}
                    onChange={(e) => { set(e.target.value); setErrors((ev) => ({ ...ev, [key]: "" })); }}
                    placeholder="••••••••"
                  />
                  <button className="cp-eye" onClick={() => setShow((s) => ({ ...s, [vk]: !s[vk] }))}>
                    <IonIcon icon={vis ? eyeOutline : eyeOffOutline} style={{ fontSize: 18, color: "#9B8E84" }} />
                  </button>
                </div>
                {errors[key] && <div className="cp-err">{errors[key]}</div>}
              </div>
            ))}

            {/* Strength bar */}
            {nw.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, color: "#9B8E84", marginBottom: 6, fontWeight: 600 }}>Password Strength</div>
                <div style={{ display: "flex", gap: 4 }}>
                  {[1, 2, 3, 4].map((i) => {
                    const score = Math.min(Math.floor(nw.length / 3), 4);
                    return (
                      <div key={i} style={{
                        flex: 1, height: 4, borderRadius: 2,
                        background: i <= score
                          ? score <= 1 ? "#DC2626" : score <= 2 ? "#D97706" : score <= 3 ? "#0284C7" : "#16A34A"
                          : "#EAE5DF",
                        transition: "background 0.2s",
                      }} />
                    );
                  })}
                </div>
              </div>
            )}

            <div className="cp-actions">
              <button className="cp-btn-cancel" onClick={onClose}>Cancel</button>
              <button className="cp-btn-save" onClick={handleSave}>Update</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ─── Delete Account Modal ─── */
const DeleteAccountModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [reason, setReason] = useState("");
  const [confirm, setConfirm] = useState("");

  const reasons = [
    "I found a better app",
    "Privacy concerns",
    "Too many notifications",
    "I don't use it anymore",
    "Technical issues",
    "Other",
  ];

  return (
    <div className="cp-overlay" onClick={onClose}>
      <div className="cp-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="cp-handle" />
        {step === 1 ? (
          <>
            <div className="cp-title" style={{ color: "#DC2626" }}>Delete Account</div>
            <div style={{ fontSize: 13, color: "#9B8E84", marginBottom: 18, lineHeight: 1.6 }}>
              We're sorry to see you go. Please tell us why you want to delete your account:
            </div>
            {reasons.map((r) => (
              <div
                key={r}
                onClick={() => setReason(r)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 14px", borderRadius: 12, marginBottom: 8, cursor: "pointer",
                  border: `1.5px solid ${reason === r ? "#1A1714" : "#EAE5DF"}`,
                  background: reason === r ? "#F5EFE0" : "white",
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 13, fontWeight: reason === r ? 600 : 400, color: "#1A1714" }}>{r}</span>
                {reason === r && <IonIcon icon={checkmarkOutline} style={{ fontSize: 16, color: "#1A1714" }} />}
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button className="cp-btn-cancel" onClick={onClose}>Cancel</button>
              <button
                style={{
                  flex: 1, padding: 13, borderRadius: 14,
                  background: reason ? "#DC2626" : "#EAE5DF",
                  border: "none", fontSize: 14, fontWeight: 700, color: reason ? "white" : "#9B8E84",
                  cursor: reason ? "pointer" : "default", fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.15s",
                }}
                onClick={() => reason && setStep(2)}
              >
                Continue
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="cp-title" style={{ color: "#DC2626" }}>Are you sure?</div>
            <div style={{
              background: "#FEE2E2", border: "1px solid #FECACA",
              borderRadius: 14, padding: 14, marginBottom: 18,
            }}>
              <div style={{ fontSize: 13, color: "#991B1B", lineHeight: 1.6, fontWeight: 500 }}>
                ⚠️ This action is <strong>permanent</strong>. All your orders, addresses, and account data will be deleted and cannot be recovered.
              </div>
            </div>
            <div className="cp-field">
              <label className="cp-label">Type <strong>DELETE</strong> to confirm</label>
              <input
                className={`cp-input ${confirm.length > 0 && confirm !== "DELETE" ? "cp-input-err" : ""}`}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value.toUpperCase())}
                placeholder="DELETE"
                style={{ letterSpacing: 2, fontWeight: 700 }}
              />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button className="cp-btn-cancel" onClick={() => setStep(1)}>Back</button>
              <button
                style={{
                  flex: 1, padding: 13, borderRadius: 14,
                  background: confirm === "DELETE" ? "#DC2626" : "#EAE5DF",
                  border: "none", fontSize: 14, fontWeight: 700,
                  color: confirm === "DELETE" ? "white" : "#9B8E84",
                  cursor: confirm === "DELETE" ? "pointer" : "default",
                  fontFamily: "'DM Sans', sans-serif",
                }}
                onClick={() => confirm === "DELETE" && onClose()}
              >
                Delete My Account
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════
   Account Privacy Page
═══════════════════════════════════════ */
const AccountPrivacy = () => {
  const router = useIonRouter();

  const [settings, setSettings] = useState({
    orderUpdates:       true,
    promotions:         false,
    emailNotifications: true,
    smsAlerts:          true,
    locationAccess:     true,
    activityTracking:   false,
    dataSharing:        false,
    twoFactor:          false,
  });

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteAccount,  setShowDeleteAccount]  = useState(false);

  const toggle = (key: keyof typeof settings) =>
    setSettings((s) => ({ ...s, [key]: !s[key] }));

  const sections = [
    {
      title: "Notifications",
      icon: "🔔",
      items: [
        {
          key: "orderUpdates",
          label: "Order Updates",
          desc: "Get notified about order status changes",
          icon: notificationsOutline,
        },
        {
          key: "promotions",
          label: "Promotions & Offers",
          desc: "Receive deals, discounts and special offers",
          icon: notificationsOutline,
        },
        {
          key: "emailNotifications",
          label: "Email Notifications",
          desc: "Receive updates and receipts via email",
          icon: mailOutline,
        },
        {
          key: "smsAlerts",
          label: "SMS Alerts",
          desc: "Delivery updates via text message",
          icon: phonePortraitOutline,
        },
      ],
    },
    {
      title: "Privacy",
      icon: "🔒",
      items: [
        {
          key: "locationAccess",
          label: "Location Access",
          desc: "Allow app to access location for delivery",
          icon: informationCircleOutline,
        },
        {
          key: "activityTracking",
          label: "Activity Tracking",
          desc: "Help us improve by sharing usage data",
          icon: eyeOffOutline,
        },
        {
          key: "dataSharing",
          label: "Personalization Data",
          desc: "Use purchase history to personalize recommendations",
          icon: shieldCheckmarkOutline,
        },
      ],
    },
    {
      title: "Security",
      icon: "🛡️",
      items: [
        {
          key: "twoFactor",
          label: "Two-Factor Authentication",
          desc: "Add an extra layer of security to your account",
          icon: lockClosedOutline,
        },
      ],
    },
  ];

  return (
    <IonPage>
      <IonContent fullscreen>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          :root {
            --bg: #FFFBEB; --surface: #FFFFFF; --charcoal: #1A1714;
            --amber: #E07B00; --amber-light: #F59E0B; --amber-pale: #FEF3C7;
            --muted: #9B8E84; --border: #EAE5DF;
          }
          .ap-root { font-family: 'DM Sans', sans-serif; background: var(--bg); min-height: 100vh; }

          /* Header */
          .ap-header {
            position: sticky; top: 0; z-index: 100;
            background: #FFFBEB; border-bottom: 1px solid #F0E8C0;
            padding: 14px 16px;
            display: flex; align-items: center; gap: 12px;
          }
          .ap-back-btn {
            width: 38px; height: 38px; border-radius: 12px;
            background: #F5EFE0; border: none; cursor: pointer;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          }
          .ap-header-title { font-family: 'Syne', sans-serif; font-size: 19px; font-weight: 800; color: #1A1714; }
          .ap-header-sub { font-size: 11px; color: #9B8E84; margin-top: 1px; }

          /* Hero card */
          .ap-hero {
            margin: 16px 16px 0;
            background: linear-gradient(135deg, #1A1714, #2D2520);
            border-radius: 22px; padding: 22px 20px;
            display: flex; align-items: center; gap: 16px;
          }
          .ap-hero-icon {
            width: 56px; height: 56px; border-radius: 18px;
            background: rgba(224,123,0,0.2);
            display: flex; align-items: center; justify-content: center;
            font-size: 28px; flex-shrink: 0;
          }
          .ap-hero-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 800; color: white; margin-bottom: 4px; }
          .ap-hero-sub { font-size: 12px; color: rgba(255,255,255,0.5); line-height: 1.5; }

          /* Section */
          .ap-section { margin: 20px 16px 0; }
          .ap-section-label {
            display: flex; align-items: center; gap: 6px;
            font-size: 12px; font-weight: 700; color: #9B8E84;
            text-transform: uppercase; letter-spacing: 0.07em;
            margin-bottom: 10px; padding: 0 2px;
          }
          .ap-card {
            background: white; border-radius: 20px; border: 1px solid #EAE5DF; overflow: hidden;
          }
          .ap-row {
            display: flex; align-items: center; gap: 12px;
            padding: 14px 16px;
            border-bottom: 1px solid #F5F2EC;
            transition: background 0.15s;
          }
          .ap-row:last-child { border-bottom: none; }
          .ap-row-icon {
            width: 36px; height: 36px; border-radius: 10px;
            background: #F5EFE0;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          }
          .ap-row-content { flex: 1; min-width: 0; }
          .ap-row-label { font-size: 14px; font-weight: 600; color: #1A1714; }
          .ap-row-desc { font-size: 11px; color: #9B8E84; margin-top: 2px; line-height: 1.4; }

          /* Action rows */
          .ap-action-card {
            background: white; border-radius: 20px; border: 1px solid #EAE5DF; overflow: hidden;
            margin-top: 20px;
          }
          .ap-action-row {
            display: flex; align-items: center; gap: 12px;
            padding: 15px 16px; cursor: pointer;
            border-bottom: 1px solid #F5F2EC;
            transition: background 0.15s;
          }
          .ap-action-row:last-child { border-bottom: none; }
          .ap-action-row:active { background: #FAF8F5; }
          .ap-action-icon {
            width: 36px; height: 36px; border-radius: 10px;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          }
          .ap-action-label { font-size: 14px; font-weight: 600; }
          .ap-action-desc { font-size: 11px; color: #9B8E84; margin-top: 2px; }

          /* Delete zone */
          .ap-delete-zone {
            margin: 20px 16px;
            background: white; border-radius: 20px; border: 1px solid #FECACA; overflow: hidden;
          }
          .ap-delete-row {
            display: flex; align-items: center; gap: 12px;
            padding: 15px 16px; cursor: pointer;
            transition: background 0.15s;
          }
          .ap-delete-row:active { background: #FEF2F2; }

          /* Modal base */
          .cp-overlay {
            position: fixed; inset: 0; background: rgba(0,0,0,0.45);
            z-index: 1000; display: flex; align-items: flex-end; justify-content: center;
          }
          .cp-sheet {
            background: white; border-radius: 24px 24px 0 0;
            padding: 8px 20px 44px; width: 100%; max-width: 480px;
            max-height: 88vh; overflow-y: auto;
            animation: slideUp 0.25s ease;
          }
          @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
          .cp-handle { width: 40px; height: 4px; border-radius: 2px; background: #EAE5DF; margin: 10px auto 20px; }
          .cp-title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; color: #1A1714; margin-bottom: 18px; }
          .cp-field { margin-bottom: 14px; }
          .cp-label { font-size: 12px; font-weight: 600; color: #5A5248; margin-bottom: 6px; display: block; }
          .cp-input-wrap { position: relative; }
          .cp-input {
            width: 100%; padding: 11px 44px 11px 14px; border-radius: 12px;
            border: 1.5px solid #EAE5DF; background: #FFFBF5;
            font-size: 14px; color: #1A1714; outline: none;
            font-family: 'DM Sans', sans-serif; transition: border-color 0.15s;
          }
          .cp-input:focus { border-color: #E07B00; }
          .cp-input-err { border-color: #DC2626 !important; }
          .cp-err { font-size: 11px; color: #DC2626; margin-top: 4px; }
          .cp-eye {
            position: absolute; right: 12px; top: 50%;
            transform: translateY(-50%); background: none; border: none; cursor: pointer;
            display: flex; align-items: center; padding: 0;
          }
          .cp-actions { display: flex; gap: 10px; margin-top: 8px; }
          .cp-btn-cancel { flex: 1; padding: 13px; border-radius: 14px; background: #F5EFE0; border: none; font-size: 14px; font-weight: 700; color: #1A1714; cursor: pointer; font-family: 'DM Sans', sans-serif; }
          .cp-btn-save { flex: 1; padding: 13px; border-radius: 14px; background: #1A1714; border: none; font-size: 14px; font-weight: 700; color: white; cursor: pointer; font-family: 'DM Sans', sans-serif; }
          .cp-btn-save:active { background: #E07B00; }

          .ap-pb { height: 80px; }
        `}</style>

        <div className="ap-root">
          {/* Header */}
          <div className="ap-header">
            <button className="ap-back-btn" onClick={() => router.goBack()}>
              <IonIcon icon={arrowBackOutline} style={{ fontSize: 20, color: "#1A1714" }} />
            </button>
            <div>
              <div className="ap-header-title">Account & Privacy</div>
              <div className="ap-header-sub">Manage your preferences</div>
            </div>
          </div>

          {/* Hero */}
          <div className="ap-hero">
            <div className="ap-hero-icon">🛡️</div>
            <div>
              <div className="ap-hero-title">Your data, your control</div>
              <div className="ap-hero-sub">Manage what we collect, how we use it, and how we communicate with you.</div>
            </div>
          </div>

          {/* Toggle sections */}
          {sections.map((sec) => (
            <div key={sec.title} className="ap-section">
              <div className="ap-section-label">
                <span>{sec.icon}</span> {sec.title}
              </div>
              <div className="ap-card">
                {sec.items.map((item) => (
                  <div key={item.key} className="ap-row">
                    <div className="ap-row-icon">
                      <IonIcon icon={item.icon} style={{ fontSize: 17, color: "#5A5248" }} />
                    </div>
                    <div className="ap-row-content">
                      <div className="ap-row-label">{item.label}</div>
                      <div className="ap-row-desc">{item.desc}</div>
                    </div>
                    <Toggle
                      on={settings[item.key as keyof typeof settings]}
                      onChange={() => toggle(item.key as keyof typeof settings)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Action rows */}
          <div className="ap-section">
            <div className="ap-section-label">⚙️ Account Actions</div>
            <div className="ap-action-card">
              <div className="ap-action-row" onClick={() => setShowChangePassword(true)}>
                <div className="ap-action-icon" style={{ background: "#F5EFE0" }}>
                  <IonIcon icon={lockClosedOutline} style={{ fontSize: 18, color: "#5A5248" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="ap-action-label" style={{ color: "#1A1714" }}>Change Password</div>
                  <div className="ap-action-desc">Update your account password</div>
                </div>
                <IonIcon icon={chevronForwardOutline} style={{ fontSize: 16, color: "#9B8E84" }} />
              </div>
              <div className="ap-action-row">
                <div className="ap-action-icon" style={{ background: "#F5EFE0" }}>
                  <IonIcon icon={shieldCheckmarkOutline} style={{ fontSize: 18, color: "#5A5248" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="ap-action-label" style={{ color: "#1A1714" }}>Download My Data</div>
                  <div className="ap-action-desc">Get a copy of all data we hold about you</div>
                </div>
                <IonIcon icon={chevronForwardOutline} style={{ fontSize: 16, color: "#9B8E84" }} />
              </div>
              <div className="ap-action-row">
                <div className="ap-action-icon" style={{ background: "#F5EFE0" }}>
                  <IonIcon icon={eyeOffOutline} style={{ fontSize: 18, color: "#5A5248" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="ap-action-label" style={{ color: "#1A1714" }}>Privacy Policy</div>
                  <div className="ap-action-desc">Read how we handle your information</div>
                </div>
                <IonIcon icon={chevronForwardOutline} style={{ fontSize: 16, color: "#9B8E84" }} />
              </div>
            </div>
          </div>

          {/* Danger zone */}
          <div className="ap-section" style={{ marginBottom: 0 }}>
            <div className="ap-section-label" style={{ color: "#DC2626" }}>⚠️ Danger Zone</div>
          </div>
          <div className="ap-delete-zone">
            <div className="ap-delete-row" onClick={() => setShowDeleteAccount(true)}>
              <div className="ap-action-icon" style={{ background: "#FEE2E2" }}>
                <IonIcon icon={trashOutline} style={{ fontSize: 18, color: "#DC2626" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="ap-action-label" style={{ color: "#DC2626" }}>Delete My Account</div>
                <div className="ap-action-desc">Permanently remove your account and all data</div>
              </div>
              <IonIcon icon={chevronForwardOutline} style={{ fontSize: 16, color: "#DC2626" }} />
            </div>
          </div>

          <div className="ap-pb" />
        </div>

        {/* Change Password Modal */}
        {showChangePassword && (
          <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
        )}

        {/* Delete Account Modal */}
        {showDeleteAccount && (
          <DeleteAccountModal onClose={() => setShowDeleteAccount(false)} />
        )}
      </IonContent>
    </IonPage>
  );
};

export default AccountPrivacy;