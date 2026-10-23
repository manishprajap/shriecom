import {
  IonPage,
  IonContent,
  IonIcon,
  useIonRouter,
} from "@ionic/react";
import {
  arrowBackOutline,
  personOutline,
  callOutline,
  mailOutline,
  calendarOutline,
  cameraOutline,
  checkmarkCircle,
  pencilOutline,
  shieldCheckmarkOutline,
  closeOutline,
} from "ionicons/icons";
import { useState, useRef, useEffect } from "react";
import { Circles } from "react-loader-spinner";
import logo from "../assets/shrilogo.jpeg";

const BASE = "https://shriecom.in/appapis/shreefood/public/api";

const getInitials = (name: string) =>
  name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

/* ══ Toast ══ */
const Toast: React.FC<{ msg: string; type: "success" | "error"; onClose: () => void }> = ({
  msg, type, onClose,
}) => (
  <div style={{
    position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
    background: type === "success" ? "#16A34A" : "#DC2626",
    color: "white", padding: "12px 24px", borderRadius: 14,
    fontSize: 14, fontWeight: 600, zIndex: 99999,
    boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
    display: "flex", alignItems: "center", gap: 8,
    whiteSpace: "nowrap",
  }}>
    <IonIcon icon={type === "success" ? checkmarkCircle : closeOutline} style={{ fontSize: 18 }} />
    {msg}
  </div>
);

/* ══ Input Field ══ */
const InputField: React.FC<{
  label: string; icon: string; value: string;
  onChange: (v: string) => void; type?: string;
  placeholder?: string; disabled?: boolean; hint?: string;
}> = ({ label, icon, value, onChange, type = "text", placeholder, disabled, hint }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: "#9B8E84", letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
        {label}
      </label>
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        background: focused ? "#FFF8EE" : "#FAFAF9",
        border: `2px solid ${focused ? "#E07B00" : disabled ? "#F0EDE8" : "#E8E3DC"}`,
        borderRadius: 14, padding: "0 16px",
        transition: "all 0.2s ease",
        opacity: disabled ? 0.65 : 1,
      }}>
        <IonIcon icon={icon} style={{ fontSize: 18, color: focused ? "#E07B00" : "#9B8E84", flexShrink: 0, transition: "color 0.2s" }} />
        <input
          type={type}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1, border: "none", background: "transparent",
            fontSize: 15, fontWeight: 500, color: "#1A1714",
            fontFamily: "'Nunito', sans-serif",
            padding: "14px 0", outline: "none",
          }}
        />
      </div>
      {hint && <div style={{ fontSize: 11, color: "#9B8E84", marginTop: 5, paddingLeft: 4 }}>{hint}</div>}
    </div>
  );
};

/* ══ Gender Picker ══ */
const GenderPicker: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  const options = ["Male", "Female", "Other"];
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: "#9B8E84", letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
        Gender
      </label>
      <div style={{ display: "flex", gap: 10 }}>
        {options.map((g) => (
          <button
            key={g}
            onClick={() => onChange(g)}
            style={{
              flex: 1, padding: "12px 8px", borderRadius: 12, cursor: "pointer",
              border: `2px solid ${value === g ? "#E07B00" : "#E8E3DC"}`,
              background: value === g ? "#FFF3E0" : "#FAFAF9",
              color: value === g ? "#E07B00" : "#6B7280",
              fontSize: 13, fontWeight: 700, fontFamily: "'Nunito', sans-serif",
              transition: "all 0.2s ease",
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 3 }}>
              {g === "Male" ? "👨" : g === "Female" ? "👩" : "🧑"}
            </div>
            {g}
          </button>
        ))}
      </div>
    </div>
  );
};

