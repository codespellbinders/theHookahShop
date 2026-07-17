import { Link } from "react-router-dom";
import heroHookahVideo from "../../assets/herohookah.mp4";

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
        <h1 className="hero-title">
          UNWIND IN STYLE
        </h1>
        <p className="hero-description">
          Discover premium hookahs & accessories
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