import { IonContent, IonInput, IonButton, IonIcon } from "@ionic/react";
import { arrowBackOutline, eyeOutline, eyeOffOutline } from "ionicons/icons";
import { useState } from "react";
import logo from "../assets/shrilogo.jpeg";
import OtpModal from "./OtpModal";

interface RegisterModalProps {
  closeModal: () => void;
  openLogin: () => void;
}

const API_BASE = "https://shriecom.in/appapis/shreefood/public/api";

const RegisterModal = ({ closeModal, openLogin }: RegisterModalProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // OTP step state
  const [showOtp, setShowOtp] = useState(false);
  const [otpPhone, setOtpPhone] = useState("");

  const getDeviceId = () => {
    let deviceId = localStorage.getItem("device_id");
    if (!deviceId) {
      deviceId = "dev-" + Math.random().toString(36).substring(2, 10);
      localStorage.setItem("device_id", deviceId);
    }
    return deviceId;
  };

  const handleRegister = async () => {
    setError(null);

    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (!/^\d{10}$/.test(phone.trim())) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone.trim(),
          device_id: getDeviceId(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 422 && data?.errors) {
          const firstError = Object.values(data.errors as Record<string, string[]>)[0]?.[0];
          setError(firstError ?? data.message ?? "Validation failed.");
        } else {
          setError(data?.message ?? `Server error (${response.status})`);
        }
        return;
      }

      if (data?.success) {
        const phoneForOtp =
          data?.phone ??
          data?.data?.phone ??
          data?.user?.phone ??
          phone.trim();

        setOtpPhone(phoneForOtp);
        setShowOtp(true);
      } else {
        setError(data?.message ?? "Registration failed. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to connect to server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // ── Show OTP screen after register ──
  if (showOtp) {
    return (
      <OtpModal
        phone={otpPhone}
        roleId={2}
        mode="register"
        closeModal={closeModal}
        goBack={() => setShowOtp(false)}
        redirectAfterLogin="/"
      />
    );
  }

  return (
    <>
      <style>{`
        :root {
          --cream: #FAF6F0; --charcoal: #1C1917; --warm-brown: #78350F;
          --amber: #D97706; --amber-light: #F59E0B; --muted: #A8A29E;
          --surface: #FFFFFF; --border: #E7E0D8;
          --shadow: 0 32px 80px rgba(28,25,23,0.15);
          --error: #DC2626; --error-bg: #FEF2F2; --error-border: #FECACA;
        }
        .rm-content { font-family: 'DM Sans', sans-serif; }
        .rm-blob { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; }
        .rm-blob-1 { width: 300px; height: 300px; background: radial-gradient(circle, rgba(217,119,6,0.14) 0%, transparent 70%); top: -70px; right: -70px; animation: rmBlobFloat 9s ease-in-out infinite; }
        .rm-blob-2 { width: 220px; height: 220px; background: radial-gradient(circle, rgba(120,53,15,0.10) 0%, transparent 70%); bottom: -50px; left: -50px; animation: rmBlobFloat 11s ease-in-out infinite reverse; }
        @keyframes rmBlobFloat { 0%,100% { transform: translateY(0px) scale(1); } 50% { transform: translateY(-18px) scale(1.05); } }
        .rm-card { background: var(--surface); border-radius: 28px; box-shadow: var(--shadow), 0 0 0 1px rgba(231,224,216,0.8); padding: 40px 36px; width: 100%; max-width: 420px; position: relative; animation: rmCardIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
        @keyframes rmCardIn { from { opacity:0; transform: translateY(32px) scale(0.96); } to { opacity:1; transform: translateY(0) scale(1); } }
        .rm-back { position: absolute; top: 20px; left: 20px; width: 38px; height: 38px; border-radius: 50%; background: var(--cream); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--charcoal); transition: all 0.2s ease; }
        .rm-back:hover { background: var(--charcoal); color: white; border-color: var(--charcoal); transform: scale(1.08); }
        .rm-back ion-icon { font-size: 18px; }
        .rm-logo-wrap { display: flex; flex-direction: column; align-items: center; margin-bottom: 24px; margin-top: 8px; }
        .rm-logo-ring { width: 72px; height: 72px; border-radius: 20px; background: linear-gradient(135deg, var(--amber-light), var(--amber)); display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(217,119,6,0.3); }
        .rm-logo-ring img { width: 46px; height: 46px; object-fit: contain; }
        .rm-title { font-size: 28px; font-weight: 700; color: var(--charcoal); margin: 0 0 6px; text-align: center; }
        .rm-divider { display: flex; align-items: center; gap: 12px; margin-bottom: 22px; }
        .rm-divider-line { flex: 1; height: 1px; background: var(--border); }
        .rm-field { margin-bottom: 14px; }
        .rm-field-label { font-size: 11px; font-weight: 500; color: var(--muted); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 6px; display: block; }
        .rm-input-box { border: 1.5px solid var(--border); border-radius: 14px; background: var(--cream); transition: all 0.25s ease; overflow: hidden; display: flex; align-items: center; }
        .rm-input-box.focused { border-color: var(--amber); background: #FFFBF4; box-shadow: 0 0 0 3px rgba(217,119,6,0.10); }
        .rm-input-box ion-input { --padding-start: 16px; --padding-end: 16px; --padding-top: 14px; --padding-bottom: 14px; --color: var(--charcoal); --placeholder-color: #C4B8AE; font-size: 15px; font-family: 'DM Sans', sans-serif; --background: transparent; flex: 1; }
        .rm-eye-btn { --color: var(--muted); --padding-start: 8px; --padding-end: 12px; margin: 0; height: 100%; flex-shrink: 0; }
        .rm-error { background: var(--error-bg); border: 1px solid var(--error-border); border-radius: 12px; padding: 10px 14px; margin-bottom: 14px; font-size: 13px; color: var(--error); display: flex; align-items: center; gap: 8px; animation: errorIn 0.25s ease both; }
        @keyframes errorIn { from { opacity:0; transform: translateY(-6px); } to { opacity:1; transform: translateY(0); } }
        .rm-error-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--error); flex-shrink: 0; }
        .rm-strength-bar { display: flex; gap: 4px; margin-top: 8px; }
        .rm-strength-seg { flex: 1; height: 3px; border-radius: 2px; background: var(--border); transition: background 0.3s ease; }
        .rm-strength-seg.weak { background: #EF4444; }
        .rm-strength-seg.medium { background: #F59E0B; }
        .rm-strength-seg.strong { background: #10B981; }
        .rm-strength-label { font-size: 11px; color: var(--muted); margin-top: 4px; text-align: right; }
        .rm-btn { margin-top: 24px; --border-radius: 14px; --background: linear-gradient(135deg, #D97706, #B45309); --background-hover: linear-gradient(135deg, #F59E0B, #D97706); --box-shadow: 0 8px 24px rgba(180,83,9,0.35); --color: white; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 500; height: 52px; }
        .rm-btn:disabled { opacity: 0.7; }
        .rm-spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.4); border-top-color: white; border-radius: 50%; animation: rmSpin 0.7s linear infinite; margin-right: 8px; vertical-align: middle; }
        @keyframes rmSpin { to { transform: rotate(360deg); } }
        .rm-login-row { display: flex; align-items: center; justify-content: center; gap: 4px; margin-top: 20px; }
        .rm-login-row p { font-size: 13px; color: var(--muted); margin: 0; }
        .rm-login-btn { --color: var(--amber); font-size: 13px; font-weight: 500; font-family: 'DM Sans', sans-serif; --padding-start: 4px; --padding-end: 4px; margin: 0; height: auto; }
        .rm-terms { font-size: 11px; color: #C4B8AE; text-align: center; margin-top: 20px; line-height: 1.6; }
        .rm-terms span { color: var(--muted); text-decoration: underline; cursor: pointer; }
      `}</style>

      <IonContent className="rm-content">
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--cream)", padding: "24px", position: "relative", overflow: "hidden" }}>
          <div className="rm-blob rm-blob-1" />
          <div className="rm-blob rm-blob-2" />

          <div className="rm-card">
            <div className="rm-back" onClick={closeModal}>
              <IonIcon icon={arrowBackOutline} />
            </div>

            <div className="rm-logo-wrap">
              <div className="rm-logo-ring">
                <img src={logo} alt="Logo" />
              </div>
            </div>

            <h2 className="rm-title">Create Account</h2>

            <div className="rm-divider">
              <div className="rm-divider-line" />
              <span style={{ fontSize: "11px", color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Register</span>
              <div className="rm-divider-line" />
            </div>

            {error && (
              <div className="rm-error">
                <span className="rm-error-dot" />
                {error}
              </div>
            )}

            {/* Full Name */}
            <div className="rm-field">
              <label className="rm-field-label">Full Name</label>
              <div className={`rm-input-box ${focused === "name" ? "focused" : ""}`}>
                <IonInput
                  placeholder="John Doe"
                  value={name}
                  onIonInput={(e: any) => setName(e.target.value)}
                  onIonFocus={() => setFocused("name")}
                  onIonBlur={() => setFocused(null)}
                />
              </div>
            </div>

            {/* Email */}
            <div className="rm-field">
              <label className="rm-field-label">Email Address</label>
              <div className={`rm-input-box ${focused === "email" ? "focused" : ""}`}>
                <IonInput
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onIonInput={(e: any) => setEmail(e.target.value)}
                  onIonFocus={() => setFocused("email")}
                  onIonBlur={() => setFocused(null)}
                />
              </div>
            </div>

            {/* Mobile */}
            <div className="rm-field">
              <label className="rm-field-label">Mobile Number</label>
              <div className={`rm-input-box ${focused === "phone" ? "focused" : ""}`}>
                <IonInput
                  type="tel"
                  placeholder="10-digit mobile"
                  value={phone}
                  onIonInput={(e: any) => setPhone(e.target.value)}
                  onIonFocus={() => setFocused("phone")}
                  onIonBlur={() => setFocused(null)}
                />
              </div>
            </div>

            {/* Password */}
            <div className="rm-field">
              <label className="rm-field-label">Password</label>
              <div className={`rm-input-box ${focused === "password" ? "focused" : ""}`}>
                <IonInput
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={password}
                  onIonInput={(e: any) => setPassword(e.target.value)}
                  onIonFocus={() => setFocused("password")}
                  onIonBlur={() => setFocused(null)}
                />
                <IonButton
                  fill="clear"
                  className="rm-eye-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                >
                  <IonIcon icon={showPassword ? eyeOffOutline : eyeOutline} />
                </IonButton>
              </div>
              {password.length > 0 && (
                <>
                  <div className="rm-strength-bar">
                    <div className={`rm-strength-seg ${password.length >= 1 ? (password.length < 5 ? "weak" : password.length < 8 ? "medium" : "strong") : ""}`} />
                    <div className={`rm-strength-seg ${password.length >= 5 ? (password.length < 8 ? "medium" : "strong") : ""}`} />
                    <div className={`rm-strength-seg ${password.length >= 8 ? "strong" : ""}`} />
                  </div>
                  <p className="rm-strength-label">
                    {password.length < 5 ? "Weak" : password.length < 8 ? "Medium" : "Strong"}
                  </p>
                </>
              )}
            </div>

            <IonButton
              expand="block"
              className="rm-btn"
              onClick={handleRegister}
              disabled={loading}
            >
              {loading && <span className="rm-spinner" />}
              {loading ? "Creating account..." : "Create Account"}
            </IonButton>

            <div className="rm-login-row">
              <p>Already have an account?</p>
              <IonButton fill="clear" className="rm-login-btn" onClick={openLogin}>
                Sign In
              </IonButton>
            </div>

            <p className="rm-terms">
              By continuing, you agree to our{" "}
              <span>Terms of Service</span> & <span>Privacy Policy</span>
            </p>
          </div>
        </div>
      </IonContent>
    </>
  );
};

export default RegisterModal;