/* ══ MAIN COMPONENT ══ */
const EditProfile: React.FC = () => {
  const router = useIonRouter();

  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const [userId, setUserId]   = useState<string>("");
  const [token,  setToken]    = useState<string>("");
  const [name,   setName]     = useState("");
  const [phone,  setPhone]    = useState("");
  const [email,  setEmail]    = useState("");
  const [dob,    setDob]      = useState("");
  const [gender, setGender]   = useState("");
  const [avatar, setAvatar]   = useState<string | null>(null);
const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Try all common keys used by Ionic/Capacitor auth storage
    const keys = ["auth_user", "user", "userData", "currentUser", "loggedUser"];
    let found = false;

    for (const key of keys) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const u = JSON.parse(raw);
          setUserId(u.id   ?? u.user_id   ?? u.userId   ?? "");
          setToken( u.token ?? u.auth_token ?? u.access_token ?? "");
          setName(  u.name  ?? u.full_name  ?? "");
          setPhone( u.phone ?? u.mobile     ?? u.phone_number ?? "");
          setEmail( u.email ?? "");
          setDob(   u.dob   ?? u.date_of_birth ?? "");
          setGender(u.gender ?? "");
          setAvatar(u.avatar ?? u.profile_image ?? null);
		  
          found = true;
          break;
        }
      } catch { /* skip */ }
    }

    // Also check Capacitor Preferences keys
    if (!found) {
      ["_cap_auth_user", "_cap_user"].forEach((key) => {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const u = JSON.parse(raw);
            setName(u.name ?? "");
            setPhone(u.phone ?? "");
            setEmail(u.email ?? "");
          }
        } catch { /* skip */ }
      });
    }

    setLoading(false);
  }, []);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
  if (!name.trim()) { showToast("Naam zaroori hai", "error"); return; }
  if (!phone.trim() || phone.replace(/\D/g, "").length < 10) {
    showToast("Sahi phone number daalo", "error"); return;
  }

  setSaving(true);
  try {
    // Token dhundo — sabse pehle dedicated key check karo
    const authToken = token 
      || localStorage.getItem("token") 
      || localStorage.getItem("auth_token")
      || (() => {
          try { return JSON.parse(localStorage.getItem("auth_user") || "{}").token; } 
          catch { return ""; }
        })();

    const formData = new FormData();
    formData.append("name",  name.trim());
    formData.append("phone", phone.trim());
    formData.append("email", email.trim());
    if (dob)    formData.append("dob",    dob);
    if (gender) formData.append("gender", gender);
	if (avatarFile) formData.append("avatar", avatarFile); // ✅ image file bhejo
	
	// handleAvatarChange update karo
const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  setAvatarFile(file); // ✅ actual file save karo
  const reader = new FileReader();
  reader.onload = () => setAvatar(reader.result as string); // preview ke liye
  reader.readAsDataURL(file);
};

    const res = await fetch(`${BASE}/update-profile`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${authToken}`,
      },
      body: formData,
    });

    const json = await res.json().catch(() => ({ success: false }));

    if (!res.ok || json.success === false) {
      showToast(json.message || "Update fail hua", "error");
      return;
    }

    // LocalStorage update karo
    const updated = { id: userId, token: authToken, name, phone, email, dob, gender, avatar };
    ["auth_user", "user", "userData"].forEach((key) => {
      try {
        const existing = localStorage.getItem(key);
        if (existing) localStorage.setItem(key, JSON.stringify({ ...JSON.parse(existing), ...updated }));
      } catch { /* skip */ }
    });
    localStorage.setItem("auth_user", JSON.stringify(updated));

    showToast("Profile update ho gaya! ✓", "success");
    setTimeout(() => router.goBack(), 1800);

  } catch (err) {
    console.error("Update error:", err);
    showToast("Network error, dobara try karo", "error");
  } finally {
    setSaving(false);
  }
};

  if (loading) {
    return (
      <IonPage>
        <IonContent>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
            <Circles height="48" width="48" color="#E07B00" ariaLabel="loading" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent fullscreen>
        <style>{`
          @keyframes slideUp {
            from { opacity: 0; transform: translateX(-50%) translateY(16px); }
            to   { opacity: 1; transform: translateX(-50%) translateY(0);    }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0);    }
          }
          .ep-section { animation: fadeIn 0.4s ease both; }
          .ep-save-btn:active { transform: scale(0.97); }
        `}</style>

        {/* ════ HEADER ════ */}
        <div style={{
          background: "linear-gradient(135deg,#1A1714 0%,#2D2520 100%)",
          padding: "0 0 32px", position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(224,123,0,0.08)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -20, left: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(224,123,0,0.05)", pointerEvents: "none" }} />

          <div style={{ display: "flex", alignItems: "center", padding: "16px 16px 0", gap: 12 }}>
            <button
              onClick={() => router.goBack()}
              style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            >
              <IonIcon icon={arrowBackOutline} style={{ fontSize: 20, color: "white" }} />
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "white", fontFamily: "'Nunito',sans-serif" }}>Edit Profile</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>Apni personal info update karo</div>
            </div>
            <img src={logo} alt="Logo" style={{ height: 34, opacity: 0.85 }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 24, gap: 8 }}>
            <div style={{ position: "relative" }}>
              <div style={{
                width: 90, height: 90, borderRadius: "50%",
                background: avatar ? "transparent" : "linear-gradient(135deg,#F59E0B,#D97706)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 0 4px rgba(224,123,0,0.35), 0 8px 24px rgba(0,0,0,0.3)",
                overflow: "hidden",
              }}>
                {avatar
                  ? <img src={avatar} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontSize: 32, fontWeight: 800, color: "white" }}>{getInitials(name || "U")}</span>
                }
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  position: "absolute", bottom: 0, right: 0,
                  width: 28, height: 28, borderRadius: "50%",
                  background: "#E07B00", border: "2px solid #1A1714",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <IonIcon icon={cameraOutline} style={{ fontSize: 13, color: "white" }} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
            </div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", fontFamily: "'Nunito',sans-serif" }}>
              Camera tap karo photo change karne ke liye
            </div>
          </div>
        </div>

        {/* ════ FORM ════ */}
        <div style={{ padding: "24px 16px 120px", background: "#F9F6F1", minHeight: "calc(100vh - 240px)" }}>

          {/* Debug info — REMOVE IN PRODUCTION */}
          {!userId && (
            <div style={{ background: "#FEF9C3", borderRadius: 12, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#854D0E" }}>
              ⚠️ User ID nahi mila. Login karke dobara aao ya <code>useAuth</code> hook check karo.
            </div>
          )}

          <div className="ep-section" style={{ background: "white", borderRadius: 20, padding: "20px 16px", marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IonIcon icon={personOutline} style={{ fontSize: 16, color: "#D97706" }} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#1A1714", fontFamily: "'Nunito',sans-serif" }}>Personal Info</div>
            </div>

            <InputField label="Poora Naam" icon={personOutline} value={name} onChange={setName} placeholder="Apna poora naam daalo" />
            <InputField label="Phone Number" icon={callOutline} value={phone} onChange={setPhone} type="tel" placeholder="10 digit mobile number" hint="Orders aur login ke liye use hoga" />
            <InputField label="Email Address" icon={mailOutline} value={email} onChange={setEmail} type="email" placeholder="your@email.com" />
          </div>

          <div className="ep-section" style={{ background: "white", borderRadius: 20, padding: "20px 16px", marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.05)", animationDelay: "0.1s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IonIcon icon={pencilOutline} style={{ fontSize: 16, color: "#16A34A" }} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#1A1714", fontFamily: "'Nunito',sans-serif" }}>Aur Details</div>
            </div>
            <InputField label="Date of Birth" icon={calendarOutline} value={dob} onChange={setDob} type="date" />
            <GenderPicker value={gender} onChange={setGender} />
          </div>

          <div className="ep-section" style={{ display: "flex", alignItems: "center", gap: 10, background: "#F0FDF4", borderRadius: 14, padding: "12px 14px", marginBottom: 24, border: "1px solid #BBF7D0", animationDelay: "0.2s" }}>
            <IonIcon icon={shieldCheckmarkOutline} style={{ fontSize: 20, color: "#16A34A", flexShrink: 0 }} />
            <div style={{ fontSize: 12, color: "#166534", fontWeight: 600, fontFamily: "'Nunito',sans-serif", lineHeight: 1.5 }}>
              Aapka data secure hai aur kisi third party ke saath share nahi hoga.
            </div>
          </div>

          <button
            className="ep-save-btn"
            onClick={handleSave}
            disabled={saving}
            style={{
              width: "100%", padding: "17px", borderRadius: 16,
              background: saving ? "#9B8E84" : "linear-gradient(135deg,#E07B00,#D97706)",
              border: "none", cursor: saving ? "not-allowed" : "pointer",
              color: "white", fontSize: 16, fontWeight: 800,
              fontFamily: "'Nunito',sans-serif",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              boxShadow: saving ? "none" : "0 6px 20px rgba(224,123,0,0.4)",
              transition: "all 0.2s ease",
            }}
          >
            {saving
              ? <><Circles height="22" width="22" color="white" ariaLabel="saving" /> Save ho raha hai…</>
              : <><IonIcon icon={checkmarkCircle} style={{ fontSize: 20 }} /> Changes Save Karo</>
            }
          </button>
        </div>

        {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </IonContent>
    </IonPage>
  );
};

export default EditProfile;