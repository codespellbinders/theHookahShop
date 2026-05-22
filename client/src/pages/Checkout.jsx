import { useLocation } from "react-router-dom";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const WHATSAPP_NUMBER = "923178154864";

function Checkout() {
  const location = useLocation();
  const product = location.state?.product ?? location.state;
  const { items, total } = useCart();
  const { user, isVerified } = useAuth();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    payment_method: "bank_transfer",
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const checkoutItems = product ? [{ ...product, qty: 1 }] : items;
  const orderTotal = product ? product.price : total;
  const customerEmail = user?.email || "Not provided";

  const buildWhatsAppMessage = () => {
    const itemLines = checkoutItems
      .map((item) => `- ${item.name} x${item.qty} = Rs ${(item.price * item.qty).toLocaleString()}`)
      .join("\n");

    const paymentLabel = form.payment_method === "easypaisa" ? "Easypaisa Transfer" : "Bank Transfer";

    return [
      "New Order Request",
      "",
      `Name: ${form.name}`,
      `Phone: ${form.phone}`,
      `Email: ${customerEmail}`,
      `City: ${form.city}`,
      `Address: ${form.address}`,
      `Payment Method: ${paymentLabel}`,
      "",
      "Items:",
      itemLines,
      "",
      `Total: Rs ${orderTotal.toLocaleString()}`,
      "",
      "Payment Details:",
      "MEEZAN BANK LIMITED",
      "ACCOUNT TITLE: KHUDAI NOOR",
      "ACCOUNT NUMBER: 75010111899132",
      "IBAN: PK96MEZN0075010111899132",
      "EASYPAYSA: ACCOUNT TITLE: KHUDAI NOOR",
      "EASYPAYSA: ACCOUNT NUMBER: +923178154864",
    ].join("\n");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (checkoutItems.length === 0) {
      setErrorMessage("Your cart is empty.");
      return;
    }

    try {
      setIsSubmitting(true);
      const message = buildWhatsAppMessage();
      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

      window.location.href = whatsappUrl;

      setSuccessMessage("Opening WhatsApp with your order details.");
    } catch (error) {
      setErrorMessage("Unable to open WhatsApp right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-shell container">
      <div className="page-header">
        <h1>Checkout</h1>
          <p>Finalize your order on WhatsApp using your verified email account.</p>
      </div>

      {!isVerified && (
        <div className="notice-card">
          <p>
            WhatsApp checkout will still work without verification, but you can verify your email in <Link to="/profile">profile</Link> if you want an account.
          </p>
        </div>
      )}

      <div className="checkout-layout">
        <form className="checkout-form card" onSubmit={handleSubmit}>
          <h2>Customer Details</h2>

          <div className="form-grid">
            <input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} />
            <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} />
            <input value={user?.email || ""} placeholder="Verified Email" disabled />
            <input name="city" placeholder="City" value={form.city} onChange={handleChange} />
          </div>

          <textarea
            name="address"
            placeholder="Address"
            value={form.address}
            onChange={handleChange}
            rows="4"
          />

          <div className="form-grid">
            <select name="payment_method" value={form.payment_method} onChange={handleChange}>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="easypaisa">Easypaisa Transfer</option>
            </select>

            <div className="checkout-note">No file upload needed. Send payment details on WhatsApp.</div>
          </div>

          <button type="submit" className="gold-btn" disabled={isSubmitting}>
            {isSubmitting ? "Opening WhatsApp..." : "Send Order on WhatsApp"}
          </button>

          {successMessage && <p className="success-message">{successMessage}</p>}
          {errorMessage && <p className="error-message">{errorMessage}</p>}
        </form>

        <aside className="checkout-summary card">
          <h2>Order Summary</h2>
            {checkoutItems.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            checkoutItems.map((item) => (
              <div className="summary-row" key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                    <p>Qty {item.qty}</p>
                </div>
                <span>Rs {(item.price * item.qty).toLocaleString()}</span>
              </div>
            ))
          )}

          <div className="summary-total">
            <span>Total</span>
            <strong>Rs {orderTotal.toLocaleString()}</strong>
          </div>

          <div className="bank-block">
            <h3>Payment Details</h3>
            <p>Bank: MEEZAN BANK LIMITED</p>
            <p>Account Title: KHUDAI NOOR</p>
            <p>Account Number: 75010111899132</p>
            <p>IBAN: PK96MEZN0075010111899132</p>
            <div style={{ marginTop: "12px" }}>
              <strong>Easypaisa</strong>
              <p style={{ margin: "6px 0 0" }}>Account Title: KHUDAI NOOR</p>
              <p style={{ margin: "4px 0 0" }}>Account Number: +923178154864</p>
            </div>
          </div>
        </aside>
      </div>

      {!product && checkoutItems.length === 0 && (
        <div className="empty-state card">
          <h3>Your cart is empty</h3>
          <p>Add products to your cart before checking out.</p>
          <Link to="/products" className="primary-action-link">
            Shop Now
          </Link>
        </div>
      )}
    </div>
  );
}

export default Checkout;