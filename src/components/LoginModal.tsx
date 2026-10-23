import {
  IonContent,
  IonInput,
  IonButton,
  IonIcon,
} from "@ionic/react";
import { arrowBackOutline, eyeOutline, eyeOffOutline } from "ionicons/icons";
import { useRef, useState } from "react";
import logo from "../assets/shrilogo.jpeg";
import OtpModal from "./OtpModal";

interface LoginModalProps {
  closeModal: () => void;
  openRegister: () => void;
  redirectAfterLogin?: string;
}

const API_BASE = "https://shriecom.in/appapis/shreefood/public/api";

const LoginModal: React.FC<LoginModalProps> = ({
  closeModal,
  openRegister,
  redirectAfterLogin = "/",
}) => {
  const identifierRef = useRef<HTMLIonInputElement>(null);
  const passwordRef = useRef<HTMLIonInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [identifierValue, setIdentifierValue] = useState("");

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

  const isEmail = (value: string) => value.includes("@");

  const handleLogin = async () => {
    setError(null);

    const identifier = (identifierRef.current?.value ?? "").toString().trim();
    const password = (passwordRef.current?.value ?? "").toString().trim();

    if (!identifier || !password) {
      setError("Please enter your email/phone and password.");
      return;
    }

    if (!isEmail(identifier) && !/^\+?[0-9]{7,15}$/.test(identifier)) {
      setError("Please enter a valid email address or phone number.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ login: identifier, password, device_id: getDeviceId() }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 422 && data?.errors) {
          const firstError = Object.values(data.errors as Record<string, string[]>)[0]?.[0];
          setError(firstError ?? "Validation failed.");
        } else {
          setError(data?.message ?? `Server error (${response.status})`);
        }
        return;
      }

      // ✅ Step 1 success — server sends OTP, now show OTP screen
      if (data?.success && data?.phone) {
        setOtpPhone(data.phone);
        setShowOtp(true);
      } else {
        setError(data?.message ?? "Login failed. Please try again.");
      }
    } catch (err) {
      setError("Unable to connect to server. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  // ── Show OTP screen ──
  if (showOtp) {
    return (
      <OtpModal
        phone={otpPhone}
        roleId={2}
        mode="login"
        closeModal={closeModal}
        goBack={() => setShowOtp(false)}
        redirectAfterLogin={redirectAfterLogin}
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
        .lm-content { font-family: 'DM Sans', sans-serif; }
        .lm-wrapper { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--cream); padding: 24px; position: relative; overflow: hidden; }
        .lm-blob { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; }
        .lm-blob-1 { width: 320px; height: 320px; background: radial-gradient(circle, rgba(217,119,6,0.15) 0%, transparent 70%); top: -80px; right: -80px; animation: blobFloat 8s ease-in-out infinite; }
        .lm-blob-2 { width: 240px; height: 240px; background: radial-gradient(circle, rgba(120,53,15,0.10) 0%, transparent 70%); bottom: -60px; left: -60px; animation: blobFloat 10s ease-in-out infinite reverse; }
        @keyframes blobFloat { 0%,100% { transform: translateY(0px) scale(1); } 50% { transform: translateY(-20px) scale(1.05); } }
        .lm-card { background: var(--surface); border-radius: 28px; box-shadow: var(--shadow), 0 0 0 1px rgba(231,224,216,0.8); padding: 40px 36px; width: 100%; max-width: 420px; position: relative; animation: cardIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
        @keyframes cardIn { from { opacity:0; transform: translateY(32px) scale(0.96); } to { opacity:1; transform: translateY(0) scale(1); } }
        .lm-back { position: absolute; top: 20px; left: 20px; width: 38px; height: 38px; border-radius: 50%; background: var(--cream); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--charcoal); transition: all 0.2s ease; }
        .lm-back:hover { background: var(--charcoal); color: white; border-color: var(--charcoal); transform: scale(1.08); }
        .lm-back ion-icon { font-size: 18px; }
        .lm-logo-wrap { display: flex; flex-direction: column; align-items: center; margin-bottom: 28px; margin-top: 8px; }
        .lm-logo-ring { width: 72px; height: 72px; border: 1px solid var(--error-border); display: flex; align-items: center; justify-content: center; }
        .lm-logo-ring img { width: 46px; height: 46px; object-fit: contain; }
        .lm-divider { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
        .lm-divider-line { flex: 1; height: 1px; background: var(--border); }
        .lm-divider-text { font-size: 11px; color: var(--muted); letter-spacing: 0.08em; text-transform: uppercase; }
        .lm-error { background: var(--error-bg); border: 1px solid var(--error-border); border-radius: 12px; padding: 10px 14px; margin-bottom: 16px; font-size: 13px; color: var(--error); display: flex; align-items: center; gap: 8px; animation: errorIn 0.25s ease both; }
        @keyframes errorIn { from { opacity:0; transform: translateY(-6px); } to { opacity:1; transform: translateY(0); } }
        .lm-error-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--error); flex-shrink: 0; }
        .lm-field { margin-bottom: 14px; position: relative; }
        .lm-field-label { font-size: 11px; font-weight: 500; color: var(--muted); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 6px; display: block; }
        .lm-input-box { border: 1.5px solid var(--border); border-radius: 14px; background: var(--cream); transition: all 0.25s ease; overflow: hidden; display: flex; align-items: center; }
        .lm-input-box.focused { border-color: var(--amber); background: #FFFBF4; box-shadow: 0 0 0 3px rgba(217,119,6,0.10); }
        .lm-input-box ion-input { --padding-start: 16px; --padding-end: 16px; --padding-top: 14px; --padding-bottom: 14px; --color: var(--charcoal); --placeholder-color: #C4B8AE; font-size: 15px; font-family: 'DM Sans', sans-serif; --background: transparent; flex: 1; }
        .lm-eye-btn { --color: var(--muted); --padding-start: 8px; --padding-end: 12px; margin: 0; height: 100%; flex-shrink: 0; }
        .lm-btn { margin-top: 24px; --border-radius: 14px; --background: linear-gradient(135deg, #D97706, #B45309); --background-hover: linear-gradient(135deg, #F59E0B, #D97706); --background-activated: linear-gradient(135deg, #B45309, #92400E); --box-shadow: 0 8px 24px rgba(180,83,9,0.35); --color: white; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 500; letter-spacing: 0.02em; height: 52px; }
        .lm-btn:disabled { opacity: 0.7; }
        .lm-spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.4); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; margin-right: 8px; vertical-align: middle; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .lm-register { display: flex; align-items: center; justify-content: center; gap: 4px; margin-top: 20px; }
        .lm-register p { font-size: 13px; color: var(--muted); margin: 0; }
        .lm-register-btn { --color: var(--amber); --color-hover: var(--warm-brown); font-size: 13px; font-weight: 500; font-family: 'DM Sans', sans-serif; --padding-start: 4px; --padding-end: 4px; margin: 0; height: auto; }
        .lm-terms { font-size: 11px; color: #C4B8AE; text-align: center; margin-top: 20px; line-height: 1.6; }
        .lm-terms span { color: var(--muted); text-decoration: underline; cursor: pointer; }
        .lm-input-badge { font-size: 10px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; padding: 2px 8px; border-radius: 20px; margin-right: 8px; flex-shrink: 0; transition: all 0.25s ease; }
        .lm-input-badge.email { background: rgba(217,119,6,0.12); color: var(--amber); }
        .lm-input-badge.phone { background: rgba(22,163,74,0.12); color: #16A34A; }
      `}</style>

      <IonContent className="lm-content">
        <div className="lm-wrapper" onKeyDown={handleKeyDown}>
          <div className="lm-blob lm-blob-1" />
          <div className="lm-blob lm-blob-2" />

          <div className="lm-card">
            <div className="lm-back" onClick={closeModal}>
              <IonIcon icon={arrowBackOutline} />
            </div>

            <div className="lm-logo-wrap">
              <div className="lm-logo-ring">
                <img src={logo} alt="Logo" />
              </div>
            </div>

            <div className="lm-divider">
              <div className="lm-divider-line" />
              <span className="lm-divider-text">Login</span>
              <div className="lm-divider-line" />
            </div>

            {error && (
              <div className="lm-error">
                <span className="lm-error-dot" />
                {error}
              </div>
            )}

            <div className="lm-field">
              <label className="lm-field-label">Email or Phone Number</label>
              <div className={`lm-input-box ${focused === "identifier" ? "focused" : ""}`}>
                <IonInput
                  ref={identifierRef}
                  type={isEmail(identifierValue) ? "email" : "text"}
                  inputmode={isEmail(identifierValue) ? "email" : "tel"}
                  placeholder="you@example.com or 9876543210"
                  onIonInput={(e) => setIdentifierValue((e.detail.value ?? "").toString())}
                  onIonFocus={() => setFocused("identifier")}
                  onIonBlur={() => setFocused(null)}
                />
                {identifierValue.length > 0 && (
                  <span className={`lm-input-badge ${isEmail(identifierValue) ? "email" : "phone"}`}>
                    {isEmail(identifierValue) ? "Email" : "Phone"}
                  </span>
                )}
              </div>
            </div>

            <div className="lm-field">
              <label className="lm-field-label">Password</label>
              <div className={`lm-input-box ${focused === "password" ? "focused" : ""}`}>
                <IonInput
                  ref={passwordRef}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  onIonFocus={() => setFocused("password")}
                  onIonBlur={() => setFocused(null)}
                />
                <IonButton
                  fill="clear"
                  className="lm-eye-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                >
                  <IonIcon icon={showPassword ? eyeOffOutline : eyeOutline} />
                </IonButton>
              </div>
            </div>

            <IonButton
              expand="block"
              className="lm-btn"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading && <span className="lm-spinner" />}
              {loading ? "Sending OTP..." : "Continue"}
            </IonButton>

            <div className="lm-register">
              <p>Don't have an account?</p>
              <IonButton fill="clear" className="lm-register-btn" onClick={openRegister}>
                Register
              </IonButton>
            </div>

            <p className="lm-terms">
              By continuing, you agree to our{" "}
              <span>Terms of Service</span> & <span>Privacy Policy</span>
            </p>
          </div>
        </div>
      </IonContent>
    </>
  );
};

export default LoginModal;