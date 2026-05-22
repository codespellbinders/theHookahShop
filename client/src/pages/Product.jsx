import { Link, useLocation, useParams } from "react-router-dom";
import products from "../data/products";
import "./productPage.css";
import { useCart } from "../context/CartContext";

function Product() {
  const { id } = useParams();
  const location = useLocation();
  const { addToCart, openCart } = useCart();

  const product = location.state?.product ?? products.find(
    (item) => item.id === parseInt(id)
  );

  if (!product) {
    return <h2 style={{ color: "white", padding: "150px" }}>Product not found</h2>;
  }

  return (
    <section className="product-page">
      <div className="product-container">

        <div className="product-image">
          <div className="image-placeholder">
            {product.name}
          </div>
        </div>

        <div className="product-details">
          <h1>{product.name}</h1>
          <p className="product-price">
            Rs {product.price.toLocaleString()}
          </p>

          <p className="product-category">
            {product.category.replace(/-/g, " ").toUpperCase()}
          </p>

          <p className="product-description">
            Premium luxury hookah designed for ultimate performance and style.
          </p>

          <div className="product-actions">

            <Link to="/products" className="secondary-action-btn">
              BACK TO PRODUCTS
            </Link>

            <button className="secondary-action-btn" onClick={() => addToCart(product)}>
              ADD TO CART
            </button>

            <Link to="/checkout" state={{ product }} className="add-to-cart-btn">
              BUY NOW
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}

export default Product;