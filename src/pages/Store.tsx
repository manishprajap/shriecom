import {
    IonPage,
    IonContent,
    IonIcon,
    IonModal
} from "@ionic/react";
import "./shop.css";
import { arrowBackOutline, searchOutline, cartOutline, heartOutline } from "ionicons/icons";
import { useIonRouter } from "@ionic/react";
import SkillPage from "./SkillPage";
import shop1 from "../assets/shop1.jpg";
import shop2 from "../assets/shop2.jpg";
import shop3 from "../assets/shop3.jpg";
import shop4 from "../assets/shop4.jpg";
import shop5 from "../assets/shop5.jpg";
import vege from "../assets/vege.jpg";
import { useState } from "react";

const categories = [
    { name: "Basic Skill Development", img: shop1, emoji: "🧠" },
    { name: "Science Kits", img: shop2, emoji: "🔬" },
    { name: "Art & Craft", img: shop3, emoji: "🎨" },
    { name: "Puzzles", img: shop4, emoji: "🧩" },
    { name: "Soft Toys", img: shop5, emoji: "🧸" },
    { name: "Toddler Toys", img: shop1, emoji: "🎠" },
];

const summerItems = [
    { img: shop1, label: "Fun Pool Time" },
    { img: shop2, label: "Indoor Games" },
    { img: shop3, label: "Outdoor Games" },
];

const bestsellers = [
    { img: shop4, name: "King Krab Air Plane Launcher", price: "₹189", old: "₹399", off: "52% OFF", time: "30 mins" },
    { img: shop5, name: "Frendo Deforming Crash", price: "₹199", old: "₹699", off: "71% OFF", time: "30 mins" },
    { img: shop1, name: "Puzzle Master Set", price: "₹299", old: "₹799", off: "63% OFF", time: "30 mins" },
];

const sportsItems = [
    { img: shop2, off: "70% OFF" },
    { img: shop3, off: "52% OFF" },
    { img: shop4, off: "80% OFF" },
];

const ToysStore: React.FC = () => {
    const router = useIonRouter();
    const [showModal, setShowModal] = useState(false);

    return (
        <IonPage>
            <IonContent className="toys-content" scrollEvents={true}>

                {/* ── Top Header ── */}
                <div className="toys-header">
                    <button className="toys-icon-btn" onClick={() => router.goBack()}>
                        <IonIcon icon={arrowBackOutline} />
                    </button>

                    /* <div className="toys-header-center">
                        <span className="delivery-badge">⚡ Delivery in 10 minutes</span>
                    </div> */

                    {/* <div className="toys-header-actions">
                        <button className="toys-icon-btn">
                            <IonIcon icon={searchOutline} />
                        </button>
                        <button className="toys-icon-btn">
                            <IonIcon icon={cartOutline} />
                        </button>
                    </div> */}
                </div>

                {/* ── Hero Banner ── */}
                <div className="toys-hero">
                    <img src={vege} alt="Toys Store" className="toys-hero-img" />
                    <div className="toys-hero-overlay">
                        <span className="hero-tag">🎉 New Arrivals</span>
                        <h1 className="hero-title">Toys &amp; Games<br />Store</h1>
                        <p className="hero-sub">Endless fun for every age — delivered fast!</p>
                        <button className="hero-cta">Shop Now →</button>
                    </div>
                </div>

                {/* ── Categories Grid ── */}
                <div className="toys-section">
                    <div className="section-head">
                        <h2 className="section-title">Browse Categories</h2>
                        <span className="see-all-link">See All</span>
                    </div>
                    <div className="cat-grid">
                        {categories.map((item, i) => (
                            <div className="cat-card" key={i} onClick={() => setShowModal(true)}>
                                <div className="cat-img-wrap">
                                    <img src={item.img} alt={item.name} />
                                    <span className="cat-emoji">{item.emoji}</span>
                                </div>
                                <p className="cat-name">{item.name}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Summer Special ── */}
                <div className="toys-section">
                    <div className="section-head">
                        <h2 className="section-title">☀️ Summer Special</h2>
                        <span className="see-all-link">See All</span>
                    </div>
                    <div className="hscroll">
                        {summerItems.map((item, i) => (
                            <div className="summer-card" key={i}>
                                <img src={item.img} alt={item.label} />
                                <div className="summer-label">{item.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Bestsellers ── */}
                <div className="toys-section">
                    <div className="section-head">
                        <h2 className="section-title">🔥 Bestsellers</h2>
                        <span className="see-all-link">See All</span>
                    </div>
                    <div className="hscroll">
                        {bestsellers.map((p, i) => (
                            <div className="product-card" key={i}>
                                <div className="product-img-wrap">
                                    <span className="discount-badge">{p.off}</span>
                                    <button className="wishlist-btn">
                                        <IonIcon icon={heartOutline} />
                                    </button>
                                    <img src={p.img} alt={p.name} />
                                </div>
                                <div className="product-info">
                                    <p className="product-name">{p.name}</p>
                                    <p className="delivery-time">⏱ {p.time}</p>
                                    <div className="price-row">
                                        <div className="prices">
                                            <span className="price">{p.price}</span>
                                            <span className="old-price">{p.old}</span>
                                        </div>
                                        <button className="add-btn">ADD</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Sports & Outdoor ── */}
                <div className="toys-section">
                    <div className="section-head">
                        <h2 className="section-title">⚽ Sports &amp; Outdoor</h2>
                        <span className="see-all-link">See All</span>
                    </div>
                    <div className="hscroll">
                        {sportsItems.map((item, i) => (
                            <div className="product-card product-card--slim" key={i}>
                                <div className="product-img-wrap">
                                    <span className="discount-badge">{item.off}</span>
                                    <img src={item.img} alt="Sport toy" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Bottom Banner ── */}
                <div className="toys-footer-banner">
                    <div className="footer-banner-content">
                        <span className="footer-brand">ToyDeliver</span>
                        <p>Fast. Fun. For every kid. ❤️</p>
                        <button className="footer-cta">Download App</button>
                    </div>
                </div>

            </IonContent>

            <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
                <SkillPage closeModal={() => setShowModal(false)} />
            </IonModal>
        </IonPage>
    );
};

export default ToysStore;