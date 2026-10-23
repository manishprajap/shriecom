import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  IonPage, IonContent, IonHeader, IonToolbar, IonTitle,
  IonButtons, IonBackButton, IonButton, IonIcon,
  IonCard, IonCardContent, IonAvatar, IonLabel,
} from "@ionic/react";
import { useParams } from "react-router-dom";
import { callOutline, chatbubbleOutline, timeOutline } from "ionicons/icons";
import "./OrderTracking.css";

import { getToken } from "../hooks/useAuth";

const BASE_URL = "https://shriecom.in/appapis/shreefood/public/api";

interface RouteParams { id: string; }

interface RiderInfo {
  name: string;
  phone: string;
  rating: string | number;
  deliveries: number;
  avatar?: string | null;
}

interface RiderLocation {
  lat: number;
  lng: number;
  bearing?: number | null;
  updated_at?: string | null;
  distance_km?: number | null;
  eta_minutes?: number | null;
}

interface DeliveryLocation {
  lat: number | null;
  lng: number | null;
  address: string | null;
  has_gps: boolean;
}

interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

interface TrackingData {
  success: boolean;
  dstatus: string;
  status_title: string;
  status_sub: string;
  active_step: number;
  location_active: boolean;
  rider_location: RiderLocation | null;
  delivery_location: DeliveryLocation;
  rider: RiderInfo | null;
  picked_at: string | null;
  delivered_at: string | null;
  items: OrderItem[];
  amount: number;
}

// ── Leaflet loader ─────────────────────────────────────────
const loadLeaflet = (): Promise<any> =>
  new Promise((resolve, reject) => {
    if ((window as any).L) { resolve((window as any).L); return; }
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css"; link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => resolve((window as any).L);
    script.onerror = () => reject(new Error("Leaflet failed to load"));
    document.head.appendChild(script);
  });

const makeSvgIcon = (L: any, emoji: string, size = 36) =>
  L.divIcon({
    html: `<div style="font-size:${size * 0.6}px;width:${size}px;height:${size}px;
      display:flex;align-items:center;justify-content:center;background:white;
      border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.25);border:2px solid #fff;">
      ${emoji}</div>`,
    className: "", iconSize: [size, size], iconAnchor: [size / 2, size / 2],
  });

// ── Progress Steps ─────────────────────────────────────────
const STATUS_STEPS = [
  { label: "Order Placed", icon: "📋" },
  { label: "Confirmed",    icon: "✅" },
  { label: "Preparing",    icon: "👨‍🍳" },
  { label: "On the Way",   icon: "🛵" },
  { label: "Delivered",    icon: "🏠" },
];

// ── Helper: normalize status string ───────────────────────
const normalize = (s: string) => (s ?? "").toLowerCase().trim();

// ── All known "picked" variants from API ──────────────────
const PICKED_STATUSES = new Set([
  "picked",
  "pick up",
  "pickup",
  "picked_up",
  "pickedup",
  "pick-up",
]);

// ── All known "on the way" variants ───────────────────────
const ON_THE_WAY_STATUSES = new Set([
  "on_the_way",
  "on the way",
  "ontheway",
  "on-the-way",
  "out for delivery",
  "out_for_delivery",
]);

// ── All known "assigned/accepted" variants ────────────────
const ASSIGNED_STATUSES = new Set([
  "assigned",
  "accepted",
]);

const getCurrentStep = (status: string) => {
  switch (status?.toLowerCase()) {
    case "assigned":
      return 0; // Order Placed
    case "confirmed":
      return 1;
    case "preparing":
      return 2;
    case "on_the_way":
    case "ontheway":
      return 3;
    case "delivered":
      return 4;
    default:
      return 0;
  }
};

