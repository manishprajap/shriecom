import { IonPage, IonContent, IonIcon, useIonRouter } from "@ionic/react";
import { arrowBackOutline, cartOutline } from "ionicons/icons";
import { useState, useEffect } from "react";
import { useLocation, useHistory } from "react-router";

import vege from "../assets/vege.jpg";

// ✅ Cart uses localStorage directly — yeh auth data nahi hai
//    Capacitor Preferences sirf token/user ke liye hai (useAuth.ts mein)
const loadCart  = (): CartItem[] => {
  try { return JSON.parse(localStorage.getItem("cart") ?? "[]"); } catch { return []; }
};
const storeCart = (c: CartItem[]) => localStorage.setItem("cart", JSON.stringify(c));

const BASE = "https://shriecom.in/appapis/shreefood/public/api";

type CartItem    = { id: number; name: string; price: number; img: string; qty: number };
type Product     = { id: number; name: string; price: number; mrp?: number; image_url: string; qty_label?: string; discount?: number };
type ApiCategory = { id: number; name: string; slug: string; image: string | null };

const PAGE_CONFIG: Record<string, {
  title: string; subtitle: string; emoji: string;
  api: string; type: "categories" | "products" | "recipes";
}> = {
  "/all-categories": {
    title: "All Categories", subtitle: "Browse everything we offer",
    emoji: "🧺", api: `${BASE}/category-list`, type: "categories",
  },
  "/all-deals": {
    title: "Hot Deals", subtitle: "Today's best prices",
    emoji: "🔥", api: `${BASE}/hot-deals`, type: "products",
  },
  "/all-fresh": {
    title: "Daily Fresh Needs", subtitle: "Straight from the farm",
    emoji: "🌿", api: `${BASE}/fresh-needs`, type: "products",
  },
  "/all-recipes": {
    title: "Cooking Ideas", subtitle: "Recipes for today",
    emoji: "👨‍🍳", api: `${BASE}/cooking-ideas`, type: "recipes",
  },
};

