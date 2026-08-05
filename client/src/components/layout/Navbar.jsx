import { useEffect, useMemo, useState } from "react";
import {
  HiOutlineSearch,
  HiOutlineUser,
  HiOutlineShoppingBag,
  HiOutlineMenu,
  HiOutlineX,
} from "react-icons/hi";
import logo from "../../assets/logo.png";
import "./Navbar.css";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { fetchCategories } from "../../services/api";

function Navbar() {
  const [dropdown, setDropdown] = useState(null);
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
      } catch {
        // keep fallback navigation below
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const parentCategories = useMemo(() => {
    const topLevel = categories.filter((category) => category.parentCategoryId === null);
    return topLevel.length
      ? topLevel
      : [
          { id: 1, name: "Hookahs", slug: "hookahs", parentCategoryId: null },
          { id: 2, name: "Accessories", slug: "accessories", parentCategoryId: null },
          { id: 3, name: "Bowls", slug: "bowls", parentCategoryId: null },
          { id: 4, name: "Flavours", slug: "flavours", parentCategoryId: null },
        ];
  }, [categories]);

  const childCategoriesByParent = useMemo(() => {
    return categories.reduce((map, category) => {
      if (category.parentCategoryId === null) return map;
      const key = String(category.parentCategoryId);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(category);
      return map;
    }, new Map());
  }, [categories]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const query = searchValue.trim();
    navigate(query ? `/products?search=${encodeURIComponent(query)}` : "/products");
    setShowSearch(false);
  };

  return (
    <header className="navbar">
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
            onClick={() => setMobileMenu((current) => !current)}
            aria-label="Toggle menu"
          >
            {mobileMenu ? <HiOutlineX className="nav-icon" /> : <HiOutlineMenu className="nav-icon" />}
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

          <button type="button" className="nav-icon-button cart-wrapper" onClick={openCart} aria-label="Open cart">
            <HiOutlineShoppingBag className="nav-icon" />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        </div>
      </div>

      {showSearch ? (
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
      ) : null}

      <nav className="navbar-menu">
        <NavLink to="/">
          HOME
        </NavLink>
        <NavLink to="/about">
          ABOUT US
        </NavLink>

        {parentCategories.map((category) => {
          const children = childCategoriesByParent.get(String(category.id)) || [];

          if (children.length) {
            return (
              <div
                key={category.id}
                className="dropdown"
                onMouseEnter={() => setDropdown(String(category.id))}
                onMouseLeave={() => setDropdown(null)}
              >
                <NavLink to={`/category/${category.slug}`} className="nav-link">
                  {String(category.name || "").toUpperCase()}
                  <i className="arrow"></i>
                </NavLink>

                {dropdown === String(category.id) ? (
                  <div className="dropdown-menu">
                    {children.map((item) => (
                      <Link key={item.id} to={`/category/${item.slug}`}>
                        {String(item.name || item.slug).toUpperCase()}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          }

          return (
            <NavLink key={category.id} to={`/category/${category.slug}`}>
              {String(category.name || "").toUpperCase()}
            </NavLink>
          );
        })}
      </nav>

      {mobileMenu ? (
        <div className="navbar-menu-mobile container">
          <Link to="/" className="mobile-link" onClick={() => setMobileMenu(false)}>
            HOME
          </Link>
          <Link to="/about" className="mobile-link" onClick={() => setMobileMenu(false)}>
            ABOUT US
          </Link>

          {parentCategories.map((category) => {
            const children = childCategoriesByParent.get(String(category.id)) || [];

            if (children.length) {
              return (
                <details key={category.id} className="mobile-details">
                  <summary>{String(category.name || "").toUpperCase()}</summary>
                  <div className="mobile-sublinks">
                    {children.map((item) => (
                      <Link key={item.id} to={`/category/${item.slug}`} onClick={() => setMobileMenu(false)}>
                        {String(item.name || item.slug).toUpperCase()}
                      </Link>
                    ))}
                  </div>
                </details>
              );
            }

            return (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                className="mobile-link"
                onClick={() => setMobileMenu(false)}
              >
                {String(category.name || "").toUpperCase()}
              </Link>
            );
          })}
        </div>
      ) : null}

      <div className="announcement-bar">
        <div className="announcement-track">Orders are processed only after advance payment. Thanks for understanding.</div>
      </div>
    </header>
  );
}

export default Navbar;