// ── Status → title/subtitle messages ────────────────────────
const STATUS_MESSAGES: Record<string, { title: string; sub: string; step: number }> = {
  new:             { title: "Order Received",          sub: "We've received your order!",                          step: 0 },
  "new confirmed": { title: "Order Confirmed",         sub: "Your order has been confirmed by the store.",         step: 1 },
  confirmed:       { title: "Order Confirmed",         sub: "Your order has been confirmed.",                      step: 1 },
  pending:         { title: "Order Placed",            sub: "Your order has been received.",                       step: 0 },
  processing:      { title: "Being Prepared 👨‍🍳",      sub: "The store is preparing your order.",                  step: 2 },
  assigned:        { title: "Rider Assigned! 🛵",      sub: "A delivery partner has been assigned to your order.", step: 2 },
  accepted:        { title: "Rider Accepted",          sub: "Delivery partner accepted your order.",               step: 2 },
  picked:          { title: "Order Picked Up 📦",      sub: "Your order is on the way.",                          step: 3 },
  "pick up":       { title: "Order Picked Up 📦",      sub: "Your order is on the way.",                          step: 3 },
  pickup:          { title: "Order Picked Up 📦",      sub: "Your order is on the way.",                          step: 3 },
  picked_up:       { title: "Order Picked Up 📦",      sub: "Your order is on the way.",                          step: 3 },
  pickedup:        { title: "Order Picked Up 📦",      sub: "Your order is on the way.",                          step: 3 },
  "pick-up":       { title: "Order Picked Up 📦",      sub: "Your order is on the way.",                          step: 3 },
  on_the_way:      { title: "On the Way! 🛵",          sub: "Your order is out for delivery.",                     step: 3 },
  delivered:       { title: "Delivered! 🎉",           sub: "Your order has been delivered successfully.",         step: 4 },
  cancelled:       { title: "Order Cancelled",         sub: "This order has been cancelled.",                      step: 0 },
};

const DEFAULT_RESTAURANT = { lat: 26.8553, lng: 80.9452 };

