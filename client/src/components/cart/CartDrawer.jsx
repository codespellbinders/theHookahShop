import { useCart } from "../../context/CartContext";
import { Link } from "react-router-dom";
import "./CartDrawer.css";

function CartDrawer() {
  const { items, removeFromCart, updateQty, total, clearCart, drawerOpen, openCart, closeCart } = useCart();

  return (
    <div className={`cart-drawer ${drawerOpen ? "open" : ""}`}>
      <button className="cart-toggle" onClick={() => (drawerOpen ? closeCart() : openCart())}>
        🛒 {items.length}
      </button>

      <div className="cart-panel">
        <h3>Your Cart</h3>
        {items.length === 0 && <p>Your cart is empty.</p>}

        <div className="cart-items">
          {items.map((it) => (
            <div className="cart-item" key={it.id}>
              <div className="ci-left">
                <div className="ci-name">{it.name}</div>
                <div className="ci-price">Rs {it.price.toLocaleString()}</div>
              </div>
              <div className="ci-right">
                <input type="number" min={1} value={it.qty} onChange={(e) => updateQty(it.id, Number(e.target.value) || 1)} />
                <button onClick={() => removeFromCart(it.id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-footer">
          <div className="cart-total">Total: Rs {total.toLocaleString()}</div>
          <div className="cart-actions">
            <button onClick={clearCart} className="secondary">Clear</button>
            <Link to="/checkout" state={{ product: items.length === 1 ? items[0] : null }} className="primary">Checkout</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartDrawer;
