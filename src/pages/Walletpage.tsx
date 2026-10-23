import {
  IonPage,
  IonContent,
  IonIcon,
} from "@ionic/react";
import {
  arrowBackOutline,
  addOutline,
  arrowUpOutline,
  arrowDownOutline,
  cardOutline,
  walletOutline,
  cashOutline,
  giftOutline,
  timeOutline,
  checkmarkCircle,
  closeCircle,
  ellipsisHorizontal,
} from "ionicons/icons";
import { useState } from "react";
import { useHistory } from "react-router";

interface Transaction {
  id: number;
  type: "credit" | "debit";
  title: string;
  subtitle: string;
  amount: number;
  date: string;
  status: "success" | "failed" | "pending";
  icon: string;
}

const transactions: Transaction[] = [
  { id: 1, type: "credit", title: "Money Added",        subtitle: "Via UPI · ICICI Bank",         amount: 500,  date: "Today, 10:32 AM",      status: "success", icon: "💳" },
  { id: 2, type: "debit",  title: "Order #8821",         subtitle: "Fresh Tomato, Milk, Bread",    amount: 169,  date: "Today, 9:14 AM",       status: "success", icon: "🛒" },
  { id: 3, type: "credit", title: "Cashback Reward",     subtitle: "10% cashback on order #8820", amount: 24,   date: "Yesterday, 6:45 PM",   status: "success", icon: "🎁" },
  { id: 4, type: "debit",  title: "Order #8818",         subtitle: "Vegetables & Fruits Basket",  amount: 312,  date: "Yesterday, 11:20 AM",  status: "success", icon: "🛒" },
  { id: 5, type: "credit", title: "Refund Credited",     subtitle: "Order #8801 partial refund",  amount: 45,   date: "12 Jul, 3:00 PM",      status: "success", icon: "↩️" },
  { id: 6, type: "debit",  title: "Order #8810",         subtitle: "Dairy & Breakfast items",     amount: 220,  date: "11 Jul, 8:55 AM",      status: "failed",  icon: "🛒" },
  { id: 7, type: "credit", title: "Money Added",        subtitle: "Via Debit Card · HDFC Bank",  amount: 1000, date: "10 Jul, 7:30 PM",      status: "success", icon: "💳" },
  { id: 8, type: "debit",  title: "Order #8805",         subtitle: "Munchies & Cold Drinks",      amount: 135,  date: "9 Jul, 2:10 PM",       status: "pending", icon: "🛒" },
];

