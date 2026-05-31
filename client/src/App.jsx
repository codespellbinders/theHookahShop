import { Navigate, Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Navbar from "./components/layout/Navbar";
import Category from "./pages/Category";
import Product from "./pages/Product"; // ✅ DETAIL PAGE
import Products from "./pages/Products"; // ✅ ALL PRODUCTS PAGE
import Checkout from "./pages/Checkout";
import CartDrawer from "./components/cart/CartDrawer";
import AuthLogin from "./pages/AuthLogin";
import AuthSignup from "./pages/AuthSignup";
import AuthVerify from "./pages/AuthVerify";
import WhatsAppButton from "./components/layout/WhatsAppButton";
import Footer from "./components/layout/Footer";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminProducts from "./pages/admin/AdminProducts";
import { getAdminToken } from "./services/api";

function RequireAdmin({ children }) {
  const token = getAdminToken();
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  if (isAdminRoute) {
    return (
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/products"
          element={
            <RequireAdmin>
              <AdminProducts />
            </RequireAdmin>
          }
        />
        <Route path="/admin" element={<Navigate to="/admin/products" replace />} />
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    );
  }

  return (
    <>
      <Navbar />
      <CartDrawer />
      <WhatsAppButton />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/category/:category" element={<Category />} />
        <Route path="/product/:id" element={<Product />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/auth/login" element={<AuthLogin />} />
        <Route path="/auth/signup" element={<AuthSignup />} />
        <Route path="/auth/verify" element={<AuthVerify />} />
        <Route path="/admin/*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
