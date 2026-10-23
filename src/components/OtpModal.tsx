import { IonContent, IonButton, IonIcon } from "@ionic/react";
import { arrowBackOutline } from "ionicons/icons";
import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import logo from "../assets/shrilogo.jpeg";
import { saveAuth } from "../hooks/useAuth";

interface OtpModalProps {
  phone: string;
  roleId: number; // 2=customer, 3=vendor, 4=delivery, 5=seller, 6=packer
  mode: "register" | "login"; // 👈 decides which backend endpoint to hit
  closeModal: () => void;
  goBack: () => void;
  redirectAfterLogin?: string;
}

const API_BASE = "https://shriecom.in/appapis/shreefood/public/api";
const RESEND_SECONDS = 60;

const OtpModal: React.FC<OtpModalProps> = ({
  phone,
  roleId,
  mode,
  closeModal,
  goBack,
  redirectAfterLogin = "/",
}) => {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  const getDeviceId = () => {
    let deviceId = localStorage.getItem("device_id");
    if (!deviceId) {
      deviceId = "dev-" + Math.random().toString(36).substring(2, 10);
      localStorage.setItem("device_id", deviceId);
    }
    return deviceId;
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // digits only
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);
    setError(null);

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "Enter" && digits.join("").length === 6) handleVerify();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(6).fill("");
    pasted.split("").forEach((d, i) => (next[i] = d));
    setDigits(next);
    const lastIndex = Math.min(pasted.length, 6) - 1;
    inputsRef.current[lastIndex]?.focus();
  };

  // ─────────────────────────────────────────
  // FCM — Platform-aware push token registration
  // (same behaviour as LoginModal, called after successful verify)
  // ─────────────────────────────────────────
  const initFCMAfterLogin = async (authToken: string) => {
    try {
      const isNative = Capacitor.isNativePlatform();
      if (isNative) {
        const { PushNotifications } = await import("@capacitor/push-notifications");
        const permission = await PushNotifications.requestPermissions();
        if (permission.receive !== "granted") return;
        await PushNotifications.register();
        PushNotifications.addListener("registration", async (token) => {
          const platform = Capacitor.getPlatform() === "ios" ? "ios" : "android";
          await fetch(`${API_BASE}/save-fcm-token`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ fcm_token: token.value, platform }),
          });
        });
      } else {
        const { initializeApp, getApps } = await import("firebase/app");
        const { getMessaging, getToken } = await import("firebase/messaging");
        const firebaseConfig = {
          apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
          authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
          projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
          messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
          appId: import.meta.env.VITE_FIREBASE_APP_ID,
        };
        const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
        const messaging = getMessaging(app);
        const fcmToken = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        });
        if (fcmToken) {
          await fetch(`${API_BASE}/save-fcm-token`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ fcm_token: fcmToken, platform: "web" }),
          });
        }
      }
    } catch (fcmErr) {
      console.warn("FCM init failed (non-blocking):", fcmErr);
    }
  };

  // ─────────────────────────────────────────
  // VERIFY — role_id ab hamesha bheja jayega
  // (register aur login dono mode mein backend
  // isko required maangta hai)
  // ─────────────────────────────────────────
  const handleVerify = async () => {
    setError(null);
    setSuccess(null);

    const otp = digits.join("");
    if (otp.length !== 6) {
      setError("Please enter the complete 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);
      const endpoint = "verify-otp";

      const body = { phone, otp, role_id: roleId, device_id: getDeviceId() };

      const response = await fetch(`${API_BASE}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        setError(data?.message ?? `OTP verification failed (${response.status})`);
        return;
      }

      // ✅ Success — save token & user (correct keys, native-safe), register FCM, then auto-login
      if (data?.token && data?.user) {
        await saveAuth(data.token, data.user);
        await initFCMAfterLogin(data.token);
      }

      setSuccess(
        mode === "register"
          ? "Registration successful! Logging you in..."
          : "Login successful!"
      );

      setTimeout(() => {
        closeModal();
        window.location.href = redirectAfterLogin;
      }, 700);
    } catch (err) {
      setError("Unable to connect to server. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────
  // RESEND — role_id yahan bhi hamesha bheja jayega
  // (agar aapka resend-otp backend route role_id
  // maangta nahi hai to ye extra field ignore ho jayegi,
  // koi nuksan nahi hoga)
  // ─────────────────────────────────────────
  const handleResend = async () => {
    if (secondsLeft > 0 || resending) return;
    setError(null);
    setSuccess(null);

    try {
      setResending(true);

      const endpoint = "resend-otp";
      const body = { phone, role_id: roleId };

      const response = await fetch(`${API_BASE}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        setError(data?.message ?? `Could not resend OTP (${response.status})`);
        return;
      }

      setSuccess("OTP resent successfully.");
      setDigits(Array(6).fill(""));
      inputsRef.current[0]?.focus();
      setSecondsLeft(RESEND_SECONDS);
    } catch (err) {
      setError("Unable to connect to server. Please check your internet connection.");
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <style>{`
        :root {
          --cream: #FAF6F0; --charcoal: #1C1917; --warm-brown: #78350F;
          --amber: #D97706; --amber-light: #F59E0B; --muted: #A8A29E;
          --surface: #FFFFFF; --border: #E7E0D8;
          --shadow: 0 32px 80px rgba(28,25,23,0.15);
          --error: #DC2626; --error-bg: #FEF2F2; --error-border: #FECACA;
          --success: #16A34A; --success-bg: #F0FDF4; --success-border: #BBF7D0;
        }
        .om-content { font-family: 'DM Sans', sans-serif; }
        .om-wrapper { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--cream); padding: 24px; position: relative; overflow: hidden; }
        .om-blob { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; }
        .om-blob-1 { width: 320px; height: 320px; background: radial-gradient(circle, rgba(217,119,6,0.15) 0%, transparent 70%); top: -80px; right: -80px; }
        .om-blob-2 { width: 240px; height: 240px; background: radial-gradient(circle, rgba(120,53,15,0.10) 0%, transparent 70%); bottom: -60px; left: -60px; }
        .om-card { background: var(--surface); border-radius: 28px; box-shadow: var(--shadow), 0 0 0 1px rgba(231,224,216,0.8); padding: 40px 36px; width: 100%; max-width: 420px; position: relative; animation: omCardIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
        @keyframes omCardIn { from { opacity:0; transform: translateY(32px) scale(0.96); } to { opacity:1; transform: translateY(0) scale(1); } }
        .om-back { position: absolute; top: 20px; left: 20px; width: 38px; height: 38px; border-radius: 50%; background: var(--cream); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--charcoal); transition: all 0.2s ease; }
        .om-back:hover { background: var(--charcoal); color: white; border-color: var(--charcoal); transform: scale(1.08); }
        .om-logo-wrap { display: flex; flex-direction: column; align-items: center; margin-bottom: 20px; margin-top: 8px; }
        .om-logo-ring { width: 72px; height: 72px; border: 1px solid var(--border); border-radius: 20px; display: flex; align-items: center; justify-content: center; }
        .om-logo-ring img { width: 46px; height: 46px; object-fit: contain; }
        .om-title { font-size: 22px; font-weight: 700; color: var(--charcoal); margin: 0 0 6px; text-align: center; }
        .om-subtitle { font-size: 13px; color: var(--muted); text-align: center; margin: 0 0 24px; }
        .om-subtitle b { color: var(--charcoal); }
        .om-error { background: var(--error-bg); border: 1px solid var(--error-border); border-radius: 12px; padding: 10px 14px; margin-bottom: 16px; font-size: 13px; color: var(--error); display: flex; align-items: center; gap: 8px; }
        .om-success { background: var(--success-bg); border: 1px solid var(--success-border); border-radius: 12px; padding: 10px 14px; margin-bottom: 16px; font-size: 13px; color: var(--success); display: flex; align-items: center; gap: 8px; }
        .om-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .om-dot.err { background: var(--error); }
        .om-dot.ok { background: var(--success); }
        .om-otp-row { display: flex; gap: 10px; justify-content: center; margin-bottom: 20px; }
        .om-otp-box { width: 46px; height: 54px; border: 1.5px solid var(--border); border-radius: 12px; background: var(--cream); text-align: center; font-size: 20px; font-weight: 600; color: var(--charcoal); outline: none; transition: all 0.2s ease; }
        .om-otp-box:focus { border-color: var(--amber); background: #FFFBF4; box-shadow: 0 0 0 3px rgba(217,119,6,0.10); }
        .om-btn { margin-top: 4px; --border-radius: 14px; --background: linear-gradient(135deg, #D97706, #B45309); --background-hover: linear-gradient(135deg, #F59E0B, #D97706); --box-shadow: 0 8px 24px rgba(180,83,9,0.35); --color: white; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 500; height: 52px; }
        .om-btn:disabled { opacity: 0.7; }
        .om-spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.4); border-top-color: white; border-radius: 50%; animation: omSpin 0.7s linear infinite; margin-right: 8px; vertical-align: middle; }
        @keyframes omSpin { to { transform: rotate(360deg); } }
        .om-resend-row { display: flex; align-items: center; justify-content: center; gap: 4px; margin-top: 20px; }
        .om-resend-row p { font-size: 13px; color: var(--muted); margin: 0; }
        .om-resend-btn { --color: var(--amber); font-size: 13px; font-weight: 500; font-family: 'DM Sans', sans-serif; --padding-start: 4px; --padding-end: 4px; margin: 0; height: auto; }
        .om-resend-btn[disabled] { --color: var(--muted); opacity: 1; }
      `}</style>

      <IonContent className="om-content">
        <div className="om-wrapper">
          <div className="om-blob om-blob-1" />
          <div className="om-blob om-blob-2" />

          <div className="om-card">
            <div className="om-back" onClick={goBack}>
              <IonIcon icon={arrowBackOutline} />
            </div>

            <div className="om-logo-wrap">
              <div className="om-logo-ring">
                <img src={logo} alt="Logo" />
              </div>
            </div>

            <h2 className="om-title">Verify OTP</h2>
            <p className="om-subtitle">
              Enter the 6-digit code sent to <b>{phone}</b>
            </p>

            {error && (
              <div className="om-error">
                <span className="om-dot err" />
                {error}
              </div>
            )}
            {success && (
              <div className="om-success">
                <span className="om-dot ok" />
                {success}
              </div>
            )}

            <div className="om-otp-row">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputsRef.current[i] = el;
                  }}
                  className="om-otp-box"
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={handlePaste}
                />
              ))}
            </div>

            <IonButton
              expand="block"
              className="om-btn"
              onClick={handleVerify}
              disabled={loading}
            >
              {loading && <span className="om-spinner" />}
              {loading ? "Verifying..." : "Verify & Continue"}
            </IonButton>

            <div className="om-resend-row">
              <p>Didn't receive the code?</p>
              <IonButton
                fill="clear"
                className="om-resend-btn"
                onClick={handleResend}
                disabled={secondsLeft > 0 || resending}
              >
                {resending
                  ? "Sending..."
                  : secondsLeft > 0
                  ? `Resend in ${secondsLeft}s`
                  : "Resend OTP"}
              </IonButton>
            </div>
          </div>
        </div>
      </IonContent>
    </>
  );
};

export default OtpModal;