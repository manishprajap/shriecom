import {
  IonPage,
  IonContent,
  IonIcon,
} from "@ionic/react";
import {
  arrowBackOutline,
  copyOutline,
  shareOutline,
  addOutline,
  giftOutline,
  checkmarkOutline,
  mailOutline,
  personOutline,
  cardOutline,
} from "ionicons/icons";
import { useState } from "react";
import { useHistory } from "react-router";

interface GiftCard {
  id: number;
  code: string;
  amount: number;
  balance: number;
  theme: { bg: string; accent: string; emoji: string; name: string };
  from: string;
  message: string;
  expiryDate: string;
  status: "active" | "used" | "expired";
}

const themes = [
  { bg: "linear-gradient(135deg,#E07B00,#B45309)", accent: "#FEF3C7", emoji: "🛒", name: "Grocery Delight" },
  { bg: "linear-gradient(135deg,#16A34A,#15803D)", accent: "#DCFCE7", emoji: "🌿", name: "Fresh Green"    },
  { bg: "linear-gradient(135deg,#2563EB,#1D4ED8)", accent: "#DBEAFE", emoji: "💧", name: "Ocean Blue"     },
  { bg: "linear-gradient(135deg,#9333EA,#7E22CE)", accent: "#F3E8FF", emoji: "✨", name: "Purple Magic"   },
  { bg: "linear-gradient(135deg,#DB2777,#BE185D)", accent: "#FCE7F3", emoji: "🌸", name: "Blossom Pink"   },
  { bg: "linear-gradient(135deg,#1A1714,#2D2520)", accent: "#F5F3F0", emoji: "🖤", name: "Midnight"       },
];

const myGiftCards: GiftCard[] = [
  {
    id: 1,
    code: "FOOD-XMAS-7K92",
    amount: 500,
    balance: 320,
    theme: themes[0],
    from: "Rohit Sharma",
    message: "Happy Birthday! Enjoy your groceries 🎂",
    expiryDate: "31 Dec 2025",
    status: "active",
  },
  {
    id: 2,
    code: "FOOD-GIFT-3M41",
    amount: 1000,
    balance: 1000,
    theme: themes[2],
    from: "Priya Singh",
    message: "Congratulations on your promotion! 🎉",
    expiryDate: "30 Sep 2025",
    status: "active",
  },
  {
    id: 3,
    code: "FOOD-USED-9P77",
    amount: 200,
    balance: 0,
    theme: themes[1],
    from: "Self Purchase",
    message: "",
    expiryDate: "10 Jul 2025",
    status: "used",
  },
];

