import { Routes, Route } from "react-router-dom";
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

function App() {
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
      </Routes>
      <Footer />
    </>
  );
}

export default App;
