import { IonPage, IonContent, IonIcon, useIonRouter } from "@ionic/react";
import { useHistory } from "react-router";
import {
  arrowBackOutline,
  searchOutline,
  closeOutline,
  cartOutline,
  funnelOutline,
  chevronDownOutline,
  storefrontOutline,
  starOutline,
  timeOutline,
  locationOutline,
} from "ionicons/icons";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router";
import shop1 from "../assets/shop1.jpg";

const BASE = "https://shriecom.in/appapis/shreefood/public/api";

/* ─── Types ─── */
type CartItem = { id: number; name: string; price: number; img: string; qty: number; };
type Product = {
  id: number; name: string; price: number; mrp?: number;
  image: string; image_url?: string; qty_label?: string;
  category_id?: number; category?: string; subcategory_id?: number;
  quantity?: number; vendor_id?: number;
  vendor?: {
    id: number; name: string; shop_name?: string;
    address?: string; rating?: number; delivery_time?: string; logo?: string;
  };
  subcategory?: { id: number; name: string; };
};
type ApiCategory = { id: number; name: string; };
type SortKey = "relevance" | "price_asc" | "price_desc" | "discount";

/* ─── Vendor group after grouping search results ─── */
interface VendorGroup {
  vendorId: number;
  vendorName: string;
  shopName: string;
  address: string;
  rating: number;
  deliveryTime: string;
  logo: string | null;
  products: Product[];
}

/* ─── Cart helpers ─── */
const loadCart  = (): CartItem[] => JSON.parse(localStorage.getItem("cart") ?? "[]");
const storeCart = (c: CartItem[]) => localStorage.setItem("cart", JSON.stringify(c));

