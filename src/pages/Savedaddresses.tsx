import { IonPage, IonContent, IonIcon, useIonRouter } from "@ionic/react";
import {
  arrowBackOutline,
  addCircleOutline,
  pencilOutline,
  trashOutline,
  checkmarkCircle,
  radioButtonOffOutline,
} from "ionicons/icons";
import { useState, useEffect } from "react";
import { getToken, getUser, AuthUser } from "../hooks/useAuth";

const BASE_URL = "https://shriecom.in/appapis/shreefood/public/api";

type AddressType = "Home" | "Work" | "Hotel" | "Other";

interface Address {
  id: number;
  label: AddressType;
  name: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalcode: string;
  is_default: boolean;
}

const typeConfig: Record<string, { icon: string; color: string; bg: string }> = {
  Home:  { icon: "🏠", color: "#16A34A", bg: "#DCFCE7" },
  Work:  { icon: "💼", color: "#2563EB", bg: "#DBEAFE" },
  Hotel: { icon: "🏨", color: "#7C3AED", bg: "#EDE9FE" },
  Other: { icon: "📍", color: "#E07B00", bg: "#FEF3C7" },
};

interface FormProps {
  initial?: Partial<Address>;
  onSave:  (a: Partial<Address>) => void;
  onClose: () => void;
  saving:  boolean;
  error:   string | null;
}

