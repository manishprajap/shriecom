import { IonPage, IonContent, IonIcon, IonModal } from "@ionic/react";
import {
    arrowBackOutline, locationOutline, cardOutline,
    checkmarkCircleOutline, addOutline, closeOutline,
} from "ionicons/icons";
import { useState, useEffect } from "react";
import { useIonRouter } from "@ionic/react";

import { getToken, getUser } from "../hooks/useAuth";

const BASE_URL = "https://shriecom.in/appapis/shreefood/public/api";

declare global {
    interface Window { Razorpay: any; }
}

type CartItem = { id: number; name: string; price: number; qty: number; img: string; };

interface Address {
    id: number;
    label: string;
    name: string;
    phone: string;
    address: string;
    city: string;
    is_default: boolean;
}

const CheckoutPage = () => {
    const router = useIonRouter();

    const cart: CartItem[] = JSON.parse(localStorage.getItem("cart") || "[]");

    const [token,    setToken]    = useState("");
    const [userName, setUserName] = useState("");

    useEffect(() => {
        const loadAuth = async () => {
            const t = await getToken();
            const u = await getUser();
            if (t) setToken(t);
            if (u?.name) setUserName(u.name);
            if (!t || !u) {
                router.push("/", "root", "replace");
            }
        };
        loadAuth();
    }, []);

    const [addresses, setAddresses]             = useState<Address[]>([]);
    const [selectedId, setSelectedId]           = useState<number | null>(null);
    const [selectedPayment, setSelectedPayment] = useState("cod");
    const [placing, setPlacing]                 = useState(false);
    const [placed, setPlaced]                   = useState(false);
    const [orderId, setOrderId]                 = useState<number | null>(null);
    const [error, setError]                     = useState<string | null>(null);
    const [loadingAddr, setLoadingAddr]         = useState(true);

    const [showAddModal, setShowAddModal] = useState(false);
    const [saving, setSaving]             = useState(false);
    const [newAddr, setNewAddr]           = useState({
        label: "Home", name: "", phone: "",
        address: "", city: "", province: "", postalcode: "",
    });

    useEffect(() => {
        if (userName) {
            setNewAddr(prev => ({ ...prev, name: userName }));
        }
    }, [userName]);

    const itemsTotal      = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const deliveryCharge  = 0;
    const handlingCharge  = 0;
    const smallCartCharge = 0;
    const grandTotal      = itemsTotal + deliveryCharge + handlingCharge + smallCartCharge;

    // Load Razorpay script
    useEffect(() => {
        if (!document.getElementById("razorpay-script")) {
            const script   = document.createElement("script");
            script.id      = "razorpay-script";
            script.src     = "https://checkout.razorpay.com/v1/checkout.js";
            script.async   = true;
            document.body.appendChild(script);
        }
    }, []);

    // Load addresses — token ready hone ke baad
    useEffect(() => {
        if (!token) return;
        fetch(`${BASE_URL}/addresses`, {
            headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" },
        })
            .then(r => r.json())
            .then(json => {
                if (json.success && json.data.length > 0) {
                    setAddresses(json.data);
                    const def = json.data.find((a: Address) => a.is_default);
                    setSelectedId(def ? def.id : json.data[0].id);
                }
            })
            .catch(console.error)
            .finally(() => setLoadingAddr(false));
    }, [token]);

    const saveAddress = async () => {
        if (!newAddr.name || !newAddr.phone || !newAddr.address || !newAddr.city) {
            setError("Please fill all required address fields.");
            return;
        }
        setSaving(true);
        try {
            const res  = await fetch(`${BASE_URL}/addresses`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ ...newAddr, is_default: addresses.length === 0 }),
            });
            const data = await res.json();
            if (data.success) {
                setAddresses(prev => [...prev, data.data]);
                setSelectedId(data.data.id);
                setShowAddModal(false);
                setNewAddr({ label: "Home", name: userName, phone: "", address: "", city: "", province: "", postalcode: "" });
            } else {
                setError(data.message || "Failed to save address.");
            }
        } catch {
            setError("Network error.");
        } finally {
            setSaving(false);
        }
    };

    // ✅ FIX: Payment fail/cancel hone par pending order ko backend mein cancel karo
    const cancelPendingOrder = async (dbOrderId: number) => {
        try {
            await fetch(`${BASE_URL}/payment/cancel-pending`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ order_id: dbOrderId }),
            });
        } catch (e) {
            console.error("Cancel pending order failed:", e);
        }
    };

    const verifyPayment = async (rzpResponse: any, dbOrderId: number) => {
        try {
            const res  = await fetch(`${BASE_URL}/payment/verify`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    razorpay_order_id:   rzpResponse.razorpay_order_id,
                    razorpay_payment_id: rzpResponse.razorpay_payment_id,
                    razorpay_signature:  rzpResponse.razorpay_signature,
                    order_id:            dbOrderId,
                }),
            });
            const data = await res.json();
            if (data.success) {
                localStorage.removeItem("cart");
                window.dispatchEvent(new Event("focus"));
                setOrderId(data.order_id);
                setPlaced(true);
            } else {
                // ✅ FIX: Verify fail hone par bhi order cancel karo
                await cancelPendingOrder(dbOrderId);
                setError("Payment verification failed. Please contact support.");
                setPlacing(false);
            }
        } catch {
            setError("Network error during verification. Please contact support.");
            setPlacing(false);
        }
    };

    const openRazorpay = (initiateData: any) => {
        const options = {
            key:         initiateData.key,
            amount:      initiateData.amount,
            currency:    initiateData.currency,
            name:        "Shri Enterprises",
            description: "Food Order",
            order_id:    initiateData.razorpay_order_id,
            prefill: {
                name:    initiateData.name,
                email:   initiateData.email,
                contact: initiateData.phone,
            },
            theme: { color: "#0C831F" },
            retry: { enabled: false },
            handler: async (response: any) => {
                // Payment successful — verify karo
                await verifyPayment(response, initiateData.order_id);
            },
            modal: {
                // ✅ FIX: User ne modal close kiya — pending order cancel karo
                ondismiss: async () => {
                    await cancelPendingOrder(initiateData.order_id);
                    setError("Payment cancelled. Tap 'Place Order' to try again.");
                    setPlacing(false);
                },
            },
        };

        const rzp = new window.Razorpay(options);

        // ✅ FIX: Payment failed event — pending order cancel karo
        rzp.on("payment.failed", async (response: any) => {
            await cancelPendingOrder(initiateData.order_id);
            setError("Payment failed: " + (response.error?.description || "Please tap 'Place Order' again to retry."));
            setPlacing(false);
        });

        rzp.open();
    };

    const placeOrder = async () => {
        if (!selectedId) { setError("Please select a delivery address."); return; }
        if (cart.length === 0) return;

        const addr = addresses.find(a => a.id === selectedId);
        if (!addr) return;

        setError(null);
        setPlacing(true);

        try {
            if (selectedPayment === "razorpay") {
                const res  = await fetch(`${BASE_URL}/payment/initiate`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        items:           cart.map(i => ({ product_id: i.id, qty: i.qty, price: i.price })),
                        billing_name:    addr.name,
                        billing_address: addr.address,
                        billing_city:    addr.city,
                        billing_phone:   addr.phone,
                        grand_total:     grandTotal,
                        payment_method:  "razorpay",
                        cod:             0,
                    }),
                });
                const data = await res.json();
                if (data.success) {
                    // ✅ Razorpay modal open karo — order DB mein already saved hai (pending)
                    openRazorpay(data.data);
                } else {
                    setError(data.message || "Failed to initiate payment. Please try again.");
                    setPlacing(false);
                }
            } else {
                // COD flow — seedha order place karo
                const res  = await fetch(`${BASE_URL}/orders`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        items:           cart.map(i => ({ product_id: i.id, qty: i.qty, price: i.price })),
                        billing_name:    addr.name,
                        billing_address: addr.address,
                        billing_city:    addr.city,
                        billing_phone:   addr.phone,
                        payment_gateway: "cod",
                        payment_method:  "cod",
                        cod:             1,
                    }),
                });
                const data = await res.json();
                if (data.success) {
                    localStorage.removeItem("cart");
                    window.dispatchEvent(new Event("focus"));
                    setOrderId(data.data.order_id);
                    setPlaced(true);
                } else {
                    setError(data.message || "Failed to place order. Please try again.");
                }
                setPlacing(false);
            }
        } catch {
            setError("Network error. Please check your connection and try again.");
            setPlacing(false);
        }
    };

    // ── Success screen ────────────────────────────────────
    if (placed) {
        return (
            <IonPage>
                <IonContent>
                    <style>{`
                        .co-success { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; padding:32px; text-align:center; background:#F7FFF8; font-family:'DM Sans',sans-serif; }
                        .co-success-anim { font-size:72px; margin-bottom:16px; animation:popIn .4s cubic-bezier(0.34,1.56,0.64,1) both; }
                        @keyframes popIn { from{transform:scale(0);opacity:0} to{transform:scale(1);opacity:1} }
                        .co-success h2 { font-size:22px; font-weight:800; color:#1A1714; margin-bottom:8px; font-family:'DM Sans',sans-serif; }
                        .co-success p { font-size:14px; color:#6B7280; margin-bottom:8px; line-height:1.6; }
                        .co-order-id { font-size:12px; color:#9B8E84; background:#F5F2EC; padding:6px 16px; border-radius:20px; margin-bottom:28px; }
                        .co-success-btn { background:#0C831F; color:#fff; border:none; padding:14px 36px; border-radius:12px; font-size:15px; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; }
                    `}</style>
                    <div className="co-success">
                        <div className="co-success-anim">🎉</div>
                        <h2>Order Placed!</h2>
                        <p>Your order has been confirmed Delivery .</p>
                        {orderId && <div className="co-order-id">Order ID: #{orderId}</div>}
                        <button className="co-success-btn" onClick={() => router.push("/orders", "root", "replace")}>
                            Track My Order →
                        </button>
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    return (
        <IonPage>
            <IonContent fullscreen>
                <style>{`
                    * { box-sizing:border-box; margin:0; padding:0; }
                    .co-root { font-family:'DM Sans',sans-serif; background:#F7F5F2; min-height:100vh; padding-bottom:110px; }

                    .co-header { position:sticky; top:0; z-index:100; background:#f8cb46; padding:12px 16px; display:flex; align-items:center; gap:12px; }
                    .co-back { width:36px; height:36px; border-radius:10px; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; border:none; cursor:pointer; flex-shrink:0; }
                    .co-back ion-icon { color:#fff; font-size:18px; }
                    .co-header h2 { font-size:16px; font-weight:700; color:#000; }

                    .co-section { background:#fff; margin:12px 16px; border-radius:16px; overflow:hidden; border:1px solid #EAE5DF; }
                    .co-section-title { font-size:12px; font-weight:700; color:#9B8E84; text-transform:uppercase; letter-spacing:.06em; padding:14px 16px 10px; border-bottom:1px solid #F5F2EC; display:flex; align-items:center; justify-content:space-between; }
                    .co-section-title-left { display:flex; align-items:center; gap:6px; }
                    .co-section-title ion-icon { font-size:15px; color:#0C831F; }
                    .co-add-btn { display:flex; align-items:center; gap:4px; background:#E8F5E9; color:#0C831F; border:none; padding:5px 10px; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; }

                    .co-address-opt { padding:14px 16px; border-bottom:1px solid #F5F2EC; display:flex; align-items:flex-start; gap:12px; cursor:pointer; transition:background .15s; }
                    .co-address-opt:last-child { border-bottom:none; }
                    .co-address-opt:active { background:#F9F6F0; }
                    .co-radio { width:20px; height:20px; border-radius:50%; border:2px solid #D1C9C0; flex-shrink:0; display:flex; align-items:center; justify-content:center; margin-top:2px; transition:all .15s; }
                    .co-radio.sel { border-color:#0C831F; background:#0C831F; }
                    .co-radio.sel::after { content:''; width:8px; height:8px; border-radius:50%; background:#fff; display:block; }
                    .co-addr-label { font-size:11px; font-weight:700; color:#0C831F; background:#E8F5E9; padding:2px 8px; border-radius:10px; margin-bottom:4px; display:inline-block; }
                    .co-addr-name { font-size:13px; font-weight:600; color:#1A1714; }
                    .co-addr-text { font-size:12px; color:#6B7280; line-height:1.4; margin-top:2px; }
                    .co-addr-phone { font-size:11px; color:#9B8E84; margin-top:2px; }
                    .co-no-addr { padding:20px 16px; text-align:center; color:#9B8E84; font-size:13px; }

                    .co-pay-opt { padding:14px 16px; border-bottom:1px solid #F5F2EC; display:flex; align-items:center; gap:12px; cursor:pointer; transition:background .15s; }
                    .co-pay-opt:last-child { border-bottom:none; }
                    .co-pay-opt:active { background:#F9F6F0; }
                    .co-pay-emoji { font-size:20px; width:32px; text-align:center; flex-shrink:0; }
                    .co-pay-name { font-size:14px; font-weight:600; color:#1A1714; }
                    .co-pay-sub { font-size:11px; color:#9B8E84; margin-top:2px; }
                    .co-pay-badge { font-size:10px; font-weight:700; padding:2px 8px; border-radius:10px; margin-left:8px; }
                    .co-pay-badge.cod { background:#FFF3CD; color:#856404; }
                    .co-pay-badge.online { background:#D1FAE5; color:#065F46; }

                    .co-item-row { display:flex; align-items:center; gap:10px; padding:10px 16px; border-bottom:1px solid #F5F2EC; }
                    .co-item-row:last-of-type { border-bottom:none; }
                    .co-item-img { width:44px; height:44px; object-fit:cover; border-radius:8px; background:#F5F2EC; flex-shrink:0; }
                    .co-item-detail { flex:1; }
                    .co-item-name { font-size:13px; font-weight:600; color:#1A1714; }
                    .co-item-qty { font-size:11px; color:#9B8E84; margin-top:2px; }
                    .co-item-price { font-size:13px; font-weight:700; color:#1A1714; }

                    .co-bill-row { display:flex; justify-content:space-between; padding:9px 16px; font-size:13px; color:#5A534E; }
                    .co-bill-total { display:flex; justify-content:space-between; padding:13px 16px; border-top:1px solid #F5F2EC; font-weight:700; font-size:15px; color:#1A1714; }

                    .co-error { margin:0 16px 12px; padding:12px 14px; background:#FEF2F2; border:1px solid #FECACA; border-radius:12px; font-size:13px; color:#DC2626; }

                    .co-bar { position:fixed; bottom:0; left:0; right:0; background:#fff; border-top:1px solid #EAE5DF; padding:12px 16px; display:flex; align-items:center; justify-content:space-between; z-index:200; box-shadow:0 -4px 16px rgba(0,0,0,.08); }
                    .co-bar-info p { font-size:11px; color:#9B8E84; margin-bottom:2px; }
                    .co-bar-info strong { font-size:20px; font-weight:800; color:#1A1714; display:block; }
                    .co-place-btn { background:#0C831F; color:#fff; border:none; padding:14px 28px; border-radius:12px; font-size:15px; font-weight:700; font-family:'DM Sans',sans-serif; cursor:pointer; }
                    .co-place-btn:disabled { opacity:.6; cursor:not-allowed; }
                    .co-spinner { display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; margin-right:6px; vertical-align:middle; }
                    @keyframes spin { to{transform:rotate(360deg)} }

                    .sk { background:linear-gradient(90deg,#eee 25%,#f5f5f5 50%,#eee 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:8px; }
                    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

                    .modal-inner { padding:20px 16px; font-family:'DM Sans',sans-serif; }
                    .modal-title { font-size:16px; font-weight:800; color:#1A1714; margin-bottom:16px; display:flex; align-items:center; justify-content:space-between; }
                    .modal-close { background:none; border:none; cursor:pointer; padding:4px; }
                    .modal-close ion-icon { font-size:22px; color:#9B8E84; }
                    .mf-label { font-size:11px; font-weight:700; color:#9B8E84; text-transform:uppercase; letter-spacing:.05em; margin-bottom:6px; display:block; }
                    .mf-input { width:100%; padding:12px 14px; border:1.5px solid #EAE5DF; border-radius:12px; font-size:14px; font-family:'DM Sans',sans-serif; color:#1A1714; background:#FAFAF9; outline:none; margin-bottom:12px; }
                    .mf-input:focus { border-color:#0C831F; background:#fff; }
                    .mf-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
                    .mf-label-tabs { display:flex; gap:8px; margin-bottom:14px; }
                    .mf-tab { padding:6px 14px; border-radius:20px; font-size:12px; font-weight:600; cursor:pointer; border:1.5px solid #EAE5DF; background:#fff; color:#9B8E84; font-family:'DM Sans',sans-serif; }
                    .mf-tab.active { background:#1A1714; color:#fff; border-color:#1A1714; }
                    .mf-save-btn { width:100%; background:#0C831F; color:#fff; border:none; padding:14px; border-radius:12px; font-size:15px; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; margin-top:4px; }
                    .mf-save-btn:disabled { opacity:.6; }
                `}</style>

                <div className="co-root">
                    <div className="co-header">
                        <button className="co-back" onClick={() => router.goBack()}>
                            <IonIcon icon={arrowBackOutline} />
                        </button>
                        <h2>Checkout</h2>
                    </div>

                    {error && <div className="co-error">⚠️ {error}</div>}

                    {/* Cart items */}
                    <div className="co-section">
                        <div className="co-section-title">
                            <div className="co-section-title-left">
                                <IonIcon icon={checkmarkCircleOutline} />
                                {cart.length} item{cart.length !== 1 ? "s" : ""} in your order
                            </div>
                        </div>
                        {cart.map(item => (
                            <div key={item.id} className="co-item-row">
                                {item.img && (
                                    <img src={item.img} alt={item.name} className="co-item-img"
                                        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                )}
                                <div className="co-item-detail">
                                    <div className="co-item-name">{item.name}</div>
                                    <div className="co-item-qty">Qty: {item.qty}</div>
                                </div>
                                <div className="co-item-price">₹{item.price * item.qty}</div>
                            </div>
                        ))}
                    </div>

                    {/* Delivery Address */}
                    <div className="co-section">
                        <div className="co-section-title">
                            <div className="co-section-title-left">
                                <IonIcon icon={locationOutline} /> Delivery address
                            </div>
                            <button className="co-add-btn" onClick={() => setShowAddModal(true)}>
                                <IonIcon icon={addOutline} style={{ fontSize: 13 }} /> Add New
                            </button>
                        </div>

                        {loadingAddr ? (
                            <div style={{ padding: 16 }}>
                                <div className="sk" style={{ height: 60, marginBottom: 8 }} />
                                <div className="sk" style={{ height: 60 }} />
                            </div>
                        ) : addresses.length === 0 ? (
                            <div className="co-no-addr">
                                No saved addresses.<br />
                                <span style={{ color: "#0C831F", cursor: "pointer", fontWeight: 600 }}
                                    onClick={() => setShowAddModal(true)}>
                                    + Add your first address
                                </span>
                            </div>
                        ) : (
                            addresses.map(a => (
                                <div key={a.id} className="co-address-opt" onClick={() => setSelectedId(a.id)}>
                                    <div className={`co-radio ${selectedId === a.id ? "sel" : ""}`} />
                                    <div>
                                        <span className="co-addr-label">{a.label}</span>
                                        {a.is_default && (
                                            <span style={{ fontSize: 10, color: "#0C831F", marginLeft: 6, fontWeight: 600 }}>★ Default</span>
                                        )}
                                        <div className="co-addr-name">{a.name}</div>
                                        <div className="co-addr-text">{a.address}, {a.city}</div>
                                        <div className="co-addr-phone">📞 {a.phone}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Payment Method */}
                    <div className="co-section">
                        <div className="co-section-title">
                            <div className="co-section-title-left">
                                <IonIcon icon={cardOutline} /> Payment method
                            </div>
                        </div>
                        {[
                            { id: "cod",      emoji: "💵", name: "Cash on Delivery",  sub: "Pay when order arrives",         badge: "COD",    badgeClass: "cod" },
                            { id: "razorpay", emoji: "💳", name: "Pay via Razorpay",  sub: "UPI, Card, Net Banking, Wallet", badge: "ONLINE", badgeClass: "online" },
                        ].map(p => (
                            <div key={p.id} className="co-pay-opt" onClick={() => setSelectedPayment(p.id)}>
                                <div className={`co-radio ${selectedPayment === p.id ? "sel" : ""}`} />
                                <span className="co-pay-emoji">{p.emoji}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center" }}>
                                        <span className="co-pay-name">{p.name}</span>
                                        <span className={`co-pay-badge ${p.badgeClass}`}>{p.badge}</span>
                                    </div>
                                    <div className="co-pay-sub">{p.sub}</div>
                                </div>
                                {selectedPayment === p.id && <span style={{ fontSize: 18, color: "#0C831F" }}>✓</span>}
                            </div>
                        ))}
                    </div>

                    {/* Bill Summary */}
                    <div className="co-section">
                        <div className="co-section-title">
                            <div className="co-section-title-left">🧾 Bill summary</div>
                        </div>
                        <div className="co-bill-row"><span>Items total</span>        <span>₹{itemsTotal}</span></div>
                        <div className="co-bill-row"><span>Delivery charge</span>   <span>₹{deliveryCharge}</span></div>
                        <div className="co-bill-row"><span>Handling charge</span>   <span>₹{handlingCharge}</span></div>
                        <div className="co-bill-row"><span>Small cart charge</span> <span>₹{smallCartCharge}</span></div>
                        <div className="co-bill-total"><span>Grand Total</span>     <span>₹{grandTotal}</span></div>
                        <div style={{ padding:"10px 16px", background:"#F9F6F0", borderTop:"1px solid #F5F2EC", fontSize:12, color:"#5A534E", display:"flex", justifyContent:"space-between" }}>
                            <span>Payment Mode</span>
                            <span style={{ fontWeight:700, color: selectedPayment === "cod" ? "#856404" : "#065F46" }}>
                                {selectedPayment === "cod" ? "💵 Cash on Delivery" : "💳 Razorpay (Online)"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Place Order Bar */}
                <div className="co-bar">
                    <div className="co-bar-info">
                        <p>To pay</p>
                        <strong>₹{grandTotal}</strong>
                    </div>
                    <button className="co-place-btn" onClick={placeOrder}
                        disabled={placing || cart.length === 0 || !selectedId}>
                        {placing && <span className="co-spinner" />}
                        {placing ? "Placing..." : "Place Order →"}
                    </button>
                </div>

                {/* Add Address Modal */}
                <IonModal isOpen={showAddModal} onDidDismiss={() => setShowAddModal(false)}
                    initialBreakpoint={0.92} breakpoints={[0, 0.92, 1]}>
                    <div className="modal-inner">
                        <div className="modal-title">
                            Add New Address
                            <button className="modal-close" onClick={() => setShowAddModal(false)}>
                                <IonIcon icon={closeOutline} />
                            </button>
                        </div>

                        <div className="mf-label-tabs">
                            {["Home", "Work", "Other"].map(l => (
                                <button key={l} className={`mf-tab ${newAddr.label === l ? "active" : ""}`}
                                    onClick={() => setNewAddr(p => ({ ...p, label: l }))}>
                                    {l === "Home" ? "🏠" : l === "Work" ? "🏢" : "📍"} {l}
                                </button>
                            ))}
                        </div>

                        <label className="mf-label">Full Name *</label>
                        <input className="mf-input" placeholder="Receiver's name" value={newAddr.name}
                            onChange={e => setNewAddr(p => ({ ...p, name: e.target.value }))} />

                        <label className="mf-label">Phone *</label>
                        <input className="mf-input" placeholder="10-digit mobile number" type="tel" value={newAddr.phone}
                            onChange={e => setNewAddr(p => ({ ...p, phone: e.target.value }))} />

                        <label className="mf-label">Full Address *</label>
                        <input className="mf-input" placeholder="House no., Street, Area" value={newAddr.address}
                            onChange={e => setNewAddr(p => ({ ...p, address: e.target.value }))} />

                        <div className="mf-row">
                            <div>
                                <label className="mf-label">City *</label>
                                <input className="mf-input" placeholder="City" value={newAddr.city}
                                    onChange={e => setNewAddr(p => ({ ...p, city: e.target.value }))} />
                            </div>
                            <div>
                                <label className="mf-label">Pincode</label>
                                <input className="mf-input" placeholder="Pincode" type="number" value={newAddr.postalcode}
                                    onChange={e => setNewAddr(p => ({ ...p, postalcode: e.target.value }))} />
                            </div>
                        </div>

                        <button className="mf-save-btn" onClick={saveAddress} disabled={saving}>
                            {saving ? "Saving..." : "Save Address"}
                        </button>
                    </div>
                </IonModal>

            </IonContent>
        </IonPage>
    );
};

export default CheckoutPage;