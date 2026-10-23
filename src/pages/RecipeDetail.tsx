import {
    IonPage,
    IonContent,
    IonIcon,
} from "@ionic/react";
import { arrowBackOutline, searchOutline, heartOutline, shareOutline, timeOutline, peopleOutline } from "ionicons/icons";
import { useIonRouter } from "@ionic/react";
import { useParams } from "react-router-dom";
import "./recipe.css";
import shop4 from "../assets/shop4.jpg";
import shop5 from "../assets/shop5.jpg";
import shop3 from "../assets/shop3.jpg";
import shop2 from "../assets/shop2.jpg";
import paneer from "../assets/paneer.jpg";
import light1 from "../assets/light1.jpg";

const ingredients = [
    { img: shop4, name: "King Krab Air Plane Launcher", price: "₹189", old: "₹399", off: "52% OFF", time: "30 mins" },
    { img: shop5, name: "Frendo Deforming Crash", price: "₹199", old: "₹699", off: "71% OFF", time: "30 mins" },
    { img: shop3, name: "King Krab Air Plane Launcher", price: "₹189", old: "₹399", off: "52% OFF", time: "30 mins" },
    { img: shop2, name: "Frendo Deforming Crash", price: "₹199", old: "₹699", off: "71% OFF", time: "30 mins" },
];

const steps = [
    "Take wheat flour in a bowl and add chopped onion.",
    "Add spices: salt, red chilli powder, coriander powder and knead into a soft dough.",
    "Divide into equal portions, roll each into a flat paratha.",
    "Cook on a hot tawa with ghee till golden brown on both sides.",
];

const nutrition = [
    { label: "Calories", value: "280 kcal", icon: "🔥" },
    { label: "Protein",  value: "7 g",      icon: "💪" },
    { label: "Fat",      value: "6 g",       icon: "🫒" },
    { label: "Carbs",    value: "38 g",      icon: "🌾" },
];

const RecipeDetail: React.FC = () => {
    const router = useIonRouter();
    const { id } = useParams<{ id: string }>();

    return (
        <IonPage>
            <IonContent className="recipe-content">

                {/* ── Hero Image with floating header ── */}
                <div className="recipe-hero">
                    <img src={paneer} alt="Paneer Matar" className="recipe-hero-img" />
                    <div className="recipe-hero-gradient" />

                    {/* Floating Header */}
                    <div className="recipe-float-header">
                        <button className="recipe-icon-btn" onClick={() => router.goBack()}>
                            <IonIcon icon={arrowBackOutline} />
                        </button>
                        <div className="recipe-float-actions">
                            <button className="recipe-icon-btn">
                                <IonIcon icon={heartOutline} />
                            </button>
                            <button className="recipe-icon-btn">
                                <IonIcon icon={shareOutline} />
                            </button>
                        </div>
                    </div>

                    {/* Delivery pill */}
                   /*  <div className="delivery-pill">⚡ Delivery in 10 minutes</div> */
                </div>

                {/* ── Recipe Info Card ── */}
                <div className="recipe-info-card">
                    <span className="recipe-tag">Indian Cuisine</span>
                    <h1 className="recipe-title">Paneer Matar</h1>
                    <p className="recipe-desc">
                        A rich and flavourful North Indian curry made with soft paneer and tender green peas in a spiced tomato-onion gravy.
                    </p>

                    <div className="recipe-meta">
                        <div className="meta-item">
                            <IonIcon icon={timeOutline} />
                            <span>30 min</span>
                        </div>
                        <div className="meta-divider" />
                        <div className="meta-item">
                            <IonIcon icon={peopleOutline} />
                            <span>Serves 2</span>
                        </div>
                        <div className="meta-divider" />
                        <div className="meta-item">
                            <span>🌶️</span>
                            <span>Medium</span>
                        </div>
                    </div>
                </div>

                {/* ── Nutrition ── */}
                <div className="recipe-section">
                    <h2 className="rs-title">Nutrition</h2>
                    <div className="nutrition-grid">
                        {nutrition.map((n, i) => (
                            <div className="nutrition-card" key={i}>
                                <span className="nutrition-icon">{n.icon}</span>
                                <strong className="nutrition-value">{n.value}</strong>
                                <span className="nutrition-label">{n.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Ingredients ── */}
                <div className="recipe-section">
                    <div className="rs-head">
                        <h2 className="rs-title">Ingredients</h2>
                        <span className="rs-see-all">See all</span>
                    </div>
                    <div className="ingredient-scroll">
                        {ingredients.map((item, i) => (
                            <div className="ingredient-card" key={i}>
                                <div className="ingredient-img-wrap">
                                    <span className="ing-badge">{item.off}</span>
                                    <img src={item.img} alt={item.name} />
                                </div>
                                <div className="ingredient-info">
                                    <p className="ing-name">{item.name}</p>
                                    <p className="ing-time">⏱ {item.time}</p>
                                    <div className="ing-price-row">
                                        <div>
                                            <span className="ing-price">{item.price}</span>
                                            <span className="ing-old">{item.old}</span>
                                        </div>
                                        <button className="ing-add-btn">ADD</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Steps ── */}
                <div className="recipe-section">
                    <h2 className="rs-title">How to Cook</h2>
                    <div className="steps-list">
                        {steps.map((step, i) => (
                            <div className="step-item" key={i}>
                                <div className="step-num">{i + 1}</div>
                                <p className="step-text">{step}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Promo Banner ── */}
                <div className="recipe-promo">
                    <img src={light1} alt="AI Recipe Banner" className="promo-img" />
                    <div className="promo-overlay">
                        <span className="promo-label">✨ AI-Powered</span>
                        <h3>Discover More Recipes</h3>
                        <button className="promo-btn">Explore →</button>
                    </div>
                </div>

            </IonContent>
        </IonPage>
    );
};

export default RecipeDetail;