import { Link } from "react-router-dom";
import heroHookahVideo from "../../assets/herohookah.mp4";

function Hero() {
  return (
    <section
      style={{
        height: "90vh",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center"
      }}
    >
      <video
        autoPlay
        muted
        loop
        playsInline
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover"
        }}
      >
        <source src={heroHookahVideo} type="video/mp4" />
      </video>

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.6)"
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <h1 style={{ fontSize: "48px" }}>
          UNWIND IN STYLE
        </h1>
        <p style={{ marginTop: "20px", color: "#ccc" }}>
          Discover premium hookahs & accessories
        </p>

        <div style={{ marginTop: "30px" }}>
          <Link to="/products">
            <button className="gold-btn">SHOP NOW</button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Hero;