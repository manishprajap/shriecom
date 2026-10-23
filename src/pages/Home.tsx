import {
  IonPage,
  IonContent,
  IonIcon,
  IonModal,
  useIonRouter,
} from "@ionic/react";
import {
  personCircleOutline,
  chevronDownOutline,
  chevronUpOutline,
  chevronBackOutline,
  flashOutline,
  receiptOutline,
  locationOutline,
  logOutOutline,
  cartOutline,
  callOutline,
  mailOutline,
  pencilOutline,
  shieldCheckmarkOutline,
  bagHandleOutline,
  appsOutline,
  chatbubbleEllipsesOutline, // ✅ NEW — for "My Enquiries" menu item
} from "ionicons/icons";
import { useState, useEffect, useRef } from "react";
import { Circles } from "react-loader-spinner";
import './Home.css';
import vege from "../assets/vege.jpg";
import logo from "../assets/shrilogo.jpeg";

import RegisterModal from "../components/RegisterModal";
import LoginModal    from "../components/LoginModal";
import GlobalSearch  from "./GlobalSearch";
import LocationPopup from "../components/LocationPopup";
import EnquiryModal from "../components/EnquiryModal";

import { getUser, clearAuth } from "../hooks/useAuth";

const BASE = "https://shriecom.in/appapis/shreefood/public/api";

interface ApiCategory    { id: number; name: string; slug: string; image: string | null; }
interface HotDealItem    { id: number; name: string; qty_label: string | null; price: number; mrp: number | null; image_url: string; discount: number; }
interface FreshItem      { id: number; name: string; qty_label: string | null; price: number; image_url: string; }
interface CookingItem    { id: number; name: string; image_url: string; }
interface HomeCareItem   { id: number; name: string; image_url: string; }

interface SellerCategory {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
  product_count: number;
}

interface SellerProduct  {
  id: number;
  name: string;
  qty_label?: string | null;
  price: number;
  mrp?: number | null;
  image_url: string | null;
  stock?: number;
  category?: { id: number; name: string } | null;
  seller?: { id: number; name: string } | null;
}

type CartItem = { id: number; name: string; price: number; img: string; qty: number; type: "vendor" | "seller"; };

const getInitials = (name: string) =>
  name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

const imgFallback = (e: React.SyntheticEvent<HTMLImageElement>, fallback: string) => {
  (e.target as HTMLImageElement).src = fallback;
};

async function safeFetchJson<T = any>(url: string): Promise<{ success: boolean; data: T } | null> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch (err) {
    console.error(`Network error calling ${url}:`, err);
    return null;
  }

  if (!res.ok) {
    console.error(`Request failed (${res.status}) for ${url}`);
    return null;
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    console.error(`Expected JSON but got "${contentType}" from ${url}`);
    return null;
  }

  try {
    return await res.json();
  } catch (err) {
    console.error(`Failed to parse JSON from ${url}:`, err);
    return null;
  }
}

const isSellerProduct = (item: any): boolean => {
  if (!item || typeof item !== "object") return false;
  if (item.is_seller_product === true) return true;
  if (item.is_seller === true) return true;
  const typeVal   = (item.type   ?? "").toString().toLowerCase();
  const sourceVal = (item.source ?? "").toString().toLowerCase();
  if (typeVal === "seller" || typeVal === "ecom")     return true;
  if (sourceVal === "seller" || sourceVal === "ecom") return true;
  if (item.seller && (item.seller.id || item.seller.name)) return true;
  if (item.seller_id) return true;
  return false;
};

const stripSellerProducts = <T,>(rows: T[] | undefined | null): T[] =>
  Array.isArray(rows) ? rows.filter((row) => !isSellerProduct(row)) : [];

const PageLoader: React.FC = () => (
  <div style={{
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(255,251,235,0.97)",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    zIndex: 99999, backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
  }}>
    <div style={{
      width: 90, height: 90, borderRadius: "50%",
      background: "radial-gradient(circle at 40% 35%,#fff8e7,#fde68a)",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 8px 32px rgba(224,123,0,0.25)", marginBottom: 20,
    }}>
      <img src={logo} alt="Shri" style={{ width: 150, height: 150, objectFit: "contain" }} />
    </div>
    <div style={{ fontSize: 22, fontWeight: 900, color: "#1A1714", fontFamily: "'Nunito',sans-serif", letterSpacing: "-0.5px", marginBottom: 4 }}>
      Shri Enterprises
    </div>
    <Circles height="36" width="36" color="#E07B00" ariaLabel="page-loading" />
  </div>
);

