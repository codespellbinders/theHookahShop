import { useEffect } from "react";
import "./aboutPage.css";

function About() {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <section className="about-page">
      <div className="about-container">
        
        {/* Page Title */}
        <header className="about-header">
          <h1>ABOUT US</h1>
        </header>

        {/* Section 1: Who We Are */}
        <div className="about-section">
          <h2>WHO WE ARE</h2>
          <p>
            At Hookah Shop Pakistan, we are a trusted source for premium hookahs, flavors, and accessories. Since 2016, we have been serving hookah enthusiasts across Pakistan with quality products, competitive pricing, and dependable service.
          </p>
          <p>
            With more than 11 years of experience, our mission is to provide an exceptional shopping experience through authentic products, secure ordering, fast delivery, and dedicated customer support. We are committed to putting our customers first and building lasting trust with every order.
          </p>
          <p>
            At Hookah Shop Pakistan, we’re your go-to place for premium hookahs, flavors, and accessories. Since 2016, we’ve been helping hookah lovers across Pakistan find quality products, fair prices, and reliable service.
          </p>
          <p>
            With more than 11 years of experience, our goal is to make your shopping experience easy and enjoyable with authentic products, secure ordering, fast delivery, and friendly customer support. We always put our customers first and work hard to earn your trust with every order.
          </p>
        </div>

        <hr className="about-divider" />

        {/* Section 2: Our Physical Shop In Quetta */}
        <div className="about-section">
          <h2>OUR PHYSICAL SHOP IN QUETTA</h2>
          <p>Visit our store in Quetta</p>
          <p>
            Since 2016, Hookah Shop Pakistan has proudly served customers through both our online store and physical location.
          </p>
          <p>Come visit our store in Quetta</p>
          <p>
            Since 2016, Hookah Shop Pakistan has been serving customers through both our online store and our physical shop.
          </p>
          
          {/* Address Card */}
          <div className="about-address-card">
            <p className="about-address-text">
              <span className="about-address-icon">📍</span> Shop No. 7, Qaddafi Market, Masjid Road, Quetta
            </p>
          </div>

          <p>
            Our business is Google Verified, giving our customers confidence that they are purchasing from a genuine and reliable store. We remain committed to offering authentic products and professional customer service.
          </p>
          <p>
            We’re Google Verified, so you can shop with confidence knowing you’re buying from a genuine and trusted store. We’re always here to offer authentic products and helpful customer service.
          </p>
        </div>

        <hr className="about-divider" />

        {/* Section 3: Our Services */}
        <div className="about-section">
          <h2>OUR SERVICES</h2>
          <p>We offer a wide range of premium hookah products and accessories, including:</p>
          
          {/* Services 2-Column Grid */}
          <div className="about-services-grid">
            <div className="about-service-item">
              <span className="about-service-icon">✔</span> Imported Hookahs
            </div>
            <div className="about-service-item">
              <span className="about-service-icon">✔</span> Complete Hookah Accessories
            </div>
            <div className="about-service-item">
              <span className="about-service-icon">✔</span> Hookah Bowls
            </div>
            <div className="about-service-item">
              <span className="about-service-icon">✔</span> Hookah Hoses and Spare Parts
            </div>
            <div className="about-service-item">
              <span className="about-service-icon">✔</span> Hookah Pumps
            </div>
            <div className="about-service-item">
              <span className="about-service-icon">✔</span> Premium Hookah Flavors
            </div>
            <div className="about-service-item">
              <span className="about-service-icon">✔</span> Other Hookah Essentials
            </div>
          </div>

          <p>
            We carefully source our products to ensure high quality and customer satisfaction.
          </p>
          <p>
            We carefully choose our products to make sure you get great quality and a satisfying experience.
          </p>
        </div>

        <hr className="about-divider" />

        {/* Section 4: Delivery Across Pakistan */}
        <div className="about-section">
          <h2>DELIVERY ACROSS PAKISTAN 🇵🇰</h2>
          <p>We deliver our products throughout Pakistan through reliable courier services.</p>
          <p>We deliver all over Pakistan through trusted courier services.</p>
          
          {/* Delivery Highlights */}
          <div className="about-delivery-highlights">
            <div className="about-delivery-item">
              <span className="about-delivery-emoji">🚚</span> Delivery Partner: TCS
            </div>
            <div className="about-delivery-item">
              <span className="about-delivery-emoji">⏱️</span> Estimated Delivery Time: 3–4 working days
            </div>
          </div>

          <p>All orders are carefully packaged to ensure safe delivery.</p>
          <p>Every order is packed carefully so it reaches you safely.</p>
        </div>

        <hr className="about-divider" />

        {/* Section 5: Payment Policy */}
        <div className="about-section">
          <h2>PAYMENT POLICY</h2>
          
          <div className="about-payment-box">
            <p className="about-payment-note">To ensure a secure ordering process:</p>
            <p className="about-payment-note">To keep the ordering process secure:</p>
            
            <p className="about-payment-item">
              <strong>Hookahs and flavors:</strong> Advance payment is required (Cash on Delivery is not available for these products).
            </p>
            <p className="about-payment-item">
              <strong>Accessories:</strong> Cash on Delivery (COD) is available.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}

export default About;