const GiftCardPage: React.FC = () => {
  const history = useHistory();
  const [activeTab, setActiveTab] = useState<"my" | "buy" | "redeem">("my");
  const [selectedTheme, setSelectedTheme] = useState(0);
  const [giftAmount, setGiftAmount] = useState("500");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [redeemCode, setRedeemCode] = useState("");
  const [copied, setCopied] = useState<number | null>(null);

  const handleCopy = (id: number, code: string) => {
    navigator.clipboard?.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          .gc-root { font-family: 'DM Sans', sans-serif; background: #FFFBEB; min-height: 100vh; }

          .gc-header {
            position: sticky; top: 0; z-index: 100;
            background: #FFFBEB; border-bottom: 1px solid #F0E8C0;
            padding: 14px 16px; display: flex; align-items: center; gap: 12px;
          }
          .gc-back-btn { width: 38px; height: 38px; border-radius: 12px; background: white; border: 1.5px solid #EAE5DF; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
          .gc-header-title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; color: #1A1714; }

          /* Tabs */
          .gc-tabs { display: flex; gap: 0; padding: 14px 16px; }
          .gc-tab {
            flex: 1; padding: 10px; border: 1.5px solid #EAE5DF;
            background: white; font-size: 12px; font-weight: 600; color: #9B8E84;
            cursor: pointer; text-align: center; font-family: 'DM Sans', sans-serif;
            transition: all 0.18s;
          }
          .gc-tab:first-child { border-radius: 12px 0 0 12px; }
          .gc-tab:last-child  { border-radius: 0 12px 12px 0; }
          .gc-tab + .gc-tab   { border-left: none; }
          .gc-tab.active      { background: #1A1714; border-color: #1A1714; color: white; }

          /* ── My Gift Cards ── */
          .gc-list { display: flex; flex-direction: column; gap: 16px; padding: 0 16px; }

          /* Visual gift card */
          .gc-visual { border-radius: 20px; padding: 20px; position: relative; overflow: hidden; margin-bottom: 0; }
          .gc-visual::before { content: ''; position: absolute; top: -30px; right: -30px; width: 120px; height: 120px; border-radius: 50%; background: rgba(255,255,255,0.1); }
          .gc-visual::after  { content: ''; position: absolute; bottom: -20px; left: 20px; width: 80px; height: 80px; border-radius: 50%; background: rgba(255,255,255,0.07); }
          .gc-visual-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; position: relative; z-index: 1; }
          .gc-brand { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 800; color: white; opacity: 0.9; }
          .gc-theme-emoji { font-size: 22px; }
          .gc-visual-amount { font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 800; color: white; position: relative; z-index: 1; margin-bottom: 4px; }
          .gc-visual-balance { font-size: 12px; color: rgba(255,255,255,0.65); position: relative; z-index: 1; }
          .gc-visual-code { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.9); letter-spacing: 0.12em; background: rgba(255,255,255,0.15); border-radius: 8px; padding: 5px 10px; display: inline-block; margin-top: 12px; position: relative; z-index: 1; }
          .gc-expiry { font-size: 10px; color: rgba(255,255,255,0.5); margin-top: 6px; position: relative; z-index: 1; }

          /* Card body */
          .gc-card-body { background: white; border: 1px solid #EAE5DF; border-radius: 20px; overflow: hidden; }
          .gc-card-wrap { border-radius: 20px; overflow: hidden; border: 1px solid #EAE5DF; }
          
          .gc-from-msg { padding: 12px 14px; border-bottom: 1px solid #F5F3F0; }
          .gc-from { font-size: 11px; color: #9B8E84; margin-bottom: 3px; }
          .gc-from span { font-weight: 600; color: #1A1714; }
          .gc-message { font-size: 12px; color: #1A1714; font-style: italic; }

          /* Progress bar */
          .gc-progress-wrap { padding: 12px 14px; border-bottom: 1px solid #F5F3F0; }
          .gc-progress-labels { display: flex; justify-content: space-between; margin-bottom: 6px; }
          .gc-progress-lbl { font-size: 10px; color: #9B8E84; font-weight: 500; }
          .gc-progress-lbl span { font-weight: 700; color: #1A1714; }
          .gc-progress-bar { height: 6px; background: #EAE5DF; border-radius: 99px; overflow: hidden; }
          .gc-progress-fill { height: 100%; background: linear-gradient(90deg, #E07B00, #F59E0B); border-radius: 99px; }

          /* Status badge */
          .gc-status { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 8px; font-size: 10px; font-weight: 700; }
          .gc-status.active  { background: #DCFCE7; color: #16A34A; }
          .gc-status.used    { background: #F5F3F0; color: #9B8E84; }
          .gc-status.expired { background: #FEE2E2; color: #DC2626; }

          /* Actions */
          .gc-actions { display: flex; border-top: 1px solid #F5F3F0; }
          .gc-action-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px; padding: 11px; background: none; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600; color: #9B8E84; transition: background 0.15s; }
          .gc-action-btn + .gc-action-btn { border-left: 1px solid #F5F3F0; }
          .gc-action-btn.primary { color: #E07B00; }
          .gc-action-btn:hover { background: #FAFAF8; }

          /* ── Buy Tab ── */
          .gc-buy-section { padding: 0 16px; }
          .gc-field-label { font-size: 12px; font-weight: 600; color: #1A1714; margin-bottom: 8px; margin-top: 16px; }
          .gc-input {
            width: 100%; padding: 13px 14px; border-radius: 14px;
            border: 1.5px solid #EAE5DF; font-size: 14px; font-weight: 500;
            color: #1A1714; font-family: 'DM Sans', sans-serif; outline: none;
            background: white; transition: border-color 0.18s;
          }
          .gc-input:focus { border-color: #E07B00; }
          .gc-textarea { resize: none; height: 80px; }
          .gc-amount-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
          .gc-amount-opt {
            padding: 11px; border-radius: 12px; border: 1.5px solid #EAE5DF;
            background: white; font-size: 13px; font-weight: 700; color: #1A1714;
            cursor: pointer; text-align: center; font-family: 'Syne', sans-serif;
            transition: all 0.18s;
          }
          .gc-amount-opt.sel { background: #1A1714; border-color: #1A1714; color: white; }

          /* Theme picker */
          .gc-theme-scroll { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; padding-bottom: 4px; }
          .gc-theme-scroll::-webkit-scrollbar { display: none; }
          .gc-theme-opt { flex-shrink: 0; width: 70px; border-radius: 12px; padding: 10px 8px; text-align: center; cursor: pointer; border: 2.5px solid transparent; transition: all 0.18s; }
          .gc-theme-opt.sel { border-color: #E07B00; box-shadow: 0 0 0 2px rgba(224,123,0,0.3); }
          .gc-theme-opt-emoji { font-size: 18px; margin-bottom: 4px; }
          .gc-theme-opt-name { font-size: 9px; font-weight: 600; color: #1A1714; line-height: 1.3; }

          /* Preview card */
          .gc-preview-label { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: #1A1714; margin: 16px 0 10px; }
          .gc-buy-btn { width: 100%; padding: 15px; background: #E07B00; color: white; border: none; border-radius: 14px; font-size: 15px; font-weight: 700; font-family: 'DM Sans', sans-serif; cursor: pointer; margin-top: 20px; box-shadow: 0 6px 20px rgba(224,123,0,0.35); }

          /* ── Redeem Tab ── */
          .gc-redeem-section { padding: 0 16px; }
          .gc-redeem-hero { background: linear-gradient(135deg, #1A1714, #2D2520); border-radius: 20px; padding: 24px 20px; text-align: center; margin-bottom: 20px; }
          .gc-redeem-hero-emoji { font-size: 44px; margin-bottom: 10px; }
          .gc-redeem-hero h3 { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 800; color: white; margin-bottom: 6px; }
          .gc-redeem-hero p { font-size: 12px; color: rgba(255,255,255,0.5); line-height: 1.6; }
          .gc-redeem-input-wrap { position: relative; margin-bottom: 14px; }
          .gc-redeem-input { width: 100%; padding: 16px 14px; border-radius: 14px; border: 2px solid #EAE5DF; font-size: 16px; font-weight: 700; color: #1A1714; font-family: 'Syne', sans-serif; outline: none; letter-spacing: 0.08em; text-transform: uppercase; background: white; }
          .gc-redeem-input:focus { border-color: #E07B00; }
          .gc-redeem-btn { width: 100%; padding: 15px; background: #E07B00; color: white; border: none; border-radius: 14px; font-size: 15px; font-weight: 700; font-family: 'DM Sans', sans-serif; cursor: pointer; box-shadow: 0 6px 20px rgba(224,123,0,0.35); }
          .gc-how-it-works { margin-top: 24px; }
          .gc-how-title { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: #1A1714; margin-bottom: 12px; }
          .gc-steps { display: flex; flex-direction: column; gap: 10px; }
          .gc-step { display: flex; align-items: center; gap: 12px; background: white; border: 1px solid #EAE5DF; border-radius: 14px; padding: 13px; }
          .gc-step-num { width: 30px; height: 30px; border-radius: 10px; background: #FEF3C7; display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 800; color: #D97706; flex-shrink: 0; }
          .gc-step-text { font-size: 12px; font-weight: 500; color: #1A1714; }

          .gc-pb { height: 40px; }
        `}</style>

        <div className="gc-root">

          {/* Header */}
          <div className="gc-header">
            <div className="gc-back-btn" onClick={() => history.goBack()}>
              <IonIcon icon={arrowBackOutline} style={{ fontSize: 19, color: "#1A1714" }} />
            </div>
            <div className="gc-header-title">E-Gift Cards</div>
          </div>

          {/* Tabs */}
          <div className="gc-tabs">
            {(["my", "buy", "redeem"] as const).map((t) => (
              <button key={t} className={`gc-tab${activeTab === t ? " active" : ""}`} onClick={() => setActiveTab(t)}>
                {t === "my" ? "🎁 My Cards" : t === "buy" ? "🛍️ Buy" : "🔑 Redeem"}
              </button>
            ))}
          </div>

          {/* ── MY CARDS ── */}
          {activeTab === "my" && (
            <div className="gc-list">
              {myGiftCards.map((card) => {
                const usedPct = Math.round(((card.amount - card.balance) / card.amount) * 100);
                return (
                  <div key={card.id} className="gc-card-wrap">
                    {/* Visual Card */}
                    <div className="gc-visual" style={{ background: card.theme.bg }}>
                      <div className="gc-visual-top">
                        <span className="gc-brand">FoodDeliver</span>
                        <span className="gc-theme-emoji">{card.theme.emoji}</span>
                      </div>
                      <div className="gc-visual-amount">₹{card.amount}</div>
                      <div className="gc-visual-balance">Balance: ₹{card.balance}</div>
                      <div className="gc-visual-code">{card.code}</div>
                      <div className="gc-expiry">Valid till {card.expiryDate}</div>
                    </div>

                    {/* Info */}
                    {card.message && (
                      <div className="gc-from-msg">
                        <div className="gc-from">From: <span>{card.from}</span></div>
                        <div className="gc-message">"{card.message}"</div>
                      </div>
                    )}

                    <div className="gc-progress-wrap">
                      <div className="gc-progress-labels">
                        <span className="gc-progress-lbl">Used: <span>₹{card.amount - card.balance}</span></span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div className={`gc-status ${card.status}`}>{card.status}</div>
                        </div>
                      </div>
                      <div className="gc-progress-bar">
                        <div className="gc-progress-fill" style={{ width: `${usedPct}%` }} />
                      </div>
                    </div>

                    <div className="gc-actions">
                      <button className="gc-action-btn primary" onClick={() => handleCopy(card.id, card.code)}>
                        <IonIcon icon={copied === card.id ? checkmarkOutline : copyOutline} style={{ fontSize: 14 }} />
                        {copied === card.id ? "Copied!" : "Copy Code"}
                      </button>
                      <button className="gc-action-btn primary">
                        <IonIcon icon={shareOutline} style={{ fontSize: 14 }} />
                        Share
                      </button>
                      {card.status === "active" && (
                        <button className="gc-action-btn primary">
                          <IonIcon icon={cardOutline} style={{ fontSize: 14 }} />
                          Use Now
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── BUY ── */}
          {activeTab === "buy" && (
            <div className="gc-buy-section">
              <div className="gc-field-label">Select Amount</div>
              <div className="gc-amount-grid">
                {["100", "200", "500", "1000", "2000", "5000"].map((amt) => (
                  <div key={amt} className={`gc-amount-opt${giftAmount === amt ? " sel" : ""}`} onClick={() => setGiftAmount(amt)}>₹{amt}</div>
                ))}
              </div>

              <div className="gc-field-label">Choose Theme</div>
              <div className="gc-theme-scroll">
                {themes.map((th, i) => (
                  <div key={i} className={`gc-theme-opt${selectedTheme === i ? " sel" : ""}`}
                    style={{ background: th.bg }} onClick={() => setSelectedTheme(i)}>
                    <div className="gc-theme-opt-emoji">{th.emoji}</div>
                    <div className="gc-theme-opt-name" style={{ color: "white" }}>{th.name}</div>
                  </div>
                ))}
              </div>

              <div className="gc-field-label">Recipient Name</div>
              <input className="gc-input" placeholder="Enter recipient's name"
                value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />

              <div className="gc-field-label">Recipient Email / Phone</div>
              <input className="gc-input" placeholder="email@example.com or 9XXXXXXXXX"
                value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} />

              <div className="gc-field-label">Personal Message (optional)</div>
              <textarea className="gc-input gc-textarea" placeholder="Write a heartfelt message…"
                value={giftMessage} onChange={(e) => setGiftMessage(e.target.value)} />

              {/* Preview */}
              <div className="gc-preview-label">Preview</div>
              <div className="gc-visual" style={{ background: themes[selectedTheme].bg }}>
                <div className="gc-visual-top">
                  <span className="gc-brand">FoodDeliver</span>
                  <span className="gc-theme-emoji">{themes[selectedTheme].emoji}</span>
                </div>
                <div className="gc-visual-amount">₹{giftAmount}</div>
                <div className="gc-visual-balance">To: {recipientName || "Recipient"}</div>
                <div className="gc-visual-code">FOOD-XXXX-XXXX</div>
                {giftMessage && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 8, fontStyle: "italic", position: "relative", zIndex: 1 }}>"{giftMessage}"</div>}
              </div>

              <button className="gc-buy-btn">
                Proceed to Pay ₹{giftAmount}
              </button>
            </div>
          )}

          {/* ── REDEEM ── */}
          {activeTab === "redeem" && (
            <div className="gc-redeem-section">
              <div className="gc-redeem-hero">
                <div className="gc-redeem-hero-emoji">🎁</div>
                <h3>Redeem Your Gift Card</h3>
                <p>Enter your gift card code below to add the balance to your wallet and shop instantly.</p>
              </div>
              <input className="gc-redeem-input" placeholder="FOOD-XXXX-XXXX"
                value={redeemCode} onChange={(e) => setRedeemCode(e.target.value)} />
              <button className="gc-redeem-btn">
                Redeem Gift Card
              </button>

              <div className="gc-how-it-works">
                <div className="gc-how-title">How it works</div>
                <div className="gc-steps">
                  <div className="gc-step">
                    <div className="gc-step-num">1</div>
                    <div className="gc-step-text">Enter the gift card code shared with you via email or message.</div>
                  </div>
                  <div className="gc-step">
                    <div className="gc-step-num">2</div>
                    <div className="gc-step-text">Tap "Redeem" and the amount gets added to your FoodDeliver wallet instantly.</div>
                  </div>
                  <div className="gc-step">
                    <div className="gc-step-num">3</div>
                    <div className="gc-step-text">Use your wallet balance during checkout on any order — no expiry on wallet balance.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="gc-pb" />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default GiftCardPage;