const CardSkeleton: React.FC<{ width: number; height: number; radius?: number }> = ({
  width, height, radius = 16,
}) => (
  <div style={{
    flexShrink: 0, width, height, borderRadius: radius,
    background: "linear-gradient(90deg,#f0e8c0 25%,#fef9e7 50%,#f0e8c0 75%)",
    backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite",
  }} />
);

const ProfileDropdown: React.FC<{
  userName:   string;
  onLogout:   () => void;
  onNavigate: (path: string) => void;
}> = ({ userName, onLogout, onNavigate }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // ✅ NEW — "My Enquiries" menu item added
  const menuItems = [
    { label: "My Orders",       icon: receiptOutline,          iconBg: "#FEF3C7", iconColor: "#D97706", path: "/orders"          },
    { label: "Saved Addresses", icon: locationOutline,         iconBg: "#DCFCE7", iconColor: "#16A34A", path: "/addresses"       },
    { label: "My Enquiries",    icon: chatbubbleEllipsesOutline, iconBg: "#FFF3E0", iconColor: "#EA580C", path: "/my-enquiries"  },
    { label: "Account Privacy", icon: shieldCheckmarkOutline,  iconBg: "#F5F3FF", iconColor: "#7C3AED", path: "/account-privacy" },
    { label: "Edit Profile",    icon: pencilOutline,           iconBg: "#FFF3E0", iconColor: "#E07B00", path: "/edit-profile"    },
  ];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 7,
          background: "#E07B00", border: "none", borderRadius: 12,
          padding: "6px 10px", cursor: "pointer",
        }}
      >
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "linear-gradient(135deg,#F59E0B,#D97706)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontWeight: 700, fontSize: 11, flexShrink: 0,
        }}>
          {getInitials(userName)}
        </div>
        <span style={{
          fontSize: 13, fontWeight: 600, color: "#1A1714",
          maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {userName.split(" ")[0]}
        </span>
        <IonIcon icon={open ? chevronUpOutline : chevronDownOutline} style={{ fontSize: 13, color: "#9B8E84" }} />
      </button>

      {open && (
        <div style={{
          position: "fixed",
          top: 64,
          right: 12,
          background: "white",
          borderRadius: 18,
          boxShadow: "0 20px 60px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.07)",
          width: 260,
          zIndex: 999999,
        }}>
          <div style={{
            background: "linear-gradient(135deg,#1A1714,#2D2520)",
            borderRadius: "18px 18px 0 0",
            padding: "16px",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "linear-gradient(135deg,#F59E0B,#B45309)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontWeight: 800, fontSize: 16, flexShrink: 0,
              boxShadow: "0 4px 12px rgba(217,119,6,0.4)",
            }}>
              {getInitials(userName)}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "white" }}>{userName}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>My Account</div>
            </div>
          </div>

          {menuItems.map((item) => (
            <div
              key={item.label}
              onClick={() => { setOpen(false); onNavigate(item.path); }}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 14px", cursor: "pointer",
                borderBottom: "1px solid #F5F3F0",
                background: "white",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#FAF8F5")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
            >
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: item.iconBg, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <IonIcon icon={item.icon} style={{ fontSize: 17, color: item.iconColor }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: "#1A1714" }}>{item.label}</span>
            </div>
          ))}

          <div
            onClick={() => { onLogout(); setOpen(false); }}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 14px", cursor: "pointer",
              borderRadius: "0 0 18px 18px",
              background: "white",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#FEF2F2")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
          >
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: "#FEE2E2", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <IonIcon icon={logOutOutline} style={{ fontSize: 17, color: "#DC2626" }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#DC2626" }}>Log Out</span>
          </div>
        </div>
      )}
    </div>
  );
};

const CATEGORY_TABS = [
  { key: "grocery", label: "Grocery", icon: bagHandleOutline },
  { key: "others",  label: "Ecom",  icon: appsOutline      },
];

