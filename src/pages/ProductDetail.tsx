import {
    IonPage,
    IonContent,
    IonIcon,
    IonModal, // ✅ NEW
} from "@ionic/react";
import { arrowBackOutline, cartOutline, chevronForwardOutline, chevronDownOutline, chevronUpOutline, chatbubbleEllipsesOutline } from "ionicons/icons"; // ✅ chatbubbleEllipsesOutline added
import { useIonRouter } from "@ionic/react";
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import shop1 from "../assets/shop1.jpg";
import { getToken, getUser } from "../hooks/useAuth";
import EnquiryModal from "../components/EnquiryModal"; // ✅ NEW

const BASE = "https://shriecom.in/appapis/shreefood/public/api";

interface UnifiedProduct {
    id: number;
    name: string;
    price: number;
    mrp?: number | null;
    image: string;
    details?: string | null;
    qty_label?: string | null;
    description?: string;
    quantity?: number;
    category_id?: number | null;
    subcategory_id?: number | null;
    delivery_type?: 'cod' | 'online' | 'both';
    category?: { id: number; name: string; image?: string | null } | null;
    subcategory?: { id: number; name: string; image?: string | null } | null;
    sellerName?: string | null;
    discountPercent?: number | null;
    source: 'vendor' | 'seller';
}

type CartItem = {
    id: number; name: string; price: number;
    img: string; qty: number; type: "vendor" | "seller";
    weight?: string;
};

const sameCartLine = (item: { id: number; weight?: string }, id: number, weight?: string) =>
    item.id === id && (item.weight ?? "") === (weight ?? "");

const stripHtml = (html?: string | null): string => {
    if (!html) return "—";
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
};

const parseUnitOptions = (qtyLabel?: string | null): string[] => {
    if (!qtyLabel) return [];
    return qtyLabel
        .split(",")
        .map(u => u.trim())
        .filter(Boolean);
};

const parseUnitToBase = (label: string): number | null => {
    const match = label.trim().toLowerCase().match(/^([\d.]+)\s*(kg|kgs|g|gram|grams|ltr|litre|liter|l|ml)?$/i);
    if (!match) return null;
    const value = parseFloat(match[1]);
    if (isNaN(value)) return null;
    const unit = match[2] || "g";
    if (unit === "kg" || unit === "kgs") return value * 1000;
    if (unit === "ltr" || unit === "litre" || unit === "liter" || unit === "l") return value * 1000;
    return value;
};

const mapVendorProduct = (p: any): UnifiedProduct => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    mrp: p.mrp ? Number(p.mrp) : null,
    image: p.image_url || p.image,
    details: p.details,
    qty_label: p.qty_label,
    description: p.description,
    quantity: p.quantity,
    category_id: p.category_id,
    subcategory_id: p.subcategory_id,
    delivery_type: p.delivery_type,
    category: p.category ? { id: p.category.id, name: p.category.name } : null,
    subcategory: p.subcategory ? { id: p.subcategory.id, name: p.subcategory.name } : null,
    sellerName: p.vendor?.shop_name ?? p.vendor?.name ?? null,
    discountPercent: null,
    source: 'vendor',
});

const mapSellerProduct = (p: any, discountPercent: number | null = null): UnifiedProduct => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    mrp: p.discount_price ? Number(p.discount_price) : null,
    image: p.image_url,
    details: null,
    qty_label: null,
    description: p.description,
    quantity: p.stock,
    category_id: p.category_id,
    subcategory_id: p.subcategory_id,
    delivery_type: undefined,
    category: p.category ? { id: p.category.id, name: p.category.name, image: p.category.image_url } : null,
    subcategory: p.subcategory ? { id: p.subcategory.id, name: p.subcategory.name } : null,
    sellerName: p.seller?.name ?? null,
    discountPercent,
    source: 'seller',
});

const ProductDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const router = useIonRouter();
    const history = useHistory();

    const [product,         setProduct]         = useState<UnifiedProduct | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<UnifiedProduct[]>([]);
    const [alsoProducts,    setAlsoProducts]    = useState<UnifiedProduct[]>([]);
    const [loading,         setLoading]         = useState(true);

    const [keyInfoOpen, setKeyInfoOpen] = useState(true);
    const [infoOpen,    setInfoOpen]    = useState(false);

    const [selectedUnit, setSelectedUnit] = useState<string>("");

    const [showEnquiry, setShowEnquiry] = useState(false); // ✅ NEW

    const [isLoggedIn, setIsLoggedIn] = useState(false);
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

    const productId  = parseInt(id);
    const totalItems = cart.reduce((sum, i) => sum + i.qty, 0);
    const itemsTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

    const getQty = (pid: number, weight?: string) =>
        cart.find(i => sameCartLine(i, pid, weight))?.qty ?? 0;

    const handleViewCart = () => history.push("/cart");

    const unitOptions = parseUnitOptions(product?.qty_label);

    const getUnitPricing = (unit: string): { price: number; mrp: number | null } => {
        if (!product) return { price: 0, mrp: null };
        const baseUnit = unitOptions[0];
        if (!baseUnit || unit === baseUnit) {
            return { price: product.price, mrp: product.mrp ?? null };
        }
        const baseGrams = parseUnitToBase(baseUnit);
        const targetGrams = parseUnitToBase(unit);
        if (!baseGrams || !targetGrams) {
            return { price: product.price, mrp: product.mrp ?? null };
        }
        const ratio = targetGrams / baseGrams;
        return {
            price: Math.round(product.price * ratio),
            mrp: product.mrp ? Math.round(product.mrp * ratio) : null,
        };
    };

    const selectedPricing = product ? getUnitPricing(selectedUnit || unitOptions[0] || "") : { price: 0, mrp: null };

    const qty = getQty(productId, selectedUnit);

    useEffect(() => {
        if (product?.qty_label) {
            const options = parseUnitOptions(product.qty_label);
            setSelectedUnit(options[0] ?? "");
        } else {
            setSelectedUnit("");
        }
    }, [product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setProduct(null);
        setRelatedProducts([]);
        setAlsoProducts([]);

        fetch(`${BASE}/product/${productId}`)
            .then(r => r.json())
            .then(json => {
                if (cancelled) return;

                if (json.success) {
                    const p = mapVendorProduct(json.data);
                    setProduct(p);

                    fetch(`${BASE}/product-list?category_id=${p.category_id}&per_page=20`)
                        .then(r2 => r2.json())
                        .then(j2 => {
                            if (cancelled || !j2.success) return;
                            const all: any[] = j2.data.data ?? j2.data;
                            const others = all.filter((x: any) => x.id !== p.id).map(mapVendorProduct);
                            setRelatedProducts(others.slice(0, 6));
                            setAlsoProducts(others.slice(6, 12));
                        })
                        .finally(() => { if (!cancelled) setLoading(false); });
                    return;
                }

                fetch(`${BASE}/products/${productId}/detail`)
                    .then(r2 => r2.json())
                    .then(j2 => {
                        if (cancelled) return;

                        if (j2.status) {
                            const p = mapSellerProduct(j2.data, j2.discount_percent ?? null);
                            setProduct(p);

                            fetch(`${BASE}/products/by-category?category_id=${p.category_id}`)
                                .then(r3 => r3.json())
                                .then(j3 => {
                                    if (cancelled || !j3.status) return;
                                    const rows: any[] = j3.data?.data ?? [];
                                    const others = rows.filter((x: any) => x.id !== p.id).map((row: any) => mapSellerProduct(row));
                                    setRelatedProducts(others.slice(0, 6));
                                    setAlsoProducts(others.slice(6, 12));
                                })
                                .finally(() => { if (!cancelled) setLoading(false); });
                        } else {
                            setLoading(false);
                        }
                    })
                    .catch(err => { console.error(err); if (!cancelled) setLoading(false); });
            })
            .catch(err => { console.error(err); if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [productId]);

    const addItem = (item: UnifiedProduct, weight?: string, priceOverride?: number) => {
        const itemWeight = weight ?? parseUnitOptions(item.qty_label)[0] ?? "1 pc";
        const itemPrice  = priceOverride ?? item.price;

        setCart(prev => {
            const exists = prev.find(i => sameCartLine(i, item.id, itemWeight));
            const updated = exists
                ? prev.map(i => sameCartLine(i, item.id, itemWeight) ? { ...i, qty: i.qty + 1 } : i)
                : [...prev, {
                    id: item.id,
                    name: item.name,
                    price: itemPrice,
                    img: item.image,
                    qty: 1,
                    type: item.source,
                    weight: itemWeight,
                }];
            localStorage.setItem("cart", JSON.stringify(updated));
            return updated;
        });
    };

    const removeItem = (pid: number, weight?: string) => {
        setCart(prev => {
            const updated = prev
                .map(i => sameCartLine(i, pid, weight) ? { ...i, qty: i.qty - 1 } : i)
                .filter(i => i.qty > 0);
            localStorage.setItem("cart", JSON.stringify(updated));
            return updated;
        });
    };

    const weightLabel = (item: UnifiedProduct) => {
        const options = parseUnitOptions(item.qty_label);
        return options[0] || item.details || "1 pc";
    };

    return (
        <IonPage>
            <IonContent>
                <style>{`
                    :root {
                        --bg: #F7F5F2; --surface: #fff;
                        --charcoal: #1A1714; --amber: #E07B00;
                        --green: #0C831F; --muted: #9B8E84; --border: #EAE5DF;
                    }
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    .pd-root {
                        font-family: 'DM Sans', system-ui, sans-serif;
                        background: var(--bg); min-height: 100vh; padding-bottom: 160px;
                    }
                    .pd-center { width: 100%; max-width: 720px; margin: 0 auto; }

                    .pd-header {
                        position: sticky; top: 0; z-index: 200;
                        background: #f8cb46; padding: 14px 16px;
                        display: flex; align-items: center; gap: 12px;
                    }
                    .pd-back {
                        width: 36px; height: 36px; border-radius: 10px;
                        background: rgba(4,4,4,0.86);
                        display: flex; align-items: center; justify-content: center;
                        border: 1px solid rgba(255,255,255,0.12); cursor: pointer;
                        flex-shrink: 0; transition: background 0.2s;
                    }
                    .pd-back:active { background: rgba(7,6,6,0.95); }
                    .pd-back ion-icon { color: #fff; font-size: 18px; }
                    .pd-header-label { font-size: 15px; font-weight: 700; color: #000; }

                    .pd-hero { background: #fff; position: relative; overflow: hidden; }
                    .pd-hero img {
                        width: 100%; height: clamp(220px, 40vw, 320px);
                        object-fit: cover; display: block;
                    }
                    .pd-hero-overlay {
                        position: absolute; bottom: 0; left: 0; right: 0; height: 80px;
                        background: linear-gradient(to top, rgba(0,0,0,0.18) 0%, transparent 100%);
                        pointer-events: none;
                    }
                    .pd-dots {
                        position: absolute; bottom: 10px; left: 50%;
                        transform: translateX(-50%); display: flex; gap: 5px;
                    }
                    .pd-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.5); }
                    .pd-dot.a { background: #fff; width: 18px; border-radius: 3px; }

                    .pd-namebox {
                        background: #fff; padding: 14px 16px 14px;
                        border-bottom: 6px solid var(--bg);
                    }
                    .pd-pname {
                        font-size: 18px; font-weight: 800; color: var(--charcoal);
                        margin-bottom: 12px; line-height: 1.3;
                    }

                    .pd-units-section { margin-bottom: 14px; }
                    .pd-units-label {
                        font-size: 12px; color: var(--muted); font-weight: 700;
                        text-transform: uppercase; letter-spacing: 0.03em;
                        margin-bottom: 8px;
                    }
                    .pd-units-row { display: flex; gap: 10px; flex-wrap: wrap; }
                    .pd-unit-chip {
                        display: flex; flex-direction: column; align-items: flex-start; gap: 4px;
                        border: 1.5px solid var(--border);
                        background: #fff; color: var(--charcoal);
                        min-width: 84px;
                        padding: 9px 16px; border-radius: 10px;
                        cursor: pointer; font-family: 'DM Sans', sans-serif;
                        transition: all 0.15s;
                    }
                    .pd-unit-weight { font-size: 13px; font-weight: 700; color: var(--charcoal); }
                    .pd-unit-price { font-size: 13px; font-weight: 700; color: var(--charcoal); }
                    .pd-unit-chip.active {
                        border-color: var(--green);
                        background: #F0FAF1;
                    }
                    .pd-unit-chip.active .pd-unit-weight,
                    .pd-unit-chip.active .pd-unit-price {
                        color: var(--green);
                    }

                    .pd-badges {
                        display: flex; border: 1px solid var(--border);
                        border-radius: 12px; overflow: hidden;
                    }
                    .pd-badge {
                        flex: 1; display: flex; flex-direction: column;
                        align-items: center; justify-content: center;
                        padding: 10px 4px; gap: 3px;
                        border-right: 1px solid var(--border); background: #fff;
                    }
                    .pd-badge:last-child { border-right: none; }
                    .pd-badge-icon { font-size: 20px; line-height: 1; }
                    .pd-badge-val { font-size: 12px; font-weight: 700; color: var(--charcoal); }
                    .pd-badge-label { font-size: 9px; color: var(--muted); text-align: center; line-height: 1.3; }

                    /* ✅ NEW — Ask a question button */
                    .pd-ask-btn {
                        width: 100%;
                        display: flex; align-items: center; justify-content: center; gap: 8px;
                        margin-top: 12px;
                        background: #FFF7ED;
                        border: 1.5px dashed var(--amber);
                        color: var(--amber);
                        padding: 11px;
                        border-radius: 10px;
                        font-size: 13.5; font-weight: 700;
                        cursor: pointer;
                        font-family: 'DM Sans', sans-serif;
                    }
                    .pd-ask-btn ion-icon { font-size: 16px; }

                    .pd-accordion { background: #fff; border-bottom: 6px solid var(--bg); }
                    .pd-acc-row {
                        display: flex; align-items: center; justify-content: space-between;
                        padding: 14px 16px; cursor: pointer;
                        border-bottom: 1px solid var(--border); user-select: none;
                    }
                    .pd-acc-title { font-size: 14px; font-weight: 700; color: var(--charcoal); }
                    .pd-acc-body { padding: 4px 16px 14px; }

                    .pd-info-row {
                        display: flex; gap: 10px; padding: 10px 0;
                        border-bottom: 1px dashed var(--border); font-size: 13px;
                    }
                    .pd-info-row:last-child { border-bottom: none; }
                    .pd-info-key { color: #211f1e; min-width: 130px; flex-shrink: 0; font-weight: 600; }
                    .pd-info-val { color: var(--charcoal); font-weight: 500; line-height: 1.5; flex: 1; }

                    .pd-sec { background: #fff; margin-bottom: 8px; }
                    .pd-sec-hd {
                        display: flex; align-items: center; justify-content: space-between;
                        padding: 14px 16px 10px;
                    }
                    .pd-sec-title { font-size: 15px; font-weight: 800; color: var(--charcoal); }
                    .pd-seeall {
                        display: flex; align-items: center; gap: 3px;
                        background: #EFF6FF; color: #2563EB;
                        font-size: 12px; font-weight: 600;
                        padding: 5px 10px; border-radius: 8px;
                        cursor: pointer; border: none;
                        font-family: 'DM Sans', sans-serif; flex-shrink: 0;
                    }

                    .pd-grid {
                        display: grid; grid-template-columns: repeat(3, 1fr);
                        gap: 0; padding: 0 8px 14px;
                    }
                    @media (min-width: 540px) { .pd-grid { grid-template-columns: repeat(4, 1fr); } }

                    .mini-card { cursor: pointer; padding: 5px; }
                    .mini-img-wrap {
                        position: relative; background: #F9F7F4;
                        border-radius: 12px; overflow: hidden; padding: 8px;
                        display: flex; align-items: center; justify-content: center;
                        height: 100px; margin-bottom: 6px;
                    }
                    .mini-img-wrap img { width: 72px; height: 72px; object-fit: cover; border-radius: 8px; }
                    .mini-add-btn {
                        position: absolute; bottom: 6px; right: 6px;
                        background: white; border: 1.5px solid var(--amber);
                        color: var(--amber); font-size: 11px; font-weight: 700;
                        padding: 3px 10px; border-radius: 6px; cursor: pointer;
                        font-family: 'DM Sans', sans-serif;
                    }
                    .mini-add-btn:active { background: var(--amber); color: white; }
                    .mini-qty-box {
                        position: absolute; bottom: 6px; right: 6px;
                        display: flex; align-items: center; gap: 3px;
                        background: #0c831f; border-radius: 6px; padding: 3px 5px;
                    }
                    .mini-qty-box button {
                        background: none; border: none; color: #fff;
                        font-size: 14px; font-weight: 700; cursor: pointer;
                        width: 16px; height: 16px;
                        display: flex; align-items: center; justify-content: center; padding: 0;
                    }
                    .mini-qty-box span { color: #fff; font-size: 11px; font-weight: 700; min-width: 14px; text-align: center; }
                    .mini-info { padding: 0 2px; }
                    .mini-weight { font-size: 10px; color: var(--muted); margin-bottom: 2px; }
                    .mini-name {
                        font-size: 12px; font-weight: 600; color: var(--charcoal);
                        line-height: 1.3; margin-bottom: 3px;
                        display: -webkit-box; -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical; overflow: hidden;
                    }
                    .mini-delivery { font-size: 10px; color: var(--muted); margin-bottom: 3px; }
                    .mini-price { font-size: 13px; font-weight: 700; color: var(--charcoal); }

                    .sk {
                        background: linear-gradient(90deg, #eee 25%, #f5f5f5 50%, #eee 75%);
                        background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 10px;
                    }
                    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

                    .cp-cart-bar {
                        position: fixed; bottom: 117px; left: 50%;
                        transform: translateX(-50%);
                        width: calc(100% - 32px); max-width: 420px;
                        background: #0C831F; border-radius: 14px; padding: 12px 16px;
                        display: flex; align-items: center; justify-content: space-between;
                        z-index: 200;
                        animation: slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1);
                        box-shadow: 0 6px 24px rgba(12,131,31,0.40);
                    }
                    @keyframes slideUp {
                        from { transform: translateX(-50%) translateY(20px); opacity: 0; }
                        to   { transform: translateX(-50%) translateY(0); opacity: 1; }
                    }
                    .cp-cart-left { display: flex; align-items: center; gap: 10px; }
                    .cp-cart-icon {
                        background: rgba(255,255,255,0.15); border-radius: 8px;
                        width: 34px; height: 34px;
                        display: flex; align-items: center; justify-content: center;
                    }
                    .cp-cart-icon ion-icon { color: white; font-size: 18px; }
                    .cp-cart-info strong { display: block; font-size: 13px; font-weight: 700; color: white; }
                    .cp-cart-info span   { font-size: 12px; color: rgba(255,255,255,0.75); }
                    .cp-view-cart-btn {
                        background: white; color: #0C831F; border: none;
                        padding: 8px 16px; border-radius: 9px;
                        font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap;
                    }

                    .pd-bar {
                        position: fixed; bottom: 0; left: 0; right: 0;
                        background: #fff; border-top: 1px solid var(--border);
                        display: flex; align-items: center; justify-content: center;
                        z-index: 400; box-shadow: 0 -4px 20px rgba(0,0,0,.10);
                        padding: 10px 16px;
                        padding-bottom: max(10px, env(safe-area-inset-bottom));
                    }
                    .pd-bar-inner { width: 100%; max-width: 720px; display: flex; align-items: center; justify-content: space-between; }
                    .pd-bar-l { display: flex; flex-direction: column; }
                    .pd-bar-qtylab { font-size: 11px; color: var(--muted); margin-bottom: 1px; }
                    .pd-bar-pr { font-size: 20px; font-weight: 800; color: var(--charcoal); }
                    .pd-bar-mrp { font-size: 12px; color: var(--muted); text-decoration: line-through; margin-left: 6px; }
                    .pd-bar-tax { font-size: 10px; color: var(--muted); marginBottom:23px;}
                    .pd-atc {
                        background: white; border: 1.5px solid var(--amber);
                        color: var(--amber); padding: 12px 32px; border-radius: 10px;
                        font-size: 14px; font-weight: 700;
                        font-family: 'DM Sans', sans-serif; cursor: pointer;
                        letter-spacing: 0.04em; transition: all 0.18s;
						margin-bottom:35px;
                    }
                    .pd-atc:active { background: var(--amber); color: white; transform: scale(0.97); }
                    .pd-bar-qbox {
                        display: flex; align-items: center; gap: 12px;
                        background: #0c831f; border-radius: 10px; padding: 10px 16px;
                    }
                    .pd-bar-qbox button {
                        background: none; border: none; color: #fff;
                        font-size: 22px; font-weight: 700; cursor: pointer;
                        width: 24px; height: 24px;
                        display: flex; align-items: center; justify-content: center;
                    }
                    .pd-bar-qbox span { color: #fff; font-size: 17px; font-weight: 700; min-width: 22px; text-align: center; }
                `}</style>

                <div className="pd-root">

                    <div className="pd-header">
                        <button className="pd-back" onClick={() => router.goBack()}>
                            <IonIcon icon={arrowBackOutline} />
                        </button>
                    </div>

                    <div className="pd-center">
                        {loading ? (
                            <div style={{ padding: 16 }}>
                                <div className="sk" style={{ height: 260, marginBottom: 14 }} />
                                <div className="sk" style={{ height: 28, width: "70%", marginBottom: 8 }} />
                                <div className="sk" style={{ height: 16, width: "40%", marginBottom: 20 }} />
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="sk" style={{ height: 160 }} />)}
                                </div>
                            </div>
                        ) : product ? (
                            <>
                                <div className="pd-hero">
                                    <img
                                        src={product.image || shop1}
                                        alt={product.name}
                                        onError={(e) => { (e.target as HTMLImageElement).src = shop1; }}
                                    />
                                    <div className="pd-hero-overlay" />
                                    <div className="pd-dots">
                                        {[true, false, false, false, false].map((active, i) => (
                                            <div key={i} className={`pd-dot${active ? " a" : ""}`} />
                                        ))}
                                    </div>
                                </div>

                                <div className="pd-namebox">
                                    <div className="pd-pname">{product.name}</div>

                                    {unitOptions.length > 0 && (
                                        <div className="pd-units-section">
                                            <p className="pd-units-label">Select Unit</p>
                                            <div className="pd-units-row">
                                                {unitOptions.map(u => {
                                                    const { price } = getUnitPricing(u);
                                                    return (
                                                        <button
                                                            key={u}
                                                            type="button"
                                                            className={`pd-unit-chip${selectedUnit === u ? " active" : ""}`}
                                                            onClick={() => setSelectedUnit(u)}
                                                        >
                                                            <span className="pd-unit-weight">{u}</span>
                                                            <span className="pd-unit-price">₹{price}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    <div className="pd-badges">
											<div className="pd-badge">
												<span className="pd-badge-icon">
													{product.delivery_type === 'cod' ? '💵' :
													 product.delivery_type === 'online' ? '💳' : '💵'}
												</span>
												<span className="pd-badge-val">
													{product.delivery_type === 'cod' ? 'COD' :
													 product.delivery_type === 'online' ? 'Online' : 'COD & Online'}
												</span>
												<span className="pd-badge-label">Payment</span>
											</div>
											<div className="pd-badge">
												<span className="pd-badge-icon">🎧</span>
												<span className="pd-badge-val">24/7</span>
												<span className="pd-badge-label">Support</span>
											</div>
											<div className="pd-badge">
												<span className="pd-badge-icon">🚀</span>
												<span className="pd-badge-val">Fast</span>
												<span className="pd-badge-label">Delivery</span>
											</div>
										</div>

                                    {/* ✅ NEW — Ask a question about this product */}
                                    <button className="pd-ask-btn" onClick={() => setShowEnquiry(true)}>
                                        <IonIcon icon={chatbubbleEllipsesOutline} />
                                        Ask a Question About This Product
                                    </button>
                                </div>

                                <div className="pd-accordion">

                                    <div className="pd-acc-row" onClick={() => setKeyInfoOpen(o => !o)}>
                                        <span className="pd-acc-title">Key Information</span>
                                        <IonIcon icon={keyInfoOpen ? chevronUpOutline : chevronDownOutline} style={{ color: "var(--muted)", fontSize: 18 }} />
                                    </div>
                                    {keyInfoOpen && (
                                        <div className="pd-acc-body">
                                            {product.details && (
                                                <div className="pd-info-row">
                                                    <span className="pd-info-key">Health Benefits</span>
                                                    <span className="pd-info-val">{stripHtml(product.details)}</span>
                                                </div>
                                            )}
                                            {product.source === 'seller' && (
                                                <div className="pd-info-row">
                                                    <span className="pd-info-key">Sold By</span>
                                                    <span className="pd-info-val">{product.sellerName ?? "—"}</span>
                                                </div>
                                            )}
                                            <div className="pd-info-row">
                                                <span className="pd-info-key">Storage Temp (deg C)</span>
                                                <span className="pd-info-val">7–10</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="pd-acc-row" onClick={() => setInfoOpen(o => !o)}>
                                        <span className="pd-acc-title">Info</span>
                                        <IonIcon icon={infoOpen ? chevronUpOutline : chevronDownOutline} style={{ color: "var(--muted)", fontSize: 18 }} />
                                    </div>
                                    {infoOpen && (
                                        <div className="pd-acc-body">
                                            <div className="pd-info-row">
                                                <span className="pd-info-key">Description</span>
                                                <span className="pd-info-val">{stripHtml(product.description)}</span>
                                            </div>

                                            <div className="pd-info-row">
                                                <span className="pd-info-key">Category</span>
                                                <span className="pd-info-val">{product.category?.name ?? "—"}</span>
                                            </div>
                                            <div className="pd-info-row">
                                                <span className="pd-info-key">Subcategory</span>
                                                <span className="pd-info-val">{product.subcategory?.name ?? "—"}</span>
                                            </div>
                                            <div className="pd-info-row">
                                                <span className="pd-info-key">Disclaimer</span>
                                                <span className="pd-info-val">Every effort is made to maintain accuracy of all information. Packaging and materials may contain more and/or different information.</span>
                                            </div>
                                            <div className="pd-info-row">
                                                <span className="pd-info-key">Customer Care</span>
                                                <span className="pd-info-val">shrient.99@gmail.com</span>
                                            </div>

                                        </div>
                                    )}
                                </div>

                                {relatedProducts.length > 0 && (
                                    <div className="pd-sec">
                                        <div className="pd-sec-hd">
                                            <div className="pd-sec-title">Top products in this category</div>
                                            <button className="pd-seeall" onClick={() => router.push(product.source === 'seller' ? `/seller/category/${product.category_id}` : `/category/${product.category_id}`)}>
                                                See all <IonIcon icon={chevronForwardOutline} />
                                            </button>
                                        </div>
                                        <div className="pd-grid">
                                            {relatedProducts.map(item => (
                                                <div key={item.id} className="mini-card" onClick={() => router.push(`/product/${item.id}`)}>
                                                    <div className="mini-img-wrap">
                                                        <img src={item.image || shop1} alt={item.name} onError={(e) => { (e.target as HTMLImageElement).src = shop1; }} />
                                                        <div onClick={e => e.stopPropagation()}>
                                                            {getQty(item.id, weightLabel(item)) === 0 ? (
                                                                <button className="mini-add-btn" onClick={() => addItem(item)}>ADD</button>
                                                            ) : (
                                                                <div className="mini-qty-box">
                                                                    <button onClick={() => removeItem(item.id, weightLabel(item))}>−</button>
                                                                    <span>{getQty(item.id, weightLabel(item))}</span>
                                                                    <button onClick={() => addItem(item)}>+</button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="mini-info">
                                                        <p className="mini-weight">{weightLabel(item)}</p>
                                                        <p className="mini-name">{item.name}</p>

                                                        <div className="mini-price">₹{item.price}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {alsoProducts.length > 0 && (
                                    <div className="pd-sec">
                                        <div className="pd-sec-hd">
                                            <div className="pd-sec-title">People also bought</div>
                                            <button className="pd-seeall" onClick={() => router.push(product.source === 'seller' ? `/seller/category/${product.category_id}` : `/category/${product.category_id}`)}>
                                                See all <IonIcon icon={chevronForwardOutline} />
                                            </button>
                                        </div>
                                        <div className="pd-grid">
                                            {alsoProducts.map(item => (
                                                <div key={item.id} className="mini-card" onClick={() => router.push(`/product/${item.id}`)}>
                                                    <div className="mini-img-wrap">
                                                        <img src={item.image || shop1} alt={item.name} onError={(e) => { (e.target as HTMLImageElement).src = shop1; }} />
                                                        <div onClick={e => e.stopPropagation()}>
                                                            {getQty(item.id, weightLabel(item)) === 0 ? (
                                                                <button className="mini-add-btn" onClick={() => addItem(item)}>ADD</button>
                                                            ) : (
                                                                <div className="mini-qty-box">
                                                                    <button onClick={() => removeItem(item.id, weightLabel(item))}>−</button>
                                                                    <span>{getQty(item.id, weightLabel(item))}</span>
                                                                    <button onClick={() => addItem(item)}>+</button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="mini-info">
                                                        <p className="mini-weight">{weightLabel(item)}</p>
                                                        <p className="mini-name">{item.name}</p>

                                                        <div className="mini-price">₹{item.price}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div style={{ textAlign: "center", padding: "60px 24px", color: "var(--muted)" }}>
                                <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
                                <p style={{ fontWeight: 600, color: "var(--charcoal)", fontSize: 16 }}>Product not found</p>
                            </div>
                        )}
                    </div>
                </div>

                {totalItems > 0 && (
                    <div className="cp-cart-bar">
                        <div className="cp-cart-left">
                            <div className="cp-cart-icon"><IonIcon icon={cartOutline} /></div>
                            <div className="cp-cart-info">
                                <strong>{totalItems} item{totalItems > 1 ? "s" : ""}</strong>
                                <span>₹{itemsTotal}</span>
                            </div>
                        </div>
                        <button className="cp-view-cart-btn" onClick={handleViewCart}>View Cart →</button>
                    </div>
                )}

                {product && (
                    <div className="pd-bar">
                        <div className="pd-bar-inner">
                            <div className="pd-bar-l">
                                <span className="pd-bar-qtylab">{selectedUnit || (qty > 1 ? `${qty} pc` : "1 pc")}</span>
                                <span>
                                    <span className="pd-bar-pr">₹{selectedPricing.price}</span>
                                    {selectedPricing.mrp && selectedPricing.mrp > selectedPricing.price && (
                                        <span className="pd-bar-mrp">₹{selectedPricing.mrp}</span>
                                    )}
                                </span>
                                <span className="pd-bar-tax">Inclusive of all taxes</span>
                            </div>
                            {qty === 0 ? (
                                <button className="pd-atc" onClick={() => addItem(product, selectedUnit, selectedPricing.price)}>ADD</button>
                            ) : (
                                <div className="pd-bar-qbox">
                                    <button onClick={() => removeItem(product.id, selectedUnit)}>−</button>
                                    <span>{qty}</span>
                                    <button onClick={() => addItem(product, selectedUnit, selectedPricing.price)}>+</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ✅ NEW — Enquiry modal, product context ke saath */}
                <IonModal isOpen={showEnquiry} onDidDismiss={() => setShowEnquiry(false)}>
                    <EnquiryModal
                        closeModal={() => setShowEnquiry(false)}
                        product={product ? { id: product.id, name: product.name } : null}
                    />
                </IonModal>

            </IonContent>
        </IonPage>
    );
};

export default ProductDetail;