import React, { useState, useEffect } from 'react';
import { IonIcon } from '@ionic/react';
import {
  closeOutline,
  chatbubbleEllipsesOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons';

const BASE = "https://shriecom.in/appapis/shreefood/public/api";

interface EnquiryProduct {
  id: number;
  name: string;
}

interface EnquiryModalProps {
  closeModal: () => void;
  product?: EnquiryProduct | null;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 10,
  border: '1.5px solid #E5E0D8',
  fontSize: 14,
  fontFamily: 'inherit',
  color: '#1A1714',
  outline: 'none',
  background: '#FAF8F5',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: 12.5,
  fontWeight: 700,
  color: '#57504A',
  marginBottom: 6,
  display: 'block',
};

const EnquiryModal: React.FC<EnquiryModalProps> = ({ closeModal, product }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Auto-fill form fields from auth_user in localStorage on mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('auth_user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user.name) setName(user.name);
        if (user.phone) setPhone(user.phone);
        if (user.email) setEmail(user.email);
      }
    } catch (e) {
      console.error('Failed to parse auth_user from localStorage', e);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');

  if (!name.trim() || !phone.trim() || !message.trim()) {
    setError('Please fill name, phone and your question.');
    return;
  }

  setLoading(true);

  try {
    const token = localStorage.getItem('auth_token');
    const storedUserStr = localStorage.getItem('auth_user');

    let userId: number | undefined = undefined;

    if (storedUserStr) {
      try {
        const parsedUser = JSON.parse(storedUserStr);
        userId = parsedUser?.id; // ✅ FIX
      } catch (e) {
        console.error('User parse error', e);
      }
    }

    // ✅ FINAL PAYLOAD
    const payload: Record<string, any> = {
      name,
      phone,
      email: email || undefined,
      message,
    };

    // ✅ user_id (no .id mistake)
    if (userId) {
      payload.user_id = userId;
    }
if (product?.id) {
  payload.product_id = product.id;
}

    console.log("FINAL PAYLOAD:", payload);

    const res = await fetch(`${BASE}/product-enquiry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || json?.success === false) {
      throw new Error(json?.message || 'Enquiry failed');
    }

    setSuccess(true);

  } catch (err: any) {
    setError(err?.message || 'Something went wrong');
  } finally {
    setLoading(false);
  }
};

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#fff',
        fontFamily: "'Nunito',sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg,#1A1714,#2D2520)',
          padding: '20px 20px 22px',
          position: 'relative',
        }}
      >
        <button
          onClick={closeModal}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <IonIcon icon={closeOutline} style={{ fontSize: 18, color: '#fff' }} />
        </button>

        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'rgba(224,123,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
          }}
        >
          <IonIcon icon={chatbubbleEllipsesOutline} style={{ fontSize: 22, color: '#E07B00' }} />
        </div>

        <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: '#fff' }}>
          {product ? 'Ask About This Product' : 'Send Us an Enquiry'}
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'rgba(255,255,255,0.55)' }}>
          {product
            ? "We'll get back to you shortly with the details you need."
            : 'Have a question about an order, bulk purchase, or anything else? Ask away.'}
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {success ? (
          <div style={{ textAlign: 'center', padding: '40px 10px' }}>
            <IonIcon
              icon={checkmarkCircleOutline}
              style={{ fontSize: 56, color: '#16A34A', marginBottom: 14 }}
            />
            <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800, color: '#1A1714' }}>
              Enquiry Sent!
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: 13.5, color: '#9B8E84', lineHeight: 1.6 }}>
              Thanks {name.split(' ')[0]}, our team will reach out to you soon
              {phone ? ` at ${phone}` : ''}.
            </p>
            <button
              onClick={closeModal}
              style={{
                background: '#E07B00',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '11px 28px',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Product context chip */}
            {product && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: '#FFF3E0',
                  border: '1px solid rgba(224,123,0,0.25)',
                  borderRadius: 10,
                  padding: '10px 12px',
                  marginBottom: 18,
                }}
              >
                <span style={{ fontSize: 18 }}>🛒</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: '#9B8E84', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                    Regarding
                  </div>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: '#1A1714',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {product.name}
                  </div>
                </div>
              </div>
            )}

            {/* Name */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Your Name</label>
              <input
                style={inputStyle}
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Phone + Email side by side */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Phone Number</label>
                <input
                  style={inputStyle}
                  type="tel"
                  placeholder="10-digit number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  disabled={loading}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Email (optional)</label>
                <input
                  style={inputStyle}
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Message */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Your Question</label>
              <textarea
                style={{ ...inputStyle, resize: 'vertical', minHeight: 96, fontFamily: 'inherit' }}
                placeholder={
                  product
                    ? 'e.g. Is this available in a larger pack size?'
                    : 'Tell us what you need help with...'
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && (
              <div
                style={{
                  background: '#FEF2F2',
                  color: '#DC2626',
                  fontSize: 12.5,
                  fontWeight: 600,
                  borderRadius: 8,
                  padding: '10px 12px',
                  marginBottom: 14,
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? '#E0AB66' : '#E07B00',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '13px',
                fontSize: 15,
                fontWeight: 800,
                cursor: loading ? 'default' : 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 4px 14px rgba(224,123,0,0.3)',
              }}
            >
              {loading ? 'Sending…' : 'Submit Enquiry'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default EnquiryModal;