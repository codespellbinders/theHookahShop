import { Link } from "react-router-dom";
import ProductCard from "../components/product/ProductCard";
import products from "../data/products";
import Hero from "../components/layout/Hero";

function Home() {
  const renderSection = (categoryName, title) => {
    const filtered = products.filter((p) => p.category === categoryName);

    return (
      <section className="products-section">
        <div className="products-container">
          <h2 className="products-title">{title}</h2>

          <div className="products-grid">
            {filtered.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: "40px" }}>
            <Link to={`/category/${categoryName}`}>
              <button className="view-btn">VIEW ALL</button>
            </Link>
          </div>
        </div>
      </section>
    );
  };

  return (
    <>
      <Hero />
      {renderSection("premium-hookahs", "PREMIUM HOOKAHS")}
      {renderSection("exclusive-hookahs", "EXCLUSIVE HOOKAHS")}
      {renderSection("budget-hookahs", "BUDGET FRIENDLY")}
      {renderSection("portable-hookahs", "PORTABLE")}
      {renderSection("royal-hookahs", "ROYAL")}
      {renderSection("bowls", "BOWLS")}
      {renderSection("accessories", "ACCESSORIES")}
      {renderSection("coals", "COALS")}
      {renderSection("heat-management", "HEAT MANAGEMENT")}
      {renderSection("flavours", "FLAVOURS")}
    </>
  );
}

export default Home;
