import { IonPage, IonContent, IonIcon, useIonRouter } from "@ionic/react";
import {
    arrowBackOutline, chevronForwardOutline,
    receiptOutline, refreshOutline, closeOutline,
    alertCircleOutline,
} from "ionicons/icons";
import { useState, useEffect } from "react";
import { getToken, getUser } from "../hooks/useAuth";

const BASE_URL = "https://shriecom.in/appapis/shreefood/public/api";

type OrderStatus = string;

interface OrderItem {
    product_id: number;
    name:        string;
    image:       string;
    price:       number;
    qty:         number;
}

interface Order {
    id:              number;
    date:            string;
    created_at:      string;   // ✅ backend field
    status:          OrderStatus;
    billing_name:    string;
    customer_name:   string;   // ✅ backend field
    billing_address: string;
    billing_phone:   string;
    payment_gateway: string;
    payment_method:  string;   // ✅ backend uses this, not payment_gateway
    subtotal:        number;
    total:           number;
    amount:          number;
    total_amount:    number;   // ✅ actual backend total field
    items:           OrderItem[];
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    pending:    { label: "Pending",    color: "#D97706", bg: "#FEF3C7", icon: "⏳" },
    processing: { label: "Preparing",  color: "#D97706", bg: "#FEF3C7", icon: "👨‍🍳" },
    confirmed:  { label: "Confirmed",  color: "#16A34A", bg: "#DCFCE7", icon: "✅" },
    on_the_way: { label: "On the way", color: "#0284C7", bg: "#E0F2FE", icon: "🛵" },
    delivered:  { label: "Delivered",  color: "#16A34A", bg: "#DCFCE7", icon: "✅" },
    cancelled:  { label: "Cancelled",  color: "#DC2626", bg: "#FEE2E2", icon: "❌" },
    failed:     { label: "Failed",     color: "#DC2626", bg: "#FEE2E2", icon: "❌" },
};

const trackSteps = ["Placed", "Preparing", "On the Way", "Delivered"];

const trackProgress: Record<string, number> = {
    pending:    1,
    processing: 2,
    confirmed: 2,
    on_the_way: 3,
    delivered:  4,
    cancelled:  0,
    failed:     0,
};

const CANCEL_REASONS = [
    "Ordered by mistake",
    "Delivery is taking too long",
    "Found a better price",
    "Want to change my order",
    "Other reason",
];

const tabs = ["All", "Active", "Delivered", "Cancelled"];

// ✅ FIX: normalize status to lowercase to handle "Delivered", "Processing" etc from backend
const normalizeStatus = (status: string): string => (status ?? "").toLowerCase().trim();

// ✅ FIX: total_amount added as first priority — that's what backend actually sends
const getOrderTotal = (order: Order): number => {
    if (order.total_amount && order.total_amount > 0) return order.total_amount;
    if (order.total     && order.total > 0)           return order.total;
    if (order.subtotal  && order.subtotal > 0)        return order.subtotal;
    if (order.amount    && order.amount > 0)          return order.amount;
    return 0;
};

// ✅ FIX: backend uses payment_method field, not payment_gateway
const getPaymentLabel = (order: Order) => {
    const gateway = (order.payment_method || order.payment_gateway || "").toLowerCase();
    if (gateway === "cod")                          return { label: "💵 Cash on Delivery", cls: "mo-pay-cod" };
    if (gateway === "razorpay")                     return { label: "💳 Razorpay",          cls: "mo-pay-online" };
    if (gateway === "phonepay" || gateway === "phonepe") return { label: "📱 PhonePe",      cls: "mo-pay-online" };
    return { label: "💳 Online Payment", cls: "mo-pay-online" };
};