const AddressForm: React.FC<FormProps> = ({ initial = {}, onSave, onClose, saving, error }) => {
  const [label,    setLabel]    = useState<AddressType>(initial.label    ?? "Home");
  const [flat,     setFlat]     = useState(initial.address?.split(",")[0]?.trim() ?? "");
  const [floor,    setFloor]    = useState("");
  const [area,     setArea]     = useState(initial.city    ?? "");
  const [landmark, setLandmark] = useState("");
  const [name,     setName]     = useState(initial.name    ?? "");
  const [phone,    setPhone]    = useState(initial.phone   ?? "");
  const [pincode,  setPincode]  = useState(initial.postalcode ?? "");
  const [errs,     setErrs]     = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!flat.trim()) e.flat = "Required";
    if (!area.trim()) e.area = "Required";
    if (!name.trim()) e.name = "Required";
    setErrs(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const fullAddress = [flat, floor, area, landmark].filter(Boolean).join(", ");
    onSave({ label, name, phone, address: fullAddress, city: area, postalcode: pincode });
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center"
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: "24px 24px 0 0",
        padding: "0 20px 40px", width: "100%", maxWidth: 480,
        maxHeight: "92vh", overflowY: "auto",
        animation: "slideUp 0.25s ease"
      }} onClick={e => e.stopPropagation()}>

        <div style={{ width: 40, height: 4, borderRadius: 2, background: "#E5E7EB", margin: "12px auto 18px" }} />

        <div style={{ fontFamily: "sans-serif", fontSize: 18, fontWeight: 800, color: "#1A1714", marginBottom: 18 }}>
          {initial.id ? "Edit Address" : "Enter complete address"}
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: "#9B8E84", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
          Save address as <span style={{ color: "#DC2626" }}>*</span>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
          {(["Home", "Work", "Hotel", "Other"] as AddressType[]).map(t => (
            <button key={t} onClick={() => setLabel(t)} style={{
              flex: 1, minWidth: 60, display: "flex", flexDirection: "column",
              alignItems: "center", gap: 4, padding: "10px 6px",
              borderRadius: 14, border: label === t ? "1.5px solid #1A1714" : "1.5px solid #E5E7EB",
              background: label === t ? "#1A1714" : "#fff",
              color: label === t ? "#fff" : "#9B8E84",
              fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "sans-serif"
            }}>
              <span style={{ fontSize: 16 }}>{typeConfig[t].icon}</span>{t}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: "#9B8E84", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
          Address details
        </div>

        {[
          { label: `Flat / House no / Building name`, key: "flat", value: flat, setter: setFlat, required: true, type: "text" },
          { label: "Floor (optional)", key: "floor", value: floor, setter: setFloor, required: false, type: "text" },
          { label: "Area / Sector / Locality", key: "area", value: area, setter: setArea, required: true, type: "text" },
          { label: "Nearby landmark (optional)", key: "landmark", value: landmark, setter: setLandmark, required: false, type: "text" },
          { label: "Pincode (optional)", key: "pincode", value: pincode, setter: setPincode, required: false, type: "numeric" },
        ].map(({ label: lbl, key, value, setter, required, type }) => (
          <div key={key} style={{ marginBottom: 12 }}>
            <div style={{ position: "relative" }}>
              <input
                value={value}
                onChange={e => { setter(e.target.value); if (required) setErrs(p => ({ ...p, [key]: "" })); }}
                inputMode={type === "numeric" ? "numeric" : undefined}
                maxLength={type === "numeric" ? 6 : undefined}
                placeholder=" "
                style={{
                  width: "100%", padding: "22px 14px 8px",
                  border: `1.5px solid ${errs[key] ? "#DC2626" : "#E5E7EB"}`,
                  borderRadius: 12, fontSize: 14, fontFamily: "sans-serif",
                  color: "#1A1714", background: "#FAFAF9", outline: "none",
                  boxSizing: "border-box"
                }}
              />
              <label style={{
                position: "absolute", left: 14, top: value ? 8 : "50%",
                transform: value ? "none" : "translateY(-50%)",
                fontSize: value ? 11 : 14,
                color: value ? "#0C831F" : "#9B8E84",
                pointerEvents: "none", transition: "all 0.2s",
                fontFamily: "sans-serif", fontWeight: value ? 600 : 400
              }}>
                {lbl} {required && <span style={{ color: "#DC2626" }}>*</span>}
              </label>
            </div>
            {errs[key] && <div style={{ fontSize: 11, color: "#DC2626", marginTop: 3, paddingLeft: 4 }}>{errs[key]}</div>}
          </div>
        ))}

        <div style={{ fontSize: 12, color: "#9B8E84", margin: "16px 0 14px", paddingBottom: 14, borderBottom: "1px solid #F5F2EC", lineHeight: 1.5 }}>
          Enter your details for seamless delivery experience
        </div>

        {[
          { label: "Your name", key: "name", value: name, setter: setName, required: true, type: "text" },
          { label: "Your phone number (optional)", key: "phone", value: phone, setter: setPhone, required: false, type: "tel" },
        ].map(({ label: lbl, key, value, setter, required, type }) => (
          <div key={key} style={{ marginBottom: 12 }}>
            <div style={{ position: "relative" }}>
              <input
                value={value}
                onChange={e => { setter(e.target.value); if (required) setErrs(p => ({ ...p, [key]: "" })); }}
                type={type}
                placeholder=" "
                style={{
                  width: "100%", padding: "22px 14px 8px",
                  border: `1.5px solid ${errs[key] ? "#DC2626" : "#E5E7EB"}`,
                  borderRadius: 12, fontSize: 14, fontFamily: "sans-serif",
                  color: "#1A1714", background: "#FAFAF9", outline: "none",
                  boxSizing: "border-box"
                }}
              />
              <label style={{
                position: "absolute", left: 14, top: value ? 8 : "50%",
                transform: value ? "none" : "translateY(-50%)",
                fontSize: value ? 11 : 14,
                color: value ? "#0C831F" : "#9B8E84",
                pointerEvents: "none", transition: "all 0.2s",
                fontFamily: "sans-serif", fontWeight: value ? 600 : 400
              }}>
                {lbl} {required && <span style={{ color: "#DC2626" }}>*</span>}
              </label>
            </div>
            {errs[key] && <div style={{ fontSize: 11, color: "#DC2626", marginTop: 3, paddingLeft: 4 }}>{errs[key]}</div>}
          </div>
        ))}

        {error && (
          <div style={{ padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, fontSize: 13, color: "#DC2626", marginBottom: 12 }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: 13, borderRadius: 14, background: "#F5EFE0",
            border: "none", fontSize: 14, fontWeight: 700, color: "#1A1714",
            cursor: "pointer", fontFamily: "sans-serif"
          }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{
            flex: 1, padding: 13, borderRadius: 14, background: "#0C831F",
            border: "none", fontSize: 14, fontWeight: 700, color: "#fff",
            cursor: "pointer", fontFamily: "sans-serif", opacity: saving ? 0.6 : 1
          }}>
            {saving ? "Saving..." : "Save Address"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════
   Saved Addresses Page
═══════════════════════════════════════ */
const SavedAddresses = () => {
  const router = useIonRouter();

  const [token,      setToken]      = useState<string>("");
  const [user,       setUser]       = useState<AuthUser | null>(null);
  const [addresses,  setAddresses]  = useState<Address[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [editTarget, setEditTarget] = useState<Partial<Address> | null>(null);
  const [deleteId,   setDeleteId]   = useState<number | null>(null);
  const [saving,     setSaving]     = useState(false);
  const [formError,  setFormError]  = useState<string | null>(null);
  const [pageError,  setPageError]  = useState<string | null>(null);

  // ✅ FIX: getToken() and getUser() are async — load them first, then fetch addresses
  useEffect(() => {
    const init = async () => {
      const [tok, usr] = await Promise.all([getToken(), getUser()]);
      const resolvedToken = tok ?? "";
      setToken(resolvedToken);
      setUser(usr);

      if (!resolvedToken) {
        setPageError("You are not logged in. Please log in and try again.");
        setLoading(false);
        return;
      }

      try {
        const res  = await fetch(`${BASE_URL}/addresses`, {
          headers: {
            "Content-Type":  "application/json",
            "Accept":        "application/json",
            "Authorization": `Bearer ${resolvedToken}`,
          },
        });
        const json = await res.json();
        if (json.success) setAddresses(json.data);
        else setPageError(json.message);
      } catch {
        setPageError("Network error.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // ✅ Always build headers from the token in state (already resolved)
  const getHeaders = () => ({
    "Content-Type":  "application/json",
    "Accept":        "application/json",
    "Authorization": `Bearer ${token}`,
  });

  const openAddForm = () => {
    setEditTarget({
      name:  user?.name  ?? "",
      phone: user?.phone ?? "",
    });
    setFormError(null);
    setShowForm(true);
  };

  const openEditForm = (addr: Address) => {
    setEditTarget(addr);
    setFormError(null);
    setShowForm(true);
  };

  const setDefault = async (id: number) => {
    try {
      const res  = await fetch(`${BASE_URL}/addresses/${id}/set-default`, { method: "POST", headers: getHeaders() });
      const data = await res.json();
      if (data.success) setAddresses(prev => prev.map(a => ({ ...a, is_default: a.id === id })));
    } catch { /* silent */ }
  };

  const deleteAddress = async (id: number) => {
    try {
      const res  = await fetch(`${BASE_URL}/addresses/${id}`, { method: "DELETE", headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setAddresses(prev => {
          const remaining = prev.filter(a => a.id !== id);
          if (prev.find(a => a.id === id)?.is_default && remaining.length > 0) {
            remaining[0].is_default = true;
          }
          return remaining;
        });
      }
    } catch { /* silent */ }
    finally  { setDeleteId(null); }
  };

  const saveAddress = async (data: Partial<Address>) => {
    setSaving(true);
    setFormError(null);
    try {
      const isEdit = !!(editTarget as Address)?.id;
      const url    = isEdit ? `${BASE_URL}/addresses/${(editTarget as Address).id}` : `${BASE_URL}/addresses`;
      const method = isEdit ? "PUT" : "POST";
      const res    = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify({ ...data, is_default: addresses.length === 0 }),
      });
      const json = await res.json();
      if (json.success) {
        if (isEdit) {
          setAddresses(prev => prev.map(a => a.id === (editTarget as Address).id ? json.data : a));
        } else {
          setAddresses(prev => [...prev, json.data]);
        }
        setShowForm(false);
        setEditTarget(null);
      } else {
        setFormError(json.message || "Failed to save address.");
      }
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <style>{`
          @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
          @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          .sa-root { font-family: sans-serif; background: #FFFBEB; min-height: 100vh; }
          .skeleton { background: linear-gradient(90deg, #eee 25%, #f5f5f5 50%, #eee 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 12px; }
        `}</style>

        <div className="sa-root">

          {/* ── Header ── */}
          <div style={{
            position: "sticky", top: 0, zIndex: 100,
            background: "#FFFBEB", borderBottom: "1px solid #F0E8C0",
            padding: "14px 16px", display: "flex",
            alignItems: "center", justifyContent: "space-between"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => router.goBack()} style={{
                width: 38, height: 38, borderRadius: 12, background: "#F5EFE0",
                border: "none", cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center"
              }}>
                <IonIcon icon={arrowBackOutline} style={{ fontSize: 20, color: "#1A1714" }} />
              </button>
              <div>
                <div style={{ fontFamily: "sans-serif", fontSize: 19, fontWeight: 800, color: "#1A1714" }}>
                  Saved Addresses
                </div>
                <div style={{ fontSize: 11, color: "#9B8E84", marginTop: 1 }}>
                  {addresses.length} address{addresses.length !== 1 ? "es" : ""} saved
                </div>
              </div>
            </div>
            <button
              onClick={openAddForm}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "#1A1714", color: "#fff", border: "none",
                borderRadius: 12, padding: "8px 14px",
                fontSize: 13, fontWeight: 700, fontFamily: "sans-serif", cursor: "pointer"
              }}
            >
              <IonIcon icon={addCircleOutline} style={{ fontSize: 16 }} /> Add New
            </button>
          </div>

          {/* ── Page Error ── */}
          {pageError && (
            <div style={{
              margin: 16, padding: 14, background: "#FEF2F2",
              border: "1px solid #FECACA", borderRadius: 12,
              fontSize: 13, color: "#DC2626"
            }}>⚠️ {pageError}</div>
          )}

          {/* ── Skeleton ── */}
          {loading && (
            <div style={{ padding: 16 }}>
              {[1, 2].map(i => (
                <div key={i} className="skeleton" style={{ height: 130, marginBottom: 12 }} />
              ))}
            </div>
          )}

          {/* ── Empty State ── */}
          {!loading && addresses.length === 0 && !pageError && (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", padding: "60px 32px", textAlign: "center"
            }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>📍</div>
              <div style={{ fontFamily: "sans-serif", fontSize: 18, fontWeight: 700, color: "#1A1714", marginBottom: 8 }}>
                No addresses saved
              </div>
              <div style={{ fontSize: 13, color: "#9B8E84", lineHeight: 1.5, marginBottom: 24 }}>
                Add a delivery address to make checkout faster and easier.
              </div>
              <button
                onClick={openAddForm}
                style={{
                  background: "#1A1714", color: "#fff", border: "none",
                  borderRadius: 14, padding: "12px 28px",
                  fontSize: 14, fontWeight: 700, fontFamily: "sans-serif", cursor: "pointer"
                }}
              >
                + Add Address
              </button>
            </div>
          )}

          {/* ── Address Cards ── */}
          {!loading && addresses.map(addr => {
            const cfg = typeConfig[addr.label] ?? typeConfig.Other;
            return (
              <div key={addr.id} style={{
                background: "#fff",
                margin: "12px 16px 0",
                borderRadius: 20,
                border: addr.is_default ? "1.5px solid #E07B00" : "1px solid #EAE5DF",
                overflow: "hidden"
              }}>
                <div style={{ padding: 16, display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                    background: cfg.bg, display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 20
                  }}>
                    {cfg.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "sans-serif", fontSize: 15, fontWeight: 700, color: "#1A1714", marginBottom: 3 }}>
                      {addr.label}
                    </div>
                    <div style={{ fontSize: 13, color: "#5A5248", lineHeight: 1.5 }}>{addr.name}</div>
                    <div style={{ fontSize: 13, color: "#5A5248", lineHeight: 1.5 }}>{addr.address}</div>
                    <div style={{ fontSize: 13, color: "#5A5248", lineHeight: 1.5 }}>{addr.city}</div>
                    {addr.postalcode && <div style={{ fontSize: 12, color: "#9B8E84", marginTop: 2 }}>📮 {addr.postalcode}</div>}
                    {addr.phone      && <div style={{ fontSize: 12, color: "#9B8E84", marginTop: 2 }}>📞 {addr.phone}</div>}
                    {addr.is_default && (
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        background: "#FEF3C7", color: "#92400E",
                        fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                        letterSpacing: "0.06em", padding: "3px 8px",
                        borderRadius: 6, marginTop: 6
                      }}>
                        ⭐ Default
                      </div>
                    )}
                  </div>
                </div>

                <div style={{
                  padding: "10px 16px", borderTop: "1px solid #F5F2EC",
                  display: "flex", alignItems: "center", justifyContent: "space-between"
                }}>
                  <button
                    onClick={() => !addr.is_default && setDefault(addr.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      fontSize: 12, color: addr.is_default ? "#16A34A" : "#9B8E84",
                      fontWeight: addr.is_default ? 600 : 400,
                      background: "none", border: "none",
                      fontFamily: "sans-serif", cursor: "pointer"
                    }}
                  >
                    <IonIcon
                      icon={addr.is_default ? checkmarkCircle : radioButtonOffOutline}
                      style={{ fontSize: 16, color: addr.is_default ? "#16A34A" : "#9B8E84" }}
                    />
                    {addr.is_default ? "Default address" : "Set as default"}
                  </button>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => openEditForm(addr)}
                      style={{
                        width: 34, height: 34, borderRadius: 10, border: "none",
                        background: "#F5EFE0", display: "flex",
                        alignItems: "center", justifyContent: "center", cursor: "pointer"
                      }}
                    >
                      <IonIcon icon={pencilOutline} style={{ fontSize: 16, color: "#5A5248" }} />
                    </button>
                    <button
                      onClick={() => setDeleteId(addr.id)}
                      style={{
                        width: 34, height: 34, borderRadius: 10, border: "none",
                        background: "#FEE2E2", display: "flex",
                        alignItems: "center", justifyContent: "center", cursor: "pointer"
                      }}
                    >
                      <IonIcon icon={trashOutline} style={{ fontSize: 16, color: "#DC2626" }} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          <div style={{ height: 80 }} />
        </div>

        {/* ── Delete Confirm Sheet ── */}
        {deleteId !== null && (
          <div
            onClick={() => setDeleteId(null)}
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
              zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center"
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: "#fff", borderRadius: "24px 24px 0 0",
                padding: "28px 24px 40px", width: "100%", maxWidth: 480,
                animation: "slideUp 0.25s ease"
              }}
            >
              <div style={{ fontSize: 44, textAlign: "center", marginBottom: 12 }}>🗑️</div>
              <div style={{ fontFamily: "sans-serif", fontSize: 18, fontWeight: 800, color: "#1A1714", textAlign: "center", marginBottom: 6 }}>
                Remove Address?
              </div>
              <div style={{ fontSize: 13, color: "#9B8E84", textAlign: "center", marginBottom: 24, lineHeight: 1.5 }}>
                This address will be permanently removed from your saved list.
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setDeleteId(null)}
                  style={{
                    flex: 1, padding: 13, borderRadius: 14,
                    background: "#F5EFE0", border: "none",
                    fontSize: 14, fontWeight: 700, color: "#1A1714",
                    cursor: "pointer", fontFamily: "sans-serif"
                  }}
                >Cancel</button>
                <button
                  onClick={() => deleteAddress(deleteId)}
                  style={{
                    flex: 1, padding: 13, borderRadius: 14,
                    background: "#DC2626", border: "none",
                    fontSize: 14, fontWeight: 700, color: "#fff",
                    cursor: "pointer", fontFamily: "sans-serif"
                  }}
                >Yes, Remove</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Add / Edit Form Sheet ── */}
        {showForm && (
          <AddressForm
            initial={editTarget ?? undefined}
            onSave={saveAddress}
            onClose={() => { setShowForm(false); setEditTarget(null); }}
            saving={saving}
            error={formError}
          />
        )}

      </IonContent>
    </IonPage>
  );
};

export default SavedAddresses;