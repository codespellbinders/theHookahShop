import { useState, useEffect } from "react";
import {
  HiOutlineSearch,
  HiOutlineUser,
  HiOutlineShoppingBag,
  HiOutlineMenu,
  HiOutlineX,
} from "react-icons/hi";
import logo from "../../assets/logo.png";
import "./Navbar.css";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { fetchCategories } from "../../services/api";

function Navbar() {
  const [dropdown, setDropdown] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();
  const { items, openCart } = useCart();
  const cartCount = items.reduce((s, it) => s + (it.qty || 1), 0);
  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const rows = await fetchCategories();
        if (mounted && Array.isArray(rows)) setCategories(rows);
      } catch (err) {
        // ignore - we'll fall back to hardcoded links
      }
    })();
    return () => (mounted = false);
  }, []);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const query = searchValue.trim();
    navigate(query ? `/products?search=${encodeURIComponent(query)}` : "/products");
    setShowSearch(false);
  };

  return (
    <header className="navbar">
      {/* TOP ROW */}
      <div className="navbar-top container">
        <Link to="/" className="nav-brand">
          <img src={logo} alt="The Hookah Shop" />
          <span className="nav-brand-copy">
            <strong>THE HOOKAH SHOP</strong>
            <small>Premium hookah lifestyle</small>
          </span>
        </Link>

        <div className="nav-right">
          <button
            type="button"
            className="nav-icon-button mobile-menu-button"
            onClick={() => setMobileMenu((m) => !m)}
            aria-label="Toggle menu"
          >
            {mobileMenu ? (
              <HiOutlineX className="nav-icon" />
            ) : (
              <HiOutlineMenu className="nav-icon" />
            )}
          </button>
          <button
            type="button"
            className="nav-icon-button"
            onClick={() => setShowSearch((current) => !current)}
            aria-label="Search products"
          >
            <HiOutlineSearch className="nav-icon" />
          </button>

          <Link
            to="/auth/login"
            className="nav-icon-button"
            aria-label={user?.email ? `Signed in as ${user.email}` : "Profile"}
          >
            <HiOutlineUser className="nav-icon" />
          </Link>

          <button
            type="button"
            className="nav-icon-button cart-wrapper"
            onClick={openCart}
            aria-label="Open cart"
          >
            <HiOutlineShoppingBag className="nav-icon" />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        </div>
      </div>

      {showSearch && (
        <form className="navbar-search container" onSubmit={handleSearchSubmit}>
          <input
            type="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search hookahs, bowls, accessories..."
            className="navbar-search-input"
          />
          <button type="submit" className="navbar-search-button">
            Search
          </button>
        </form>
      )}

      {/* MENU ROW */}
      <nav className="navbar-menu">
        <Link to="/" className="active">
          HOME
        </Link>

        <div
          className="dropdown"
          onMouseEnter={() => setDropdown(true)}
          onMouseLeave={() => setDropdown(false)}
        >
          <Link to="/category/hookahs" className="nav-link">
            HOOKAHS
            <i className="arrow"></i>
          </Link>

          {dropdown && (
            <div className="dropdown-menu">
              <Link to="/category/premium-hookahs">PREMIUM HOOKAHS</Link>
              <Link to="/category/exclusive-hookahs">EXCLUSIVE HOOKAHS</Link>
              <Link to="/category/budget-hookahs">BUDGET FRIENDLY HOOKAHS</Link>
              <Link to="/category/portable-hookahs">PORTABLE HOOKAHS</Link>
              <Link to="/category/royal-hookahs">ROYAL HOOKAHS</Link>
            </div>
          )}
        </div>

        {/* render categories from API (exclude hookah subcategories handled in dropdown) */}
        {categories && categories.length
          ? categories
              .filter((c) => !String(c.slug || "").includes("hookah"))
              .map((c) => (
                <Link key={c.id} to={`/category/${c.slug}`}>
                  {String(c.name || "").toUpperCase()}
                </Link>
              ))
          : (
            <>
              <Link to="/category/bowl">BOWLS</Link>
              <Link to="/category/accessories">ACCESSORIES</Link>
              <Link to="/category/coals">COALS</Link>
              <Link to="/category/heat-management">HEAT MANAGEMENT DEVICES</Link>
              <Link to="/category/flavours">FLAVOURS</Link>
            </>
          )}
        {/* Admin link removed from public navbar (owner-only) */}
      </nav>
      {mobileMenu && (
        <div className="navbar-menu-mobile container">
          <Link to="/" className="mobile-link" onClick={() => setMobileMenu(false)}>
            HOME
          </Link>

          <details className="mobile-details">
            <summary>HOOKAHS</summary>
            <div className="mobile-sublinks">
              <Link to="/category/premium-hookahs" onClick={() => setMobileMenu(false)}>PREMIUM HOOKAHS</Link>
              <Link to="/category/exclusive-hookahs" onClick={() => setMobileMenu(false)}>EXCLUSIVE HOOKAHS</Link>
              <Link to="/category/budget-hookahs" onClick={() => setMobileMenu(false)}>BUDGET FRIENDLY HOOKAHS</Link>
              <Link to="/category/portable-hookahs" onClick={() => setMobileMenu(false)}>PORTABLE HOOKAHS</Link>
              <Link to="/category/royal-hookahs" onClick={() => setMobileMenu(false)}>ROYAL HOOKAHS</Link>
            </div>
          </details>

          {categories && categories.length ? (
            categories
              .filter((c) => !String(c.slug || "").includes("hookah"))
              .map((c) => (
                <Link key={c.id} to={`/category/${c.slug}`} className="mobile-link" onClick={() => setMobileMenu(false)}>
                  {c.name}
                </Link>
              ))
          ) : (
            <>
              <Link to="/category/bowl" className="mobile-link" onClick={() => setMobileMenu(false)}>BOWLS</Link>
              <Link to="/category/accessories" className="mobile-link" onClick={() => setMobileMenu(false)}>ACCESSORIES</Link>
              <Link to="/category/coals" className="mobile-link" onClick={() => setMobileMenu(false)}>COALS</Link>
              <Link to="/category/heat-management" className="mobile-link" onClick={() => setMobileMenu(false)}>HEAT MANAGEMENT DEVICES</Link>
              <Link to="/category/flavours" className="mobile-link" onClick={() => setMobileMenu(false)}>FLAVOURS</Link>
            </>
          )}
        </div>
      )}
      <div className="announcement-bar">
        <div className="announcement-track">
          🚚 Free Delivery on Orders Above Rs.50,000 – Order Now & Save
        </div>
      </div>
    </header>
  );
}

export default Navbar;
