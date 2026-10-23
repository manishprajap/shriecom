import {
    IonPage,
    IonContent,
    IonIcon,
    IonModal
} from "@ionic/react";
import {
    arrowBackOutline, searchOutline, cartOutline,
    storefrontOutline, locationOutline, timeOutline,
    starOutline, funnelOutline, leafOutline
} from "ionicons/icons";
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
    vendor_id: number;
    vendor?: {
        id: number;
        name: string;
        shop_name?: string;
        address?: string;
        rating?: number;
        delivery_time?: string;
        logo?: string;
    };
    subcategory?: { id: number; name: string; image: string | null; };
}

interface VendorGroup {
    vendorId: number;
    vendorName: string;
    shopName: string;
    address: string;
    rating: number;
    deliveryTime: string;
    logo: string | null;
    products: ApiProduct[];
    isExpanded: boolean;
}

const BASE = "https://shriecom.in/appapis/shreefood/public/api";

/* ─── Main Page ─── */
const CategoryPage: React.FC = () => {
    const { id } = useParams<RouteParams>();
    const categoryId = parseInt(id);
    const router = useIonRouter();
    const history = useHistory();

    const [showCart, setShowCart] = useState(false);
    const [activeSubcat, setActiveSubcat] = useState<number | null>(null);
    const [subcategories, setSubcategories] = useState<ApiSubcategory[]>([]);
    const [products, setProducts] = useState<ApiProduct[]>([]);
    const [subcatLoading, setSubcatLoading] = useState(true);
    const [productLoading, setProductLoading] = useState(true);
    const [categoryName, setCategoryName] = useState("Category");
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [vendorGroups, setVendorGroups] = useState<VendorGroup[]>([]);

    useEffect(() => {
        const checkAuth = async () => {
            const token = await getToken();
            const user = await getUser();
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

    // Subcategories fetch
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

    // Products fetch
    useEffect(() => {
        setProductLoading(true);
        fetch(`${BASE}/product-list?category_id=${categoryId}&per_page=200&with=vendor`)
            .then(res => res.json())
            .then(json => {
                if (json.success) {
                    const data: ApiProduct[] = json.data.data ?? json.data;
                    const sorted = [...data].sort((a, b) => {
                        const aIn = a.quantity > 0;
                        const bIn = b.quantity > 0;
                        if (aIn && !bIn) return -1;
                        if (!aIn && bIn) return 1;
                        return 0;
                    });
                    setProducts(sorted);
                    if (sorted.length > 0 && (sorted[0] as any).category) {
                        setCategoryName((sorted[0] as any).category.name);
                    }
                    const groupMap = new Map<number, VendorGroup>();
                    sorted.forEach((product) => {
                        const vId = product.vendor_id ?? 0;
                        const vendor = product.vendor;
                        if (!groupMap.has(vId)) {
                            groupMap.set(vId, {
                                vendorId: vId,
                                vendorName: vendor?.name ?? `Vendor #${vId}`,
                                shopName: vendor?.shop_name ?? vendor?.name ?? `Store #${vId}`,
                                address: vendor?.address ?? "",
                                rating: vendor?.rating ?? 0,
                                deliveryTime: vendor?.delivery_time ?? "",
                                logo: vendor?.logo ?? null,
                                products: [],
                                isExpanded: false,
                            });
                        }
                        groupMap.get(vId)!.products.push(product);
                    });
                    setVendorGroups(Array.from(groupMap.values()));
                }
            })
            .catch(err => console.error("Product fetch error:", err))
            .finally(() => setProductLoading(false));
    }, [categoryId]);

    // Filtered groups based on active subcategory
    const filteredGroups: VendorGroup[] = vendorGroups.map(group => ({
        ...group,
        products: activeSubcat
            ? group.products.filter(p => p.subcategory_id === activeSubcat)
            : group.products,
    })).filter(group => group.products.length > 0);

    // Cart helpers
    const totalItems = cart.reduce((sum, i) => sum + i.qty, 0);
    const itemsTotal = cart.reduce((sum, i) => sum + i.qty * i.price, 0);
    const deliveryCharge = 25;
    const handlingCharge = 2;
    const smallCartCharge = itemsTotal > 0 && itemsTotal < 200 ? 20 : 0;
    const grandTotal = itemsTotal + deliveryCharge + handlingCharge + smallCartCharge;

    const getQty = (productId: number) => cart.find(i => i.id === productId)?.qty ?? 0;

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

    // ─── Navigate to ProductDetail on card click ───
    const openVendor = (group: VendorGroup) => {
        // Navigate to the first in-stock product; fallback to first product
        const firstProduct = group.products.find(p => p.quantity > 0) ?? group.products[0];
        if (firstProduct) {
            history.push(`/product/${firstProduct.id}`);
        }
    };

    return (
        <IonPage>
            <IonContent>
                <style>{`
                    :root {
                        --white: #FFFFFF;
                        --bg: #fffbeb;
                        --charcoal: #1C1C1C;
                        --red: #CB202D;
                        --green: #3D9B6B;
                        --green-dark: #1E7A4A;
                        --amber: #E07B00;
                        --muted: #696969;
                        --border: #E8E8E8;
                        --rating-green: #48c479;
                    }
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    .zp-root {
                        background: var(--bg);
                        min-height: 100vh;
                        padding-bottom: 100px;
                        font-family: 'Okra', -apple-system, BlinkMacSystemFont, sans-serif;
                    }

                    /* ── Header ── */
                    .zp-header {
                        position: sticky; top: 0; z-index: 100;
                        background: var(--bg);
                        padding: 12px 16px 0;
                        box-shadow: 0 1px 4px rgba(0,0,0,0.08);
                    }
                    .zp-header-top {
                        display: flex; align-items: center; gap: 10px;
                        padding-bottom: 12px;
                    }
                    .zp-back-btn {
                        width: 34px; height: 34px; border-radius: 50%;
                        background: var(--bg); border: none;
                        display: flex; align-items: center; justify-content: center;
                        cursor: pointer; flex-shrink: 0;
                    }
                    .zp-back-btn ion-icon { font-size: 20px; color: var(--charcoal); }
                    .zp-header-title { flex: 1; }
                    .zp-header-title h3 {
                        font-size: 18px; font-weight: 700; color: var(--charcoal);
                        line-height: 1.2;
                    }
                    .zp-header-title p {
                        font-size: 12px; color: var(--muted);
                        margin-top: 1px;
                    }
                    .zp-header-actions { display: flex; gap: 6px; }
                    .zp-icon-btn {
                        width: 34px; height: 34px; border-radius: 50%;
                        background: var(--bg); border: none;
                        display: flex; align-items: center; justify-content: center;
                        cursor: pointer; position: relative;
                    }
                    .zp-icon-btn ion-icon { font-size: 20px; color: var(--charcoal); }
                    .zp-cart-badge {
                        position: absolute; top: -2px; right: -2px;
                        width: 16px; height: 16px; border-radius: 50%;
                        background: var(--red); color: white;
                        font-size: 9px; font-weight: 700;
                        display: flex; align-items: center; justify-content: center;
                    }

                    /* ── Filter chips row ── */
                    .zp-filter-row {
                        display: flex; align-items: center; gap: 8px;
                        padding: 0 0 12px;
                        overflow-x: auto;
                        -webkit-overflow-scrolling: touch;
                        scrollbar-width: none;
                    }
                    .zp-filter-row::-webkit-scrollbar { display: none; }
                    .zp-chip {
                        display: inline-flex; align-items: center; gap: 5px;
                        padding: 6px 14px; border-radius: 20px;
                        font-size: 13px; font-weight: 600;
                        white-space: nowrap; cursor: pointer;
                        transition: all 0.18s; border: 1.5px solid var(--border);
                        background: var(--white); color: var(--charcoal);
                        flex-shrink: 0;
                    }
                    .zp-chip.active {
                        background: var(--charcoal); color: white;
                        border-color: var(--charcoal);
                    }
                    .zp-chip ion-icon { font-size: 14px; }
                    .zp-chip--subcat.active {
                        background: var(--red); border-color: var(--red); color: white;
                    }

                    /* ── Section header ── */
                    .zp-section-title {
                        padding: 16px 16px 8px;
                        font-size: 20px; font-weight: 700; color: var(--charcoal);
                    }

                    /* ── Restaurant Grid ── */
                    .zp-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 2px;
                        padding: 0 0 8px;
                    }
                    @media (max-width: 340px) {
                        .zp-grid { grid-template-columns: 1fr; }
                    }

                    /* ── Restaurant Card ── */
                    .zrc-card {
                        background: var(--white);
                        cursor: pointer;
                        overflow: hidden;
                        transition: transform 0.15s;
                        margin: 6px 8px;
                        padding: 4px;
                        border-radius: 16px;
                        border: 1px solid var(--border);
                        box-shadow: 0 1px 4px rgba(0,0,0,0.06);
                    }
                    .zrc-card:active { transform: scale(0.97); }

                    /* Cover image */
                    .zrc-img-wrap {
                        position: relative;
                        width: 100%; height: 130px;
                        overflow: hidden; border-radius: 16px 16px 0 0;
                        background: #eee;
                    }
                    .zrc-cover-img {
                        width: 100%; height: 100%;
                        object-fit: cover;
                        transition: transform 0.3s;
						 opacity: 0.;
                    }
                    /* Black transparent overlay - image clear rahe, upar se black tint */
                    .zrc-img-overlay {
                        position: absolute; inset: 0;
                        background: rgba(0, 0, 0, 0.35);
                        border-radius: 16px 16px 0 0;
                        pointer-events: none;
                    }

                    /* Discount badge */
                    .zrc-discount-badge {
                        position: absolute; bottom: 0; left: 0;
                        background: rgba(20,20,20,0.82);
                        color: white; font-size: 10px; font-weight: 700;
                        padding: 4px 10px;
                        border-radius: 0 8px 0 0;
                        letter-spacing: 0.02em;
                    }

                    /* Closed overlay */
                    .zrc-closed-overlay {
                        position: absolute; inset: 0;
                        background: rgba(255,255,255,0.75);
                        display: flex; align-items: center; justify-content: center;
                    }
                    .zrc-closed-overlay span {
                        background: var(--charcoal); color: white;
                        font-size: 11px; font-weight: 700;
                        padding: 5px 12px; border-radius: 20px;
                        letter-spacing: 0.05em;
                    }

                    /* Card body */
                    .zrc-body { padding: 10px 10px 12px; }
                    .zrc-top-row {
                        display: flex; align-items: flex-start;
                        justify-content: space-between; gap: 6px;
                        margin-bottom: 3px;
                    }
                    .zrc-name {
                        font-size: 13px; font-weight: 700; color: var(--charcoal);
                        line-height: 1.3;
                        display: -webkit-box;
                        -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                        flex: 1;
                    }
                    .zrc-rating {
                        display: inline-flex; align-items: center; gap: 3px;
                        background: var(--rating-green); color: white;
                        font-size: 11px; font-weight: 700;
                        padding: 3px 6px; border-radius: 6px; flex-shrink: 0;
                    }
                    .zrc-rating ion-icon { font-size: 11px; }
                    .zrc-cuisine {
                        font-size: 11px; color: var(--muted);
                        margin-bottom: 6px;
                        display: -webkit-box;
                        -webkit-line-clamp: 1;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                    }
                    .zrc-meta-row {
                        display: flex; align-items: center; gap: 4px;
                        font-size: 11px; color: var(--muted);
                    }
                    .zrc-meta-item {
                        display: inline-flex; align-items: center; gap: 2px;
                    }
                    .zrc-meta-item ion-icon { font-size: 11px; }
                    .zrc-dot { color: #ccc; }

                    /* ── Skeleton ── */
                    @keyframes shimmer {
                        0%  { background-position: 200% 0; }
                        100%{ background-position: -200% 0; }
                    }
                    .zp-skeleton-grid {
                        display: grid; grid-template-columns: 1fr 1fr;
                        gap: 2px; padding: 6px 6px;
                    }
                    .zp-skel-card {
                        margin: 6px; border-radius: 16px; overflow: hidden;
                        border: 1px solid var(--border);
                        background: white;
                    }
                    .zp-skel-img {
                        height: 130px;
                        background: linear-gradient(90deg,#eee 25%,#f5f5f5 50%,#eee 75%);
                        background-size: 200% 100%; animation: shimmer 1.4s infinite;
                    }
                    .zp-skel-body { padding: 10px; }
                    .zp-skel-line {
                        height: 12px; border-radius: 6px; margin-bottom: 8px;
                        background: linear-gradient(90deg,#eee 25%,#f5f5f5 50%,#eee 75%);
                        background-size: 200% 100%; animation: shimmer 1.4s infinite;
                    }

                    /* ── Empty ── */
                    .zp-empty {
                        text-align: center; padding: 60px 24px; color: var(--muted);
                    }
                    .zp-empty-icon { font-size: 52px; margin-bottom: 12px; }
                    .zp-empty p { font-size: 16px; font-weight: 700; color: var(--charcoal); }
                    .zp-empty span { font-size: 13px; margin-top: 6px; display: block; }

                    /* ── Floating Cart Bar ── */
                    .zp-cart-bar {
                        position: fixed; bottom: 0; left: 0; right: 0;
                        background: var(--red);
                        padding: 14px 20px;
                        display: flex; align-items: center; justify-content: space-between;
                        z-index: 300;
                        animation: slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1);
                    }
                    @keyframes slideUp {
                        from { transform: translateY(100%); opacity: 0; }
                        to   { transform: translateY(0); opacity: 1; }
                    }
                    .zp-cart-left { display: flex; align-items: center; gap: 10px; }
                    .zp-cart-icon {
                        background: rgba(255,255,255,0.2); border-radius: 8px;
                        width: 34px; height: 34px;
                        display: flex; align-items: center; justify-content: center;
                    }
                    .zp-cart-icon ion-icon { color: white; font-size: 18px; }
                    .zp-cart-info strong { display: block; font-size: 13px; font-weight: 700; color: white; }
                    .zp-cart-info span { font-size: 11px; color: rgba(255,255,255,0.8); }
                    .zp-view-btn {
                        background: white; color: var(--red); border: none;
                        padding: 9px 18px; border-radius: 8px;
                        font-size: 13px; font-weight: 700; cursor: pointer;
                    }

                    /* ── Cart Modal ── */
                    .zp-cart-modal { height: 100%; display: flex; flex-direction: column; background: var(--bg); }
                    .zp-cart-modal-header {
                        background: var(--white); padding: 18px 16px 16px;
                        display: flex; align-items: center; justify-content: space-between;
                        flex-shrink: 0; border-bottom: 1px solid var(--border);
                    }
                    .zp-cart-modal-header h2 { font-size: 20px; font-weight: 800; color: var(--charcoal); }
                    .zp-cart-modal-close {
                        width: 30px; height: 30px; border-radius: 50%;
                        background: var(--bg); color: var(--charcoal);
                        border: none; font-size: 16px; font-weight: 700;
                        display: flex; align-items: center; justify-content: center; cursor: pointer;
                    }
                    .zp-cart-body { flex: 1; overflow-y: auto; padding: 12px 14px; }
                    .zp-cart-item {
                        background: white; border-radius: 14px; padding: 12px; margin-bottom: 10px;
                        display: flex; align-items: center; gap: 12px; border: 1px solid var(--border);
                    }
                    .zp-cart-item-img {
                        width: 56px; height: 56px; border-radius: 10px; object-fit: cover;
                        flex-shrink: 0;
                    }
                    .zp-cart-item-info { flex: 1; min-width: 0; }
                    .zp-cart-item-name {
                        font-size: 14px; font-weight: 600; color: var(--charcoal);
                        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                    }
                    .zp-cart-item-price { font-size: 14px; font-weight: 700; color: var(--charcoal); margin-top: 3px; }
                    .zp-bill {
                        background: white; border-radius: 14px; padding: 14px;
                        margin-top: 6px; border: 1px solid var(--border);
                    }
                    .zp-bill h3 { font-size: 14px; font-weight: 700; color: var(--charcoal); margin-bottom: 10px; }
                    .zp-bill-row {
                        display: flex; justify-content: space-between;
                        padding: 6px 0; font-size: 13px; color: var(--muted);
                        border-bottom: 1px dashed #eee;
                    }
                    .zp-bill-row:last-child { border-bottom: none; }
                    .zp-bill-row.total {
                        font-size: 15px; font-weight: 700; color: var(--charcoal);
                        padding-top: 10px; margin-top: 4px; border-top: 1.5px solid var(--border);
                    }
                    .zp-cart-bottom {
                        background: white; border-top: 1px solid var(--border);
                        padding: 14px 16px;
                        display: flex; align-items: center; justify-content: space-between;
                        flex-shrink: 0;
                    }
                    .zp-cart-total { font-size: 18px; font-weight: 800; color: var(--charcoal); }
                    .zp-cart-total span { font-size: 12px; color: var(--muted); font-weight: 400; display: block; }
                    .zp-checkout-btn {
                        border: none; padding: 12px 20px; border-radius: 10px;
                        font-size: 14px; font-weight: 700; cursor: pointer; color: white;
                    }
                    .zp-checkout-btn.in  { background: var(--green-dark); }
                    .zp-checkout-btn.out { background: var(--red); }

                    /* ── Qty control (used in cart modal) ── */
                    .zp-qty-ctrl {
                        display: flex; align-items: center; gap: 8px;
                        background: var(--green-dark); border-radius: 8px; padding: 6px 10px;
                    }
                    .zp-qty-ctrl button {
                        background: none; border: none; color: white;
                        font-size: 16px; font-weight: 700; cursor: pointer;
                        line-height: 1; padding: 0;
                        display: flex; align-items: center; justify-content: center;
                    }
                    .zp-qty-ctrl span {
                        color: white; font-size: 13px; font-weight: 700;
                        min-width: 16px; text-align: center;
                    }
                `}</style>

                <div className="zp-root">

                    {/* ── Header ── */}
                    <div className="zp-header">
                        <div className="zp-header-top">
                            <button className="zp-back-btn" onClick={() => router.goBack()}>
                                <IonIcon icon={arrowBackOutline} />
                            </button>
                            <div className="zp-header-title">
                                <h3>{categoryName}</h3>
                                <p>
                                    {filteredGroups.reduce((s, g) => s + g.products.length, 0)} products · {filteredGroups.length} store{filteredGroups.length !== 1 ? "s" : ""}
                                </p>
                            </div>
                            <div className="zp-header-actions">
                                <button className="zp-icon-btn" onClick={() => history.push("/search")}>
                                    <IonIcon icon={searchOutline} />
                                </button>
                                <button className="zp-icon-btn" onClick={() => setShowCart(true)}>
                                    <IonIcon icon={cartOutline} />
                                    {totalItems > 0 && <div className="zp-cart-badge">{totalItems}</div>}
                                </button>
                            </div>
                        </div>

                        {/* ── Subcategory chips ── */}
                        <div className="zp-filter-row">
                            {!subcatLoading && subcategories.map(sub => (
                                <div
                                    key={sub.id}
                                    className={`zp-chip zp-chip--subcat ${sub.id === activeSubcat ? "active" : ""}`}
                                    onClick={() => setActiveSubcat(sub.id)}
                                >
                                    {sub.name}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Section title ── */}
                    {!productLoading && filteredGroups.length > 0 && (
                        <div className="zp-section-title">
                            {filteredGroups.length} Store{filteredGroups.length !== 1 ? "s" : ""} Near You
                        </div>
                    )}

                    {/* ── Restaurant Grid ── */}
                    {productLoading ? (
                        <div className="zp-skeleton-grid">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="zp-skel-card">
                                    <div className="zp-skel-img" />
                                    <div className="zp-skel-body">
                                        <div className="zp-skel-line" style={{ width: "80%" }} />
                                        <div className="zp-skel-line" style={{ width: "55%" }} />
                                        <div className="zp-skel-line" style={{ width: "40%" }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredGroups.length === 0 ? (
                        <div className="zp-empty">
                            <div className="zp-empty-icon">🏪</div>
                            <p>No stores found</p>
                            <span>Try a different category</span>
                        </div>
                    ) : (
                        <div className="zp-grid">
                            {filteredGroups.map(group => {
                                const inStockCount = group.products.filter(p => p.quantity > 0).length;
                                const minPrice = group.products.length > 0
                                    ? Math.min(...group.products.map(p => p.price)) : 0;
                                const coverImg = group.products.find(p => p.image)?.image ?? null;

                                return (
                                    <div
                                        key={group.vendorId}
                                        className="zrc-card"
                                        onClick={() => openVendor(group)}
                                    >
                                        {/* Cover Image */}
                                        <div className="zrc-img-wrap">
                                            <img
                                                src={coverImg ?? shop1}
                                                alt={group.shopName}
                                                className="zrc-cover-img"
                                                onError={(e) => { (e.target as HTMLImageElement).src = shop1; }}
                                            />
                                            {/* Black transparent overlay */}
                                            <div className="zrc-img-overlay" />
                                            {inStockCount > 0 && (
                                                <div className="zrc-discount-badge">
                                                    {inStockCount} Items
                                                </div>
                                            )}
                                            {inStockCount === 0 && (
                                                <div className="zrc-closed-overlay">
                                                    <span>Unavailable</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Card Body */}
                                        <div className="zrc-body">
                                            <div className="zrc-top-row">
                                                <div className="zrc-name">{group.shopName || group.vendorName}</div>
                                                {group.rating > 0 && (
                                                    <div className="zrc-rating">
                                                        <IonIcon icon={starOutline} />
                                                        <span>{group.rating.toFixed(1)}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="zrc-cuisine">
                                                {group.products.slice(0, 2).map(p => p.subcategory?.name).filter(Boolean).join(", ")
                                                    || group.address || "Fresh Products"}
                                            </div>
                                            <div className="zrc-meta-row">
                                                {minPrice > 0 && (
                                                    <span className="zrc-meta-item">₹{minPrice} min</span>
                                                )}
                                                {minPrice > 0 && group.deliveryTime && (
                                                    <span className="zrc-dot">·</span>
                                                )}
                                                {group.deliveryTime && (
                                                    <span className="zrc-meta-item">
                                                        <IonIcon icon={timeOutline} />
                                                        {group.deliveryTime}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ── Floating Cart Bar ── */}
                    {totalItems > 0 && (
                        <div className="zp-cart-bar">
                            <div className="zp-cart-left">
                                <div className="zp-cart-icon">
                                    <IonIcon icon={cartOutline} />
                                </div>
                                <div className="zp-cart-info">
                                    <strong>{totalItems} item{totalItems > 1 ? "s" : ""}</strong>
                                    <span>₹{itemsTotal}</span>
                                </div>
                            </div>
                            <button className="zp-view-btn" onClick={handleViewCart}>
                                View Cart →
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Cart Modal ── */}
                <IonModal isOpen={showCart} onDidDismiss={() => setShowCart(false)}>
                    <div className="zp-cart-modal">
                        <div className="zp-cart-modal-header">
                            <h2>My Cart</h2>
                            <button className="zp-cart-modal-close" onClick={() => setShowCart(false)}>✕</button>
                        </div>
                        <div className="zp-cart-body">
                            {cart.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "60px 24px", color: "var(--muted)" }}>
                                    <div style={{ fontSize: 52, marginBottom: 12 }}>🛒</div>
                                    <p style={{ fontWeight: 700, fontSize: 16, color: "var(--charcoal)" }}>Your cart is empty</p>
                                    <p style={{ fontSize: 13, marginTop: 6 }}>Add items from a store</p>
                                </div>
                            ) : (
                                <>
                                    {cart.map(item => (
                                        <div key={item.id} className="zp-cart-item">
                                            <img
                                                src={item.img ?? shop1}
                                                alt={item.name}
                                                className="zp-cart-item-img"
                                                onError={(e) => { (e.target as HTMLImageElement).src = shop1; }}
                                            />
                                            <div className="zp-cart-item-info">
                                                <div className="zp-cart-item-name">{item.name}</div>
                                                <div className="zp-cart-item-price">₹{item.price * item.qty}</div>
                                            </div>
                                            <div className="zp-qty-ctrl">
                                                <button onClick={() => decreaseQty(item.id)}>−</button>
                                                <span>{item.qty}</span>
                                                <button onClick={() => increaseQtyFromCart(item)}>+</button>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="zp-bill">
                                        <h3>Bill Details</h3>
                                        <div className="zp-bill-row"><span>Items total</span><span>₹{itemsTotal}</span></div>
                                        <div className="zp-bill-row"><span>Delivery charge</span><span>₹{deliveryCharge}</span></div>
                                        <div className="zp-bill-row"><span>Handling charge</span><span>₹{handlingCharge}</span></div>
                                        {smallCartCharge > 0 && (
                                            <div className="zp-bill-row"><span>Small cart fee</span><span>₹{smallCartCharge}</span></div>
                                        )}
                                        <div className="zp-bill-row total"><span>Grand Total</span><span>₹{grandTotal}</span></div>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="zp-cart-bottom">
                            <div className="zp-cart-total">
                                <span>Total</span>
                                ₹{grandTotal}
                            </div>
                            <button
                                className={`zp-checkout-btn ${isLoggedIn ? "in" : "out"}`}
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