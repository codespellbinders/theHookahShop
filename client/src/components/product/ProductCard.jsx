import { Link } from "react-router-dom";
import "./productCard.css";

function ProductCard({ product }) {
  return (
    <Link to={`/product/${product.id}`} state={{ product }} className="product-link">
      <div className="product-card">
        <div className="product-image-wrapper">
          <div className="image-placeholder">
            {product.name}
          </div>
        </div>

        <div className="product-info">
          <h3>{product.name}</h3>
          <p className="product-price">
            Rs {product.price.toLocaleString()}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default ProductCard;