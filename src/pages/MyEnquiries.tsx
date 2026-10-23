import { IonPage, IonContent, IonIcon } from "@ionic/react";
import {
  arrowBackOutline,
  chatbubbleEllipsesOutline,
  timeOutline,
  checkmarkDoneOutline,
  sendOutline,
} from "ionicons/icons";
import { useIonRouter } from "@ionic/react";
import { useState, useEffect } from "react";

const BASE = "https://shriecom.in/appapis/shreefood/public/api";

interface ReplyRow {
  id: number;
  sender_type: "customer" | "admin";
  message: string;
  created_at: string;
}

interface EnquiryRow {
  id: number;
  message: string;
  status?: string;
  admin_reply?: string | null; // legacy, kept for older records
  replies?: ReplyRow[];
  product?: { id: number; name: string } | null;
  created_at: string;
}

const timeAgo = (dateStr?: string): string => {
  if (!dateStr) return "";
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
    return `${Math.floor(hrs / 24)} day${Math.floor(hrs / 24) > 1 ? "s" : ""} ago`;
  } catch {
    return "";
  }
};

const statusColors = (status?: string) => {
  switch (status) {
    case "responded":
      return { color: "#16A34A", bg: "#F0FDF4" };
    case "closed":
      return { color: "#6B7280", bg: "#F3F4F6" };
    default:
      return { color: "#D97706", bg: "#FFFBEB" }; // pending
  }
};

const getToken = (): string | null => {
  let token = localStorage.getItem("auth_token");
  if (token && token.startsWith('"')) {
    try {
      token = JSON.parse(token);
    } catch {
      /* ignore */
    }
  }
  return token;
};