/* ══════════════════════════════════════════════════════
   SearchResults Page — Zomato-style store cards layout
══════════════════════════════════════════════════════ */
const SearchResults: React.FC = () => {
  const location = useLocation();
  const router   = useIonRouter();
  const history  = useHistory();

  const rawQuery = new URLSearchParams(location.search).get("q") ?? "";

  /* ── State ── */
  const [inputVal,     setInputVal]     = useState(rawQuery);
  const [allResults,   setAllResults]   = useState<Product[]>([]);
  const [vendorGroups, setVendorGroups] = useState<VendorGroup[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<VendorGroup[]>([]);
  const [categories,   setCategories]   = useState<ApiCategory[]>([]);
  const [activeCat,    setActiveCat]    = useState<number | null>(null);
  const [sortKey,      setSortKey]      = useState<SortKey>("relevance");
  const [showSort,     setShowSort]     = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [cart,         setCart]         = useState<CartItem[]>(loadCart);
  // Selected vendor sheet
  const [selectedVendor, setSelectedVendor] = useState<VendorGroup | null>(null);
  const [showSheet,    setShowSheet]    = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const sortRef  = useRef<HTMLDivElement>(null);

  /* ── Cart sync ── */
  const saveCart   = (u: CartItem[]) => { setCart(u); storeCart(u); };
  const getQty     = (id: number) => cart.find((i) => i.id === id)?.qty ?? 0;
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cart.reduce((s, i) => s + i.qty * i.price, 0);

  const addToCart   = (p: Product) =>
    saveCart([...cart, { id: p.id, name: p.name, price: p.price, img: p.image ?? p.image_url ?? "", qty: 1 }]);
  const increaseQty = (id: number) =>
    saveCart(cart.map((i) => (i.id === id ? { ...i, qty: i.qty + 1 } : i)));
  const decreaseQty = (id: number) =>
    saveCart(cart.map((i) => (i.id === id ? { ...i, qty: i.qty - 1 } : i)).filter((i) => i.qty > 0));

  /* ── Fetch search results ── */
  useEffect(() => {
    setInputVal(rawQuery);
    if (!rawQuery.trim()) { setLoading(false); return; }
    setLoading(true);
    setActiveCat(null);

    fetch(`${BASE}/product-list?search=${encodeURIComponent(rawQuery)}&with=vendor&per_page=200`)
      .then((r) => r.json())
      .then((json) => {
        const data: Product[] = json.success ? (json.data?.data ?? json.data ?? []) : [];

        // Sort: in-stock first
        const sorted = [...data].sort((a, b) => {
          const aIn = (a.quantity ?? 1) > 0;
          const bIn = (b.quantity ?? 1) > 0;
          if (aIn && !bIn) return -1;
          if (!aIn && bIn) return 1;
          return 0;
        });

        setAllResults(sorted);

        /* Build unique category list */
        const catMap = new Map<number, string>();
        sorted.forEach((p) => {
          if (p.category_id && p.category) catMap.set(p.category_id, p.category);
        });
        setCategories(Array.from(catMap, ([id, name]) => ({ id, name })));

        /* Group by vendor */
        buildVendorGroups(sorted);
      })
      .catch(() => { setAllResults([]); setVendorGroups([]); })
      .finally(() => setLoading(false));
  }, [rawQuery]);

  const buildVendorGroups = (products: Product[]) => {
    const groupMap = new Map<number, VendorGroup>();
    products.forEach((product) => {
      const vId    = product.vendor_id ?? 0;
      const vendor = product.vendor;
      if (!groupMap.has(vId)) {
        groupMap.set(vId, {
          vendorId:     vId,
          vendorName:   vendor?.name ?? `Vendor #${vId}`,
          shopName:     vendor?.shop_name ?? vendor?.name ?? `Store #${vId}`,
          address:      vendor?.address ?? "",
          rating:       vendor?.rating ?? 0,
          deliveryTime: vendor?.delivery_time ?? "",
          logo:         vendor?.logo ?? null,
          products:     [],
        });
      }
      groupMap.get(vId)!.products.push(product);
    });
    setVendorGroups(Array.from(groupMap.values()));
  };

  /* ── Apply category filter ── */
  useEffect(() => {
    let groups = vendorGroups.map(g => ({
      ...g,
      products: activeCat !== null
        ? g.products.filter(p => p.category_id === activeCat)
        : g.products,
    })).filter(g => g.products.length > 0);

    // Sort groups by sortKey (sort products inside each group)
    groups = groups.map(g => ({
      ...g,
      products: sortProducts(g.products, sortKey),
    }));

    setFilteredGroups(groups);
  }, [vendorGroups, activeCat, sortKey]);

  const sortProducts = (products: Product[], key: SortKey) => {
    const d = [...products];
    switch (key) {
      case "price_asc":  return d.sort((a, b) => a.price - b.price);
      case "price_desc": return d.sort((a, b) => b.price - a.price);
      case "discount":
        return d.sort((a, b) => {
          const da = a.mrp ? (1 - a.price / a.mrp) : 0;
          const db = b.mrp ? (1 - b.price / b.mrp) : 0;
          return db - da;
        });
      default: return d;
    }
  };

  /* ── Close sort dropdown on outside click ── */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSort(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /* ── New search ── */
  const handleSearch = (q: string) => {
    if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`, "forward");
  };

  const sortLabels: Record<SortKey, string> = {
    relevance:  "Relevance",
    price_asc:  "Price: Low to High",
    price_desc: "Price: High to Low",
    discount:   "Best Discount",
  };

  const POPULAR = ["Onion", "Milk", "Bread", "Tomato", "Rice", "Eggs", "Banana", "Paneer"];

  const totalProductCount = filteredGroups.reduce((s, g) => s + g.products.length, 0);

  /* ════════════════════════════════════
     RENDER
  ════════════════════════════════════ */
  return (
    <IonPage>
      <IonContent fullscreen>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Nunito', sans-serif; }
          :root {
            --amber:        #E07B00;
            --amber-light:  #F59E0B;
            --amber-pale:   #FEF3C7;
            --charcoal:     #1A1714;
            --muted:        #9B8E84;
            --border:       #EAE5DF;
            --bg:           #FFFBEB;
            --surface:      #FFFFFF;
            --green:        #0C831F;
            --green-dark:   #1E7A4A;
            --red:          #DC2626;
            --rating-green: #48c479;
          }

          @keyframes shimmer {
            0%   { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideUp {
            from { transform: translateX(-50%) translateY(20px); opacity: 0; }
            to   { transform: translateX(-50%) translateY(0); opacity: 1; }
          }
          @keyframes sheetIn {
            from { transform: translateY(100%); }
            to   { transform: translateY(0); }
          }

          .sr-root {
            background: var(--bg);
            min-height: 100vh;
            padding-bottom: 110px;
          }

          /* ══ Sticky top bar ══ */
          .sr-topbar {
            position: sticky; top: 0; z-index: 200;
            background: var(--bg);
            border-bottom: 1px solid #F0E8C0;
            padding: 10px 14px;
          }
          .sr-topbar-row {
            display: flex; align-items: center; gap: 10px;
          }
          .sr-back {
            flex-shrink: 0; width: 38px; height: 38px; border-radius: 12px;
            background: white; border: 1.5px solid #E8DFC0;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.06);
          }
          .sr-input-box {
            flex: 1; display: flex; align-items: center; gap: 8px;
            background: white; border: 1.5px solid var(--amber);
            border-radius: 12px; padding: 9px 12px;
            box-shadow: 0 0 0 3px rgba(224,123,0,0.1);
          }
          .sr-input-box input {
            flex: 1; background: none; border: none; outline: none;
            font-size: 14px; font-weight: 700; color: var(--charcoal);
            caret-color: var(--amber); font-family: 'Nunito', sans-serif;
          }
          .sr-input-box input::placeholder { color: #C4B896; font-weight: 500; }
          .sr-clear {
            flex-shrink: 0; cursor: pointer; width: 20px; height: 20px;
            border-radius: 50%; background: #F0E8D0;
            display: flex; align-items: center; justify-content: center;
          }

          /* ══ Meta row ══ */
          .sr-meta-row {
            display: flex; align-items: center; justify-content: space-between;
            padding: 12px 14px 6px; flex-wrap: wrap; gap: 6px;
          }
          .sr-meta-left { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
          .sr-meta-label { font-size: 13px; color: var(--muted); font-weight: 600; }
          .sr-meta-query { font-size: 13px; font-weight: 900; color: var(--charcoal); }
          .sr-count-pill {
            background: rgba(224,123,0,0.12); color: var(--amber);
            font-size: 11px; font-weight: 800;
            padding: 3px 9px; border-radius: 20px;
          }

          /* Sort dropdown */
          .sr-sort-wrap { position: relative; }
          .sr-sort-btn {
            display: flex; align-items: center; gap: 5px;
            background: white; border: 1.5px solid var(--border);
            border-radius: 10px; padding: 6px 10px; cursor: pointer;
            font-size: 12px; font-weight: 700; color: var(--charcoal);
            white-space: nowrap; font-family: 'Nunito', sans-serif;
          }
          .sr-sort-btn ion-icon { font-size: 13px; color: var(--amber); }
          .sr-sort-menu {
            position: absolute; top: calc(100% + 6px); right: 0;
            background: white; border-radius: 14px; min-width: 190px;
            box-shadow: 0 12px 40px rgba(0,0,0,0.13), 0 0 0 1px rgba(0,0,0,0.05);
            z-index: 999; overflow: hidden; animation: fadeIn 0.15s ease;
          }
          .sr-sort-item {
            padding: 11px 14px; font-size: 13px; font-weight: 700;
            color: var(--charcoal); cursor: pointer; transition: background 0.12s;
            display: flex; align-items: center; justify-content: space-between;
          }
          .sr-sort-item:hover { background: #FEF9F0; }
          .sr-sort-item.active { color: var(--amber); }
          .sr-sort-check { color: var(--amber); font-size: 16px; }

          /* Category filter chips */
          .sr-cats-row {
            display: flex; gap: 8px; overflow-x: auto;
            padding: 2px 14px 12px; scrollbar-width: none;
          }
          .sr-cats-row::-webkit-scrollbar { display: none; }
          .sr-cat-chip {
            flex-shrink: 0; background: white;
            border: 1.5px solid var(--border);
            border-radius: 20px; padding: 6px 14px;
            font-size: 12px; font-weight: 700; color: var(--charcoal);
            cursor: pointer; transition: all 0.15s; white-space: nowrap;
          }
          .sr-cat-chip:hover { border-color: var(--amber); color: var(--amber); }
          .sr-cat-chip.active {
            background: var(--amber); color: white; border-color: var(--amber);
            box-shadow: 0 3px 10px rgba(224,123,0,0.3);
          }

          /* ══ Section title ══ */
          .sr-section-title {
            padding: 4px 14px 10px;
            font-size: 18px; font-weight: 900; color: var(--charcoal);
          }

          /* ══ Store Grid — 2 col like Zomato ══ */
          .sr-grid {
            display: grid; grid-template-columns: 1fr 1fr;
            gap: 0; padding: 0 0 8px;
            animation: fadeIn 0.3s ease;
          }

          /* ══ Store Card ══ */
          .zrc-card {
            background: var(--surface);
            cursor: pointer; overflow: hidden;
            transition: transform 0.15s;
            margin: 6px 8px;
            border-radius: 16px;
            border: 1px solid var(--border);
            box-shadow: 0 1px 6px rgba(0,0,0,0.06);
          }
          .zrc-card:active { transform: scale(0.97); }

          .zrc-img-wrap {
            position: relative; width: 100%; height: 130px;
            overflow: hidden; border-radius: 16px 16px 0 0;
            background: #F5F0E8;
          }
          .zrc-cover-img {
            width: 100%; height: 100%; object-fit: cover;
            transition: transform 0.3s;
          }
          .zrc-card:active .zrc-cover-img { transform: scale(1.03); }

          .zrc-badge {
            position: absolute; bottom: 0; left: 0;
            background: rgba(20,20,20,0.82);
            color: white; font-size: 10px; font-weight: 800;
            padding: 4px 10px; border-radius: 0 8px 0 0;
            letter-spacing: 0.02em;
          }
          .zrc-badge-discount {
            position: absolute; top: 8px; left: 8px;
            background: var(--red); color: white;
            font-size: 9px; font-weight: 800;
            padding: 3px 7px; border-radius: 6px;
          }
          .zrc-unavailable {
            position: absolute; inset: 0;
            background: rgba(255,255,255,0.75);
            display: flex; align-items: center; justify-content: center;
          }
          .zrc-unavailable span {
            background: var(--charcoal); color: white;
            font-size: 11px; font-weight: 700;
            padding: 5px 12px; border-radius: 20px;
            letter-spacing: 0.05em;
          }

          .zrc-body { padding: 10px 10px 12px; }
          .zrc-top-row {
            display: flex; align-items: flex-start;
            justify-content: space-between; gap: 6px; margin-bottom: 3px;
          }
          .zrc-name {
            font-size: 13px; font-weight: 800; color: var(--charcoal);
            line-height: 1.3;
            display: -webkit-box; -webkit-line-clamp: 2;
            -webkit-box-orient: vertical; overflow: hidden; flex: 1;
          }
          .zrc-rating {
            display: inline-flex; align-items: center; gap: 3px;
            background: var(--rating-green); color: white;
            font-size: 11px; font-weight: 800;
            padding: 3px 6px; border-radius: 6px; flex-shrink: 0;
          }
          .zrc-rating ion-icon { font-size: 10px; }
          .zrc-sub {
            font-size: 11px; color: var(--muted);
            margin-bottom: 6px;
            display: -webkit-box; -webkit-line-clamp: 1;
            -webkit-box-orient: vertical; overflow: hidden;
          }
          .zrc-meta {
            display: flex; align-items: center; gap: 4px;
            font-size: 11px; color: var(--muted);
          }
          .zrc-meta-item {
            display: inline-flex; align-items: center; gap: 2px;
          }
          .zrc-meta-item ion-icon { font-size: 11px; }
          .zrc-dot { color: #ccc; }

          /* ══ Skeleton loader ══ */
          .sr-skeleton-grid {
            display: grid; grid-template-columns: 1fr 1fr;
            padding: 6px 6px;
          }
          .sr-skel-card {
            margin: 6px; border-radius: 16px; overflow: hidden;
            border: 1px solid var(--border); background: white;
          }
          .sr-skel-img {
            height: 130px;
            background: linear-gradient(90deg,#f0e8c0 25%,#fef9e7 50%,#f0e8c0 75%);
            background-size: 200% 100%; animation: shimmer 1.4s infinite;
          }
          .sr-skel-body { padding: 10px; }
          .sr-skel-line {
            height: 11px; border-radius: 6px; margin-bottom: 8px;
            background: linear-gradient(90deg,#f0e8c0 25%,#fef9e7 50%,#f0e8c0 75%);
            background-size: 200% 100%; animation: shimmer 1.4s infinite;
          }

          /* ══ Empty state ══ */
          .sr-empty {
            display: flex; flex-direction: column;
            align-items: center; padding: 52px 20px; text-align: center;
            animation: fadeIn 0.4s ease;
          }
          .sr-empty-emoji { font-size: 52px; margin-bottom: 14px; }
          .sr-empty h3 { font-size: 18px; font-weight: 900; color: var(--charcoal); margin-bottom: 7px; }
          .sr-empty p  { font-size: 13px; color: var(--muted); font-weight: 600; line-height: 1.6; }
          .sr-empty-chips {
            display: flex; flex-wrap: wrap; gap: 8px;
            justify-content: center; margin-top: 18px;
          }
          .sr-empty-chip {
            background: white; border: 1.5px solid var(--border);
            border-radius: 20px; padding: 7px 14px;
            font-size: 12px; font-weight: 700; color: var(--charcoal);
            cursor: pointer; transition: all 0.15s;
          }
          .sr-empty-chip:hover { background: var(--amber); color: white; border-color: var(--amber); }

          /* ══ Product Sheet (bottom modal) ══ */
          .sr-sheet { height: 100%; display: flex; flex-direction: column; background: var(--bg); }

          .sr-sheet-header {
            background: var(--surface); flex-shrink: 0;
          }
          .sr-sheet-cover-wrap {
            height: 180px; overflow: hidden; position: relative;
          }
          .sr-sheet-cover {
            width: 100%; height: 100%; object-fit: cover;
          }
          .sr-sheet-overlay {
            position: absolute; inset: 0;
            background: linear-gradient(to top, rgba(0,0,0,0.65), transparent);
          }
          .sr-sheet-close {
            position: absolute; top: 12px; right: 12px;
            width: 32px; height: 32px; border-radius: 50%;
            background: rgba(255,255,255,0.9); border: none;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; font-size: 16px; font-weight: 800; color: var(--charcoal);
          }
          .sr-sheet-info {
            position: absolute; bottom: 12px; left: 14px; right: 14px;
          }
          .sr-sheet-info h2 {
            font-size: 20px; font-weight: 900; color: white; margin-bottom: 2px;
          }
          .sr-sheet-info p { font-size: 12px; color: rgba(255,255,255,0.8); }
          .sr-sheet-tags {
            display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
            padding: 10px 14px; border-top: 1px solid var(--border);
          }
          .sr-sheet-tag {
            display: inline-flex; align-items: center; gap: 3px;
            border-radius: 7px; padding: 4px 10px;
            font-size: 11px; font-weight: 700;
          }
          .sr-sheet-tag--rating { background: #f0fdf4; color: #166534; }
          .sr-sheet-tag--time   { background: #fff7ed; color: #c2410c; }
          .sr-sheet-tag--addr   { background: #fef9c3; color: #854d0e; }
          .sr-sheet-tag ion-icon { font-size: 11px; }

          .sr-sheet-body { flex: 1; overflow-y: auto; padding: 8px 10px; }

          /* Product rows in sheet */
          .sr-prod-card {
            background: white; border-radius: 14px;
            border: 1px solid var(--border);
            padding: 12px; margin-bottom: 10px;
            display: flex; align-items: center; gap: 10px; cursor: pointer;
            transition: box-shadow 0.15s;
          }
          .sr-prod-card.oos { opacity: 0.6; cursor: default; }
          .sr-prod-img-wrap {
            flex-shrink: 0; width: 70px; height: 70px;
            border-radius: 12px; overflow: hidden; position: relative;
            background: var(--bg);
          }
          .sr-prod-img { width: 100%; height: 100%; object-fit: cover; }
          .sr-prod-img-wrap.oos .sr-prod-img { filter: grayscale(60%); }
          .sr-oos-label {
            position: absolute; bottom: 0; left: 0; right: 0;
            background: rgba(0,0,0,0.7); color: white;
            font-size: 8px; font-weight: 700; text-align: center;
            padding: 3px; text-transform: uppercase;
          }
          .sr-prod-info { flex: 1; min-width: 0; }
          .sr-prod-name {
            font-size: 14px; font-weight: 800; color: var(--charcoal);
            margin-bottom: 2px;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          }
          .sr-prod-weight { font-size: 11px; color: var(--muted); margin-bottom: 5px; }
          .sr-prod-price-row { display: flex; align-items: center; gap: 6px; }
          .sr-prod-price { font-size: 15px; font-weight: 900; color: var(--charcoal); }
          .sr-prod-mrp   { font-size: 11px; color: var(--muted); text-decoration: line-through; }

          /* ADD / qty buttons */
          .sr-prod-action { flex-shrink: 0; }
          .sr-add-btn {
            background: white; border: 1.5px solid var(--amber);
            color: var(--amber); border-radius: 8px; padding: 6px 12px;
            font-size: 12px; font-weight: 800; cursor: pointer;
            font-family: 'Nunito', sans-serif; transition: all 0.15s;
            letter-spacing: 0.04em;
          }
          .sr-add-btn:active { background: var(--amber); color: white; }
          .sr-qty-box {
            display: flex; align-items: center; gap: 6px;
            background: var(--green); border-radius: 8px; padding: 5px 10px;
          }
          .sr-qty-box button {
            background: none; border: none; color: white;
            font-size: 16px; font-weight: 900; cursor: pointer;
            width: 18px; height: 18px;
            display: flex; align-items: center; justify-content: center; padding: 0;
            font-family: 'Nunito', sans-serif;
          }
          .sr-qty-box span {
            color: white; font-size: 13px; font-weight: 900;
            min-width: 16px; text-align: center;
          }
          .sr-notify-btn {
            background: transparent; border: 1.5px solid #ccc;
            color: var(--muted); border-radius: 8px; padding: 5px 8px;
            font-size: 10px; font-weight: 700; cursor: pointer;
            font-family: 'Nunito', sans-serif;
          }

          /* ══ Floating Cart Bar ══ */
          .sr-cart-bar {
            position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%);
            width: calc(100% - 32px); max-width: 440px;
            background: var(--green); border-radius: 16px; padding: 12px 14px;
            display: flex; align-items: center; justify-content: space-between;
            box-shadow: 0 8px 32px rgba(12,131,31,0.45);
            z-index: 500; animation: slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1);
          }
          .sr-cart-bar__left { display: flex; align-items: center; gap: 10px; }
          .sr-cart-bar__icon {
            background: rgba(255,255,255,0.15); border-radius: 9px;
            width: 36px; height: 36px;
            display: flex; align-items: center; justify-content: center;
          }
          .sr-cart-bar__info strong { display: block; font-size: 13px; font-weight: 800; color: white; }
          .sr-cart-bar__info span   { font-size: 11px; color: rgba(255,255,255,0.75); font-weight: 600; }
          .sr-cart-bar__btn {
            background: white; color: var(--green);
            border: none; padding: 9px 18px; border-radius: 10px;
            font-size: 13px; font-weight: 900; cursor: pointer;
            font-family: 'Nunito', sans-serif; white-space: nowrap;
          }

          /* Sheet cart bar */
          .sr-sheet-cart {
            background: var(--green); padding: 12px 16px;
            display: flex; align-items: center; justify-content: space-between;
            flex-shrink: 0;
          }
          .sr-sheet-cart-btn {
            background: white; color: var(--green);
            border: none; padding: 9px 18px; border-radius: 10px;
            font-size: 13px; font-weight: 900; cursor: pointer;
            font-family: 'Nunito', sans-serif;
          }
        `}</style>

        <div className="sr-root">

          {/* ══ STICKY TOP BAR ══ */}
          <div className="sr-topbar">
            <div className="sr-topbar-row">
              <div className="sr-back" onClick={() => history.goBack()}>
                <IonIcon icon={arrowBackOutline} style={{ fontSize: 20, color: "#1A1714" }} />
              </div>
              <div className="sr-input-box">
                <IonIcon icon={searchOutline} style={{ fontSize: 17, color: "#B8A878", flexShrink: 0 }} />
                <input
                  ref={inputRef}
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSearch(inputVal); }}
                  placeholder="Search stores & products..."
                  autoComplete="off"
                />
                {inputVal && (
                  <div className="sr-clear" onClick={() => { setInputVal(""); inputRef.current?.focus(); }}>
                    <IonIcon icon={closeOutline} style={{ fontSize: 13, color: "#9B8E84" }} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ══ META ROW ══ */}
          {!loading && rawQuery && (
            <div className="sr-meta-row">
              <div className="sr-meta-left">
                <span className="sr-meta-label">Results for</span>
                <span className="sr-meta-query">"{rawQuery}"</span>
                {filteredGroups.length > 0 && (
                  <span className="sr-count-pill">
                    {filteredGroups.length} store{filteredGroups.length !== 1 ? "s" : ""} · {totalProductCount} items
                  </span>
                )}
              </div>

              {/* Sort button */}
              {filteredGroups.length > 0 && (
                <div ref={sortRef} className="sr-sort-wrap">
                  <div className="sr-sort-btn" onClick={() => setShowSort((v) => !v)}>
                    <IonIcon icon={funnelOutline} />
                    {sortLabels[sortKey]}
                    <IonIcon icon={chevronDownOutline} />
                  </div>
                  {showSort && (
                    <div className="sr-sort-menu">
                      {(Object.keys(sortLabels) as SortKey[]).map((k) => (
                        <div
                          key={k}
                          className={`sr-sort-item${sortKey === k ? " active" : ""}`}
                          onClick={() => { setSortKey(k); setShowSort(false); }}
                        >
                          {sortLabels[k]}
                          {sortKey === k && <span className="sr-sort-check">✓</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ══ CATEGORY CHIPS ══ */}
          {!loading && categories.length > 1 && allResults.length > 0 && (
            <div className="sr-cats-row">
              <div
                className={`sr-cat-chip${activeCat === null ? " active" : ""}`}
                onClick={() => setActiveCat(null)}
              >
                All
              </div>
              {categories.map((c) => (
                <div
                  key={c.id}
                  className={`sr-cat-chip${activeCat === c.id ? " active" : ""}`}
                  onClick={() => setActiveCat(activeCat === c.id ? null : c.id)}
                >
                  {c.name}
                </div>
              ))}
            </div>
          )}

          {/* ══ SECTION TITLE ══ */}
          {!loading && filteredGroups.length > 0 && (
            <div className="sr-section-title">
              {filteredGroups.length} Store{filteredGroups.length !== 1 ? "s" : ""} Found
            </div>
          )}

          {/* ══ SKELETON ══ */}
          {loading && (
            <div className="sr-skeleton-grid">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="sr-skel-card">
                  <div className="sr-skel-img" />
                  <div className="sr-skel-body">
                    <div className="sr-skel-line" style={{ width: "80%" }} />
                    <div className="sr-skel-line" style={{ width: "55%" }} />
                    <div className="sr-skel-line" style={{ width: "40%" }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ══ EMPTY STATE ══ */}
          {!loading && filteredGroups.length === 0 && rawQuery && (
            <div className="sr-empty">
              <div className="sr-empty-emoji">🔍</div>
              <h3>No stores found for "{rawQuery}"</h3>
              <p>Try different keywords or browse popular items</p>
              <div className="sr-empty-chips">
                {POPULAR.map((p) => (
                  <div
                    key={p}
                    className="sr-empty-chip"
                    onClick={() => router.push(`/search?q=${encodeURIComponent(p)}`, "forward")}
                  >
                    {p}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ NO QUERY ══ */}
          {!loading && !rawQuery && (
            <div className="sr-empty">
              <div className="sr-empty-emoji">🔎</div>
              <h3>What are you looking for?</h3>
              <p>Type a product name to find stores near you</p>
            </div>
          )}

          {/* ══ STORE CARDS GRID ══ */}
          {!loading && filteredGroups.length > 0 && (
            <div className="sr-grid">
              {filteredGroups.map((group) => {
                const inStockCount = group.products.filter(p => (p.quantity ?? 1) > 0).length;
                const minPrice     = group.products.length > 0
                  ? Math.min(...group.products.map(p => p.price)) : 0;
                const coverImg     = group.products.find(p => p.image || p.image_url)?.image
                  ?? group.products.find(p => p.image_url)?.image_url ?? null;
                const maxDiscount  = group.products.reduce((max, p) => {
                  if (!p.mrp || p.mrp <= p.price) return max;
                  return Math.max(max, Math.round((1 - p.price / p.mrp) * 100));
                }, 0);

                return (
                  <div
                    key={group.vendorId}
                    className="zrc-card"
                    onClick={() => { setSelectedVendor(group); setShowSheet(true); }}
                  >
                    {/* Cover Image */}
                    <div className="zrc-img-wrap">
                      <img
                        src={coverImg ?? shop1}
                        alt={group.shopName}
                        className="zrc-cover-img"
                        onError={(e) => { (e.target as HTMLImageElement).src = shop1; }}
                      />
                      {maxDiscount > 0 && (
                        <div className="zrc-badge-discount">{maxDiscount}% OFF</div>
                      )}
                      {inStockCount > 0 && (
                        <div className="zrc-badge">{inStockCount} Items</div>
                      )}
                      {inStockCount === 0 && (
                        <div className="zrc-unavailable">
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
                      <div className="zrc-sub">
                        {group.products.slice(0, 2).map(p => p.subcategory?.name).filter(Boolean).join(", ")
                          || group.address || "Fresh Products"}
                      </div>
                      <div className="zrc-meta">
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

        </div>

        {/* ══ FLOATING CART BAR ══ */}
        {totalItems > 0 && !showSheet && (
          <div className="sr-cart-bar">
            <div className="sr-cart-bar__left">
              <div className="sr-cart-bar__icon">
                <IonIcon icon={cartOutline} style={{ color: "white", fontSize: 20 }} />
              </div>
              <div className="sr-cart-bar__info">
                <strong>{totalItems} item{totalItems > 1 ? "s" : ""}</strong>
                <span>₹{totalPrice.toFixed(0)}</span>
              </div>
            </div>
            <button
              className="sr-cart-bar__btn"
              onClick={() => router.push("/cart", "forward", "push")}
            >
              View Cart →
            </button>
          </div>
        )}

        {/* ══ PRODUCT SHEET (opens on store card tap) ══ */}
        {showSheet && selectedVendor && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 600,
            background: "rgba(0,0,0,0.5)",
            display: "flex", flexDirection: "column", justifyContent: "flex-end",
          }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowSheet(false); }}
          >
            <div className="sr-sheet" style={{ maxHeight: "90vh", borderRadius: "20px 20px 0 0", overflow: "hidden" }}>

              {/* Cover */}
              <div className="sr-sheet-header">
                <div className="sr-sheet-cover-wrap">
                  <img
                    src={selectedVendor.products.find(p => p.image || p.image_url)?.image
                      ?? selectedVendor.products.find(p => p.image_url)?.image_url ?? shop1}
                    alt={selectedVendor.shopName}
                    className="sr-sheet-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = shop1; }}
                  />
                  <div className="sr-sheet-overlay" />
                  <button className="sr-sheet-close" onClick={() => setShowSheet(false)}>✕</button>
                  <div className="sr-sheet-info">
                    <h2>{selectedVendor.shopName || selectedVendor.vendorName}</h2>
                    <p>{selectedVendor.products.filter(p => (p.quantity ?? 1) > 0).length} items available</p>
                  </div>
                </div>
                <div className="sr-sheet-tags">
                  {selectedVendor.rating > 0 && (
                    <span className="sr-sheet-tag sr-sheet-tag--rating">
                      <IonIcon icon={starOutline} /> {selectedVendor.rating.toFixed(1)}
                    </span>
                  )}
                  {selectedVendor.deliveryTime && (
                    <span className="sr-sheet-tag sr-sheet-tag--time">
                      <IonIcon icon={timeOutline} /> {selectedVendor.deliveryTime}
                    </span>
                  )}
                  {selectedVendor.address && (
                    <span className="sr-sheet-tag sr-sheet-tag--addr">
                      <IonIcon icon={locationOutline} /> {selectedVendor.address}
                    </span>
                  )}
                </div>
              </div>

              {/* Products */}
              <div className="sr-sheet-body">
                {selectedVendor.products.map((item) => {
                  const inStock  = (item.quantity ?? 1) > 0;
                  const qty      = getQty(item.id);
                  const discount = item.mrp && item.mrp > item.price
                    ? Math.round((1 - item.price / item.mrp) * 100) : 0;
                  const imgSrc   = item.image ?? item.image_url ?? "";

                  return (
                    <div
                      key={item.id}
                      className={`sr-prod-card${!inStock ? " oos" : ""}`}
                      onClick={() => inStock ? router.push(`/product/${item.id}`, "forward") : undefined}
                    >
                      <div className={`sr-prod-img-wrap${!inStock ? " oos" : ""}`}>
                        <img
                          src={imgSrc || shop1}
                          alt={item.name}
                          className="sr-prod-img"
                          onError={(e) => { (e.target as HTMLImageElement).src = shop1; }}
                        />
                        {!inStock && <div className="sr-oos-label">Out of Stock</div>}
                      </div>
                      <div className="sr-prod-info">
                        <div className="sr-prod-name">{item.name}</div>
                        {item.qty_label && (
                          <div className="sr-prod-weight">{item.qty_label}</div>
                        )}
                        <div className="sr-prod-price-row">
                          <span className="sr-prod-price">₹{item.price}</span>
                          {discount > 0 && item.mrp && (
                            <span className="sr-prod-mrp">₹{item.mrp}</span>
                          )}
                        </div>
                      </div>
                      <div className="sr-prod-action" onClick={(e) => e.stopPropagation()}>
                        {inStock ? (
                          qty === 0 ? (
                            <button className="sr-add-btn" onClick={() => addToCart(item)}>ADD</button>
                          ) : (
                            <div className="sr-qty-box">
                              <button onClick={() => decreaseQty(item.id)}>−</button>
                              <span>{qty}</span>
                              <button onClick={() => increaseQty(item.id)}>+</button>
                            </div>
                          )
                        ) : (
                          <button className="sr-notify-btn">Notify</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Cart bar inside sheet */}
              {totalItems > 0 && (
                <div className="sr-sheet-cart">
                  <div className="sr-cart-bar__left">
                    <div className="sr-cart-bar__icon">
                      <IonIcon icon={cartOutline} style={{ color: "white", fontSize: 20 }} />
                    </div>
                    <div className="sr-cart-bar__info">
                      <strong>{totalItems} item{totalItems > 1 ? "s" : ""}</strong>
                      <span>₹{totalPrice.toFixed(0)}</span>
                    </div>
                  </div>
                  <button
                    className="sr-sheet-cart-btn"
                    onClick={() => router.push("/cart", "forward", "push")}
                  >
                    View Cart →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </IonContent>
    </IonPage>
  );
};

export default SearchResults;