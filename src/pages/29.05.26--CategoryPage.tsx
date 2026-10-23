import {
    IonPage,
    IonContent,
    IonIcon,
    IonModal
} from "@ionic/react";
import { arrowBackOutline, searchOutline, cartOutline } from "ionicons/icons";
import { useParams } from "react-router-dom";
import { useIonRouter } from "@ionic/react";
import { useState, useEffect } from "react";
import shop1 from "../assets/shop1.jpg";
import { useHistory } from "react-router-dom";
import { getToken, getUser } from "../hooks/useAuth";

interface RouteParams { id: string; }

type CartItem = {
    id: number; name: string; price: number;
    img: string; qty: number; weight?: string;
};

interface ApiSubcategory {
    id: number;
    category_id: number;
    name: string;
    image: string | null;
    sort_order: number;
}

interface ApiProduct {
    id: number;
    name: string;
    price: number;
    image: string;
    qty_label: string;
    quantity: number;
    subcategory_id: number;
    category_id: number;
    subcategory?: { id: number; name: string; image: string | null; };
}

const BASE = "https://shriecom.in/appapis/shreefood/public/api";

const CategoryPage: React.FC = () => {
    const { id } = useParams<RouteParams>();
    const categoryId = parseInt(id);
    const router = useIonRouter();
    const history = useHistory();

    const [showCart,       setShowCart]       = useState(false);
    const [activeSubcat,   setActiveSubcat]   = useState<number | null>(null);
    const [subcategories,  setSubcategories]  = useState<ApiSubcategory[]>([]);
    const [products,       setProducts]       = useState<ApiProduct[]>([]);
    const [subcatLoading,  setSubcatLoading]  = useState(true);
    const [productLoading, setProductLoading] = useState(true);
    const [categoryName,   setCategoryName]   = useState("Category");
    const [isLoggedIn,     setIsLoggedIn]     = useState(false);

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
            if (saved) setCart(JSON.parse(saved));
        };
        window.addEventListener("focus", syncCart);
        return () => window.removeEventListener("focus", syncCart);
    }, []);

    // ── Subcategories fetch ──
    useEffect(() => {
        setSubcatLoading(true);
        fetch(`${BASE}/subcategory-list`)
            .then(res => res.json())
            .then(json => {
                if (json.success) {
                    const filtered = json.data.filter(
                        (s: ApiSubcategory) => s.category_id === categoryId
                    );
                    setSubcategories(filtered);
                    if (filtered.length > 0) setActiveSubcat(filtered[0].id);
                }
            })
            .catch(err => console.error("Subcategory fetch error:", err))
            .finally(() => setSubcatLoading(false));
    }, [categoryId]);

    // ── Products fetch ──
    // quantity > 0 → IN STOCK
    // quantity = 0 → OUT OF STOCK
    useEffect(() => {
        setProductLoading(true);

        fetch(`${BASE}/product-list?category_id=${categoryId}&per_page=200`)
            .then(res => res.json())
            .then(json => {
                if (json.success) {
                    const data: ApiProduct[] = json.data.data ?? json.data;

                    // Sort: In-stock first, out-of-stock last
                    const sorted = [...data].sort((a, b) => {
                        const aInStock = a.quantity > 0;
                        const bInStock = b.quantity > 0;
                        if (aInStock && !bInStock) return -1;
                        if (!aInStock && bInStock) return 1;
                        return 0;
                    });

                    setProducts(sorted);

                    if (sorted.length > 0 && (sorted[0] as any).category) {
                        setCategoryName((sorted[0] as any).category.name);
                    }
                }
            })
            .catch(err => console.error("Product fetch error:", err))
            .finally(() => setProductLoading(false));
    }, [categoryId]);

    // quantity > 0 = in stock
    const isInStock = (product: ApiProduct): boolean => product.quantity > 0;

    const filteredProducts = activeSubcat
        ? products.filter(p => p.subcategory_id === activeSubcat)
        : products;

    // ── Cart helpers ──
    const totalItems      = cart.reduce((sum, i) => sum + i.qty, 0);
    const itemsTotal      = cart.reduce((sum, i) => sum + i.qty * i.price, 0);
    const deliveryCharge  = 25;
    const handlingCharge  = 2;
    const smallCartCharge = itemsTotal > 0 && itemsTotal < 200 ? 20 : 0;
    const grandTotal      = itemsTotal + deliveryCharge + handlingCharge + smallCartCharge;

    const getQty = (productId: number) => cart.find(i => i.id === productId)?.qty ?? 0;

    const increaseQty = (item: ApiProduct) => {
        setCart(prev => {
            const existing = prev.find(p => p.id === item.id);
            const updated = existing
                ? prev.map(p => p.id === item.id ? { ...p, qty: p.qty + 1 } : p)
                : [...prev, { id: item.id, name: item.name, price: item.price, img: item.image, qty: 1 }];
            localStorage.setItem("cart", JSON.stringify(updated));
            return updated;
        });
    };

    const increaseQtyFromCart = (item: CartItem) => {
        setCart(prev => {
            const updated = prev.map(p => p.id === item.id ? { ...p, qty: p.qty + 1 } : p);
            localStorage.setItem("cart", JSON.stringify(updated));
            return updated;
        });
    };

    const decreaseQty = (productId: number) => {
        setCart(prev => {
            const updated = prev
                .map(p => p.id === productId ? { ...p, qty: p.qty - 1 } : p)
                .filter(p => p.qty > 0);
            localStorage.setItem("cart", JSON.stringify(updated));
            return updated;
        });
    };

    const handleViewCart = () => history.push("/cart");
    const handleCheckout = () => {
        if (isLoggedIn) router.push("/orders");
        else router.push("/login");
    };

    return (
        <IonPage>
            <IonContent>
                <style>{`
                    :root {
                        --bg: #F7F5F2; --surface: #FFFFFF; --charcoal: #1A1714;
                        --amber: #E07B00; --amber-light: #F59E0B; --amber-pale: #FEF3C7;
                        --green: #16A34A; --green-pale: #DCFCE7;
                        --muted: #9B8E84; --border: #EAE5DF; --red: #DC2626;
                    }
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    .cp-root { background: var(--bg); min-height: 100vh; padding-bottom: 100px; }

                    /* ── Header ── */
                    .cp-header { position: sticky; top: 0; z-index: 100; background: #f8cb46; padding: 14px 16px; display: flex; align-items: center; gap: 12px; }
                    .cp-back-btn { width: 36px; height: 36px; border-radius: 10px; background: rgba(4,4,4,0.86); display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.12); }
                    .cp-back-btn ion-icon { color: white; font-size: 18px; }
                    .cp-header-title { flex: 1; }
                    .cp-header-title h3 { font-size: 16px; font-weight: 800; color: black; line-height: 1.2; }
                    .cp-header-title p { font-size: 11px; color: #1a1714; margin-top: 2px; font-weight: 500; }
                    .cp-header-actions { display: flex; align-items: center; gap: 8px; }
                    .cp-icon-btn { width: 36px; height: 36px; border-radius: 10px; background: #000; display: flex; align-items: center; justify-content: center; cursor: pointer; position: relative; }
                    .cp-icon-btn ion-icon { color: white; font-size: 18px; }
                    .cp-cart-badge { position: absolute; top: -5px; right: -5px; width: 18px; height: 18px; border-radius: 50%; background: var(--amber-light); color: var(--charcoal); font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; border: 2px solid var(--charcoal); }

                    /* ── Body layout ── */
                    .cp-body { display: flex; align-items: flex-start; }

                    /* ── Sidebar ── */
                    .cp-sidebar { width: 76px; flex-shrink: 0; background: var(--surface); border-right: 1px solid var(--border); min-height: calc(100vh - 64px); padding: 8px 0; }
                    .cp-sidebar-item { display: flex; flex-direction: column; align-items: center; padding: 10px 6px; cursor: pointer; transition: background 0.2s; border-left: 3px solid transparent; }
                    .cp-sidebar-item.active { background: var(--amber-pale); border-left-color: var(--amber); }
                    .cp-sidebar-item:not(.active):hover { background: var(--bg); }
                    .cp-sidebar-img { width: 46px; height: 46px; border-radius: 12px; object-fit: cover; border: 2px solid transparent; transition: border-color 0.2s; }
                    .cp-sidebar-item.active .cp-sidebar-img { border-color: var(--amber); }
                    .cp-sidebar-label { font-size: 9.5px; text-align: center; margin-top: 5px; color: var(--muted); line-height: 1.3; font-weight: 500; }
                    .cp-sidebar-item.active .cp-sidebar-label { color: var(--amber); font-weight: 600; }
                    .cp-sidebar-skeleton { width: 46px; height: 46px; border-radius: 12px; background: linear-gradient(90deg,#eee 25%,#f5f5f5 50%,#eee 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; margin: 10px auto; }
                    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

                    /* ── Products grid ── */
                    .cp-products { flex: 1; padding: 12px 10px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
                    .cp-empty { grid-column: 1 / -1; text-align: center; padding: 48px 16px; color: var(--muted); }
                    .cp-empty-icon { font-size: 48px; margin-bottom: 12px; }
                    .cp-empty p { font-size: 14px; font-weight: 600; color: var(--charcoal); }
                    .cp-empty span { font-size: 12px; margin-top: 4px; display: block; }
                    .cp-product-skeleton { border-radius: 16px; background: linear-gradient(90deg,#eee 25%,#f5f5f5 50%,#eee 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; height: 200px; }

                    /* ── Product card — IN STOCK ── */
                    .cp-product-card { background: var(--surface); border-radius: 16px; overflow: hidden; border: 1px solid var(--border); cursor: pointer; transition: transform 0.2s; position: relative; display: flex; flex-direction: column; }
                    .cp-product-card:active { transform: scale(0.97); }

                    /* ── Product card — OUT OF STOCK ── */
                    .cp-product-card.oos { cursor: default; }
                    .cp-product-card.oos:active { transform: none; }

                    .cp-img-wrap { position: relative; background: #F9F7F4; padding: 10px; display: flex; align-items: center; justify-content: center; height: 110px; }
                    .cp-product-card.oos .cp-img-wrap { background: #F0EEEB; }
                    .cp-product-img { width: 80px; height: 80px; object-fit: cover; border-radius: 12px; }
                    .cp-product-card.oos .cp-product-img { filter: grayscale(60%) opacity(0.55); }

                    /* OOS badge */
                    .cp-oos-badge {
                        position: absolute; bottom: 0; left: 0; right: 0;
                        background: rgba(30, 30, 30, 0.78);
                        color: #fff;
                        font-size: 9.5px; font-weight: 700;
                        text-align: center;
                        padding: 5px 4px;
                        letter-spacing: 0.04em;
                        text-transform: uppercase;
                        backdrop-filter: blur(2px);
                    }

                    /* Notify me button */
                    .cp-notify-btn {
                        background: transparent;
                        border: 1.5px solid #9B8E84;
                        color: #6B6461;
                        border-radius: 9px;
                        padding: 5px 8px;
                        font-size: 10px;
                        font-weight: 700;
                        cursor: pointer;
                        white-space: nowrap;
                        letter-spacing: 0.02em;
                        transition: all 0.18s;
                    }
                    .cp-notify-btn:active { background: #F0EEEB; }

                    .cp-product-info { padding: 8px 10px 10px; display: flex; flex-direction: column; flex: 1; }
                    .cp-product-name { font-size: 13px; font-weight: 600; color: var(--charcoal); line-height: 1.2; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                    .cp-product-card.oos .cp-product-name { color: #9B8E84; }
                    .cp-product-weight { font-size: 11px; color: var(--muted); margin-bottom: 8px; }
                    .cp-bottom-row { display: flex; align-items: center; justify-content: space-between; margin-top: auto; }
                    .cp-price { font-size: 15px; font-weight: 700; color: var(--charcoal); }
                    .cp-product-card.oos .cp-price { color: #9B8E84; }

                    /* ADD / qty buttons */
                    .cp-add-btn { background: white; border: 1.5px solid var(--amber); color: var(--amber); border-radius: 9px; padding: 5px 14px; font-size: 12px; font-weight: 700; cursor: pointer; letter-spacing: 0.04em; transition: all 0.18s; }
                    .cp-add-btn:active { background: var(--amber); color: white; transform: scale(0.95); }
                    .cp-qty-box { display: flex; align-items: center; gap: 6px; background: #0c831f; border-radius: 9px; padding: 4px 8px; }
                    .cp-qty-box button { background: none; border: none; color: white; font-size: 16px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; line-height: 1; }
                    .cp-qty-box span { color: white; font-size: 13px; font-weight: 700; min-width: 16px; text-align: center; }

                    /* ── Cart bar ── */
                    .cp-cart-bar { position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%); width: calc(100% - 32px); max-width: 420px; background: #0C831F; border-radius: 14px; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; z-index: 200; animation: slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1); }
                    @keyframes slideUp { from { transform: translateX(-50%) translateY(20px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }
                    .cp-cart-left { display: flex; align-items: center; gap: 10px; }
                    .cp-cart-icon { background: rgba(255,255,255,0.15); border-radius: 8px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; }
                    .cp-cart-icon ion-icon { color: white; font-size: 18px; }
                    .cp-cart-info strong { display: block; font-size: 13px; font-weight: 700; color: white; }
                    .cp-cart-info span { font-size: 12px; color: rgba(255,255,255,0.75); }
                    .cp-view-cart-btn { background: white; color: #0C831F; border: none; padding: 8px 16px; border-radius: 9px; font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; }

                    /* ── Cart modal ── */
                    .cp-cart-modal { height: 100%; display: flex; flex-direction: column; background: var(--bg); }
                    .cp-modal-header { background: var(--charcoal); padding: 18px 18px 16px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
                    .cp-modal-header h2 { font-size: 20px; font-weight: 800; color: white; }
                    .cp-modal-close { width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,0.1); color: white; font-size: 16px; display: flex; align-items: center; justify-content: center; cursor: pointer; border: none; }
                    .cp-modal-body { flex: 1; overflow-y: auto; padding: 12px 14px; }
                    .cp-cart-item-card { background: white; border-radius: 14px; padding: 12px; margin-bottom: 10px; display: flex; align-items: center; gap: 12px; border: 1px solid var(--border); }
                    .cp-cart-item-img { width: 58px; height: 58px; border-radius: 12px; object-fit: cover; flex-shrink: 0; background: var(--bg); }
                    .cp-cart-item-info { flex: 1; min-width: 0; }
                    .cp-cart-item-name { font-size: 14px; font-weight: 600; color: var(--charcoal); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                    .cp-cart-item-price { font-size: 14px; font-weight: 700; color: var(--charcoal); margin-top: 4px; }
                    .cp-bill { background: white; border-radius: 16px; padding: 16px; margin-top: 6px; border: 1px solid var(--border); }
                    .cp-bill h3 { font-size: 15px; font-weight: 700; color: var(--charcoal); margin-bottom: 12px; }
                    .cp-bill-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: 13px; color: #6B6461; border-bottom: 1px dashed #F0EBE5; }
                    .cp-bill-row:last-child { border-bottom: none; }
                    .cp-bill-row.total { font-size: 15px; font-weight: 700; color: var(--charcoal); padding-top: 10px; margin-top: 4px; border-top: 1.5px solid var(--border); }
                    .cp-cancel-note { background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 12px; padding: 10px 12px; margin-top: 10px; font-size: 11px; color: #92400E; line-height: 1.5; }
                    .cp-modal-bottom { background: white; border-top: 1px solid var(--border); padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
                    .cp-modal-total { font-size: 18px; font-weight: 800; color: var(--charcoal); }
                    .cp-modal-total span { font-size: 12px; color: var(--muted); font-weight: 400; display: block; margin-bottom: 1px; }
                    .cp-checkout-btn { border: none; padding: 12px 20px; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; color: white; }
                    .cp-checkout-btn.logged-in  { background: linear-gradient(135deg,#0C831F,#166534); }
                    .cp-checkout-btn.logged-out { background: linear-gradient(135deg,#E07B00,#B45309); }
                `}</style>

                <div className="cp-root">

                    {/* ── Header ── */}
                    <div className="cp-header">
                        <div className="cp-back-btn" onClick={() => router.goBack()}>
                            <IonIcon icon={arrowBackOutline} />
                        </div>
                        <div className="cp-header-title">
                            <h3>{categoryName}</h3>
                            <p>{filteredProducts.length} Products Available</p>
                        </div>
                        <div className="cp-header-actions">
                            <div className="cp-icon-btn" onClick={() => history.push("/search")}>
                                <IonIcon icon={searchOutline} />
                            </div>
                            <div className="cp-icon-btn" onClick={() => setShowCart(true)}>
                                <IonIcon icon={cartOutline} />
                                {totalItems > 0 && <div className="cp-cart-badge">{totalItems}</div>}
                            </div>
                        </div>
                    </div>

                    <div className="cp-body">

                        {/* ── Sidebar ── */}
                        <div className="cp-sidebar">
                            {subcatLoading ? (
                                [1,2,3,4,5].map(i => (
                                    <div key={i} style={{ padding: "10px 6px" }}>
                                        <div className="cp-sidebar-skeleton" />
                                    </div>
                                ))
                            ) : subcategories.length === 0 ? (
                                <div style={{ padding: "16px 6px", textAlign: "center" }}>
                                    <div style={{ fontSize: 22 }}>🗂️</div>
                                    <p style={{ fontSize: 9, color: "#9B8E84", marginTop: 4, lineHeight: 1.3 }}>
                                        No subcategories
                                    </p>
                                </div>
                            ) : (
                                subcategories.map(sub => (
                                    <div
                                        key={sub.id}
                                        className={`cp-sidebar-item ${sub.id === activeSubcat ? "active" : ""}`}
                                        onClick={() => setActiveSubcat(sub.id)}
                                    >
                                        <img
                                            src={sub.image ?? shop1}
                                            alt={sub.name}
                                            className="cp-sidebar-img"
                                            onError={(e) => { (e.target as HTMLImageElement).src = shop1; }}
                                        />
                                        <span className="cp-sidebar-label">{sub.name}</span>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* ── Products Grid ── */}
                        <div className="cp-products">
                            {productLoading ? (
                                [1,2,3,4].map(i => <div key={i} className="cp-product-skeleton" />)
                            ) : filteredProducts.length === 0 ? (
                                <div className="cp-empty">
                                    <div className="cp-empty-icon">📦</div>
                                    <p>No products found</p>
                                    <span>No items available in this category</span>
                                </div>
                            ) : (
                                filteredProducts.map(item => {
                                    const inStock = isInStock(item);
                                    return (
                                        <div
                                            key={item.id}
                                            className={`cp-product-card${inStock ? "" : " oos"}`}
                                            onClick={() => inStock ? router.push(`/product/${item.id}`) : undefined}
                                        >
                                            {/* Image wrap */}
                                            <div className="cp-img-wrap">
                                                <img
                                                    src={item.image ?? shop1}
                                                    alt={item.name}
                                                    className="cp-product-img"
                                                    onError={(e) => { (e.target as HTMLImageElement).src = shop1; }}
                                                />
                                                {!inStock && (
                                                    <div className="cp-oos-badge">Out of Stock</div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="cp-product-info">
                                                <div className="cp-product-name">{item.name}</div>
                                                <div className="cp-product-weight">{item.qty_label}</div>
                                                <div className="cp-bottom-row">
                                                    <div className="cp-price">₹{item.price}</div>

                                                    {inStock ? (
                                                        <div onClick={e => e.stopPropagation()}>
                                                            {getQty(item.id) === 0 ? (
                                                                <button
                                                                    className="cp-add-btn"
                                                                    onClick={() => increaseQty(item)}
                                                                >
                                                                    ADD
                                                                </button>
                                                            ) : (
                                                                <div className="cp-qty-box">
                                                                    <button onClick={() => decreaseQty(item.id)}>−</button>
                                                                    <span>{getQty(item.id)}</span>
                                                                    <button onClick={() => increaseQty(item)}>+</button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <button
                                                            className="cp-notify-btn"
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                // Optional: notify API call or toast
                                                            }}
                                                        >
                                                            Notify Me
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* ── Floating Cart Bar ── */}
                    {totalItems > 0 && (
                        <div className="cp-cart-bar">
                            <div className="cp-cart-left">
                                <div className="cp-cart-icon">
                                    <IonIcon icon={cartOutline} />
                                </div>
                                <div className="cp-cart-info">
                                    <strong>{totalItems} item{totalItems > 1 ? "s" : ""}</strong>
                                    <span>₹{itemsTotal}</span>
                                </div>
                            </div>
                            <button className="cp-view-cart-btn" onClick={handleViewCart}>
                                View Cart →
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Cart Modal ── */}
                <IonModal isOpen={showCart} onDidDismiss={() => setShowCart(false)}>
                    <div className="cp-cart-modal">
                        <div className="cp-modal-header">
                            <h2>🛒 My Cart</h2>
                            <button className="cp-modal-close" onClick={() => setShowCart(false)}>✕</button>
                        </div>
                        <div className="cp-modal-body">
                            {cart.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--muted)" }}>
                                    <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
                                    <p style={{ fontWeight: 600, color: "var(--charcoal)" }}>Your cart is empty</p>
                                    <p style={{ fontSize: 13, marginTop: 4 }}>Add items to get started</p>
                                </div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.id} className="cp-cart-item-card">
                                        <img
                                            src={item.img ?? shop1}
                                            alt={item.name}
                                            className="cp-cart-item-img"
                                            onError={(e) => { (e.target as HTMLImageElement).src = shop1; }}
                                        />
                                        <div className="cp-cart-item-info">
                                            <div className="cp-cart-item-name">{item.name}</div>
                                            <div className="cp-cart-item-price">₹{item.price * item.qty}</div>
                                        </div>
                                        <div className="cp-qty-box">
                                            <button onClick={() => decreaseQty(item.id)}>−</button>
                                            <span>{item.qty}</span>
                                            <button onClick={() => increaseQtyFromCart(item)}>+</button>
                                        </div>
                                    </div>
                                ))
                            )}

                            {cart.length > 0 && (
                                <>
                                    <div className="cp-bill">
                                        <h3>Bill Details</h3>
                                        <div className="cp-bill-row"><span>Items total</span><span>₹{itemsTotal}</span></div>
                                        <div className="cp-bill-row"><span>Delivery charge</span><span>₹{deliveryCharge}</span></div>
                                        <div className="cp-bill-row"><span>Handling charge</span><span>₹{handlingCharge}</span></div>
                                        {smallCartCharge > 0 && (
                                            <div className="cp-bill-row"><span>Small cart charge</span><span>₹{smallCartCharge}</span></div>
                                        )}
                                        <div className="cp-bill-row total"><span>Grand Total</span><span>₹{grandTotal}</span></div>
                                    </div>
                                    <div className="cp-cancel-note">
                                        ⚠️ Orders cannot be cancelled once packed. For any issues, please contact support immediately.
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="cp-modal-bottom">
                            <div className="cp-modal-total">
                                <span>Total</span>
                                ₹{grandTotal}
                            </div>
                            <button
                                className={`cp-checkout-btn ${isLoggedIn ? "logged-in" : "logged-out"}`}
                                onClick={handleCheckout}
                            >
                                {isLoggedIn ? "Proceed →" : "Login to Proceed →"}
                            </button>
                        </div>
                    </div>
                </IonModal>

            </IonContent>
        </IonPage>
    );
};

export default CategoryPage;