const CategoryTabBar: React.FC<{
  active: string;
  onChange: (key: string) => void;
}> = ({ active, onChange }) => (
  <div className="h-tabbar-wrap">
    <div className="h-tabbar">
      {CATEGORY_TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            className={`h-tab${isActive ? " h-tab--active" : ""}`}
            onClick={() => onChange(tab.key)}
          >
            <span className={`h-tab-icon${isActive ? " h-tab-icon--active" : ""}`}>
              <IonIcon icon={tab.icon} />
            </span>
            <span className="h-tab-label">{tab.label}</span>
          </button>
        );
      })}
    </div>
  </div>
);

const SectionHeader: React.FC<{
  icon: string; title: string; subtitle?: string; action?: string; onAction?: () => void;
}> = ({ icon, title, subtitle, action, onAction }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#FEF3C7,#FDE68A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, boxShadow: "0 2px 8px rgba(224,123,0,0.2)" }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#1A1714", letterSpacing: "-0.3px" }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: "#9B8E84", marginTop: 2, fontWeight: 600 }}>{subtitle}</div>}
      </div>
    </div>
    {action && (
      <button
        onClick={onAction}
        style={{ background: "rgba(224,123,0,0.1)", border: "1px solid rgba(224,123,0,0.25)", borderRadius: 10, padding: "7px 14px", fontSize: 12, fontWeight: 700, color: "#E07B00", cursor: "pointer", whiteSpace: "nowrap" }}
      >
        {action} →
      </button>
    )}
  </div>
);

const EmptyState: React.FC<{ emoji: string; text: string }> = ({ emoji, text }) => (
  <div style={{ padding: "32px 16px", textAlign: "center", color: "#9B8E84", fontSize: 14 }}>
    <div style={{ fontSize: 36, marginBottom: 10 }}>{emoji}</div>
    {text}
  </div>
);

const AppFooter: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const quickLinks = [{ label: "About Us", path: "/about" }];
  const helpLinks  = [
    { label: "Help & Support",   path: "/support"  },
    { label: "Privacy Policy",   path: "/privacy"  },
    { label: "Terms of Service", path: "/terms"    },
    { label: "Refund Policy",    path: "/refunds"  },
    { label: "Shipping Policy",  path: "/shipping" },
  ];
  return (
    <footer style={{ background: "linear-gradient(180deg,#1A1714 0%,#0F0C0A 100%)", padding: "40px 0 28px" }}>
      <div className="h-container">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "32px 40px", marginBottom: 32 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <img src={logo} alt="Logo" style={{ height: 40 }} />
              <span style={{ fontSize: 22, fontWeight: 800, color: "white" }}>Shri Enterprises</span>
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>
              India's fastest grocery and all sales merchandise are made available for door delivery.
            </p>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#E07B00", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>Company</div>
            {quickLinks.map((l) => (
              <div
                key={l.label}
                onClick={() => onNavigate(l.path)}
                style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 11, cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}
              >{l.label}</div>
            ))}
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#E07B00", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>Help</div>
            {helpLinks.map((l) => (
              <div
                key={l.label}
                onClick={() => onNavigate(l.path)}
                style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 11, cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}
              >{l.label}</div>
            ))}
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#E07B00", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>
              Managed by Shri Enterprises
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { icon: callOutline,     text: "+91-8604650538"       },
                { icon: mailOutline,     text: "shrient.99@gmail.com" },
                { icon: locationOutline, text: "286/61, Nivaj Khera, Sai Nath Ka Mandir,\nAishbagh, Rajendra Nagar, Lucknow - 226004" },
              ].map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(224,123,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <IonIcon icon={c.icon} style={{ fontSize: 16, color: "#E07B00" }} />
                  </div>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", whiteSpace: "pre-line" }}>{c.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ height: 1, background: "rgba(255,255,255,0.08)", marginBottom: 20 }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "rgba(247,119,14,0.99)", lineHeight: 1.6 }}>
            © {new Date().getFullYear()}{" "}
             <a href="https://shriecom.in/" target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }}>
              Shri Enterprises
            </a>
          </div>
          <div style={{ fontSize: 11, color: "rgba(247,119,14,0.99)", marginBottom: 35 }}>Made with ❤️ in India</div>
        </div>
      </div>
    </footer>
  );
};

