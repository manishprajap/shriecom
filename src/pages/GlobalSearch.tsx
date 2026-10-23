import { IonIcon, useIonRouter } from "@ionic/react";
import {
  searchOutline,
  timeOutline,
  closeOutline,
  trendingUpOutline,
} from "ionicons/icons";
import { useState, useEffect, useRef, useCallback } from "react";

const BASE        = "https://shriecom.in/appapis/shreefood/public/api";
const RECENT_KEY  = "recentSearches";
const MAX_RECENT  = 6;

/* ─── Type — matches MasterController response ─────── */
interface Suggestion {
  id:            number;
  name:          string;
  image_url:     string;   // backend appends this
  price:         number;
  category_name?: string;  // backend sets this (NOT 'category')
  qty_label?:    string;
}

const POPULAR = [
  "Onion", "Milk", "Bread", "Tomato", "Rice",
  "Eggs", "Banana", "Paneer", "Butter", "Curd",
];

/* ─── Recent-search helpers ─────────────────────────── */
const getRecent = (): string[] =>
  JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");

const saveRecent = (q: string) => {
  const prev = getRecent().filter((r) => r.toLowerCase() !== q.toLowerCase());
  localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...prev].slice(0, MAX_RECENT)));
};

const removeRecent = (q: string) =>
  localStorage.setItem(
    RECENT_KEY,
    JSON.stringify(getRecent().filter((r) => r !== q))
  );

