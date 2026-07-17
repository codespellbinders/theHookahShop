import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaFacebookF, FaInstagram, FaWhatsapp } from "react-icons/fa";
import "./Footer.css";

const WHATSAPP_NUMBER = "923178154864";
const SUPPORT_EMAIL = "support@thehookahshop.pk";

import { fetchCategories } from "../../services/api";

function Footer() {
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const rows = await fetchCategories();
        if (mounted && Array.isArray(rows)) setCategories(rows);
      } catch (err) {
        // ignore
      }
    })();
    return () => (mounted = false);
  }, []);
  const year = new Date().getFullYear();

  const handleSubscribe = (event) => {
    event.preventDefault();
    const trimmed = subscriberEmail.trim();
    if (!trimmed) return;

    const subject = encodeURIComponent("Newsletter subscription request");
    const body = encodeURIComponent(`Please subscribe this email to updates: ${trimmed}`);
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    setSubscriberEmail("");
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand-column">
          <h2>THE HOOKAH SHOP</h2>
          <p>
            Premium hookah products and accessories delivered across Pakistan.
            Verified users get faster checkout support.
          </p>

          <div className="footer-social-row" aria-label="Social links">
            <a href="https://wa.me/923178154864" target="_blank" rel="noreferrer" aria-label="WhatsApp">
              <FaWhatsapp />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
              <FaInstagram />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
              <FaFacebookF />
            </a>
          </div>
        </div>

        <div>
          <h3>Quick Links</h3>
          <ul className="footer-links-list">
            <li><Link to="/" onClick={scrollToTop}>Home</Link></li>
            <li><Link to="/products" onClick={scrollToTop}>All Products</Link></li>
            <li><Link to="/about" onClick={scrollToTop}>About Us</Link></li>
            <li><Link to="/category/hookahs" onClick={scrollToTop}>Hookahs</Link></li>
            <li><Link to="/category/bowl" onClick={scrollToTop}>Bowls</Link></li>
            <li><Link to="/category/accessories" onClick={scrollToTop}>Accessories</Link></li>
            <li><Link to="/checkout" onClick={scrollToTop}>Checkout</Link></li>
          </ul>
        </div>

        <div>
          <h3>Top Categories</h3>
          <ul className="footer-links-list">
            {categories && categories.length ? (
              categories.slice(0, 6).map((c) => (
                <li key={c.id}><Link to={`/category/${c.slug}`} onClick={scrollToTop}>{c.name}</Link></li>
              ))
            ) : (
              <>
                <li><Link to="/category/premium-hookahs" onClick={scrollToTop}>Premium Hookahs</Link></li>
                <li><Link to="/category/exclusive-hookahs" onClick={scrollToTop}>Exclusive Hookahs</Link></li>
                <li><Link to="/category/budget-hookahs" onClick={scrollToTop}>Budget Hookahs</Link></li>
                <li><Link to="/category/portable-hookahs" onClick={scrollToTop}>Portable Hookahs</Link></li>
                <li><Link to="/category/royal-hookahs" onClick={scrollToTop}>Royal Hookahs</Link></li>
                <li><Link to="/category/flavours" onClick={scrollToTop}>Flavours</Link></li>
              </>
            )}
          </ul>
        </div>

        <div>
          <h3>Contact</h3>
          <ul className="footer-links-list footer-contact-list">
            <li><a href="tel:+923178154864">+92 317 8154864</a></li>
            <li><a href="mailto:support@thehookahshop.pk">support@thehookahshop.pk</a></li>
            <li><a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer">Chat on WhatsApp</a></li>
            <li><Link to="/auth/verify" onClick={scrollToTop}>Verify Your Email</Link></li>
          </ul>

          <form className="footer-subscribe" onSubmit={handleSubscribe}>
            <label htmlFor="footer-email">Get Deals & New Arrivals</label>
            <div>
              <input
                id="footer-email"
                type="email"
                placeholder="Enter your email"
                value={subscriberEmail}
                onChange={(event) => setSubscriberEmail(event.target.value)}
                required
              />
              <button type="submit">Subscribe</button>
            </div>
          </form>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-row">
          <p>© {year} The Hookah Shop. All rights reserved.</p>
          <div className="footer-utility-links">
            <button type="button" onClick={scrollToTop}>Back to top</button>
            <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Support Request")}`}>Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;