const Home = () => {
  const [showLogin,    setShowLogin]    = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [loggedUser,   setLoggedUser]   = useState<string | null>(null);
  const [pageLoading,  setPageLoading]  = useState(false);
  const [showEnquiry,  setShowEnquiry]  = useState(false);

  const [activeTab, setActiveTab] = useState<string>("grocery");

  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const [vendorReady, setVendorReady] = useState(false);

  const [apiCategories,   setApiCategories]   = useState<ApiCategory[]>([]);
  const [catLoading,      setCatLoading]       = useState(true);
  const [hotDeals,        setHotDeals]         = useState<HotDealItem[]>([]);
  const [freshData,       setFreshData]        = useState<FreshItem[]>([]);
  const [cookingData,     setCookingData]      = useState<CookingItem[]>([]);
  const [homeCareData,    setHomeCareData]     = useState<HomeCareItem[]>([]);
  const [sectionsLoading, setSectionsLoading]  = useState(true);

  const [sellerCategories,        setSellerCategories]        = useState<SellerCategory[]>([]);
  const [sellerCategoriesLoading, setSellerCategoriesLoading] = useState(false);

  const [selectedSellerCategory, setSelectedSellerCategory] = useState<SellerCategory | null>(null);
  const [sellerProducts,         setSellerProducts]          = useState<SellerProduct[]>([]);
  const [sellerLoading,          setSellerLoading]           = useState(false);

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });

  const router = useIonRouter();

  useEffect(() => {
    getUser().then((user) => {
      if (user?.name) setLoggedUser(user.name);
    });
  }, []);

  const navigateTo = (path: string) => {
    setPageLoading(true);
    setTimeout(() => {
      router.push(path, "forward", "push");
      setPageLoading(false);
    }, 800);
  };

  const saveCart = (updated: CartItem[]) => {
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  };

  useEffect(() => {
    const syncCart = () => {
      const saved = localStorage.getItem("cart");
      if (saved) setCart(JSON.parse(saved));
    };
    window.addEventListener("focus", syncCart);
    return () => window.removeEventListener("focus", syncCart);
  }, []);

  useEffect(() => {
    if (!vendorReady || selectedVendorId === null) {
      setCatLoading(false);
      return;
    }

    let cancelled = false;
    setCatLoading(true);

    safeFetchJson<ApiCategory[]>(`${BASE}/category-list`)
      .then((json) => {
        if (cancelled) return;
        if (json?.success) setApiCategories(json.data);
        else setApiCategories([]);
      })
      .finally(() => { if (!cancelled) setCatLoading(false); });

    return () => { cancelled = true; };
  }, [selectedVendorId, vendorReady]);

  useEffect(() => {
    if (!vendorReady || selectedVendorId === null) {
      setSectionsLoading(false);
      return;
    }

    let cancelled = false;
    setSectionsLoading(true);

    Promise.all([
      safeFetchJson<HotDealItem[]>(`${BASE}/hot-deals`),
      safeFetchJson<FreshItem[]>(`${BASE}/fresh-needs`),
      safeFetchJson<CookingItem[]>(`${BASE}/cooking-ideas`),
      safeFetchJson<HomeCareItem[]>(`${BASE}/home-care`),
    ])
      .then(([deals, fresh, cooking, care]) => {
        if (cancelled) return;
        setHotDeals(    stripSellerProducts(deals?.success   ? deals.data   : []));
        setFreshData(   stripSellerProducts(fresh?.success   ? fresh.data   : []));
        setCookingData( stripSellerProducts(cooking?.success ? cooking.data : []));
        setHomeCareData(stripSellerProducts(care?.success    ? care.data    : []));
      })
      .finally(() => { if (!cancelled) setSectionsLoading(false); });

    return () => { cancelled = true; };
  }, [selectedVendorId, vendorReady]);

  useEffect(() => {
    if (activeTab !== "others" || !vendorReady || selectedVendorId === null) return;

    let cancelled = false;
    setSellerCategoriesLoading(true);

    fetch(`${BASE}/seller-categories`)
      .then((res) => res.json())
      .then((json: any) => {
        if (cancelled) return;
        const rows = json?.status ? json.data ?? [] : [];
        const mapped: SellerCategory[] = rows.map((row: any) => ({
          id: row.id,
          name: row.name,
          slug: row.slug,
          image_url: row.image_url ?? null,
          product_count: row.product_count ?? 0,
        }));
        setSellerCategories(mapped);
      })
      .catch((err) => {
        console.error("Failed to load seller-categories:", err);
        if (!cancelled) setSellerCategories([]);
      })
      .finally(() => { if (!cancelled) setSellerCategoriesLoading(false); });

    return () => { cancelled = true; };
  }, [activeTab, selectedVendorId, vendorReady]);

  useEffect(() => {
    if (activeTab !== "others" || !selectedSellerCategory) return;

    let cancelled = false;
    setSellerLoading(true);

    fetch(`${BASE}/products/by-category?category_id=${selectedSellerCategory.id}`)
      .then((res) => res.json())
      .then((json: any) => {
        if (cancelled) return;
        const rows = json?.status ? json.data?.data ?? [] : [];
        const mapped: SellerProduct[] = rows.map((row: any) => ({
          id: row.id,
          name: row.name,
          price: Number(row.price),
          mrp: row.discount_price ? Number(row.discount_price) : null,
          image_url: row.image_url,
          stock: row.stock,
          category: row.category,
          seller: row.seller,
        }));
        setSellerProducts(mapped);
      })
      .catch((err) => {
        console.error("Failed to load products/by-category:", err);
        if (!cancelled) setSellerProducts([]);
      })
      .finally(() => { if (!cancelled) setSellerLoading(false); });

    return () => { cancelled = true; };
  }, [activeTab, selectedSellerCategory]);

  const getQty     = (id: number) => cart.find((i) => i.id === id)?.qty ?? 0;
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cart.reduce((s, i) => s + i.qty * i.price, 0);

  const addToCart   = (item: FreshItem) =>
    saveCart([...cart, { id: item.id, name: item.name, price: item.price, img: item.image_url, qty: 1, type: "vendor" }]);
  const increaseQty = (id: number) =>
    saveCart(cart.map((i) => (i.id === id ? { ...i, qty: i.qty + 1 } : i)));
  const decreaseQty = (id: number) =>
    saveCart(cart.map((i) => (i.id === id ? { ...i, qty: i.qty - 1 } : i)).filter((i) => i.qty > 0));

  const handleLogout = async () => {
    await clearAuth();
    setLoggedUser(null);
  };

  const handleLoginClose = async () => {
    setShowLogin(false);
    const user = await getUser();
    if (user?.name) setLoggedUser(user.name);
  };

  const handleOrderNow = () => {
    if (totalItems > 0) {
      navigateTo("/cart");
    } else {
      const el = document.querySelector(".h-cat-grid") as HTMLElement | null;
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      else navigateTo("/all-categories");
    }
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (key !== "others") setSelectedSellerCategory(null);
  };

  const handleLocationSelect = (data: { pincode: string; vendor_id: number; vendor: any }) => {
    if (!data || !data.vendor_id) return;

    localStorage.setItem("selected_vendor_id", data.vendor_id.toString());
    localStorage.setItem("user_pincode",        data.pincode);

    setSelectedVendorId(data.vendor_id);
    setVendorReady(true);
  };

  return (
    <IonPage>
      <LocationPopup onLocationSelect={handleLocationSelect} />

      <IonContent fullscreen>
        {pageLoading && <PageLoader />}

        <div className="h-root">

          {/* ════ HEADER ════ */}
          <div className="h-header">
            <div className="h-header-inner">
              <div className="h-header-brand">
                <div className="h-header-brand-icon">
                  <img src={logo} alt="Shri Logo" style={{ height: 40, width: "auto", objectFit: "contain" }} />
                </div>
                <div><h3>Shri Bazar</h3></div>
              </div>

              <div className="h-header-actions">
                {loggedUser ? (
                  <ProfileDropdown userName={loggedUser} onLogout={handleLogout} onNavigate={navigateTo} />
                ) : (
                  <>
                    <button
                      onClick={() => setShowLogin(true)}
                      style={{ display: "flex", alignItems: "center", gap: 6, background: "#E07B00", border: "none", borderRadius: 12, padding: "8px 18px", cursor: "pointer", color: "white", fontSize: 14, fontWeight: 800, fontFamily: "'Nunito',sans-serif", boxShadow: "0 3px 10px rgba(224,123,0,0.3)" }}
                    >
                      <IonIcon icon={personCircleOutline} style={{ fontSize: 18 }} />
                      Login
                    </button>
                    <button
                      onClick={() => setShowRegister(true)}
                      style={{ display: "flex", alignItems: "center", gap: 3, background: "white", border: "2px solid #E07B00", borderRadius: 12, padding: "5px 10px", cursor: "pointer", color: "#E07B00", fontSize: 11, fontWeight: 800, fontFamily: "'Nunito',sans-serif" }}
                    >
                      <IonIcon icon={personCircleOutline} style={{ fontSize: 18 }} />
                      Register
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ════ SEARCH ════ */}
          <div className="h-search-wrap">
            <GlobalSearch />
          </div>

          {/* ════ GROCERY / OTHERS TABS ════ */}
          <CategoryTabBar active={activeTab} onChange={handleTabChange} />

          {/* ════ CATEGORIES / ECOM ════ */}
          {activeTab === "grocery" ? (
            <div className="h-section">
              <div className="h-container">
                <SectionHeader icon="🧺" title="Shop by Category" subtitle="Fresh picks every day" action="See all" onAction={() => navigateTo("/all-categories")} />
                {catLoading ? (
                  <>
                    <div className="h-cat-grid">
                      {[1,2,3,4,5,6,7,8].map((i) => <div key={i} className="h-cat-skeleton" />)}
                    </div>
                    <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
                      <Circles height="35" width="35" color="#4fa94d" ariaLabel="loading" />
                    </div>
                  </>
                ) : !vendorReady ? (
                  <EmptyState emoji="📍" text="Please select your location to see categories" />
                ) : apiCategories.length === 0 ? (
                  <EmptyState emoji="🧺" text="No categories found for this location" />
                ) : (
                  <div className="h-cat-grid">
                    {apiCategories.map((cat) => (
                      <div
                        key={cat.id}
                        className="h-cat-card"
                        style={{ background: "#F3F4F6", borderColor: "#37415122" }}
                        onClick={() => navigateTo(`/category/${cat.id}`)}
                      >
                        <div className="h-cat-img-wrap">
                          <img src={cat.image ?? vege} alt={cat.name} onError={(e) => imgFallback(e, vege)} />
                        </div>
                        <div className="h-cat-label" style={{ color: "#374151" }}>{cat.name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : selectedSellerCategory === null ? (
            <div className="h-section">
              <div className="h-container">
                <SectionHeader icon="🛍️" title="Shop by Category" subtitle="Ecom marketplace" />
                {sellerCategoriesLoading ? (
                  <div className="h-cat-grid">
                    {[1,2,3,4,5,6,7,8].map((i) => <div key={i} className="h-cat-skeleton" />)}
                  </div>
                ) : !vendorReady ? (
                  <EmptyState emoji="📍" text="Please select your location first" />
                ) : sellerCategories.length === 0 ? (
                  <EmptyState emoji="🛍️" text="No categories found" />
                ) : (
                  <div className="h-cat-grid">
                    {sellerCategories.map((cat) => (
                      <div
                        key={cat.id}
                        className="h-cat-card"
                        style={{ background: "#F3F4F6", borderColor: "#37415122" }}
                        onClick={() => setSelectedSellerCategory(cat)}
                      >
                        <div className="h-cat-img-wrap">
                          <img src={cat.image_url ?? vege} alt={cat.name} onError={(e) => imgFallback(e, vege)} />
                        </div>
                        <div className="h-cat-label" style={{ color: "#374151" }}>{cat.name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-section">
              <div className="h-container">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                  <button
                    onClick={() => setSelectedSellerCategory(null)}
                    style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(224,123,0,0.1)", border: "1px solid rgba(224,123,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
                  >
                    <IonIcon icon={chevronBackOutline} style={{ fontSize: 18, color: "#E07B00" }} />
                  </button>
                  <SectionHeader icon="🛍️" title={selectedSellerCategory.name} subtitle="Products in this category" />
                </div>
                {sellerLoading ? (
                  <div className="h-fresh-wrap">
                    {[1,2,3,4,5,6].map((i) => <CardSkeleton key={i} width={145} height={195} radius={20} />)}
                  </div>
                ) : sellerProducts.length === 0 ? (
                  <EmptyState emoji="🛍️" text="No products found in this category" />
                ) : (
                  <div className="h-fresh-wrap">
                    {sellerProducts.map((item) => (
                      <div key={item.id} className="h-fresh-card" onClick={() => navigateTo(`/product/${item.id}`)}>
                        <img src={item.image_url ?? vege} alt={item.name} onError={(e) => imgFallback(e, vege)} />
                        <div className="h-fresh-info">
                          <div className="h-fresh-name">{item.name}</div>
                          <div className="h-fresh-qty">
                            {item.seller?.name ?? "Seller"}
                          </div>
                          <div className="h-fresh-bottom">
                            <span className="h-fresh-price">₹{item.price}</span>
                            {item.mrp && item.mrp > item.price && <span className="h-deal-mrp">₹{item.mrp}</span>}
                          </div>
                          {typeof item.stock === "number" && item.stock <= 0 && (
                            <div style={{ fontSize: 11, color: "#DC2626", marginTop: 4, fontWeight: 600 }}>
                              Out of stock
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          

          {activeTab === "grocery" && (
            <>
          <div className="h-divider" />

          {/* ════ HOT DEALS ════ */}
          <div className="h-section">
            <div className="h-container">
              <SectionHeader icon="🔥" title="Hot Deals" subtitle="Today's best prices" action="View all" onAction={() => navigateTo("/all-deals")} />
              {sectionsLoading ? (
                <div className="h-deals-wrap">
                  {[1,2,3,4,5,6].map((i) => <CardSkeleton key={i} width={150} height={200} radius={20} />)}
                </div>
              ) : hotDeals.length === 0 ? (
                <EmptyState emoji="🔥" text="No hot deals right now. Check back soon!" />
              ) : (
                <div className="h-deals-wrap">
                  {hotDeals.map((item) => (
                    <div key={item.id} className="h-deal-card" onClick={() => navigateTo(`/product/${item.id}`)}>
                      <div className="h-deal-img-wrap">
                        {item.discount > 0 && <div className="h-deal-badge">{item.discount}% OFF</div>}
                        <img src={item.image_url} alt={item.name} onError={(e) => imgFallback(e, vege)} />
                      </div>
                      <div className="h-deal-info">
                        <div className="h-deal-name">{item.name}</div>
                        {item.qty_label && <div className="h-deal-qty">{item.qty_label}</div>}
                        <div className="h-deal-price-row">
                          <span className="h-deal-price">₹{item.price}</span>
                          {item.mrp && item.mrp > item.price && <span className="h-deal-mrp">₹{item.mrp}</span>}
                        </div>
                        <button className="h-add-btn" onClick={(e) => { e.stopPropagation(); navigateTo(`/product/${item.id}`); }}>ADD</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="h-divider" />

          {/* ════ FRESH NEEDS ════ */}
          <div className="h-section">
            <div className="h-container">
              <SectionHeader icon="🌿" title="Daily Fresh Needs" subtitle="Straight from the farm" action="View all" onAction={() => navigateTo("/all-fresh")} />
              {sectionsLoading ? (
                <div className="h-fresh-wrap">
                  {[1,2,3,4,5,6].map((i) => <CardSkeleton key={i} width={145} height={195} radius={20} />)}
                </div>
              ) : freshData.length === 0 ? (
                <EmptyState emoji="🌿" text="Fresh items coming soon!" />
              ) : (
                <div className="h-fresh-wrap">
                  {freshData.map((item) => (
                    <div key={item.id} className="h-fresh-card" onClick={() => navigateTo(`/product/${item.id}`)}>
                      <img src={item.image_url} alt={item.name} onError={(e) => imgFallback(e, vege)} />
                      <div className="h-fresh-info">
                        <div className="h-fresh-name">{item.name}</div>
                        <div className="h-fresh-qty">{item.qty_label ?? "—"}</div>
                        <div className="h-fresh-bottom">
                          <span className="h-fresh-price">₹{item.price}</span>
                          {getQty(item.id) === 0 ? (
                            <button className="h-fresh-addbtn" onClick={(e) => { e.stopPropagation(); addToCart(item); }}>ADD</button>
                          ) : (
                            <div className="h-qty-box" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => decreaseQty(item.id)}>−</button>
                              <span>{getQty(item.id)}</span>
                              <button onClick={() => increaseQty(item.id)}>+</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="h-divider" />

          {/* ════ COOKING IDEAS ════ */}
          {(sectionsLoading || cookingData.length > 0) && (
            <>
              <div className="h-section">
                <div className="h-container">
                  <SectionHeader icon="🍳" title="Cooking Ideas" subtitle="Make something delicious" action="View all" onAction={() => navigateTo("/cooking-ideas")} />
                  {sectionsLoading ? (
                    <div className="h-api-wrap">
                      {[1,2,3,4,5].map((i) => <CardSkeleton key={i} width={130} height={160} radius={18} />)}
                    </div>
                  ) : (
                    <div className="h-api-wrap">
                      {cookingData.map((item) => (
                        <div key={item.id} className="h-api-card" onClick={() => navigateTo(`/product/${item.id}`)}>
                          <img src={item.image_url} alt={item.name} onError={(e) => imgFallback(e, vege)} />
                          <div className="h-api-card-name">{item.name}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="h-divider" />
            </>
          )}

          {/* ════ HOME CARE ════ */}
          {(sectionsLoading || homeCareData.length > 0) && (
            <>
              <div className="h-section">
                <div className="h-container">
                  <SectionHeader icon="🏠" title="Home Care" subtitle="Keep your home clean & fresh" action="View all" onAction={() => navigateTo("/home-care")} />
                  {sectionsLoading ? (
                    <div className="h-api-wrap">
                      {[1,2,3,4,5].map((i) => <CardSkeleton key={i} width={130} height={160} radius={18} />)}
                    </div>
                  ) : (
                    <div className="h-api-wrap">
                      {homeCareData.map((item) => (
                        <div key={item.id} className="h-api-card" onClick={() => navigateTo(`/product/${item.id}`)}>
                          <img src={item.image_url} alt={item.name} onError={(e) => imgFallback(e, vege)} />
                          <div className="h-api-card-name">{item.name}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="h-divider" />
            </>
          )}

          {/* ════ BANNER ════ */}
          <div className="h-section">
            <div className="h-container">
              <div className="h-banner">
                <div className="h-banner-text">
                  <h2>India's fastest grocery and all sales items delivery app</h2>
                </div>
                <button className="h-banner-btn" onClick={handleOrderNow}>
                  <IonIcon icon={flashOutline} style={{ fontSize: 16 }} />
                  {totalItems > 0 ? `View Cart (${totalItems})` : "Order Now"}
                </button>
              </div>
            </div>
          </div>
            </>
          )}
		  
		  
		  {/* ════ ENQUIRY CTA ════ */}
          <div className="h-section">
            <div className="h-container">
              <div
                style={{
                  background: "linear-gradient(135deg,#1A1714,#2D2520)",
                  borderRadius: 20,
                  padding: "24px 22px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", marginBottom: 4 }}>
                    Have a question?
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
                    Send us an enquiry about products, bulk orders, or anything else.
                  </div>
                </div>
                <button
                  onClick={() => setShowEnquiry(true)}
                  style={{
                    background: "#E07B00",
                    color: "#fff",
                    border: "none",
                    borderRadius: 12,
                    padding: "11px 22px",
                    fontSize: 13.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    fontFamily: "inherit",
                  }}
                >
                  Send Enquiry
                </button>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 48 }}>
            <AppFooter onNavigate={navigateTo} />
          </div>
        </div>

        {/* ════ CART BAR ════ */}
        {totalItems > 0 && (
          <div className="h-cart-bar">
            <div className="h-cart-bar__left">
              <div className="h-cart-bar__icon">
                <IonIcon icon={cartOutline} />
              </div>
              <div className="h-cart-bar__info">
                <strong>{totalItems} item{totalItems > 1 ? "s" : ""}</strong>
                <span>₹{totalPrice.toFixed(2)}</span>
              </div>
            </div>
            <button className="h-cart-bar__btn" onClick={() => navigateTo("/cart")}>
              View Cart →
            </button>
          </div>
        )}

        {/* ════ MODALS ════ */}
        <IonModal isOpen={showLogin} onDidDismiss={handleLoginClose}>
          <LoginModal closeModal={handleLoginClose} openRegister={() => { setShowLogin(false); setShowRegister(true); }} />
        </IonModal>
        <IonModal isOpen={showRegister} onDidDismiss={() => setShowRegister(false)}>
          <RegisterModal closeModal={() => setShowRegister(false)} openLogin={() => { setShowRegister(false); setShowLogin(true); }} />
        </IonModal>
        {/* ✅ NEW — Enquiry modal */}
        <IonModal isOpen={showEnquiry} onDidDismiss={() => setShowEnquiry(false)}>
          <EnquiryModal closeModal={() => setShowEnquiry(false)} />
        </IonModal>

      </IonContent>
    </IonPage>
  );
};

export default Home;