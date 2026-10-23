import React, { useState } from "react";
import "./shop.css";
import shop1 from "../assets/shop1.jpg";
import shop2 from "../assets/shop2.jpg";
import shop3 from "../assets/shop3.jpg";
import shop4 from "../assets/shop4.jpg";
import shop5 from "../assets/shop5.jpg";
import { IonIcon, useIonRouter } from "@ionic/react";
import { arrowBackOutline, searchOutline } from "ionicons/icons";

type Product = {
    id: number;
    name: string;
    price: number;
    img: string;
    weight?: string;
};

type CartItem = Product & {
    qty: number;
};

interface SkillPageProps {
    closeModal: () => void;
}

const SkillPage = ({ closeModal }: SkillPageProps) => {
    const router = useIonRouter();

    const [cart, setCart] = useState<CartItem | null>(null);
    const [showCartModal, setShowCartModal] = useState(false);

    const products: Product[] = [
        { id: 1, name: "Communication Course", price: 499, img: shop1 },
        { id: 2, name: "Personality Dev", price: 699, img: shop2 },
        { id: 3, name: "Public Speaking", price: 899, img: shop3 },
        { id: 4, name: "Leadership Skills", price: 999, img: shop4 },
        { id: 5, name: "Confidence Boost", price: 599, img: shop5 },
    ];

    const handleAdd = (item: Product) => {
        setCart({ ...item, qty: 1 });

    };

    const increaseQty = () => {
        if (!cart) return;
        setCart({ ...cart, qty: cart.qty + 1 });
    };

    const decreaseQty = () => {
        if (!cart) return;

        if (cart.qty > 1) {
            setCart({ ...cart, qty: cart.qty - 1 });
        } else {
            // qty = 1 → remove item
            setCart(null);
            setShowCartModal(false);
        }
    };

    return (
        <div className="skill-page">
            {/* Header */}
            <div className="top-header">
                    <IonIcon
                        icon={arrowBackOutline}
                        className="back-icon"
                        onClick={() => router.goBack()}
                    />
                    /* <div className="header-title">
                        <h3>Delivery in 10 minutes</h3>
                    </div> */
                    <IonIcon
                        icon={searchOutline}
                        className="search-icon"
                    />
                </div>

            <p className="skill-title">Basic Skill Development</p>

            {/* Product Grid */}
            <div className="skill-grid">
                {products.map((item) => (
                    <div key={item.id} className="skill-card">
                        <img src={item.img} alt={item.name} 
                        onClick={() => router.push(`/product/${item.id}`)}/>

                        <div className="card-content">
                            <p className="product-name">{item.name}</p>

                            <div className="price-row">
                                <span>₹{item.price}</span>

                                {cart?.id === item.id ? (
                                    <div className="qty-box">
                                        <button onClick={decreaseQty}>-</button>
                                        <span>{cart.qty}</span>
                                        <button onClick={increaseQty}>+</button>
                                    </div>
                                ) : (
                                    <button className="add-btn" onClick={() => handleAdd(item)}>
                                        Add
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {cart && !showCartModal && (
                <div className="bottom-view-cart">
                    <div className="cart-info">
                        <span>{cart.qty} Item</span>
                        <span>₹{cart.price * cart.qty}</span>
                    </div>

                    <button
                        className="view-cart-btn"
                        onClick={() => setShowCartModal(true)}
                    >
                        View Cart
                    </button>
                </div>
            )}

            {/* Cart Modal */}
            {showCartModal && cart && (
                <div className="cart-modal-overlay">
                    <div className="cart-modal">
                        {/* Header */}
                        <div className="cart-header">
                            <h2>My Cart</h2>
                            <span
                                className="close-btn"
                                onClick={() => setShowCartModal(false)}
                            >
                                ✕
                            </span>
                        </div>

                        {/* Cart Item */}
                        <div className="cart-item">
                            <img src={cart.img} alt={cart.name} />

                            <div className="item-details">
                                <p className="item-name">{cart.name}</p>
                                <p className="item-weight">{cart.weight || "500g"}</p>
                                <p className="item-price">₹{cart.price}</p>
                            </div>

                            <div className="qty-box">
                                <button onClick={decreaseQty}>-</button>
                                <span>{cart.qty}</span>
                                <button onClick={increaseQty}>+</button>
                            </div>
                        </div>

                        {/* Bill Details */}
                        <div className="bill-section">
                            <h3>Bill Details</h3>
                            <div>
                                <span>Item Total</span>
                                <span>₹{cart.price * cart.qty}</span>
                            </div>
                            <div className="bill-row">
                                <span>Delivery charge</span>
                                <span>₹20</span>
                            </div>
                            <div className="bold">
                                <span>Total</span>
                                <span>₹{cart.price * cart.qty + 20}</span>
                            </div>
                        </div>

                        {/* Policy */}
                        <div className="cancel-policy">
                            <p>
                                Orders cannot be cancelled once packed. In case of any issue,
                                please contact support immediately.
                            </p>
                        </div>
                        {/* Footer */}
                        <div className="bottom-bar">
                            <span className="bottom-price">
                                ₹{cart.price * cart.qty + 20}
                            </span>
                            <button className="checkout-btn">Login to Proceed</button>
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
};

export default SkillPage;