// ─────────────────────────────────────────────────────────────────────────────
const OrderTracking: React.FC = () => {
  const { id: orderId } = useParams<RouteParams>();

  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  const [token, setToken]           = useState<string | null>(null);
  const [tokenReady, setTokenReady] = useState(false);

  const mapRef      = useRef<HTMLDivElement>(null);
  const mapObj      = useRef<any>(null);
  const riderMarker = useRef<any>(null);
  const pollRef     = useRef<any>(null);

  // ── Load token ─────────────────────────────────────────────
  useEffect(() => {
    getToken().then((t) => {
      setToken(t ?? null);
      setTokenReady(true);
    });
  }, []);

  // ── Fetch tracking data ────────────────────────────────────
  const fetchTracking = useCallback(() => {
    if (!token) {
      setError("Session expired. Please login again.");
      setLoading(false);
      return;
    }

    fetch(`${BASE_URL}/orders/${orderId}/location`, {
      headers: {
        "Accept":        "application/json",
        "Authorization": `Bearer ${token}`,
      },
    })
      .then((r) => {
        const ct = r.headers.get("content-type");
        if (!ct?.includes("application/json")) {
          throw new Error("Session expired. Please login again.");
        }
        return r.json();
      })
      .then((json: TrackingData) => {
        if (json.success) {
          console.log("DEBUG dstatus raw:", JSON.stringify(json.dstatus));
          setTracking(json);
        } else {
          setError("Failed to load tracking data.");
        }
      })
      .catch((err) => setError(err.message ?? "Network error."))
      .finally(() => setLoading(false));
  }, [orderId, token]);

  // ── Start polling after token is ready ─────────────────────
  useEffect(() => {
    if (!tokenReady) return;
    fetchTracking();
    pollRef.current = setInterval(fetchTracking, 15000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchTracking, tokenReady]);

  // ── Stop polling when delivered/cancelled ─────────────────
  useEffect(() => {
    const s = normalize(tracking?.dstatus ?? "");
    if (s === "delivered" || s === "cancelled") {
      if (pollRef.current) clearInterval(pollRef.current);
    }
  }, [tracking?.dstatus]);

  // ── Init map ───────────────────────────────────────────────
  useEffect(() => {
    if (!tracking || mapObj.current) return;

    const destLat  = tracking.delivery_location?.lat ?? 26.8450;
    const destLng  = tracking.delivery_location?.lng ?? 80.9652;
    const riderLat = tracking.rider_location?.lat ?? DEFAULT_RESTAURANT.lat;
    const riderLng = tracking.rider_location?.lng ?? DEFAULT_RESTAURANT.lng;

    loadLeaflet()
      .then((L: any) => {
        if (!mapRef.current || mapObj.current) return;
        delete (L.Icon.Default.prototype as any)._getIconUrl;

        const map = L.map(mapRef.current, {
          center: [DEFAULT_RESTAURANT.lat, DEFAULT_RESTAURANT.lng],
          zoom: 14, zoomControl: false, attributionControl: false,
        });
        mapObj.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);

        L.marker([DEFAULT_RESTAURANT.lat, DEFAULT_RESTAURANT.lng], { icon: makeSvgIcon(L, "🍽️", 40) })
          .addTo(map).bindPopup("<b>Restaurant</b>").openPopup();

        L.marker([destLat, destLng], { icon: makeSvgIcon(L, "🏠", 40) })
          .addTo(map).bindPopup(`<b>${tracking.delivery_location?.address ?? "Your Location"}</b>`);

        L.polyline(
          [[DEFAULT_RESTAURANT.lat, DEFAULT_RESTAURANT.lng], [destLat, destLng]],
          { color: "#E53935", weight: 4, opacity: 0.85, dashArray: "10, 8" }
        ).addTo(map);

        riderMarker.current = L.marker(
          [riderLat, riderLng],
          { icon: makeSvgIcon(L, "🛵", 44) }
        ).addTo(map).bindPopup(`<b>${tracking.rider?.name ?? "Delivery Partner"}</b>`);

        map.fitBounds(
          [[DEFAULT_RESTAURANT.lat, DEFAULT_RESTAURANT.lng], [destLat, destLng]],
          { padding: [40, 40] }
        );
      })
      .catch(() => setMapError("Map failed to load. Check your internet connection."));

    return () => {
      if (mapObj.current) { mapObj.current.remove(); mapObj.current = null; }
    };
  }, [tracking]);

  // ── Move rider marker on poll update ──────────────────────
  useEffect(() => {
    if (!tracking?.rider_location || !riderMarker.current || !mapObj.current) return;
    const { lat, lng } = tracking.rider_location;
    riderMarker.current.setLatLng([lat, lng]);
    mapObj.current.panTo([lat, lng], { animate: true, duration: 1.2 });
  }, [tracking?.rider_location?.lat, tracking?.rider_location?.lng]);

  // ── Compute msgInfo ────────────────────────────────────────
  const ns = normalize(tracking?.dstatus ?? "");

  const msgInfo = (() => {
    if (ASSIGNED_STATUSES.has(ns)) {
      return { title: "Rider Assigned! 🛵", sub: "A delivery partner has been assigned to your order.", step: 2 };
    }

    if (PICKED_STATUSES.has(ns)) {
      return { title: "Order Picked Up 📦", sub: "Your order is on the way.", step: 3 };
    }

    if (ON_THE_WAY_STATUSES.has(ns)) {
      return { title: "On the Way! 🛵", sub: "Your order is out for delivery.", step: 3 };
    }

    return (
      STATUS_MESSAGES[ns] ?? {
        title: tracking?.status_title ?? "Order Placed",
        sub:   tracking?.status_sub   ?? "Your order has been received.",
        step:  tracking?.active_step  ?? 0,
      }
    );
  })();

  const eta         = tracking?.rider_location?.eta_minutes ?? null;
  const isDelivered = normalize(tracking?.dstatus ?? "") === "delivered";

  // ── Loading ────────────────────────────────────────────────
  if (loading || !tokenReady) return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar color="danger">
          <IonButtons slot="start"><IonBackButton defaultHref="/my-orders" color="light" /></IonButtons>
          <IonTitle color="light">Track Order #{orderId}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div style={{ padding: 20, textAlign: "center", marginTop: 60 }}>
          <div style={{ fontSize: 48 }}>🛵</div>
          <p style={{ marginTop: 16, color: "#9B8E84", fontSize: 15 }}>Loading order details…</p>
        </div>
      </IonContent>
    </IonPage>
  );

  // ── Error ──────────────────────────────────────────────────
  if (error || !tracking) return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar color="danger">
          <IonButtons slot="start"><IonBackButton defaultHref="/my-orders" color="light" /></IonButtons>
          <IonTitle color="light">Track Order</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div style={{ padding: 20, textAlign: "center", marginTop: 60 }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <p style={{ marginTop: 16, color: "#DC2626", fontSize: 14 }}>{error ?? "Order not found."}</p>
        </div>
      </IonContent>
    </IonPage>
  );

  // ── Main render ────────────────────────────────────────────
  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar color="danger">
          <IonButtons slot="start"><IonBackButton defaultHref="/my-orders" color="light" /></IonButtons>
          <IonTitle color="light">
            Track Order <span style={{ fontSize: 12, opacity: 0.75 }}>#{orderId}</span>
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>

        {/* ── Map ── */}
        <div className="ot-map-wrapper">
          {mapError ? (
            <div className="ot-map-error">
              <span style={{ fontSize: 32 }}>🗺️</span>
              <p>{mapError}</p>
            </div>
          ) : (
            <div ref={mapRef} className="ot-map" />
          )}
          <div className="ot-eta-badge">
            <IonIcon icon={timeOutline} className="ot-eta-icon" />
            <span className="ot-eta-time">
              {isDelivered ? "Delivered!" : eta !== null ? `${eta} min` : "—"}
            </span>
            {!isDelivered && eta !== null && (
              <span className="ot-eta-label">away</span>
            )}
          </div>
        </div>

        {/* ── Bottom Sheet ── */}
        <div className="ot-sheet">
          <div className="ot-sheet-handle" />

          {/* ── Status Banner ── */}
          <div className="ot-status-banner">
            <div
              className="ot-status-icon-wrap"
              style={{
                background: isDelivered
                  ? "#D1FAE5"
                  : PICKED_STATUSES.has(ns) || ON_THE_WAY_STATUSES.has(ns)
                  ? "#E0F2FE"
                  : "#FFF3E0",
              }}
            >
              <span className="ot-status-icon">
                {isDelivered
                  ? "🎉"
                  : PICKED_STATUSES.has(ns) || ON_THE_WAY_STATUSES.has(ns)
                  ? "🛵"
                  : "🍳"}
              </span>
              <div
                className="ot-status-ring"
                style={{
                  borderColor: isDelivered
                    ? "#10B981"
                    : PICKED_STATUSES.has(ns) || ON_THE_WAY_STATUSES.has(ns)
                    ? "#3B82F6"
                    : "#F59E0B",
                }}
              />
            </div>
            <div className="ot-status-text">
              <p className="ot-status-title">{msgInfo.title}</p>
              <p className="ot-status-sub">{msgInfo.sub}</p>
            </div>
            {tracking.rider?.phone && (
              <IonButton fill="clear" className="ot-call-fab"
                onClick={() => window.open(`tel:${tracking.rider!.phone}`)}>
                <IonIcon icon={callOutline} color="success" slot="icon-only" />
              </IonButton>
            )}
          </div>

          {/* ── Stepper ── */}
          <div className="ot-stepper">
            {STATUS_STEPS.map((step, i) => {
              const state = i < msgInfo.step ? "done" : i === msgInfo.step ? "active" : "pending";
              return (
                <React.Fragment key={i}>
                  <div className="ot-step-item">
                    <div className={`ot-step-dot dot-${state}`}>
                      {state === "done"
                        ? <span className="dot-check">✓</span>
                        : <span className="dot-icon">{step.icon}</span>
                      }
                      {state === "active" && <div className="dot-pulse" />}
                    </div>
                    <span className={`ot-step-label label-${state}`}>{step.label}</span>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`ot-step-line ${state === "done" ? "line-done" : ""}`}>
                      {state === "done" && <div className="line-fill" />}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* ── Rider Card ── */}
          <IonCard className="ot-rider-card">
            <IonCardContent className="ot-rider-content">
              <IonAvatar className="ot-avatar">
                <div className="ot-avatar-inner">
                  {(tracking.rider?.name ?? "D")[0].toUpperCase()}
                </div>
              </IonAvatar>
              <div className="ot-rider-info">
                <IonLabel>
                  <h3 className="ot-rider-name">
                    {tracking.rider?.name ?? "Not Assigned Yet"}
                  </h3>
                  <p className="ot-rider-meta">
                    ⭐ {tracking.rider?.rating ?? "4.8"}
                    &nbsp;·&nbsp;
                    {tracking.rider?.deliveries
                      ? `${tracking.rider.deliveries} deliveries`
                      : "—"}
                  </p>
                </IonLabel>
              </div>
              <div className="ot-rider-actions">
                {tracking.rider?.phone && (
                  <IonButton
                    fill="outline" size="small" color="medium"
                    className="ot-action-btn"
                    onClick={() => window.open(`tel:${tracking.rider!.phone}`)}
                  >
                    <IonIcon icon={callOutline} slot="icon-only" />
                  </IonButton>
                )}
                <IonButton fill="outline" size="small" color="medium" className="ot-action-btn">
                  <IonIcon icon={chatbubbleOutline} slot="icon-only" />
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>

          {/* ── Order Items ── */}
          <IonCard className="ot-order-card">
            <IonCardContent>
              {tracking.items && tracking.items.length > 0
                ? tracking.items.map((item, i) => (
                    <div key={i} className="ot-order-row">
                      <span className="ot-order-item">{item.qty}× {item.name}</span>
                      <span className="ot-order-price">₹{(item.price * item.qty).toFixed(0)}</span>
                    </div>
                  ))
                : (
                  <div style={{ color: "#9B8E84", fontSize: 13, textAlign: "center", padding: "8px 0" }}>
                    No items found
                  </div>
                )
              }
              <div className="ot-order-row ot-order-total">
                <span>Total paid</span>
                <span className="ot-total-val">₹{(tracking.amount ?? 0).toFixed(0)}</span>
              </div>
            </IonCardContent>
          </IonCard>

        </div>{/* ot-sheet */}
      </IonContent>
    </IonPage>
  );
};

export default OrderTracking;