/* ══════════════════════════════════════════════════════
   Component
══════════════════════════════════════════════════════ */
const GlobalSearch: React.FC = () => {
  const router = useIonRouter();

  const [query,       setQuery]       = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [recent,      setRecent]      = useState<string[]>(getRecent);
  const [open,        setOpen]        = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [activeIdx,   setActiveIdx]   = useState(-1);

  const inputRef      = useRef<HTMLInputElement>(null);
  const containerRef  = useRef<HTMLDivElement>(null);
  const debounceRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Close on outside click ── */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIdx(-1);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /* ── Debounced API call ── */
  const fetchSuggestions = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      fetch(`${BASE}/product-list?search=${encodeURIComponent(q)}&limit=6`)
        .then((r) => r.json())
        .then((json) => {
          if (json.success) {
            // API returns plain array when search param is present
            const raw = json.data;
            const list: Suggestion[] = Array.isArray(raw)
              ? raw.slice(0, 6)
              : (raw?.data ?? []).slice(0, 6);
            setSuggestions(list);
          } else {
            setSuggestions([]);
          }
        })
        .catch(() => setSuggestions([]))
        .finally(() => setLoading(false));
    }, 300);
  }, []);

  const handleChange = (val: string) => {
    setQuery(val);
    setActiveIdx(-1);
    setOpen(true);
    if (val.trim()) fetchSuggestions(val);
    else { setSuggestions([]); setLoading(false); }
  };

  /* ── Navigate to /search?q= ── */
  const goToSearch = (q: string) => {
    if (!q.trim()) return;
    saveRecent(q.trim());
    setRecent(getRecent());
    setOpen(false);
    setQuery(q.trim());
    inputRef.current?.blur();
    router.push(`/search?q=${encodeURIComponent(q.trim())}`, "forward");
  };

  /* ── Keyboard navigation ── */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIdx >= 0 && suggestions[activeIdx]) {
        goToSearch(suggestions[activeIdx].name);
      } else {
        goToSearch(query);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIdx(-1);
      inputRef.current?.blur();
    }
  };

  /* ── Highlight matching query text ── */
  const highlight = (text: string, q: string) => {
    if (!q.trim()) return <span>{text}</span>;
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts   = text.split(new RegExp(`(${escaped})`, "gi"));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === q.toLowerCase() ? (
            <mark
              key={i}
              style={{
                background: "#FEF3C7", color: "#92400E",
                borderRadius: 3, padding: "0 1px", fontWeight: 900,
              }}
            >
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

  const showDropdown = open && (query.trim().length > 0 || recent.length > 0);

  /* ════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════ */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap');

        .gs-wrap {
          position: relative;
          padding: 10px 16px 0;
          font-family: 'Nunito', sans-serif;
        }

        /* ── Input row ── */
        .gs-input-row {
          display: flex; align-items: center; gap: 10px;
          background: #FFFFFF; border: 1.5px solid #E8DFC0;
          border-radius: 14px; padding: 3px 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .gs-input-row.gs-open {
          border-color: #E07B00;
          box-shadow: 0 0 0 3px rgba(224,123,0,0.12), 0 2px 10px rgba(0,0,0,0.06);
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
        }
        .gs-search-icon { color: #B8A878; font-size: 19px; flex-shrink: 0; }
        .gs-input {
          flex: 1; background: none; border: none; outline: none;
          color: #1A1714; font-size: 14px; font-weight: 700;
          font-family: 'Nunito', sans-serif; caret-color: #E07B00;
          min-width: 0;
        }
        .gs-input::placeholder { color: #C4B896; font-weight: 500; }

        /* Spinner */
        .gs-spinner {
          flex-shrink: 0; width: 18px; height: 18px; border-radius: 50%;
          border: 2px solid #F0E8D0; border-top-color: #E07B00;
          animation: gs-spin 0.65s linear infinite;
        }
        @keyframes gs-spin { to { transform: rotate(360deg); } }

        /* Clear button */
        .gs-clear-btn {
          flex-shrink: 0; cursor: pointer; width: 22px; height: 22px;
          border-radius: 50%; background: #F0E8D0;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s;
        }
        .gs-clear-btn:hover { background: #E8DFC0; }

        /* Search button */
        .gs-search-btn {
          flex-shrink: 0; cursor: pointer; background: #E07B00;
          border-radius: 10px; width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 3px 10px rgba(224,123,0,0.35);
          transition: transform 0.15s;
        }
        .gs-search-btn:active { transform: scale(0.92); }

        /* ── Dropdown ── */
        .gs-dropdown {
          position: absolute;
          top: calc(100% + 2px);
          left: 16px; right: 16px;
          background: white;
          border-radius: 0 0 18px 18px;
          border: 1.5px solid #E07B00; border-top: none;
          box-shadow: 0 16px 48px rgba(0,0,0,0.13), 0 4px 12px rgba(0,0,0,0.06);
          z-index: 9999;
          max-height: 68vh; overflow-y: auto; scrollbar-width: none;
          animation: gs-drop 0.18s cubic-bezier(0.22,1,0.36,1);
        }
        .gs-dropdown::-webkit-scrollbar { display: none; }
        @keyframes gs-drop {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Section label */
        .gs-section-label {
          display: flex; align-items: center; gap: 6px;
          padding: 10px 14px 5px;
          font-size: 10px; font-weight: 800; color: #B8A878;
          letter-spacing: 0.08em; text-transform: uppercase;
        }
        .gs-section-label ion-icon { font-size: 12px; }

        /* Row */
        .gs-row {
          display: flex; align-items: center; gap: 12px;
          padding: 9px 14px; cursor: pointer;
          transition: background 0.1s;
        }
        .gs-row:hover, .gs-row.gs-active { background: #FFFBF0; }

        .gs-row-img {
          width: 44px; height: 44px; border-radius: 10px;
          object-fit: cover; flex-shrink: 0;
          border: 1px solid #F0E8D0; background: #F9F7F4;
        }
        .gs-row-img-placeholder {
          width: 44px; height: 44px; border-radius: 10px;
          background: linear-gradient(135deg,#FEF3C7,#FDE68A);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; flex-shrink: 0;
        }
        .gs-row-body { flex: 1; min-width: 0; }
        .gs-row-name {
          font-size: 13px; font-weight: 700; color: #1A1714;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .gs-row-meta {
          font-size: 11px; color: #9B8E84; font-weight: 600; margin-top: 1px;
        }
        .gs-row-right { flex-shrink: 0; text-align: right; }
        .gs-row-price { font-size: 13px; font-weight: 900; color: #1A1714; }

        .gs-row-recent-icon { font-size: 17px; color: #C4B896; flex-shrink: 0; }
        .gs-row-del {
          flex-shrink: 0; font-size: 15px; color: #D0C8B8; cursor: pointer;
          padding: 4px; border-radius: 6px; transition: color 0.15s;
        }
        .gs-row-del:hover { color: #E07B00; }

        .gs-divider { height: 1px; background: #F5EDD0; margin: 3px 0; }

        /* Popular chips */
        .gs-chips-wrap {
          display: flex; flex-wrap: wrap; gap: 7px;
          padding: 6px 14px 14px;
        }
        .gs-chip {
          background: #FEF9F0; border: 1px solid #EDDFCA;
          border-radius: 20px; padding: 5px 12px;
          font-size: 12px; font-weight: 700; color: #5C4A2A;
          cursor: pointer; transition: all 0.15s; white-space: nowrap;
        }
        .gs-chip:hover { background: #E07B00; color: white; border-color: #E07B00; }

        /* No results */
        .gs-empty {
          padding: 18px 14px; text-align: center;
          font-size: 13px; color: #9B8E84; font-weight: 600;
        }
        .gs-empty-emoji { font-size: 28px; display: block; margin-bottom: 6px; }

        /* View all */
        .gs-view-all {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          padding: 11px 14px; cursor: pointer;
          background: #FEF9F0; border-top: 1px solid #F5EDD0;
          font-size: 13px; font-weight: 800; color: #E07B00;
          transition: background 0.15s;
        }
        .gs-view-all:hover { background: #FEF3C7; }
      `}</style>

      <div ref={containerRef} className="gs-wrap">

        {/* ── Input bar ── */}
        <div className={`gs-input-row${open ? " gs-open" : ""}`}>
          <IonIcon icon={searchOutline} className="gs-search-icon" />

          <input
            ref={inputRef}
            className="gs-input"
            placeholder='Search "milk, onion, rice…"'
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck={false}
          />

          {/* Loading spinner */}
          {loading && <div className="gs-spinner" />}

          {/* Clear ✕ */}
          {query && !loading && (
            <div
              className="gs-clear-btn"
              onClick={() => {
                setQuery("");
                setSuggestions([]);
                setOpen(true);
                inputRef.current?.focus();
              }}
            >
              <IonIcon icon={closeOutline} style={{ fontSize: 13, color: "#9B8E84" }} />
            </div>
          )}

          {/* Search → button */}
          <div className="gs-search-btn" onClick={() => goToSearch(query)}>
            <IonIcon icon={searchOutline} style={{ fontSize: 15, color: "white" }} />
          </div>
        </div>

        {/* ── Dropdown ── */}
        {showDropdown && (
          <div className="gs-dropdown">

            {/* ── Live product suggestions ── */}
            {query.trim().length >= 2 && (
              <>
                {suggestions.length > 0 ? (
                  <>
                    <div className="gs-section-label">
                      <IonIcon icon={searchOutline} />
                      Products
                    </div>

                    {suggestions.map((s, idx) => (
                      <div
                        key={s.id}
                        className={`gs-row${activeIdx === idx ? " gs-active" : ""}`}
                        onMouseEnter={() => setActiveIdx(idx)}
                        onClick={() => goToSearch(s.name)}
                      >
                        {/* Product image */}
                        {s.image_url ? (
                          <img
                            src={s.image_url}
                            alt={s.name}
                            className="gs-row-img"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="gs-row-img-placeholder">🛒</div>
                        )}

                        {/* Name + meta */}
                        <div className="gs-row-body">
                          <div className="gs-row-name">
                            {highlight(s.name, query)}
                          </div>
                          <div className="gs-row-meta">
                            {/* ✅ FIXED: category_name (not category) */}
                            {s.qty_label}
                            {s.qty_label && s.category_name && " · "}
                            {s.category_name}
                          </div>
                        </div>

                        {/* Price */}
                        <div className="gs-row-right">
                          <div className="gs-row-price">₹{s.price}</div>
                        </div>
                      </div>
                    ))}

                    {/* See all */}
                    <div className="gs-view-all" onClick={() => goToSearch(query)}>
                      See all results for "{query}" →
                    </div>
                  </>
                ) : !loading ? (
                  /* No results */
                  <>
                    <div className="gs-empty">
                      <span className="gs-empty-emoji">😕</span>
                      No products found for "{query}"
                    </div>
                    <div className="gs-divider" />
                    <div className="gs-section-label">
                      <IonIcon icon={trendingUpOutline} />
                      Try these instead
                    </div>
                    <div className="gs-chips-wrap">
                      {POPULAR.map((p) => (
                        <div key={p} className="gs-chip" onClick={() => goToSearch(p)}>
                          {p}
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
              </>
            )}

            {/* ── Recent searches (input empty) ── */}
            {!query.trim() && recent.length > 0 && (
              <>
                <div className="gs-section-label">
                  <IonIcon icon={timeOutline} />
                  Recent Searches
                </div>
                {recent.map((r) => (
                  <div key={r} className="gs-row" onClick={() => goToSearch(r)}>
                    <IonIcon icon={timeOutline} className="gs-row-recent-icon" />
                    <div className="gs-row-body">
                      <div className="gs-row-name">{r}</div>
                    </div>
                    <div
                      className="gs-row-del"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRecent(r);
                        setRecent(getRecent());
                      }}
                    >
                      <IonIcon icon={closeOutline} />
                    </div>
                  </div>
                ))}
                <div className="gs-divider" />
              </>
            )}

            {/* ── Popular chips (input empty) ── */}
            {!query.trim() && (
              <>
                <div className="gs-section-label">
                  <IonIcon icon={trendingUpOutline} />
                  Popular right now
                </div>
                <div className="gs-chips-wrap">
                  {POPULAR.map((p) => (
                    <div key={p} className="gs-chip" onClick={() => goToSearch(p)}>
                      {p}
                    </div>
                  ))}
                </div>
              </>
            )}

          </div>
        )}
      </div>
    </>
  );
};

export default GlobalSearch;