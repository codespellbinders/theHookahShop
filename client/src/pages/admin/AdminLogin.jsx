import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  adminLogin,
  extractApiError,
  getAdminToken,
  setAdminToken,
} from "../../services/api";
import "./admin.css";

function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const existingToken = getAdminToken();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (existingToken) {
    return <Navigate to="/admin/products" replace />;
  }

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    try {
      setLoading(true);
      const { token } = await adminLogin(email.trim(), password);
      if (!token) {
        setError("Unable to login. Try again.");
        return;
      }

      setAdminToken(token);
      const redirectTo = location.state?.from || "/admin/products";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(extractApiError(err, "Invalid admin credentials."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-auth-page">
      <div className="admin-auth-panel">
        <h1>Admin Login</h1>
        <p>Manage products and categories from your dashboard.</p>

        <form className="admin-auth-form" onSubmit={submit}>
          <label htmlFor="admin-email">Email</label>
          <input
            id="admin-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="owner@example.com"
          />

          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          <button className="admin-primary-btn" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>

          {error ? <p className="admin-form-error">{error}</p> : null}
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;
