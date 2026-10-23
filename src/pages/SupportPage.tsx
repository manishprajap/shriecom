import { IonPage, IonContent, IonIcon } from "@ionic/react";
import {
  arrowBackOutline, callOutline, mailOutline, chatbubbleOutline,
  chevronDownOutline, chevronUpOutline, sendOutline, closeOutline, copyOutline,
} from "ionicons/icons";
import { useState, useRef, useEffect } from "react";
import { useHistory } from "react-router";

const SupportPage: React.FC = () => {
  const history = useHistory();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // ── Chat state ──────────────────────────────────────────────────────────────
  const [showChat, setShowChat] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [chatLog, setChatLog] = useState<{ from: "user" | "bot"; text: string; time: string }[]>([
    { from: "bot", text: "👋 Hi! I'm the ShreeFood support assistant. How can I help you today?", time: getNow() },
  ]);
  const [botTyping, setBotTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── Email modal state ───────────────────────────────────────────────────────
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [copied, setCopied] = useState(false);

  function getNow() {
    return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLog, botTyping]);

  const autoReply = (msg: string): string => {
    const lower = msg.toLowerCase();
    if (lower.includes("delivery") || lower.includes("deliver") || lower.includes("time"))
      return "⚡ We deliver in fast on average! Our dark stores are strategically placed near you.";
    if (lower.includes("cancel"))
      return "❌ Orders can be cancelled within 60 seconds of placing. After that, cancellation depends on the delivery stage.";
    if (lower.includes("refund") || lower.includes("money"))
      return "💰 Refunds are processed within 2 hours back to your original payment method. Please raise a complaint through the app.";
    if (lower.includes("wrong") || lower.includes("missing") || lower.includes("issue"))
      return "😔 We're sorry about that! Please raise a complaint via the app — we'll re-deliver or issue a full refund within 2 hours.";
    if (lower.includes("payment") || lower.includes("pay") || lower.includes("upi"))
      return "💳 We accept UPI, credit/debit cards, net banking, and cash on delivery in select areas.";
    if (lower.includes("fresh") || lower.includes("quality") || lower.includes("expir"))
      return "🌿 All products are sourced fresh daily from local farms and suppliers. All perishables carry a freshness guarantee!";
    if (lower.includes("minimum") || lower.includes("free delivery") || lower.includes("499"))
      return "🛒 Minimum order is ₹49. Orders above ₹499 get free delivery!";
    if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey"))
      return "Hello! 😊 How can I assist you today? Ask me about delivery, orders, payments, or anything else!";
    if (lower.includes("thank"))
      return "You're welcome! 🙏 Is there anything else I can help you with?";
    return "Thanks for your message! Our team will follow up on this. For urgent help, please call us at +91 8604650538 or email shrient.99@gmail.com 🙏";
  };

  const sendChat = () => {
    const msg = chatMsg.trim();
    if (!msg) return;
    setChatLog((prev) => [...prev, { from: "user" as const, text: msg, time: getNow() }]);
    setChatMsg("");
    setBotTyping(true);
    setTimeout(() => {
      setBotTyping(false);
      setChatLog((prev) => [...prev, { from: "bot", text: autoReply(msg), time: getNow() }]);
    }, 900);
  };

  // ── Call ────────────────────────────────────────────────────────────────────
  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open("tel:+918604650538", "_self");
  };

  // ── Email ───────────────────────────────────────────────────────────────────
  const handleEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEmailModal(true);
    setCopied(false);
  };

  const EMAIL     = "shrient.99@gmail.com";
  const SUBJECT   = encodeURIComponent("Support Request – ShreeFood");
  const BODY      = encodeURIComponent(
    "Hello Shri Enterprises Support Team,\n\nI need help with the following:\n\n[Please describe your issue here]\n\nThank you."
  );

  const handleGmail = () => {
    window.open(
      `https://mail.google.com/mail/?view=cm&to=${EMAIL}&su=${SUBJECT}&body=${BODY}`,
      "_blank"
    );
    setShowEmailModal(false);
  };

  const handleOutlook = () => {
    window.open(
      `https://outlook.live.com/mail/0/deeplink/compose?to=${EMAIL}&subject=${SUBJECT}&body=${BODY}`,
      "_blank"
    );
    setShowEmailModal(false);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(EMAIL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const faqs = [
    { q: "How fast is the delivery?",         a: "We are strategically located in areas that allow us to strive for the fastest possible delivery to your locality." },
    { q: "What if my order is wrong?",         a: "We apologize! You can register a complaint directly through the app." },
    { q: "Can I cancel my order?",             a: "Yes, an order can be cancelled within 60 seconds of placing it. After that, cancellation depends on the current stage of the delivery process." },
    { q: "What payment methods are accepted?", a: "We accept UPI, credit/debit cards, net banking, and cash on delivery in select areas." },
    { q: "Is there a minimum order amount?",   a: "The minimum order value must be ₹49." },
  ];

  const channels = [
    { icon: chatbubbleOutline, label: "Live Chat",      color: "#0C831F", bg: "#DCFCE7", action: "Chat Now",  onClick: (e: React.MouseEvent) => { e.stopPropagation(); setShowChat(true); } },
    { icon: callOutline,       label: "Call Us",   sub: "+91 8604650538",       color: "#2563EB", bg: "#DBEAFE", action: "Call Now",  onClick: handleCall },
    { icon: mailOutline,       label: "Email Us",  sub: EMAIL,                  color: "#E07B00", bg: "#FEF3C7", action: "Send Mail", onClick: handleEmail },
  ];

  return (
    <IonPage>
      <IonContent fullscreen>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
          * { box-sizing:border-box; margin:0; padding:0; font-family:'Nunito',sans-serif; }
          :root { --amber:#E07B00; --charcoal:#1A1714; --muted:#9B8E84; --bg:#FFFBEB; --border:#EAE5DF; }
          @keyframes fadeIn  { from{opacity:0;transform:translateY(8px)}  to{opacity:1;transform:translateY(0)} }
          @keyframes slideUp { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
          @keyframes blink   { 0%,80%,100%{opacity:0} 40%{opacity:1} }

          .sp-root    { background:var(--bg); min-height:100vh; padding-bottom:40px; }
          .sp-header  { position:sticky; top:0; z-index:100; background:#FFFBEB; border-bottom:1px solid #F0E8C0; padding:12px 16px; display:flex; align-items:center; gap:12px; }
          .sp-back    { width:38px; height:38px; border-radius:12px; background:white; border:1.5px solid #E8DFC0; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; }
          .sp-header h2 { font-size:17px; font-weight:900; color:var(--charcoal); }

          .sp-hero   { background:linear-gradient(135deg,#E07B00,#B45309); padding:28px 20px; text-align:center; }
          .sp-hero h1 { font-size:22px; font-weight:900; color:white; }
          .sp-hero p  { font-size:12px; color:rgba(255,255,255,0.75); margin-top:6px; font-weight:600; }

          .sp-section { padding:22px 16px; }
          .sp-title   { font-size:15px; font-weight:900; color:var(--charcoal); margin-bottom:14px; }

          .sp-channels { display:flex; flex-direction:column; gap:10px; margin-bottom:8px; }
          .sp-channel  { display:flex; align-items:center; gap:14px; background:white; border-radius:16px; padding:14px; border:1px solid var(--border); box-shadow:0 2px 8px rgba(0,0,0,0.04); }
          .sp-ch-icon  { width:46px; height:46px; border-radius:14px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
          .sp-ch-body  { flex:1; }
          .sp-ch-label { font-size:14px; font-weight:800; color:var(--charcoal); }
          .sp-ch-sub   { font-size:11px; color:var(--muted); font-weight:600; margin-top:1px; }
          .sp-ch-btn   { flex-shrink:0; padding:7px 14px; border-radius:10px; border:none; font-size:12px; font-weight:800; cursor:pointer; font-family:'Nunito',sans-serif; transition:opacity 0.15s; }
          .sp-ch-btn:active { opacity:0.75; }

          .sp-faq-list { display:flex; flex-direction:column; gap:8px; animation:fadeIn 0.4s ease; }
          .sp-faq-item { background:white; border-radius:14px; border:1px solid var(--border); overflow:hidden; }
          .sp-faq-q    { display:flex; align-items:center; justify-content:space-between; padding:14px; cursor:pointer; gap:10px; }
          .sp-faq-q span { font-size:13px; font-weight:700; color:var(--charcoal); flex:1; line-height:1.4; }
          .sp-faq-a    { padding:10px 14px 14px; font-size:13px; color:#5C4A2A; line-height:1.7; font-weight:600; border-top:1px solid #F5EDD0; }

          /* ── Shared overlay ── */
          .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.45); z-index:200; display:flex; align-items:flex-end; justify-content:center; }

          /* ── Email choice sheet ── */
          .email-sheet       { width:100%; max-width:480px; background:#fff; border-radius:24px 24px 0 0; padding:20px 16px 36px; display:flex; flex-direction:column; gap:12px; animation:slideUp 0.3s ease; }
          .email-sheet-title { font-size:13px; font-weight:700; color:var(--muted); text-align:center; letter-spacing:0.5px; text-transform:uppercase; margin-bottom:4px; }
          .email-to-row      { display:flex; align-items:center; justify-content:center; gap:6px; background:#FFFBEB; border:1.5px solid #F0E8C0; border-radius:12px; padding:10px 14px; }
          .email-to-row span { font-size:13px; font-weight:700; color:var(--charcoal); flex:1; text-align:center; }

          /* mail-app option button */
          .email-opt-btn {
            display:flex; align-items:center; gap:14px;
            background:#FAFAF8; border:1.5px solid var(--border);
            border-radius:16px; padding:14px 16px;
            cursor:pointer; transition:background 0.15s;
            width:100%;
          }
          .email-opt-btn:active { background:#F0EBE0; }
          .email-opt-icon {
            width:42px; height:42px; border-radius:12px;
            display:flex; align-items:center; justify-content:center;
            font-size:22px; flex-shrink:0;
          }
          .email-opt-label { font-size:14px; font-weight:800; color:var(--charcoal); }
          .email-opt-sub   { font-size:11px; color:var(--muted); font-weight:600; margin-top:2px; }

          /* copy row */
          .email-copy-row  { display:flex; align-items:center; justify-content:space-between; background:#FFFBEB; border:1.5px solid #F0E8C0; border-radius:12px; padding:12px 14px; }
          .email-copy-row span { font-size:13px; font-weight:700; color:var(--charcoal); }
          .email-copy-btn  { display:flex; align-items:center; gap:5px; padding:6px 14px; border-radius:8px; border:none; background:#FEF3C7; color:#E07B00; font-size:12px; font-weight:800; cursor:pointer; font-family:'Nunito',sans-serif; flex-shrink:0; }
          .email-copied    { font-size:12px; color:#0C831F; font-weight:700; text-align:center; }

          .email-cancel-btn { width:100%; padding:13px; border-radius:14px; border:1.5px solid var(--border); background:#fff; font-size:14px; font-weight:800; color:var(--muted); cursor:pointer; font-family:'Nunito',sans-serif; margin-top:4px; }

          /* ── Chat modal ── */
          .chat-modal   { width:100%; max-width:480px; height:72vh; background:#fff; border-radius:24px 24px 0 0; display:flex; flex-direction:column; animation:slideUp 0.3s ease; overflow:hidden; }
          .chat-head    { padding:14px 16px; border-bottom:1px solid #F0E8C0; display:flex; align-items:center; gap:10px; background:#fff; flex-shrink:0; }
          .chat-avatar  { width:38px; height:38px; border-radius:50%; background:linear-gradient(135deg,#E07B00,#B45309); display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }
          .chat-head-info { flex:1; }
          .chat-head-info strong { font-size:14px; font-weight:900; color:#1A1714; display:block; }
          .chat-head-info span   { font-size:11px; color:#0C831F; font-weight:700; }
          .chat-close   { width:32px; height:32px; border-radius:10px; border:1.5px solid #EAE5DF; background:#FAFAFA; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; }

          .chat-messages { flex:1; overflow-y:auto; padding:14px 14px 6px; display:flex; flex-direction:column; gap:10px; background:#FFFBEB; }
          .chat-bubble   { max-width:80%; padding:10px 13px; border-radius:16px; font-size:13px; font-weight:600; line-height:1.5; animation:fadeIn 0.25s ease; }
          .chat-bubble.bot  { background:white; border:1px solid #EAE5DF; color:#1A1714; border-bottom-left-radius:4px; align-self:flex-start; }
          .chat-bubble.user { background:linear-gradient(135deg,#E07B00,#B45309); color:white; border-bottom-right-radius:4px; align-self:flex-end; }
          .chat-time   { font-size:10px; margin-top:4px; font-weight:700; opacity:0.55; }
          .chat-time.bot  { text-align:left; }
          .chat-time.user { text-align:right; }

          .chat-typing span { display:inline-block; width:7px; height:7px; border-radius:50%; background:#aaa; margin:0 2px; animation:blink 1.2s infinite; }
          .chat-typing span:nth-child(2) { animation-delay:0.2s; }
          .chat-typing span:nth-child(3) { animation-delay:0.4s; }

          .chat-input-row { padding:10px 12px; border-top:1px solid #F0E8C0; display:flex; gap:8px; background:#fff; flex-shrink:0; }
          .chat-input     { flex:1; border:1.5px solid #EAE5DF; border-radius:22px; padding:10px 14px; font-size:13px; font-family:'Nunito',sans-serif; font-weight:600; outline:none; color:#1A1714; background:#FAFAF8; }
          .chat-input:focus { border-color:#E07B00; }
          .chat-send      { width:42px; height:42px; border-radius:50%; border:none; background:linear-gradient(135deg,#E07B00,#B45309); display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; transition:opacity 0.15s; }
          .chat-send:active { opacity:0.8; }
        `}</style>

        <div className="sp-root">
          {/* Header */}
          <div className="sp-header">
            <div className="sp-back" onClick={() => history.goBack()}>
              <IonIcon icon={arrowBackOutline} style={{ fontSize: 20, color: "#1A1714" }} />
            </div>
            <h2>Help & Support</h2>
          </div>

          {/* Hero */}
          <div className="sp-hero">
            <h1> How can we help?</h1>
          </div>

          {/* Channels */}
          <div className="sp-section">
            <div className="sp-title">📞 Contact Us</div>
            <div className="sp-channels">
              {channels.map((c) => (
                <div key={c.label} className="sp-channel">
                  <div className="sp-ch-icon" style={{ background: c.bg }}>
                    <IonIcon icon={c.icon} style={{ fontSize: 22, color: c.color }} />
                  </div>
                  <div className="sp-ch-body">
                    <div className="sp-ch-label">{c.label}</div>
                    <div className="sp-ch-sub">{c.sub}</div>
                  </div>
                  <button
                    className="sp-ch-btn"
                    style={{ background: c.bg, color: c.color }}
                    onClick={c.onClick}
                  >
                    {c.action}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* FAQs */}
          <div className="sp-section" style={{ paddingTop: 0 }}>
            <div className="sp-title">❓ Frequently Asked Questions</div>
            <div className="sp-faq-list">
              {faqs.map((faq, i) => (
                <div key={i} className="sp-faq-item">
                  <div className="sp-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <span>{faq.q}</span>
                    <IonIcon icon={openFaq === i ? chevronUpOutline : chevronDownOutline} style={{ fontSize: 16, color: "#9B8E84", flexShrink: 0 }} />
                  </div>
                  {openFaq === i && <div className="sp-faq-a">{faq.a}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Email Choice Sheet ─────────────────────────────────────────────── */}
        {showEmailModal && (
          <div className="modal-overlay" onClick={() => setShowEmailModal(false)}>
            <div className="email-sheet" onClick={(e) => e.stopPropagation()}>

              <div className="email-sheet-title">Send an email to</div>

              {/* To address */}
              <div className="email-to-row">
                <span>{EMAIL}</span>
              </div>

              {/* Gmail */}
              <button className="email-opt-btn" onClick={handleGmail}>
                <div className="email-opt-icon" style={{ background: "#FEE8E6" }}>
                  <svg viewBox="0 0 48 48" width="24" height="24">
                    <path fill="#EA4335" d="M6 8h36l-18 14z"/>
                    <path fill="#FBBC05" d="M6 8 6 40l10-10V18z"/>
                    <path fill="#34A853" d="M42 8v32l-10-10V18z"/>
                    <path fill="#4285F4" d="M6 40h36l-10-10H16z"/>
                    <path fill="#C5221F" d="M6 8l10 10 8-6 8 6 10-10z"/>
                  </svg>
                </div>
                <div>
                  <div className="email-opt-label">Gmail</div>
                  <div className="email-opt-sub">Open in Gmail (browser)</div>
                </div>
              </button>

              {/* Outlook */}
              <button className="email-opt-btn" onClick={handleOutlook}>
                <div className="email-opt-icon" style={{ background: "#E8F0FE" }}>
                  <svg viewBox="0 0 48 48" width="24" height="24">
                    <rect width="48" height="48" rx="6" fill="#0078D4"/>
                    <rect x="6" y="14" width="20" height="20" rx="10" fill="#fff"/>
                    <text x="11" y="30" fontSize="14" fontWeight="bold" fill="#0078D4">O</text>
                    <rect x="26" y="16" width="16" height="2" fill="#fff"/>
                    <rect x="26" y="21" width="16" height="2" fill="#fff"/>
                    <rect x="26" y="26" width="12" height="2" fill="#fff"/>
                  </svg>
                </div>
                <div>
                  <div className="email-opt-label">Outlook</div>
                  <div className="email-opt-sub">Open in Outlook (browser)</div>
                </div>
              </button>

              {/* Copy email */}
              <div className="email-copy-row">
                <span>{EMAIL}</span>
                <button className="email-copy-btn" onClick={handleCopyEmail}>
                  <IonIcon icon={copyOutline} style={{ fontSize: 13 }} />
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              {copied && <div className="email-copied">✅ Email address copied to clipboard!</div>}

              {/* Cancel */}
              <button className="email-cancel-btn" onClick={() => setShowEmailModal(false)}>
                Cancel
              </button>

            </div>
          </div>
        )}

        {/* ── Live Chat Modal ────────────────────────────────────────────────── */}
        {showChat && (
          <div className="modal-overlay" onClick={() => setShowChat(false)}>
            <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
              <div className="chat-head">
                <div className="chat-avatar">🛍️</div>
                <div className="chat-head-info">
                  <strong>ShreeFood Support</strong>
                  <span>● Online now</span>
                </div>
                <div className="chat-close" onClick={() => setShowChat(false)}>
                  <IonIcon icon={closeOutline} style={{ fontSize: 18, color: "#555" }} />
                </div>
              </div>

              <div className="chat-messages">
                {chatLog.map((msg, i) => (
                  <div key={i}>
                    <div className={`chat-bubble ${msg.from}`}>{msg.text}</div>
                    <div className={`chat-time ${msg.from}`}>{msg.time}</div>
                  </div>
                ))}
                {botTyping && (
                  <div>
                    <div className="chat-bubble bot">
                      <div className="chat-typing"><span /><span /><span /></div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="chat-input-row">
                <input
                  className="chat-input"
                  placeholder="Type your message…"
                  value={chatMsg}
                  onChange={(e) => setChatMsg(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") sendChat(); }}
                />
                <button className="chat-send" onClick={sendChat}>
                  <IonIcon icon={sendOutline} style={{ fontSize: 18, color: "#fff" }} />
                </button>
              </div>
            </div>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default SupportPage;