const MyOrders = () => {
    const router = useIonRouter();

    const [orders, setOrders]           = useState<Order[]>([]);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState<string | null>(null);
    const [activeTab, setActiveTab]     = useState("All");
    const [expandedId, setExpandedId]   = useState<number | null>(null);

    const [cancelOrderId, setCancelOrderId] = useState<number | null>(null);
    const [cancelReason, setCancelReason]   = useState("");
    const [cancelLoading, setCancelLoading] = useState(false);
    const [cancelError, setCancelError]     = useState<string | null>(null);
    const [cancelSuccess, setCancelSuccess] = useState(false);

    const [token, setToken]               = useState<string | null>(null);
    const [authChecked, setAuthChecked]   = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const t = await getToken();
            const u = await getUser();
            if (!t || !u) { router.push("/login", "forward", "push"); return; }
            setToken(t);
            setAuthChecked(true);
        };
        checkAuth();
    }, []);

    useEffect(() => {
        const params  = new URLSearchParams(window.location.search);
        const status  = params.get("status");
        const orderId = params.get("order_id");
        if (status || orderId) window.history.replaceState({}, "", window.location.pathname);
    }, []);

    const fetchOrders = async () => {
        const t = token || await getToken();
        if (!t) { router.push("/login", "forward", "push"); return; }
        setLoading(true);
        setError(null);
        try {
            const res  = await fetch(`${BASE_URL}/orders`, {
                headers: { "Accept": "application/json", "Authorization": `Bearer ${t}` },
            });
            const json = await res.json();
            console.log("order details:", json);
            if (json.success) {
                setOrders(json.data ?? []);
            } else {
                setError(json.message || "Failed to load orders.");
            }
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (authChecked) fetchOrders(); }, [authChecked]);

    // ✅ FIX: filter uses normalizeStatus so "Delivered" and "delivered" both match
    const filtered = orders.filter(o => {
        const s = normalizeStatus(o.status);
        if (activeTab === "All")       return true;
        if (activeTab === "Active")    return ["on_the_way", "processing", "pending", "confirmed"].includes(s);
        if (activeTab === "Delivered") return s === "delivered";
        if (activeTab === "Cancelled") return s === "cancelled" || s === "failed";
        return true;
    });

    const reorder = (order: Order) => {
        const cartItems = (order.items || []).map(i => ({
            id: i.product_id, name: i.name, price: i.price, img: i.image, qty: i.qty,
        }));
        localStorage.setItem("cart", JSON.stringify(cartItems));
        window.dispatchEvent(new Event("focus"));
        router.push("/cart", "forward", "push");
    };

    const handleTrack = (orderId: number) => router.push(`/order-tracking/${orderId}`, "forward", "push");

    const openCancel = (orderId: number) => {
        setCancelOrderId(orderId); setCancelReason("");
        setCancelError(null); setCancelSuccess(false);
    };

    const closeCancel = () => {
        if (cancelLoading) return;
        setCancelOrderId(null); setCancelReason("");
        setCancelError(null); setCancelSuccess(false);
    };

    const submitCancel = async () => {
        if (!cancelReason) { setCancelError("Please select a reason."); return; }
        const t = token || await getToken();
        if (!t) { setCancelError("Session expired. Please login again."); return; }
        setCancelLoading(true); setCancelError(null);
        try {
            const res  = await fetch(`${BASE_URL}/orders/${cancelOrderId}/cancel`, {
                method: "POST",
                headers: {
                    "Accept": "application/json", "Content-Type": "application/json",
                    "Authorization": `Bearer ${t}`,
                },
                body: JSON.stringify({ reason: cancelReason }),
            });
            const json = await res.json();
            if (json.success) {
                setOrders(prev => prev.map(o => o.id === cancelOrderId ? { ...o, status: "cancelled" } : o));
                setCancelSuccess(true);
                setTimeout(closeCancel, 1800);
            } else {
                setCancelError(json.message || "Could not cancel order.");
            }
        } catch {
            setCancelError("Network error. Please try again.");
        } finally {
            setCancelLoading(false);
        }
    };

    return (
        <IonPage>
            <IonContent fullscreen>
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
                    * { box-sizing:border-box; margin:0; padding:0; }
                    .mo-root { font-family:'DM Sans',sans-serif; background:#FFFBEB; min-height:100vh; }

                    .mo-header { position:sticky; top:0; z-index:100; background:#FFFBEB; border-bottom:1px solid #F0E8C0; padding:14px 16px 12px; display:flex; align-items:center; gap:12px; }
                    .mo-back-btn { width:38px; height:38px; border-radius:12px; background:#F5EFE0; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
                    .mo-header-title { font-size:19px; font-weight:800; color:#1A1714; }
                    .mo-header-sub { font-size:11px; color:#9B8E84; margin-top:1px; }

                    .mo-tabs { display:flex; gap:8px; overflow-x:auto; padding:12px 16px; scrollbar-width:none; background:#FFFBEB; border-bottom:1px solid #F0E8C0; }
                    .mo-tabs::-webkit-scrollbar { display:none; }
                    .mo-tab { flex-shrink:0; padding:7px 16px; border-radius:20px; font-size:13px; font-weight:600; font-family:'DM Sans',sans-serif; cursor:pointer; border:1.5px solid transparent; transition:all .18s; }
                    .mo-tab-active { background:#1A1714; color:white; border-color:#1A1714; }
                    .mo-tab-inactive { background:white; color:#9B8E84; border-color:#EAE5DF; }

                    .mo-auth-loading { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:80px 32px; gap:12px; }
                    .mo-auth-spinner { width:36px; height:36px; border:3px solid #F0E8C0; border-top-color:#E07B00; border-radius:50%; animation:spin .8s linear infinite; }
                    @keyframes spin { to { transform:rotate(360deg); } }
                    .mo-auth-text { font-size:13px; color:#9B8E84; font-weight:500; }

                    .sk { background:linear-gradient(90deg,#eee 25%,#f5f5f5 50%,#eee 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:10px; }
                    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

                    .mo-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:60px 32px; text-align:center; }
                    .mo-empty-icon { font-size:56px; margin-bottom:16px; }
                    .mo-empty-title { font-size:18px; font-weight:700; color:#1A1714; margin-bottom:8px; }
                    .mo-empty-sub { font-size:13px; color:#9B8E84; line-height:1.5; }

                    .mo-error { margin:16px; padding:14px; background:#FEF2F2; border:1px solid #FECACA; border-radius:12px; font-size:13px; color:#DC2626; text-align:center; }

                    .mo-card { background:white; margin:12px 16px 0; border-radius:20px; overflow:hidden; border:1px solid #EAE5DF; box-shadow:0 2px 8px rgba(0,0,0,0.04); }

                    .mo-card-header { padding:14px 16px 12px; border-bottom:1px solid #F5F2EC; display:flex; align-items:flex-start; justify-content:space-between; gap:8px; }
                    .mo-card-id { font-size:11px; color:#9B8E84; font-weight:600; margin-bottom:3px; letter-spacing:.02em; }
                    .mo-card-store { font-size:15px; font-weight:700; color:#1A1714; }
                    .mo-card-date { font-size:11px; color:#B8A878; margin-top:3px; }
                    .mo-card-meta { font-size:11px; color:#9B8E84; margin-top:4px; }
                    .mo-status-pill { display:inline-flex; align-items:center; gap:5px; padding:6px 12px; border-radius:20px; font-size:12px; font-weight:700; flex-shrink:0; white-space:nowrap; }

                    .mo-track-bar { padding:14px 16px; background:#F9F6F0; border-bottom:1px solid #F0E8C0; }
                    .mo-track-title { font-size:10px; font-weight:700; color:#9B8E84; text-transform:uppercase; letter-spacing:.08em; margin-bottom:14px; }
                    .mo-track-steps { display:flex; align-items:flex-start; position:relative; }
                    .mo-track-step { display:flex; flex-direction:column; align-items:center; flex:1; position:relative; }
                    .mo-track-connector { position:absolute; top:12px; left:50%; right:-50%; height:2px; z-index:0; }
                    .mo-track-connector-done { background:#1A1714; }
                    .mo-track-connector-pending { background:#EAE5DF; }
                    .mo-track-dot { width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; z-index:1; position:relative; flex-shrink:0; }
                    .mo-track-dot-done    { background:#1A1714; color:white; }
                    .mo-track-dot-active  { background:#E07B00; color:white; box-shadow:0 0 0 4px rgba(224,123,0,0.18); }
                    .mo-track-dot-pending { background:#EAE5DF; color:#9B8E84; }
                    .mo-track-label { font-size:9px; color:#9B8E84; margin-top:6px; text-align:center; font-weight:600; text-transform:uppercase; letter-spacing:.04em; line-height:1.2; }
                    .mo-track-label-active { color:#E07B00; }
                    .mo-track-label-done { color:#1A1714; }

                    .mo-card-body { padding:12px 16px; }
                    .mo-item-row { display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid #F9F6F0; }
                    .mo-item-row:last-of-type { border-bottom:none; }
                    .mo-item-img { width:42px; height:42px; object-fit:cover; border-radius:8px; background:#F5F2EC; flex-shrink:0; }
                    .mo-item-img-placeholder { width:42px; height:42px; border-radius:8px; background:#F5F2EC; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:18px; }
                    .mo-item-name  { font-size:13px; color:#1A1714; font-weight:600; line-height:1.3; }
                    .mo-item-meta  { font-size:11px; color:#9B8E84; margin-top:2px; }
                    .mo-item-price { font-size:13px; font-weight:700; color:#1A1714; flex-shrink:0; margin-left:auto; }
                    .mo-more-row { display:flex; align-items:center; gap:4px; padding:6px 0 2px; cursor:pointer; font-size:12px; color:#E07B00; font-weight:700; }

                    .mo-card-footer { padding:12px 16px; border-top:1px solid #F5F2EC; display:flex; align-items:center; justify-content:space-between; gap:8px; }
                    .mo-total-label { font-size:11px; color:#9B8E84; font-weight:500; }
                    .mo-total-val { font-size:20px; font-weight:800; color:#1A1714; line-height:1.2; }
                    .mo-total-sub { font-size:10px; color:#B8A878; margin-top:1px; }
                    .mo-action-btns { display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end; }
                    .mo-btn-secondary { padding:9px 14px; border-radius:10px; background:#F5EFE0; color:#1A1714; border:none; font-size:12px; font-weight:700; font-family:'DM Sans',sans-serif; cursor:pointer; }
                    .mo-btn-primary   { padding:9px 14px; border-radius:10px; background:#1A1714; color:white; border:none; font-size:12px; font-weight:700; font-family:'DM Sans',sans-serif; cursor:pointer; }
                    .mo-btn-danger    { padding:9px 14px; border-radius:10px; background:#FEF2F2; color:#DC2626; border:1.5px solid #FECACA; font-size:12px; font-weight:700; font-family:'DM Sans',sans-serif; cursor:pointer; }
                    .mo-btn-track     { padding:9px 16px; border-radius:10px; background:#0284C7; color:white; border:none; font-size:12px; font-weight:700; font-family:'DM Sans',sans-serif; cursor:pointer; display:inline-flex; align-items:center; gap:5px; box-shadow:0 2px 8px rgba(2,132,199,0.28); transition:opacity .15s; }
                    .mo-btn-track:active { opacity:0.82; }

                    .mo-pay-badge  { display:inline-flex; align-items:center; gap:4px; font-size:10px; font-weight:700; padding:3px 8px; border-radius:8px; }
                    .mo-pay-cod    { background:#FFF3CD; color:#856404; }
                    .mo-pay-online { background:#D1FAE5; color:#065F46; }

                    .cs-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.45); z-index:500; display:flex; align-items:flex-end; }
                    .cs-sheet { background:white; border-radius:24px 24px 0 0; width:100%; padding:0 0 36px; animation:slideUp .28s ease; }
                    @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
                    .cs-handle { width:36px; height:4px; background:#EAE5DF; border-radius:2px; margin:12px auto 0; }
                    .cs-header { display:flex; align-items:center; justify-content:space-between; padding:16px 20px 12px; border-bottom:1px solid #F5F2EC; }
                    .cs-title { font-size:16px; font-weight:800; color:#1A1714; }
                    .cs-close { width:32px; height:32px; border-radius:10px; background:#F5EFE0; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; }
                    .cs-order-info { margin:14px 20px; padding:12px 14px; background:#FFF8EE; border-radius:12px; border:1px solid #F0E8C0; font-size:13px; color:#7A6A50; }
                    .cs-order-info strong { color:#1A1714; }
                    .cs-reason-title { padding:0 20px; font-size:11px; font-weight:700; color:#9B8E84; text-transform:uppercase; letter-spacing:.06em; margin-bottom:8px; }
                    .cs-reasons { padding:0 20px; display:flex; flex-direction:column; gap:8px; max-height:240px; overflow-y:auto; }
                    .cs-reason-opt { display:flex; align-items:center; gap:10px; padding:11px 14px; border-radius:12px; border:1.5px solid #EAE5DF; cursor:pointer; transition:all .15s; font-size:14px; color:#1A1714; font-weight:500; background:white; }
                    .cs-reason-opt.selected { border-color:#1A1714; background:#F5EFE0; }
                    .cs-radio { width:18px; height:18px; border-radius:50%; border:2px solid #D0C8BE; flex-shrink:0; display:flex; align-items:center; justify-content:center; transition:all .15s; }
                    .cs-radio.checked { border-color:#1A1714; background:#1A1714; }
                    .cs-radio-dot { width:7px; height:7px; border-radius:50%; background:white; }
                    .cs-err { margin:10px 20px 0; font-size:12px; color:#DC2626; }
                    .cs-actions { padding:16px 20px 0; display:flex; gap:10px; }
                    .cs-btn-keep    { flex:1; padding:14px; border-radius:14px; background:#F5EFE0; color:#1A1714; border:none; font-size:14px; font-weight:700; font-family:'DM Sans',sans-serif; cursor:pointer; }
                    .cs-btn-confirm { flex:1; padding:14px; border-radius:14px; background:#DC2626; color:white; border:none; font-size:14px; font-weight:700; font-family:'DM Sans',sans-serif; cursor:pointer; transition:opacity .15s; }
                    .cs-btn-confirm:disabled { opacity:.6; cursor:not-allowed; }
                    .cs-success { display:flex; flex-direction:column; align-items:center; padding:40px 20px; text-align:center; gap:10px; }
                    .cs-success-icon { font-size:54px; }
                    .cs-success-title { font-size:17px; font-weight:800; color:#1A1714; }
                    .cs-success-sub { font-size:13px; color:#9B8E84; }
                    .mo-pb { height:80px; }
                `}</style>

                <div className="mo-root">

                    {/* ── Header ── */}
                    <div className="mo-header">
                        <button className="mo-back-btn" onClick={() => router.goBack()}>
                            <IonIcon icon={arrowBackOutline} style={{ fontSize: 20, color: "#1A1714" }} />
                        </button>
                        <div>
                            <div className="mo-header-title">My Orders</div>
                            <div className="mo-header-sub">{orders.length} total orders</div>
                        </div>
                    </div>

                    {/* ── Tabs ── */}
                    <div className="mo-tabs">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                className={`mo-tab ${activeTab === tab ? "mo-tab-active" : "mo-tab-inactive"}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Auth loading */}
                    {!authChecked && (
                        <div className="mo-auth-loading">
                            <div className="mo-auth-spinner" />
                            <div className="mo-auth-text">Checking session…</div>
                        </div>
                    )}

                    {/* Loading skeleton */}
                    {authChecked && loading && (
                        <div style={{ padding: 16 }}>
                            {[1, 2].map(i => (
                                <div key={i} style={{ marginBottom: 12 }}>
                                    <div className="sk" style={{ height: 90, marginBottom: 8, borderRadius: 20 }} />
                                    <div className="sk" style={{ height: 70, borderRadius: 20 }} />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Error */}
                    {authChecked && !loading && error && (
                        <div className="mo-error">
                            ⚠️ {error}<br />
                            <span style={{ color: "#E07B00", cursor: "pointer", fontWeight: 700 }} onClick={fetchOrders}>
                                Retry
                            </span>
                        </div>
                    )}

                    {/* Empty state */}
                    {authChecked && !loading && !error && filtered.length === 0 && (
                        <div className="mo-empty">
                            <div className="mo-empty-icon">📦</div>
                            <div className="mo-empty-title">No orders here</div>
                            <div className="mo-empty-sub">
                                You don't have any {activeTab !== "All" ? activeTab.toLowerCase() : ""} orders yet.
                            </div>
                        </div>
                    )}

                    {/* ── Order cards ── */}
                    {authChecked && !loading && !error && filtered.map(order => {

                        // ✅ FIX: normalize to lowercase — handles "Delivered", "Processing" etc
                        const ns = normalizeStatus(order.status);

                        const cfg          = statusConfig[ns] ?? statusConfig["processing"];
                        const isExpanded   = expandedId === order.id;
                        const items        = order.items || [];
                        const visibleItems = isExpanded ? items : items.slice(0, 2);
                        const hasMore      = items.length > 2;

                        // ✅ FIX: all comparisons use normalized status
                        const canCancel = ["pending", "confirmed", "processing"].includes(ns);
                        const showTrack  = ["pending", "processing", "on_the_way", "confirmed"].includes(ns);
                        const canReorder = ns === "delivered";
                        const progress   = trackProgress[ns] ?? 1;

                        // ✅ FIX: use total_amount first
                        const orderTotal = getOrderTotal(order);

                        // ✅ FIX: use payment_method field from backend
                        const payInfo    = getPaymentLabel(order);

                        return (
                            <div key={order.id} className="mo-card">

                                {/* Card header */}
                                <div className="mo-card-header">
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div className="mo-card-id">ORDER #{order.id}</div>
                                        <div className="mo-card-store">{order.billing_name || order.customer_name || "Your Order"}</div>
                                        <div className="mo-card-date">🕒 {order.date || order.created_at}</div>
                                        <div className="mo-card-meta">
                                            <span className={`mo-pay-badge ${payInfo.cls}`}>
                                                {payInfo.label}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mo-status-pill" style={{ background: cfg.bg, color: cfg.color }}>
                                        <span>{cfg.icon}</span>{cfg.label}
                                    </div>
                                </div>

                                {/* Progress tracker */}
                                {showTrack && (
                                    <div className="mo-track-bar">
                                        <div className="mo-track-title">Live Tracking</div>
                                        <div className="mo-track-steps">
                                            {trackSteps.map((step, idx) => {
                                                const isDone   = idx < progress - 1;
                                                const isActive = idx === progress - 1;
                                                return (
                                                    <div key={step} className="mo-track-step">
                                                        {idx < trackSteps.length - 1 && (
                                                            <div className={`mo-track-connector ${isDone ? "mo-track-connector-done" : "mo-track-connector-pending"}`} />
                                                        )}
                                                        <div className={`mo-track-dot ${isDone ? "mo-track-dot-done" : isActive ? "mo-track-dot-active" : "mo-track-dot-pending"}`}>
                                                            {isDone ? "✓" : idx + 1}
                                                        </div>
                                                        <div className={`mo-track-label ${isDone ? "mo-track-label-done" : isActive ? "mo-track-label-active" : ""}`}>
                                                            {step}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Items */}
                                <div className="mo-card-body">
                                    {items.length === 0 ? (
                                        <div style={{ padding: "10px 0", fontSize: 13, color: "#9B8E84", textAlign: "center" }}>
                                            No items found
                                        </div>
                                    ) : (
                                        <>
                                            {visibleItems.map((item, i) => (
                                                <div key={i} className="mo-item-row">
                                                    {item.image
                                                        ? <img src={item.image} alt={item.name} className="mo-item-img"
                                                            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                                        : <div className="mo-item-img-placeholder">🍽️</div>
                                                    }
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div className="mo-item-name">{item.name}</div>
                                                        <div className="mo-item-meta">Qty: {item.qty}&nbsp;·&nbsp;₹{item.price}/each</div>
                                                    </div>
                                                    <div className="mo-item-price">₹{(item.price * item.qty).toFixed(0)}</div>
                                                </div>
                                            ))}
                                            {hasMore && (
                                                <div className="mo-more-row" onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                                                    <IonIcon
                                                        icon={chevronForwardOutline}
                                                        style={{ fontSize: 14, transform: isExpanded ? "rotate(90deg)" : "none", transition: "0.2s" }}
                                                    />
                                                    {isExpanded ? "Show less" : `+${items.length - 2} more item${items.length - 2 > 1 ? "s" : ""}`}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="mo-card-footer">
                                    <div>
                                        <div className="mo-total-label">Order Total</div>
                                        {/* ✅ FIX: total_amount se — kabhi ₹— nahi dikhega */}
                                        <div className="mo-total-val">
                                            {orderTotal > 0 ? `₹${orderTotal.toFixed(0)}` : "₹—"}
                                        </div>
                                        <div className="mo-total-sub">Incl. delivery & charges</div>
                                    </div>

                                    <div className="mo-action-btns">
                                        {canReorder && (
                                            <>
                                                <button className="mo-btn-secondary">
                                                    <IonIcon icon={receiptOutline} style={{ fontSize: 13, verticalAlign: "middle", marginRight: 4 }} />
                                                    Invoice
                                                </button>
                                                <button className="mo-btn-primary" onClick={() => reorder(order)}>
                                                    <IonIcon icon={refreshOutline} style={{ fontSize: 13, verticalAlign: "middle", marginRight: 4 }} />
                                                    Reorder
                                                </button>
                                            </>
                                        )}
                                        {["pending", "processing", "on_the_way", "confirmed"].includes(ns) && (
    <button className="mo-btn-track" onClick={() => handleTrack(order.id)}>
        🛵 Track Order
    </button>
)}
                                        {canCancel && (
                                            <button className="mo-btn-danger" onClick={() => openCancel(order.id)}>
                                                ✕ Cancel
                                            </button>
                                        )}
                                        {(ns === "cancelled" || ns === "failed") && (
                                            <button className="mo-btn-secondary">View Details</button>
                                        )}
                                    </div>
                                </div>

                            </div>
                        );
                    })}

                    <div className="mo-pb" />
                </div>

                {/* ── Cancel Bottom Sheet ── */}
                {cancelOrderId !== null && (
                    <div className="cs-backdrop" onClick={e => { if (e.target === e.currentTarget) closeCancel(); }}>
                        <div className="cs-sheet">
                            <div className="cs-handle" />
                            {cancelSuccess ? (
                                <div className="cs-success">
                                    <div className="cs-success-icon">✅</div>
                                    <div className="cs-success-title">Order Cancelled</div>
                                    <div className="cs-success-sub">Order #{cancelOrderId} cancelled successfully.</div>
                                </div>
                            ) : (
                                <>
                                    <div className="cs-header">
                                        <div className="cs-title">Cancel Order</div>
                                        <button className="cs-close" onClick={closeCancel}>
                                            <IonIcon icon={closeOutline} style={{ fontSize: 18, color: "#1A1714" }} />
                                        </button>
                                    </div>
                                    <div className="cs-order-info">
                                        <IonIcon icon={alertCircleOutline} style={{ fontSize: 14, verticalAlign: "middle", marginRight: 6, color: "#E07B00" }} />
                                        Cancelling <strong>Order #{cancelOrderId}</strong> — this cannot be undone.
                                    </div>
                                    <div className="cs-reason-title" style={{ marginTop: 4 }}>Select a reason</div>
                                    <div className="cs-reasons">
                                        {CANCEL_REASONS.map(r => (
                                            <div
                                                key={r}
                                                className={`cs-reason-opt ${cancelReason === r ? "selected" : ""}`}
                                                onClick={() => { setCancelReason(r); setCancelError(null); }}
                                            >
                                                <div className={`cs-radio ${cancelReason === r ? "checked" : ""}`}>
                                                    {cancelReason === r && <div className="cs-radio-dot" />}
                                                </div>
                                                {r}
                                            </div>
                                        ))}
                                    </div>
                                    {cancelError && <div className="cs-err">⚠️ {cancelError}</div>}
                                    <div className="cs-actions">
                                        <button className="cs-btn-keep" onClick={closeCancel}>Keep Order</button>
                                        <button className="cs-btn-confirm" disabled={cancelLoading} onClick={submitCancel}>
                                            {cancelLoading ? "Cancelling…" : "Yes, Cancel"}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

            </IonContent>
        </IonPage>
    );
};

export default MyOrders;