const ListPage: React.FC = () => {
  const location = useLocation();
  const history  = useHistory();
  const router   = useIonRouter();

  const config = PAGE_CONFIG[location.pathname] ?? PAGE_CONFIG["/all-categories"];

  const [items,   setItems]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart,    setCart]    = useState<CartItem[]>(loadCart);

  const saveCartState = (updated: CartItem[]) => {
    setCart(updated);
    storeCart(updated);
  };

  const getQty     = (id: number) => cart.find((i) => i.id === id)?.qty ?? 0;
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cart.reduce((s, i) => s + i.qty * i.price, 0);

  const addToCart   = (p: Product) =>
    saveCartState([...cart, { id: p.id, name: p.name, price: p.price, img: p.image_url, qty: 1 }]);
  const increaseQty = (id: number) =>
    saveCartState(cart.map((i) => (i.id === id ? { ...i, qty: i.qty + 1 } : i)));
  const decreaseQty = (id: number) =>
    saveCartState(
      cart.map((i) => (i.id === id ? { ...i, qty: i.qty - 1 } : i)).filter((i) => i.qty > 0)
    );

  // Sync cart when window regains focus (back-navigation / other tabs)
  useEffect(() => {
    const syncCart = () => setCart(loadCart());
    window.addEventListener("focus", syncCart);
    return () => window.removeEventListener("focus", syncCart);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(config.api)
      .then((r) => r.json())
      .then((json) => { if (json.success) setItems(json.data ?? []); })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [config.api]);

  const imgFallback = (e: React.SyntheticEvent<HTMLImageElement>) => {
    (e.target as HTMLImageElement).src = vege;
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
          * { box-sizing:border-box; margin:0; padding:0; font-family:'Nunito',sans-serif; }
          :root {
            --amber:#E07B00; --charcoal:#1A1714; --muted:#9B8E84;
            --border:#EAE5DF; --bg:#FFFBEB; --green:#0C831F; --red:#DC2626;
          }
          @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
          @keyframes fadeIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
          @keyframes cartUp  {
            from{transform:translateX(-50%) translateY(20px);opacity:0}
            to  {transform:translateX(-50%) translateY(0);opacity:1}
          }

          .lp-root { background:var(--bg); min-height:100vh; padding-bottom:110px; }

          .lp-header {
            position:sticky; top:0; z-index:200;
            background:#FFFBEB; border-bottom:1px solid #F0E8C0;
            padding:12px 16px;
            display:flex; align-items:center; gap:12px;
          }
          .lp-back {
            flex-shrink:0; width:38px; height:38px; border-radius:12px;
            background:white; border:1.5px solid #E8DFC0;
            display:flex; align-items:center; justify-content:center;
            cursor:pointer; box-shadow:0 2px 6px rgba(0,0,0,0.06);
            transition:background 0.15s;
          }
          .lp-back:active { background:#FEF3C7; }
          .lp-header-text { flex:1; }
          .lp-header-text h2 { font-size:17px; font-weight:900; color:var(--charcoal); letter-spacing:-0.3px; }
          .lp-header-text p  { font-size:11px; color:var(--muted); margin-top:1px; font-weight:600; }
          .lp-count-badge {
            flex-shrink:0; background:rgba(224,123,0,0.12);
            color:var(--amber); font-size:11px; font-weight:800;
            padding:4px 10px; border-radius:20px;
          }

          /* Category Grid */
          .lp-cat-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; padding:16px; animation:fadeIn 0.35s ease; }
          .lp-cat-card {
            border-radius:14px; overflow:hidden; cursor:pointer;
            border:1.5px solid #EAE5DF; background:#F3F4F6;
            transition:transform 0.18s,box-shadow 0.18s;
            box-shadow:0 2px 8px rgba(0,0,0,0.04);
          }
          .lp-cat-card:active { transform:scale(0.95); }
          .lp-cat-card:hover  { box-shadow:0 5px 16px rgba(0,0,0,0.1); }
          .lp-cat-img { height:68px; overflow:hidden; display:flex; align-items:center; justify-content:center; }
          .lp-cat-img img { width:100%; height:100%; object-fit:cover; transition:transform 0.3s; }
          .lp-cat-card:hover .lp-cat-img img { transform:scale(1.07); }
          .lp-cat-name { padding:6px 6px 8px; font-size:10px; font-weight:800; text-align:center; line-height:1.3; color:#374151; }

          /* Product Grid */
          .lp-prod-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; padding:16px; animation:fadeIn 0.35s ease; }
          .lp-prod-card { background:white; border-radius:18px; overflow:hidden; border:1px solid var(--border); cursor:pointer; box-shadow:0 2px 10px rgba(0,0,0,0.05); transition:transform 0.18s,box-shadow 0.18s; }
          .lp-prod-card:active { transform:scale(0.97); }
          .lp-prod-card:hover  { box-shadow:0 6px 22px rgba(0,0,0,0.1); }
          .lp-prod-img-wrap { height:120px; overflow:hidden; position:relative; background:#F9F7F4; display:flex; align-items:center; justify-content:center; }
          .lp-prod-img-wrap img { width:100px; height:100px; object-fit:cover; border-radius:12px; transition:transform 0.3s; }
          .lp-prod-card:hover .lp-prod-img-wrap img { transform:scale(1.07); }
          .lp-prod-badge { position:absolute; top:8px; left:8px; background:var(--red); color:white; font-size:9px; font-weight:800; padding:3px 7px; border-radius:6px; }
          .lp-prod-info   { padding:10px 10px 12px; }
          .lp-prod-name   { font-size:13px; font-weight:800; color:var(--charcoal); line-height:1.3; margin-bottom:3px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
          .lp-prod-qty    { font-size:11px; color:var(--muted); font-weight:600; margin-bottom:8px; }
          .lp-prod-bottom { display:flex; align-items:center; justify-content:space-between; }
          .lp-price-col   { display:flex; flex-direction:column; gap:1px; }
          .lp-price       { font-size:15px; font-weight:900; color:var(--charcoal); }
          .lp-mrp         { font-size:11px; color:var(--muted); text-decoration:line-through; font-weight:600; }
          .lp-add-btn     { background:white; border:1.5px solid var(--amber); color:var(--amber); border-radius:8px; padding:5px 10px; font-size:12px; font-weight:800; cursor:pointer; font-family:'Nunito',sans-serif; transition:all 0.18s; }
          .lp-add-btn:active { background:var(--amber); color:white; }
          .lp-qty-box        { display:flex; align-items:center; gap:5px; background:var(--amber); border-radius:8px; padding:4px 8px; }
          .lp-qty-box button { background:none; border:none; color:white; font-size:16px; font-weight:900; cursor:pointer; width:18px; height:18px; display:flex; align-items:center; justify-content:center; padding:0; }
          .lp-qty-box span   { color:white; font-size:13px; font-weight:900; min-width:16px; text-align:center; }

          /* Recipe Grid */
          .lp-recipe-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; padding:16px; animation:fadeIn 0.35s ease; }
          .lp-recipe-card { border-radius:16px; overflow:hidden; cursor:pointer; position:relative; box-shadow:0 4px 14px rgba(0,0,0,0.1); transition:transform 0.18s; }
          .lp-recipe-card:active { transform:scale(0.96); }
          .lp-recipe-card img { width:100%; height:130px; object-fit:cover; display:block; transition:transform 0.35s; }
          .lp-recipe-card:hover img { transform:scale(1.07); }
          .lp-recipe-overlay { position:absolute; bottom:0; left:0; right:0; background:linear-gradient(to top,rgba(0,0,0,0.78) 0%,transparent 100%); padding:24px 10px 10px; }
          .lp-recipe-name    { font-size:13px; font-weight:800; color:white; line-height:1.3; }

          /* Skeleton */
          .lp-skeleton { border-radius:16px; background:linear-gradient(90deg,#f0e8c0 25%,#fef9e7 50%,#f0e8c0 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }

          /* Empty */
          .lp-empty { display:flex; flex-direction:column; align-items:center; padding:56px 20px; text-align:center; }
          .lp-empty-emoji { font-size:52px; margin-bottom:14px; }
          .lp-empty h3    { font-size:18px; font-weight:900; color:var(--charcoal); margin-bottom:7px; }
          .lp-empty p     { font-size:13px; color:var(--muted); font-weight:600; }

          /* Cart bar */
          .lp-cart-bar { position:fixed; bottom:16px; left:50%; transform:translateX(-50%); width:calc(100% - 32px); max-width:440px; background:var(--green); border-radius:16px; padding:12px 14px; display:flex; align-items:center; justify-content:space-between; box-shadow:0 8px 32px rgba(12,131,31,0.45); z-index:500; animation:cartUp 0.3s cubic-bezier(0.34,1.56,0.64,1); }
          .lp-cart-bar__left { display:flex; align-items:center; gap:10px; }
          .lp-cart-bar__icon { background:rgba(255,255,255,0.15); border-radius:9px; width:36px; height:36px; display:flex; align-items:center; justify-content:center; }
          .lp-cart-bar__info strong { display:block; font-size:13px; font-weight:800; color:white; }
          .lp-cart-bar__info span   { font-size:11px; color:rgba(255,255,255,0.75); font-weight:600; }
          .lp-cart-bar__btn { background:white; color:var(--green); border:none; padding:9px 18px; border-radius:10px; font-size:13px; font-weight:900; cursor:pointer; font-family:'Nunito',sans-serif; white-space:nowrap; }
        `}</style>

        <div className="lp-root">

          {/* Header */}
          <div className="lp-header">
            <div className="lp-back" onClick={() => history.goBack()}>
              <IonIcon icon={arrowBackOutline} style={{ fontSize: 20, color: "#1A1714" }} />
            </div>
            <div className="lp-header-text">
              <h2>{config.emoji} {config.title}</h2>
              <p>{config.subtitle}</p>
            </div>
            {!loading && items.length > 0 && (
              <div className="lp-count-badge">{items.length} items</div>
            )}
          </div>

          {/* ════ CATEGORIES ════ */}
          {config.type === "categories" && (
            <>
              {loading ? (
                <div className="lp-cat-grid">
                  {[1,2,3,4,5,6,7,8,9].map((i) => (
                    <div key={i} className="lp-skeleton" style={{ height: 100 }} />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="lp-empty">
                  <div className="lp-empty-emoji">🧺</div>
                  <h3>No categories found</h3>
                  <p>Check back soon!</p>
                </div>
              ) : (
                <div className="lp-cat-grid">
                  {(items as ApiCategory[]).map((cat) => (
                    <div
                      key={cat.id}
                      className="lp-cat-card"
                      onClick={() => router.push(`/category/${cat.id}`, "forward")}
                    >
                      <div className="lp-cat-img">
                        <img
                          src={cat.image ? cat.image : vege}
                          alt={cat.name}
                          onError={imgFallback}
                        />
                      </div>
                      <div className="lp-cat-name">{cat.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ════ PRODUCTS (Hot Deals + Fresh Needs) ════ */}
          {config.type === "products" && (
            <>
              {loading ? (
                <div className="lp-prod-grid">
                  {[1,2,3,4,5,6].map((i) => (
                    <div key={i} className="lp-skeleton" style={{ height: 220 }} />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="lp-empty">
                  <div className="lp-empty-emoji">{config.emoji}</div>
                  <h3>Nothing here yet</h3>
                  <p>Check back soon!</p>
                </div>
              ) : (
                <div className="lp-prod-grid">
                  {(items as Product[]).map((item) => {
                    const discount =
                      item.mrp && item.mrp > item.price
                        ? Math.round((1 - item.price / item.mrp) * 100)
                        : (item.discount ?? 0);
                    return (
                      <div
                        key={item.id}
                        className="lp-prod-card"
                        onClick={() => router.push(`/product/${item.id}`, "forward")}
                      >
                        <div className="lp-prod-img-wrap">
                          {discount > 0 && <div className="lp-prod-badge">{discount}% OFF</div>}
                          <img src={item.image_url} alt={item.name} onError={imgFallback} />
                        </div>
                        <div className="lp-prod-info">
                          <div className="lp-prod-name">{item.name}</div>
                          {item.qty_label && <div className="lp-prod-qty">{item.qty_label}</div>}
                          <div className="lp-prod-bottom">
                            <div className="lp-price-col">
                              <span className="lp-price">₹{item.price}</span>
                              {item.mrp && item.mrp > item.price && (
                                <span className="lp-mrp">₹{item.mrp}</span>
                              )}
                            </div>
                            {getQty(item.id) === 0 ? (
                              <button
                                className="lp-add-btn"
                                onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                              >ADD</button>
                            ) : (
                              <div className="lp-qty-box" onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => decreaseQty(item.id)}>−</button>
                                <span>{getQty(item.id)}</span>
                                <button onClick={() => increaseQty(item.id)}>+</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ════ RECIPES (Cooking Ideas) ════ */}
          {config.type === "recipes" && (
            <>
              {loading ? (
                <div className="lp-recipe-grid">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className="lp-skeleton" style={{ height: 130 }} />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="lp-empty">
                  <div className="lp-empty-emoji">👨‍🍳</div>
                  <h3>Recipes coming soon!</h3>
                  <p>We're preparing something delicious 🍳</p>
                </div>
              ) : (
                <div className="lp-recipe-grid">
                  {items.map((item: any) => (
                    <div
                      key={item.id}
                      className="lp-recipe-card"
                      onClick={() => router.push(`/recipe/${item.id}`, "forward")}
                    >
                      <img src={item.image_url} alt={item.name} onError={imgFallback} />
                      <div className="lp-recipe-overlay">
                        <div className="lp-recipe-name">{item.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

        </div>

        {/* Cart Bar */}
        {totalItems > 0 && (
          <div className="lp-cart-bar">
            <div className="lp-cart-bar__left">
              <div className="lp-cart-bar__icon">
                <IonIcon icon={cartOutline} style={{ color: "white", fontSize: 20 }} />
              </div>
              <div className="lp-cart-bar__info">
                <strong>{totalItems} item{totalItems > 1 ? "s" : ""}</strong>
                <span>₹{totalPrice.toFixed(2)}</span>
              </div>
            </div>
            <button
              className="lp-cart-bar__btn"
              onClick={() => router.push("/cart", "forward", "push")}
            >
              View Cart →
            </button>
          </div>
        )}

      </IonContent>
    </IonPage>
  );
};

export default ListPage;