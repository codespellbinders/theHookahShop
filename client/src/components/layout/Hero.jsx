function Hero() {
  return (
    <section style={{
      height: "90vh",
      background: "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('https://images.unsplash.com/photo-1606248897732-2c5ffe759c04?q=80&w=1974') center/cover",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      textAlign: "center"
    }}>
      <div>
        <h1 style={{ fontSize: "48px" }}>
          UNWIND IN STYLE
        </h1>
        <p style={{ marginTop: "20px", color: "#ccc" }}>
          Discover premium hookahs & accessories
        </p>

        <div style={{ marginTop: "30px" }}>
          <button className="gold-btn">SHOP NOW</button>
        </div>
      </div>
    </section>
  );
}

export default Hero;