const MyEnquiries: React.FC = () => {
  const router = useIonRouter();
  const [enquiries, setEnquiries] = useState<EnquiryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // per-enquiry reply box state
  const [replyText, setReplyText] = useState<Record<number, string>>({});
  const [sending, setSending] = useState<Record<number, boolean>>({});
  const [replyError, setReplyError] = useState<Record<number, string>>({});

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();

      const res = await fetch(`${BASE}/enquiries`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setError(json?.message || "Could not load your enquiries.");
        return;
      }

      const rows: EnquiryRow[] = Array.isArray(json) ? json : json?.data ?? [];
      setEnquiries(rows);
    } catch {
      setError("Could not load your enquiries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSendReply = async (enquiryId: number) => {
    const message = (replyText[enquiryId] || "").trim();
    if (!message) return;

    setSending((s) => ({ ...s, [enquiryId]: true }));
    setReplyError((s) => ({ ...s, [enquiryId]: "" }));

    try {
      const token = getToken();
      const res = await fetch(`${BASE}/enquiries/${enquiryId}/reply`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        setReplyError((s) => ({ ...s, [enquiryId]: json?.message || "Could not send reply." }));
        return;
      }

      // Replace that enquiry in state with the fresh version (includes the new reply + updated status)
      const updated: EnquiryRow = json.data;
      setEnquiries((prev) => prev.map((en) => (en.id === enquiryId ? updated : en)));
      setReplyText((s) => ({ ...s, [enquiryId]: "" }));
    } catch {
      setReplyError((s) => ({ ...s, [enquiryId]: "Could not send reply. Check your connection." }));
    } finally {
      setSending((s) => ({ ...s, [enquiryId]: false }));
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen style={{ "--background": "#F7F5F2" } as React.CSSProperties}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg,#1A1714,#2D2520)", padding: "52px 20px 24px", position: "relative" }}>
          <button
            onClick={() => router.goBack()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(255,255,255,0.12)",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              marginBottom: 14,
            }}
          >
            <IonIcon icon={arrowBackOutline} style={{ fontSize: 18, color: "#fff" }} />
          </button>

          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#fff" }}>My Enquiries</h1>

          <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "rgba(255,255,255,0.55)" }}>
            Track the questions you've sent us
          </p>
        </div>

        <div style={{ padding: "18px 16px 60px", fontFamily: "'Nunito',sans-serif" }}>
          {loading && (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#9B8E84", fontSize: 13 }}>Loading…</div>
          )}

          {!loading && error && (
            <div style={{ background: "#FEF2F2", borderRadius: 14, padding: 20, textAlign: "center" }}>
              <p style={{ color: "#DC2626", fontWeight: 700, margin: 0, fontSize: 13.5 }}>{error}</p>
            </div>
          )}

          {!loading && !error && enquiries.length === 0 && (
            <div style={{ textAlign: "center", padding: "70px 20px" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
              <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#1A1714" }}>No enquiries yet</p>
              <p style={{ margin: 0, fontSize: 12.5, color: "#9B8E84" }}>
                Questions you send from a product page will show up here
              </p>
            </div>
          )}

          {!loading &&
            !error &&
            enquiries.map((e) => {
              const sc = statusColors(e.status);

              // Build a unified thread: legacy single admin_reply (if no
              // threaded replies exist yet) + the actual replies array.
              const thread: ReplyRow[] =
                e.replies && e.replies.length > 0
                  ? e.replies
                  : e.admin_reply
                  ? [
                      {
                        id: -1,
                        sender_type: "admin",
                        message: e.admin_reply,
                        created_at: e.created_at,
                      },
                    ]
                  : [];

              const isClosed = e.status === "closed";

              return (
                <div
                  key={e.id}
                  style={{
                    background: "#fff",
                    borderRadius: 14,
                    padding: 14,
                    marginBottom: 10,
                    border: "1px solid #EAE5DF",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  }}
                >
                  {/* ── Customer's original message ── */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        flexShrink: 0,
                        background: "#FFF3E0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IonIcon icon={chatbubbleEllipsesOutline} style={{ fontSize: 17, color: "#E07B00" }} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {e.product && (
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#E07B00", marginBottom: 3 }}>
                          Re: {e.product.name}
                        </div>
                      )}

                      <p style={{ margin: 0, fontSize: 13.5, color: "#1A1714", lineHeight: 1.5 }}>{e.message}</p>

                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                        <IonIcon icon={timeOutline} style={{ fontSize: 12, color: "#9B8E84" }} />
                        <span style={{ fontSize: 11, color: "#9B8E84" }}>{timeAgo(e.created_at)}</span>

                        {e.status && (
                          <span
                            style={{
                              marginLeft: "auto",
                              fontSize: 10,
                              fontWeight: 700,
                              textTransform: "uppercase",
                              color: sc.color,
                              background: sc.bg,
                              padding: "2px 8px",
                              borderRadius: 99,
                            }}
                          >
                            {e.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── Conversation thread ── */}
                  {thread.length > 0 && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px dashed #EAE5DF" }}>
                      {thread.map((r) => {
                        const isAdmin = r.sender_type === "admin";
                        return (
                          <div
                            key={r.id}
                            style={{
                              display: "flex",
                              justifyContent: isAdmin ? "flex-start" : "flex-end",
                              marginBottom: 8,
                            }}
                          >
                            <div style={{ maxWidth: "85%" }}>
                              <div
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: isAdmin ? "#16A34A" : "#9B8E84",
                                  marginBottom: 3,
                                  textAlign: isAdmin ? "left" : "right",
                                }}
                              >
                                {isAdmin ? "Shri Bazar" : "You"}
                              </div>
                              <div
                                style={{
                                  background: isAdmin ? "#F0FDF4" : "#FFF3E0",
                                  color: "#1A1714",
                                  borderRadius: 12,
                                  padding: "8px 12px",
                                  fontSize: 13.5,
                                  lineHeight: 1.5,
                                }}
                              >
                                {r.message}
                              </div>
                              {r.created_at && (
                                <div
                                  style={{
                                    fontSize: 10,
                                    color: "#9B8E84",
                                    marginTop: 2,
                                    textAlign: isAdmin ? "left" : "right",
                                  }}
                                >
                                  {timeAgo(r.created_at)}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {thread.length === 0 && (
                    <div
                      style={{
                        marginTop: 10,
                        paddingTop: 10,
                        borderTop: "1px dashed #EAE5DF",
                        fontSize: 12,
                        color: "#9B8E84",
                        fontStyle: "italic",
                      }}
                    >
                      Waiting for a reply…
                    </div>
                  )}

                  {/* ── Reply box — send a follow-up message ── */}
                  {!isClosed && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px dashed #EAE5DF" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                        <textarea
                          value={replyText[e.id] || ""}
                          onChange={(ev) =>
                            setReplyText((s) => ({ ...s, [e.id]: ev.target.value }))
                          }
                          placeholder="Type a reply..."
                          rows={1}
                          style={{
                            flex: 1,
                            resize: "none",
                            border: "1px solid #EAE5DF",
                            borderRadius: 10,
                            padding: "8px 10px",
                            fontSize: 13,
                            fontFamily: "'Nunito',sans-serif",
                            outline: "none",
                          }}
                        />
                        <button
                          onClick={() => handleSendReply(e.id)}
                          disabled={!!sending[e.id] || !(replyText[e.id] || "").trim()}
                          style={{
                            width: 36,
                            height: 36,
                            flexShrink: 0,
                            borderRadius: 10,
                            border: "none",
                            background: sending[e.id] ? "#EAE5DF" : "#E07B00",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: sending[e.id] ? "default" : "pointer",
                          }}
                        >
                          <IonIcon icon={sendOutline} style={{ fontSize: 16, color: "#fff" }} />
                        </button>
                      </div>
                      {replyError[e.id] && (
                        <p style={{ color: "#DC2626", fontSize: 11, margin: "6px 0 0" }}>
                          {replyError[e.id]}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default MyEnquiries;