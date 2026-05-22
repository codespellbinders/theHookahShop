import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

function Cart() {
  const { items, subtotal, updateQuantity, removeFromCart, clearCart } = useCart();

  return (
    <div className="page-shell container">
      <div className="page-header">
        <h1>Cart</h1>
        <p>Review your items before heading to checkout.</p>
      </div>

      {items.length === 0 ? (
        <div className="empty-state card">
          <h3>Your cart is empty</h3>
          <p>Browse the catalog and add products to continue.</p>
          <Link to="/products" className="primary-action-link">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="checkout-layout">
          <section className="checkout-form card">
            {items.map((item) => (
              <div className="cart-item cart-page-item" key={item.id}>
                <div>
                  <h3>{item.name}</h3>
                  <p>Rs {item.price.toLocaleString()}</p>
                </div>

                <div className="cart-item-actions">
                  <button type="button" className="quantity-button" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button type="button" className="quantity-button" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                    +
                  </button>
                  <button type="button" className="remove-link" onClick={() => removeFromCart(item.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}

            <button type="button" className="secondary-action-link" onClick={clearCart}>
              Clear Cart
            </button>
          </section>

          <aside className="checkout-summary card">
            <h2>Summary</h2>
            <div className="summary-total">
              <span>Subtotal</span>
              <strong>Rs {subtotal.toLocaleString()}</strong>
            </div>
            <Link to="/checkout" className="primary-action-link">
              Proceed to Checkout
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}

export default Cart;