const WalletPage: React.FC = () => {
  const history = useHistory();
  const [activeTab, setActiveTab] = useState<"all" | "credit" | "debit">("all");
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [addAmount, setAddAmount] = useState("");

  const filtered = transactions.filter((t) =>
    activeTab === "all" ? true : t.type === activeTab
  );

  const balance = 1284.00;
  const cashback = 142.00;

  return (
    <IonPage>
      <IonContent fullscreen>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          .w-root { font-family: 'DM Sans', sans-serif; background: #FFFBEB; min-height: 100vh; }

          /* Header */
          .w-header {
            position: sticky; top: 0; z-index: 100;
            background: #FFFBEB; border-bottom: 1px solid #F0E8C0;
            padding: 14px 16px;
            display: flex; align-items: center; gap: 12px;
          }
          .w-back-btn {
            width: 38px; height: 38px; border-radius: 12px;
            background: white; border: 1.5px solid #EAE5DF;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; flex-shrink: 0;
          }
          .w-header-title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; color: #1A1714; }

          /* Balance Card */
          .w-balance-card {
            margin: 16px;
            background: linear-gradient(135deg, #1A1714 0%, #2D2520 50%, #1A1714 100%);
            border-radius: 24px; padding: 24px; position: relative; overflow: hidden;
          }
          .w-balance-card::before {
            content: ''; position: absolute; top: -40px; right: -40px;
            width: 160px; height: 160px; border-radius: 50%;
            background: radial-gradient(circle, rgba(224,123,0,0.25) 0%, transparent 70%);
          }
          .w-balance-card::after {
            content: ''; position: absolute; bottom: -30px; left: -20px;
            width: 120px; height: 120px; border-radius: 50%;
            background: radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%);
          }
          .w-balance-label { font-size: 12px; color: rgba(255,255,255,0.5); font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; }
          .w-balance-amount { font-family: 'Syne', sans-serif; font-size: 38px; font-weight: 800; color: white; margin-top: 6px; position: relative; z-index: 1; }
          .w-balance-amount span { font-size: 22px; color: rgba(255,255,255,0.6); }
          .w-balance-pills { display: flex; gap: 10px; margin-top: 18px; position: relative; z-index: 1; }
          .w-pill {
            display: flex; align-items: center; gap: 6px;
            background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15);
            border-radius: 10px; padding: 7px 12px;
          }
          .w-pill-icon { font-size: 15px; }
          .w-pill-text { font-size: 11px; color: rgba(255,255,255,0.7); font-weight: 500; }
          .w-pill-val { font-size: 12px; color: white; font-weight: 700; margin-left: 2px; }

          /* Action Buttons */
          .w-actions { display: flex; gap: 10px; padding: 0 16px; margin-bottom: 20px; }
          .w-action-btn {
            flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px;
            padding: 13px; border-radius: 14px; border: none; cursor: pointer;
            font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 700;
            transition: transform 0.18s, box-shadow 0.18s;
          }
          .w-action-btn:active { transform: scale(0.96); }
          .w-action-primary { background: #E07B00; color: white; box-shadow: 0 6px 20px rgba(224,123,0,0.35); }
          .w-action-secondary { background: white; color: #1A1714; border: 1.5px solid #EAE5DF; }

          /* Stats row */
          .w-stats { display: flex; gap: 10px; padding: 0 16px; margin-bottom: 20px; }
          .w-stat-card { flex: 1; background: white; border-radius: 16px; padding: 14px; border: 1px solid #EAE5DF; text-align: center; }
          .w-stat-icon { font-size: 20px; margin-bottom: 6px; }
          .w-stat-val { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 800; color: #1A1714; }
          .w-stat-lbl { font-size: 10px; color: #9B8E84; margin-top: 2px; font-weight: 500; }

          /* Tabs */
          .w-tabs { display: flex; gap: 6px; padding: 0 16px; margin-bottom: 14px; }
          .w-tab {
            flex: 1; padding: 9px; border-radius: 12px; border: 1.5px solid #EAE5DF;
            background: white; font-size: 12px; font-weight: 600; color: #9B8E84;
            cursor: pointer; text-align: center; transition: all 0.18s;
            font-family: 'DM Sans', sans-serif;
          }
          .w-tab.active { background: #1A1714; border-color: #1A1714; color: white; }

          /* Section label */
          .w-section-label { padding: 0 16px; margin-bottom: 10px; font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: #1A1714; }

          /* Transaction list */
          .w-txn-list { padding: 0 16px; display: flex; flex-direction: column; gap: 8px; }
          .w-txn-item {
            display: flex; align-items: center; gap: 12px;
            background: white; border-radius: 16px; padding: 13px;
            border: 1px solid #EAE5DF;
          }
          .w-txn-emoji { width: 42px; height: 42px; border-radius: 13px; background: #F9F7F4; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
          .w-txn-body { flex: 1; min-width: 0; }
          .w-txn-title { font-size: 13px; font-weight: 600; color: #1A1714; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .w-txn-sub { font-size: 11px; color: #9B8E84; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .w-txn-date { font-size: 10px; color: #B8A878; margin-top: 3px; }
          .w-txn-right { text-align: right; flex-shrink: 0; }
          .w-txn-amount { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 800; }
          .w-txn-amount.credit { color: #16A34A; }
          .w-txn-amount.debit  { color: #1A1714; }
          .w-txn-status { display: inline-flex; align-items: center; gap: 3px; margin-top: 3px; font-size: 10px; font-weight: 500; border-radius: 6px; padding: 2px 6px; }
          .w-txn-status.success { background: #DCFCE7; color: #16A34A; }
          .w-txn-status.failed  { background: #FEE2E2; color: #DC2626; }
          .w-txn-status.pending { background: #FEF3C7; color: #D97706; }

          /* Add money modal */
          .w-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 999; display: flex; align-items: flex-end; }
          .w-modal-sheet { background: white; border-radius: 24px 24px 0 0; padding: 28px 20px 40px; width: 100%; }
          .w-modal-handle { width: 40px; height: 4px; background: #EAE5DF; border-radius: 99px; margin: 0 auto 20px; }
          .w-modal-title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; color: #1A1714; margin-bottom: 18px; }
          .w-amount-presets { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
          .w-preset-btn {
            flex: 1; min-width: 70px; padding: 10px; border-radius: 12px;
            border: 1.5px solid #EAE5DF; background: white;
            font-size: 13px; font-weight: 600; color: #1A1714; cursor: pointer;
            font-family: 'DM Sans', sans-serif; transition: all 0.15s;
          }
          .w-preset-btn.sel { background: #1A1714; border-color: #1A1714; color: white; }
          .w-input-wrap { position: relative; margin-bottom: 16px; }
          .w-input-prefix { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 18px; font-weight: 700; color: #9B8E84; }
          .w-input-wrap input { width: 100%; padding: 14px 14px 14px 32px; border-radius: 14px; border: 1.5px solid #EAE5DF; font-size: 20px; font-weight: 700; color: #1A1714; font-family: 'Syne', sans-serif; outline: none; }
          .w-input-wrap input:focus { border-color: #E07B00; }
          .w-add-confirm-btn { width: 100%; padding: 15px; background: #E07B00; color: white; border: none; border-radius: 14px; font-size: 15px; font-weight: 700; font-family: 'DM Sans', sans-serif; cursor: pointer; }

          .w-pb { height: 30px; }
        `}</style>

        <div className="w-root">

          {/* Header */}
          <div className="w-header">
            <div className="w-back-btn" onClick={() => history.goBack()}>
              <IonIcon icon={arrowBackOutline} style={{ fontSize: 19, color: "#1A1714" }} />
            </div>
            <div className="w-header-title">My Wallet</div>
          </div>

          {/* Balance Card */}
          <div className="w-balance-card">
            <div className="w-balance-label">Available Balance</div>
            <div className="w-balance-amount"><span>₹</span>{balance.toFixed(2)}</div>
            <div className="w-balance-pills">
              <div className="w-pill">
                <span className="w-pill-icon">🎁</span>
                <span className="w-pill-text">Cashback</span>
                <span className="w-pill-val">₹{cashback}</span>
              </div>
              <div className="w-pill">
                <span className="w-pill-icon">⭐</span>
                <span className="w-pill-text">Reward Pts</span>
                <span className="w-pill-val">340</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="w-actions">
            <button className="w-action-btn w-action-primary" onClick={() => setShowAddMoney(true)}>
              <IonIcon icon={addOutline} style={{ fontSize: 18 }} />
              Add Money
            </button>
            <button className="w-action-btn w-action-secondary">
              <IonIcon icon={arrowUpOutline} style={{ fontSize: 16 }} />
              Transfer
            </button>
            <button className="w-action-btn w-action-secondary">
              <IonIcon icon={arrowDownOutline} style={{ fontSize: 16 }} />
              Withdraw
            </button>
          </div>

          {/* Stats */}
          <div className="w-stats">
            <div className="w-stat-card">
              <div className="w-stat-icon">💸</div>
              <div className="w-stat-val">₹2.4K</div>
              <div className="w-stat-lbl">Total Spent</div>
            </div>
            <div className="w-stat-card">
              <div className="w-stat-icon">↩️</div>
              <div className="w-stat-val">₹245</div>
              <div className="w-stat-lbl">Refunds</div>
            </div>
            <div className="w-stat-card">
              <div className="w-stat-icon">🎁</div>
              <div className="w-stat-val">₹142</div>
              <div className="w-stat-lbl">Cashback</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="w-tabs">
            {(["all", "credit", "debit"] as const).map((t) => (
              <button key={t} className={`w-tab${activeTab === t ? " active" : ""}`} onClick={() => setActiveTab(t)}>
                {t === "all" ? "All" : t === "credit" ? "💚 Added" : "🔴 Spent"}
              </button>
            ))}
          </div>

          {/* Transaction list */}
          <div className="w-section-label">Recent Transactions</div>
          <div className="w-txn-list">
            {filtered.map((txn) => (
              <div key={txn.id} className="w-txn-item">
                <div className="w-txn-emoji">{txn.icon}</div>
                <div className="w-txn-body">
                  <div className="w-txn-title">{txn.title}</div>
                  <div className="w-txn-sub">{txn.subtitle}</div>
                  <div className="w-txn-date">{txn.date}</div>
                </div>
                <div className="w-txn-right">
                  <div className={`w-txn-amount ${txn.type}`}>
                    {txn.type === "credit" ? "+" : "−"}₹{txn.amount}
                  </div>
                  <div className={`w-txn-status ${txn.status}`}>
                    {txn.status === "success" ? "✓" : txn.status === "failed" ? "✗" : "⏳"} {txn.status}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="w-pb" />
        </div>

        {/* Add Money Sheet */}
        {showAddMoney && (
          <div className="w-modal-overlay" onClick={() => setShowAddMoney(false)}>
            <div className="w-modal-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="w-modal-handle" />
              <div className="w-modal-title">Add Money to Wallet</div>
              <div className="w-amount-presets">
                {[100, 200, 500, 1000].map((amt) => (
                  <button key={amt} className={`w-preset-btn${addAmount === String(amt) ? " sel" : ""}`}
                    onClick={() => setAddAmount(String(amt))}>
                    ₹{amt}
                  </button>
                ))}
              </div>
              <div className="w-input-wrap">
                <span className="w-input-prefix">₹</span>
                <input type="number" placeholder="Enter amount" value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)} />
              </div>
              <button className="w-add-confirm-btn" onClick={() => setShowAddMoney(false)}>
                Add ₹{addAmount || "0"} via UPI / Card
              </button>
            </div>
          </div>
        )}

      </IonContent>
    </IonPage>
  );
};

export default WalletPage;