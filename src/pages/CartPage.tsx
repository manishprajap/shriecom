import { IonPage, IonContent, IonModal } from "@ionic/react";
import { useState, useEffect } from "react";
import { useIonRouter } from "@ionic/react";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";
import logo from "../assets/shrilogo.jpeg";

import { getToken, getUser } from "../hooks/useAuth";
const BASE = "https://shriecom.in/appapis/shreefood/public/api";

type CartItem = {
  id: number; name: string; price: number; mrp: number;
  img: string; qty: number; weight?: string; emoji?: string;
};

// ✅ NEW: dynamic charge line returned by /charges/calculate
type ChargeItem = {
  code: string;
  name: string;
  type: "fixed" | "percentage";
  amount: number;
  is_free: boolean;
  description?: string | null;
};

const sameCartLine = (item: CartItem, id: number, weight?: string) =>
  item.id === id && (item.weight ?? "") === (weight ?? "");

/* ─── Inline styles (no external CSS dependency) ─── */
const S: Record<string, React.CSSProperties> = {
  app: {
    minHeight: "100vh",
    background: "#f5f6fa",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    display: "flex",
    flexDirection: "column",
  },
  centerWrap: {
    width: "100%",
    maxWidth: 680,
    margin: "0 auto",
    padding: "0 0 120px",
    boxSizing: "border-box" as const,
    flex: 1,
  },
  header: {
    position: "sticky" as const,
    top: 0,
    zIndex: 100,
    background: "#fff",
    borderBottom: "1px solid #efefef",
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 16px",
  },
  backBtn: {
    background: "#f0f0f0",
    border: "none",
    borderRadius: 10,
    width: 36,
    height: 36,
    fontSize: 18,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 700,
    color: "#111",
    letterSpacing: "-0.3px",
  },
  shareBtn: {
    background: "none",
    border: "1px solid #e0e0e0",
    borderRadius: 20,
    padding: "6px 12px",
    fontSize: 13,
    color: "#555",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 5,
    flexShrink: 0,
  },
  deliveryBanner: {
    margin: "12px 16px 0",
    background: "#fff",
    borderRadius: 14,
    border: "1px solid #e8f5e9",
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
  },
  deliveryIcon: {
    width: 40,
    height: 40,
    background: "#e8f5e9",
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  deliveryTitle: { fontSize: 14, fontWeight: 700, color: "#1a7a12" },
  deliverySub: { fontSize: 12, color: "#888", marginTop: 2 },
  section: {
    margin: "12px 16px 0",
    background: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    border: "1px solid #efefef",
  },
  cartItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 16px",
    borderBottom: "1px solid #f5f5f5",
  },
  itemImg: {
    width: 60,
    height: 60,
    objectFit: "cover" as const,
    borderRadius: 10,
    flexShrink: 0,
    background: "#f8f8f8",
  },
  itemImgPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 10,
    background: "#f8f8f8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 28,
    flexShrink: 0,
  },
  itemInfo: { flex: 1, minWidth: 0 },
  itemName: {
    fontSize: 14,
    fontWeight: 600,
    color: "#111",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  itemWeight: { fontSize: 12, color: "#999", marginTop: 2 },
  priceRow: { display: "flex", alignItems: "center", gap: 6, marginTop: 4 },
  itemPrice: { fontSize: 14, fontWeight: 700, color: "#111" },
  itemMrp: { fontSize: 12, color: "#bbb", textDecoration: "line-through" },
  qtyCtrl: {
    display: "flex",
    alignItems: "center",
    border: "1.5px solid #1a8917",
    borderRadius: 10,
    overflow: "hidden",
    flexShrink: 0,
  },
  qtyBtn: {
    background: "none",
    border: "none",
    color: "#1a8917",
    fontSize: 18,
    width: 34,
    height: 34,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
  },
  qtyNum: {
    width: 28,
    textAlign: "center" as const,
    fontSize: 14,
    fontWeight: 700,
    color: "#111",
  },
  billSection: {
    margin: "12px 16px 0",
    background: "#fff",
    borderRadius: 16,
    padding: "16px",
    border: "1px solid #efefef",
  },
  billHeading: {
    fontSize: 15,
    fontWeight: 700,
    color: "#111",
    marginBottom: 12,
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  billRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "7px 0",
    borderBottom: "1px solid #f8f8f8",
  },
  billLabel: { fontSize: 13, color: "#555", display: "flex", alignItems: "center", gap: 4 },
  billVal: { fontSize: 13, color: "#333", fontWeight: 500 },
  freeVal: { fontSize: 13, color: "#1a8917", fontWeight: 700 },
  savingsPill: {
    background: "#e8f5e9",
    color: "#1a8917",
    fontSize: 11,
    fontWeight: 600,
    borderRadius: 20,
    padding: "2px 7px",
    marginLeft: 6,
  },
  mrpStrike: { color: "#bbb", marginRight: 4, fontSize: 12 },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTop: "2px solid #f0f0f0",
  },
  totalLabel: { fontSize: 15, fontWeight: 700, color: "#111", display: "flex", alignItems: "center", gap: 4 },
  totalVal: { fontSize: 16, fontWeight: 800, color: "#111" },
  chargesLoading: { fontSize: 12, color: "#999", padding: "6px 0" },
  policyBox: {
    margin: "12px 16px 0",
    background: "#fffbea",
    borderRadius: 14,
    border: "1px solid #ffe680",
    display: "flex",
    gap: 10,
    padding: "12px 14px",
  },
  policyIcon: { fontSize: 18, flexShrink: 0, marginTop: 1 },
  policyHeading: { fontSize: 13, fontWeight: 700, color: "#7a5c00", marginBottom: 4 },
  policyText: { fontSize: 12, color: "#9a7800", lineHeight: 1.5 },
  empty: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 24px",
    textAlign: "center" as const,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    background: "#f5f5f5",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: "#111", margin: "0 0 6px" },
  emptySub: { fontSize: 14, color: "#999", margin: "0 0 24px" },
  emptyBtn: {
    background: "#1a8917",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "13px 28px",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
  },
  bottomBar: {
    position: "fixed" as const,
    bottom: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: "100%",
    maxWidth: 680,
    background: "#fff",
    borderTop: "1px solid #efefef",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    paddingBottom: "max(12px, env(safe-area-inset-bottom))",
    boxSizing: "border-box" as const,
    boxShadow: "0 -4px 20px rgba(0,0,0,0.07)",
    zIndex: 200,
  },
  bottomPriceWrap: {},
  bottomPrice: { fontSize: 18, fontWeight: 800, color: "#111" },
  bottomLabel: { fontSize: 11, color: "#999", marginTop: 1 },
  checkoutBtn: {
    background: "#1a8917",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "13px 24px",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
    letterSpacing: "-0.2px",
  },
};

