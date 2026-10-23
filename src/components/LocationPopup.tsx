// components/LocationPopup.tsx

import React, { useEffect, useState, useRef } from "react";

type Vendor = {
  id: number;
  user_id: number;
  business_name: string;
  warehouse_address: string;
  warehouse_pincode: string;
  business_logo?: string;
};

type Props = {
  onLocationSelect?: (data: { pincode: string; vendor_id: number; vendor: Vendor }) => void;
};

const LocationPopup: React.FC<Props> = ({ onLocationSelect }) => {
  const [open, setOpen]         = useState(false);
  const [step, setStep]         = useState<"detect" | "manual">("detect");
  const [pincode, setPincode]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [message, setMessage]   = useState("");
  const [gpsError, setGpsError] = useState("");
  const [visible, setVisible]   = useState(false);
  const [success, setSuccess]   = useState(false); // show tick animation before close
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedPincode  = localStorage.getItem("user_pincode");
    const savedVendorId = localStorage.getItem("selected_vendor_id");

    if (savedPincode && savedVendorId) {
      const vendorId = parseInt(savedVendorId, 10);
      if (!isNaN(vendorId)) {
        onLocationSelect?.({
          pincode:   savedPincode,
          vendor_id: vendorId,
          vendor: {
            id:                vendorId,
            user_id:           vendorId,
            business_name:     "",
            warehouse_address: "",
            warehouse_pincode: savedPincode,
          },
        });
      }
      return;
    }

    setTimeout(() => {
      setOpen(true);
      setTimeout(() => setVisible(true), 10);
    }, 400);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (step === "manual" && open) {
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [step, open]);

  const getPincodeFromCoords = async (lat: number, lng: number): Promise<string | null> => {
    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await res.json();
      return data?.address?.postcode ?? null;
    } catch {
      return null;
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGpsError("GPS not supported on this device");
      setStep("manual");
      return;
    }
    setGpsLoading(true);
    setGpsError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const pin = await getPincodeFromCoords(pos.coords.latitude, pos.coords.longitude);
        setGpsLoading(false);
        if (pin) {
          setPincode(pin);
          setStep("manual");
          submitPincode(pin); // auto-submit immediately
        } else {
          setGpsError("Could not detect pincode. Please enter manually.");
          setStep("manual");
        }
      },
      () => {
        setGpsLoading(false);
        setGpsError("Location access denied. Please enter pincode manually.");
        setStep("manual");
      },
      { timeout: 8000 }
    );
  };

  // Core submit — fetch vendors, pick first one, close popup silently
  const submitPincode = async (pin: string) => {
    if (pin.length !== 6) return;
    setLoading(true);
    setMessage("");

    try {
      const res  = await fetch(
        `https://shriecom.in/appapis/shreefood/public/api/vendor/pincode/${pin}`
      );
      const data = await res.json();

      const vendors: Vendor[] = data.vendors || [];

      if (data.status === false || vendors.length === 0) {
        // No vendor available for this pincode
        setMessage(data.message || "Delivery is not available in this area. Try another pincode.");
        setLoading(false);
        return;
      }

      // Auto-pick first vendor — no list shown to user
      const vendor = vendors[0];

      localStorage.setItem("user_pincode",       vendor.warehouse_pincode || pin);
      localStorage.setItem("selected_vendor_id", String(vendor.user_id));

      onLocationSelect?.({
        pincode:   vendor.warehouse_pincode || pin,
        vendor_id: vendor.user_id,
        vendor,
      });

      // Show brief success tick, then close
      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        setVisible(false);
        setTimeout(() => setOpen(false), 320);
      }, 700);

    } catch {
      setMessage("Network error. Please try again.");
      setLoading(false);
    }
  };

  // Triggered on every keystroke — auto-submit at 6 digits
  const handlePincodeChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setPincode(digits);
    setMessage(""); // clear any previous error

    if (digits.length === 6) {
      submitPincode(digits); // auto-submit, no button needed
    }
  };

  if (!open) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

        .lp-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 9998;
          opacity: 0; transition: opacity 0.3s ease;
        }
        .lp-overlay.lp-visible { opacity: 1; }

        .lp-sheet {
          position: fixed; bottom: 0; left: 0; right: 0;
          background: #ffffff;
          border-radius: 24px 24px 0 0;
          z-index: 9999;
          max-height: 92vh;
          overflow-y: auto;
          overflow-x: hidden;
          box-shadow: 0 -4px 32px rgba(0,0,0,0.18);
          font-family: 'Nunito', sans-serif;
          transform: translateY(100%);
          transition: transform 0.38s cubic-bezier(0.32,0.72,0,1);
          padding-bottom: env(safe-area-inset-bottom, 16px);
        }
        .lp-sheet.lp-visible { transform: translateY(0); }

        .lp-handle {
          width: 40px; height: 4px;
          background: #D1D5DB; border-radius: 99px;
          margin: 12px auto 0;
        }

        /* Header */
        .lp-header {
          background: #0C831F;
          padding: 20px 20px 22px;
          position: relative; overflow: hidden;
        }
        .lp-header-deco1 {
          position: absolute; top: -28px; right: -24px;
          width: 110px; height: 110px; border-radius: 50%;
          background: rgba(255,255,255,0.07); pointer-events: none;
        }
        .lp-header-deco2 {
          position: absolute; bottom: -18px; right: 60px;
          width: 60px; height: 60px; border-radius: 50%;
          background: rgba(255,255,255,0.05); pointer-events: none;
        }
        .lp-header-icon {
          width: 44px; height: 44px; border-radius: 14px;
          background: rgba(255,255,255,0.18);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; margin-bottom: 12px;
        }
        .lp-header-title {
          font-size: 20px; font-weight: 900; color: #fff;
          letter-spacing: -0.4px; margin: 0 0 4px;
        }
        .lp-header-sub {
          font-size: 13px; color: rgba(255,255,255,0.72);
          font-weight: 600; margin: 0;
        }
        .lp-dots { display: flex; gap: 6px; margin-top: 14px; }
        .lp-dot {
          height: 4px; border-radius: 99px;
          background: rgba(255,255,255,0.3);
          transition: width 0.25s ease, background 0.25s ease;
        }
        .lp-dot.active { background: #fff; }

        /* Body */
        .lp-body { padding: 24px 20px 8px; }

        /* GPS Button */
        .lp-gps-btn {
          width: 100%; display: flex; align-items: center;
          justify-content: center; gap: 10px;
          background: #0C831F; color: #fff;
          border: none; border-radius: 16px;
          padding: 16px; cursor: pointer;
          font-family: 'Nunito', sans-serif;
          font-size: 15px; font-weight: 800;
          box-shadow: 0 4px 16px rgba(12,131,31,0.3);
          transition: opacity 0.18s, transform 0.15s;
        }
        .lp-gps-btn:active { transform: scale(0.98); opacity: 0.9; }
        .lp-gps-btn:disabled { background: #D1D5DB; box-shadow: none; cursor: not-allowed; }

        .lp-divider {
          display: flex; align-items: center; gap: 12px; margin: 18px 0;
        }
        .lp-divider-line { flex: 1; height: 1px; background: #E5E7EB; }
        .lp-divider-text { font-size: 12px; font-weight: 800; color: #9CA3AF; }

        .lp-manual-btn {
          width: 100%; display: flex; align-items: center;
          justify-content: center; gap: 10px;
          background: #F9FAFB; color: #374151;
          border: 1.5px solid #E5E7EB; border-radius: 16px;
          padding: 15px; cursor: pointer;
          font-family: 'Nunito', sans-serif;
          font-size: 15px; font-weight: 700;
          transition: background 0.15s, border-color 0.15s;
        }
        .lp-manual-btn:hover { background: #F3F4F6; border-color: #D1D5DB; }

        .lp-error-box {
          background: #FEF2F2; border: 1px solid #FECACA;
          border-radius: 12px; padding: 12px 16px;
          font-size: 13px; color: #DC2626; font-weight: 600;
          text-align: center; margin-bottom: 16px;
        }

        .lp-back-btn {
          display: flex; align-items: center; justify-content: center;
          background: #F3F4F6; border: none; border-radius: 10px;
          width: 36px; height: 36px;
          cursor: pointer; font-size: 18px; flex-shrink: 0;
        }

        /* Pincode input */
        .lp-pin-wrap { position: relative; margin-bottom: 8px; }
        .lp-pin-input {
          width: 100%; height: 56px;
          border: 2px solid #E5E7EB;
          border-radius: 14px;
          padding: 0 52px 0 52px;
          font-size: 22px; font-weight: 800;
          font-family: 'Nunito', sans-serif;
          letter-spacing: 0.18em; color: #111827;
          outline: none; box-sizing: border-box;
          transition: border-color 0.2s;
          background: #FAFAFA;
        }
        .lp-pin-input:focus { border-color: #0C831F; background: #fff; }
        .lp-pin-input.has-value { border-color: #0C831F; }
        .lp-pin-input::placeholder {
          letter-spacing: 0; font-weight: 600;
          color: #9CA3AF; font-size: 14px;
        }
        .lp-pin-icon {
          position: absolute; left: 16px; top: 50%;
          transform: translateY(-50%);
          font-size: 20px; pointer-events: none;
        }

        /* Spinner inside input */
        .lp-pin-spinner {
          position: absolute; right: 14px; top: 50%;
          transform: translateY(-50%);
          width: 22px; height: 22px;
          border: 2.5px solid rgba(12,131,31,0.2);
          border-top-color: #0C831F;
          border-radius: 50%;
          animation: lp-spin 0.7s linear infinite;
        }

        /* Success tick inside input */
        .lp-pin-tick {
          position: absolute; right: 12px; top: 50%;
          transform: translateY(-50%);
          width: 28px; height: 28px; border-radius: 50%;
          background: #0C831F;
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 14px; font-weight: 900;
          animation: lp-pop 0.3s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes lp-pop {
          from { transform: translateY(-50%) scale(0.5); opacity: 0; }
          to   { transform: translateY(-50%) scale(1);   opacity: 1; }
        }

        /* Dot indicators */
        .lp-pin-dots {
          display: flex; gap: 8px; justify-content: center; margin: 12px 0 4px;
        }
        .lp-pin-dot {
          width: 10px; height: 10px; border-radius: 50%;
          background: #E5E7EB;
          transition: background 0.12s, transform 0.12s;
        }
        .lp-pin-dot.filled { background: #0C831F; transform: scale(1.15); }

        /* Hint text below input */
        .lp-hint {
          text-align: center; font-size: 12px;
          color: #6B7280; font-weight: 600;
          margin: 10px 0 0;
        }
        .lp-hint.loading { color: #0C831F; }

        /* Error message */
        .lp-no-delivery {
          background: #FEF2F2; border: 1px solid #FECACA;
          border-radius: 14px; padding: 16px;
          text-align: center; margin-top: 16px;
        }

        /* Success box */
        .lp-success-box {
          background: #F0FDF4; border: 1px solid #86EFAC;
          border-radius: 14px; padding: 20px 16px;
          text-align: center; margin-top: 16px;
          animation: lp-pop 0.35s cubic-bezier(0.34,1.56,0.64,1);
        }

        /* Spinners */
        .lp-spinner {
          width: 28px; height: 28px;
          border: 3px solid rgba(12,131,31,0.15);
          border-top-color: #0C831F;
          border-radius: 50%;
          animation: lp-spin 0.7s linear infinite;
        }
        .lp-spinner-white {
          width: 18px; height: 18px;
          border: 2.5px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: lp-spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes lp-spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Overlay — no close on tap since vendor must be selected */}
      <div className={`lp-overlay${visible ? " lp-visible" : ""}`} />

      {/* Bottom Sheet */}
      <div className={`lp-sheet${visible ? " lp-visible" : ""}`}>

        <div className="lp-handle" />

        {/* ── Green Header ── */}
        <div className="lp-header">
          <div className="lp-header-deco1" />
          <div className="lp-header-deco2" />
          <div className="lp-header-icon">
            {success ? "✅" : step === "detect" ? "📍" : "🔍"}
          </div>
          <p className="lp-header-title">
            {success
              ? "Location confirmed!"
              : step === "detect"
              ? "Where should we deliver?"
              : "Enter your pincode"}
          </p>
          <p className="lp-header-sub">
            {success
              ? "Finding the best store near you…"
              : step === "detect"
              ? "Allow location or enter your pincode"
              : "We'll find the best store for you"}
          </p>
          <div className="lp-dots">
            <div className="lp-dot active" style={{ width: step === "detect" ? 28 : 12 }} />
            <div
              className="lp-dot"
              style={{
                width: step === "manual" ? 28 : 8,
                ...(step === "manual" ? { background: "#fff" } : {}),
              }}
            />
          </div>
        </div>

        {/* ── Body ── */}
        <div className="lp-body">

          {/* ─── STEP 1: Detect ─── */}
          {step === "detect" && (
            <>
              {gpsError && <div className="lp-error-box">⚠️ {gpsError}</div>}

              <button
                className="lp-gps-btn"
                onClick={handleDetectLocation}
                disabled={gpsLoading}
              >
                {gpsLoading ? (
                  <><div className="lp-spinner-white" />Detecting your location…</>
                ) : (
                  <><span style={{ fontSize: 20 }}>🎯</span>Use my current location</>
                )}
              </button>

              <div className="lp-divider">
                <div className="lp-divider-line" />
                <span className="lp-divider-text">OR</span>
                <div className="lp-divider-line" />
              </div>

              <button className="lp-manual-btn" onClick={() => setStep("manual")}>
                <span style={{ fontSize: 20 }}>⌨️</span>
                Enter pincode manually
              </button>

              <div style={{ height: 16 }} />
            </>
          )}

          {/* ─── STEP 2: Manual pincode (NO vendor list) ─── */}
          {step === "manual" && (
            <>
              {/* Back + Title */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <button
                  className="lp-back-btn"
                  onClick={() => {
                    setStep("detect");
                    setPincode("");
                    setMessage("");
                    setSuccess(false);
                  }}
                >
                  ←
                </button>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: "#111827" }}>
                    Enter your pincode
                  </div>
                  <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 600 }}>
                    Type 6 digits — we'll handle the rest
                  </div>
                </div>
              </div>

              {/* Pincode Input */}
              <div className="lp-pin-wrap">
                <span className="lp-pin-icon">📮</span>

                <input
                  ref={inputRef}
                  type="tel"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit pincode"
                  value={pincode}
                  onChange={(e) => handlePincodeChange(e.target.value)}
                  className={`lp-pin-input${pincode.length > 0 ? " has-value" : ""}`}
                  disabled={loading || success}
                />

                {/* Loading spinner inside input */}
                {loading && <div className="lp-pin-spinner" />}

                {/* Success tick inside input */}
                {success && !loading && (
                  <div className="lp-pin-tick">✓</div>
                )}
              </div>

              {/* Dot indicators */}
              <div className="lp-pin-dots">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className={`lp-pin-dot${i < pincode.length ? " filled" : ""}`}
                  />
                ))}
              </div>

              {/* Hint below dots */}
              {!loading && !success && !message && (
                <p className="lp-hint">
                  {pincode.length < 6
                    ? `${6 - pincode.length} more digit${6 - pincode.length !== 1 ? "s" : ""} to go`
                    : ""}
                </p>
              )}
              {loading && (
                <p className="lp-hint loading">
                  ⏳ Finding stores near you…
                </p>
              )}

              {/* Success message */}
              {success && (
                <div className="lp-success-box">
                  <div style={{ fontSize: 28, marginBottom: 6 }}>🎉</div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#166534" }}>
                    Store found! Setting up…
                  </p>
                </div>
              )}

              {/* Error — no delivery available */}
              {!loading && !success && message && (
                <div className="lp-no-delivery">
                  <div style={{ fontSize: 28, marginBottom: 8 }}>😕</div>
                  <p style={{ margin: 0, fontSize: 14, color: "#DC2626", fontWeight: 800 }}>
                    {message}
                  </p>
                  <p style={{ margin: "6px 0 0", fontSize: 12, color: "#6B7280", fontWeight: 600 }}>
                    Please try a different pincode
                  </p>
                </div>
              )}

              <div style={{ height: 20 }} />
            </>
          )}

        </div>
      </div>
    </>
  );
};

export default LocationPopup;