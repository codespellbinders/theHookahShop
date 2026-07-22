import { Link } from "react-router-dom";
import heroHookahVideo from "../../assets/herohookah2.mp4";

function Hero() {
  return (
    <section className="hero-section">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="hero-video"
      >
        <source src={heroHookahVideo} type="video/mp4" />
      </video>

      <div className="hero-overlay" />

      <div className="hero-content">
        <p className="hero-tagline">
          Pakistan&apos;s Premium Hookah Destination
        </p>
        <h1 className="hero-title">
          Experience the Art of Hookah.
        </h1>
        <p className="hero-description">
          Curated premium hookahs, authentic flavours, and accessories delivered across Pakistan. Trusted since 2016.
        </p>

        <div className="hero-actions">
          <Link to="/products">
            <button className="hero-cta-btn">SHOP NOW</button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Hero;