const CartPage = () => {
  const router = useIonRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // ✅ Auth state loaded async via useAuth
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getToken();
      const user  = await getUser();
      setIsLoggedIn(!!(token && user));
    };
    checkAuth();
  }, []);

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const syncCart = () => {
      const saved = localStorage.getItem("cart");
      setCart(saved ? JSON.parse(saved) : []);
    };
    syncCart();
    window.addEventListener("focus", syncCart);
    return () => window.removeEventListener("focus", syncCart);
  }, []);

  // increase/decrease target line via id + weight combo
  const increaseQty = (id: number, weight?: string) => {
    setCart((prev) => {
      const updated = prev.map((item) =>
        sameCartLine(item, id, weight) ? { ...item, qty: item.qty + 1 } : item
      );
      localStorage.setItem("cart", JSON.stringify(updated));
      return updated;
    });
  };

  const decreaseQty = (id: number, weight?: string) => {
    setCart((prev) => {
      const updated = prev
        .map((item) => sameCartLine(item, id, weight) ? { ...item, qty: item.qty - 1 } : item)
        .filter((item) => item.qty > 0);
      localStorage.setItem("cart", JSON.stringify(updated));
      return updated;
    });
  };

  const handleCheckout = () => {
    if (isLoggedIn) {
      router.push("/checkout", "forward", "push");
    } else {
      setShowLoginModal(true);
    }
  };

  const itemsTotal = cart.reduce((sum, item) => sum + item.qty * item.price, 0);
  const itemsMRP = cart.reduce((sum, item) => sum + item.qty * (item.mrp || item.price), 0);
  const totalSavings = itemsMRP - itemsTotal;

  // ✅ NEW: dynamic charges state, fetched from Laravel API
  const [charges, setCharges] = useState<ChargeItem[]>([]);
  const [chargesLoading, setChargesLoading] = useState(false);
  const [chargesError, setChargesError] = useState(false);

  useEffect(() => {
    if (cart.length === 0) {
      setCharges([]);
      setChargesError(false);
      return;
    }

    const controller = new AbortController();

    const fetchCharges = async () => {
      setChargesLoading(true);
      setChargesError(false);
      try {
        const res = await fetch(`${BASE}/charges/calculate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items_total: itemsTotal }),
          signal: controller.signal,
        });
        const json = await res.json();
        if (json.success) {
          setCharges(json.data.charges || []);
        } else {
          setChargesError(true);
        }
      } catch (err) {
        if ((err as any).name !== "AbortError") {
          console.error("Failed to fetch charges:", err);
          setChargesError(true);
        }
      } finally {
        setChargesLoading(false);
      }
    };

    fetchCharges();
    return () => controller.abort();
  }, [itemsTotal, cart.length]);

  const chargesTotal = charges.reduce((sum, c) => sum + c.amount, 0);
  const grandTotal = itemsTotal + chargesTotal;

  return (
    <IonPage>
      <IonContent fullscreen scrollY={true}>
        <div style={S.app}>

          {/* ── Sticky Header ── */}
          <div style={S.header}>
            <button style={S.backBtn} onClick={() => router.goBack()}>←</button>
            <span style={S.headerTitle}>My Cart</span>
            <button style={S.shareBtn}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="3" r="1.5" /><circle cx="4" cy="8" r="1.5" /><circle cx="12" cy="13" r="1.5" />
                <line x1="5.5" y1="7" x2="10.5" y2="4" /><line x1="5.5" y1="9" x2="10.5" y2="12" />
              </svg>
              Share
            </button>
          </div>

          {/* ── Centered content column ── */}
          <div style={S.centerWrap}>

            {/* Delivery banner */}
            {cart.length > 0 && (
              <div style={S.deliveryBanner}>
                <div style={S.deliveryIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a8917" strokeWidth="2">
                    <circle cx="12" cy="13" r="8" /><path d="M12 9v4l3 2" />
                    <path d="M9 2h6" /><path d="M12 2v3" />
                  </svg>
                </div>
                <div>
                  <div style={S.deliverySub}>Shipment of {cart.length} item{cart.length > 1 ? "s" : ""}</div>
                </div>
              </div>
            )}

            {/* ── Empty state ── */}
            {cart.length === 0 ? (
              <div style={S.empty}>
                <div style={S.emptyIcon}>
                  <img src={logo} alt="Logo" style={{ height: 40, width: "auto", objectFit: "contain" }} />
                </div>
                <p style={S.emptyTitle}>Your cart is empty</p>
                <p style={S.emptySub}>Add items to get started</p>
                <button style={S.emptyBtn} onClick={() => router.goBack()}>Browse Products</button>
              </div>
            ) : (
              <>
                {/* ── Cart items ── */}
                <div style={S.section}>
                  {cart.map((item, idx) => (
                    <div
                      key={`${item.id}-${item.weight ?? ""}`}
                      style={{
                        ...S.cartItem,
                        borderBottom: idx === cart.length - 1 ? "none" : "1px solid #f5f5f5",
                      }}
                    >
                      {item.img
                        ? <img src={item.img} alt={item.name} style={S.itemImg} />
                        : <div style={S.itemImgPlaceholder}>{item.emoji || "🛍️"}</div>
                      }
                      <div style={S.itemInfo}>
                        <div style={S.itemName}>{item.name}</div>
                        <div style={S.itemWeight}>{item.weight || "1 pc"}</div>
                        <div style={S.priceRow}>
                          <span style={S.itemPrice}>₹{item.price}</span>
                          {item.mrp && item.mrp > item.price && (
                            <span style={S.itemMrp}>₹{item.mrp}</span>
                          )}
                        </div>
                      </div>
                      <div style={S.qtyCtrl}>
                        <button style={S.qtyBtn} onClick={() => decreaseQty(item.id, item.weight)}>−</button>
                        <span style={S.qtyNum}>{item.qty}</span>
                        <button style={S.qtyBtn} onClick={() => increaseQty(item.id, item.weight)}>+</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Bill details ── */}
                <div style={S.billSection}>
                  <div style={S.billHeading}><span>🧾</span> Bill Details</div>

                  <div style={S.billRow}>
                    <span style={S.billLabel}>
                      Items total
                      {totalSavings > 0 && <span style={S.savingsPill}>Saved ₹{totalSavings}</span>}
                    </span>
                    <span style={S.billVal}>
                      {totalSavings > 0 && <s style={S.mrpStrike}>₹{itemsMRP}</s>} ₹{itemsTotal}
                    </span>
                  </div>

                  {/* ✅ NEW: dynamic charges rendered from API */}
                  {charges.map((c) => (
                    <div style={S.billRow} key={c.code}>
                      <span style={S.billLabel}>{c.name} <InfoIcon /></span>
                      <span style={c.is_free ? S.freeVal : S.billVal}>
                        {c.is_free ? "FREE" : `₹${c.amount}`}
                      </span>
                    </div>
                  ))}

                  {chargesLoading && (
                    <div style={S.chargesLoading}>Updating charges…</div>
                  )}
                  {chargesError && !chargesLoading && (
                    <div style={{ ...S.chargesLoading, color: "#c0392b" }}>
                      Couldn't load charges — showing items total only.
                    </div>
                  )}

                  <div style={S.totalRow}>
                    <span style={S.totalLabel}>Grand Total <InfoIcon /></span>
                    <span style={S.totalVal}>₹{grandTotal}</span>
                  </div>
                </div>

                {/* ── Cancellation policy ── */}
                <div style={S.policyBox}>
                  <span style={S.policyIcon}>⚠️</span>
                  <div>
                    <div style={S.policyHeading}>Cancellation Policy</div>
                    <div style={S.policyText}>
                      Orders cannot be cancelled once packed for delivery. In case of
                      unexpected delays, a refund will be provided, if applicable.
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── Sticky bottom checkout bar ── */}
          {cart.length > 0 && (
            <div style={S.bottomBar}>
              <div style={S.bottomPriceWrap}>
                <div style={S.bottomPrice}>₹{grandTotal}</div>
                <div style={S.bottomLabel}>Total</div>
              </div>
              <button style={S.checkoutBtn} onClick={handleCheckout}>
                {isLoggedIn ? "Proceed to Checkout →" : "Login to Proceed →"}
              </button>
            </div>
          )}
        </div>

        {/* ── Login Modal ── */}
        <IonModal
          isOpen={showLoginModal}
          onDidDismiss={() => setShowLoginModal(false)}
          initialBreakpoint={0.95}
          breakpoints={[0, 0.95, 1]}
        >
          <LoginModal
            closeModal={async () => {
              setShowLoginModal(false);
              const token = await getToken();
              const user  = await getUser();
              if (token && user) {
                setIsLoggedIn(true);
                router.push("/checkout", "forward", "push");
              }
            }}
            openRegister={() => {
              setShowLoginModal(false);
              setShowRegisterModal(true);
            }}
          />
        </IonModal>

        {/* ── Register Modal ── */}
        <IonModal
          isOpen={showRegisterModal}
          onDidDismiss={() => setShowRegisterModal(false)}
          initialBreakpoint={0.95}
          breakpoints={[0, 0.95, 1]}
        >
          <RegisterModal
            closeModal={() => setShowRegisterModal(false)}
            openLogin={() => {
              setShowRegisterModal(false);
              setShowLoginModal(true);
            }}
          />
        </IonModal>

      </IonContent>
    </IonPage>
  );
};

const InfoIcon = () => (
  <svg
    width="13" height="13" viewBox="0 0 16 16"
    fill="none" stroke="#aaa" strokeWidth="1.5"
    style={{ verticalAlign: "middle", marginLeft: 4 }}
  >
    <circle cx="8" cy="8" r="6.5" />
    <line x1="8" y1="7" x2="8" y2="11" />
    <circle cx="8" cy="5.5" r="0.5" fill="#aaa" />
  </svg>
);

export default CartPage;