import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Profile() {
  const {
    user,
    pendingEmail,
    statusMessage,
    requestVerificationCode,
    confirmVerificationCode,
    logout,
    isVerified,
  } = useAuth();

  const [email, setEmail] = useState(pendingEmail || user?.email || "");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [localMessage, setLocalMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSendCode = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setLocalMessage("");

    try {
      setLoading(true);
      await requestVerificationCode(email);
      setLocalMessage("Verification code sent to your email.");
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Unable to send verification code."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setLocalMessage("");

    try {
      setLoading(true);
      await confirmVerificationCode(email, code);
      setLocalMessage("Email verified successfully.");
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Invalid verification code."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell container">
      <div className="page-header">
        <h1>Profile</h1>
        <p>Create or verify your email before placing an order.</p>
      </div>

      <div className="checkout-layout">
        <form className="checkout-form card" onSubmit={handleSendCode}>
          <h2>Email Account</h2>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <button type="submit" className="gold-btn" disabled={loading}>
            {loading ? "Sending..." : "Send Verification Code"}
          </button>

          <input
            type="text"
            placeholder="6-digit code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            inputMode="numeric"
            maxLength={6}
          />
          <button type="button" className="secondary-action-link" onClick={handleVerifyCode} disabled={loading}>
            {loading ? "Verifying..." : "Verify Code"}
          </button>

          {user && (
            <button type="button" className="secondary-action-link" onClick={logout}>
              Log Out
            </button>
          )}

          {localMessage && <p className="success-message">{localMessage}</p>}
          {errorMessage && <p className="error-message">{errorMessage}</p>}
          {statusMessage && <p className="muted-message">{statusMessage}</p>}
        </form>

        <aside className="checkout-summary card">
          <h2>Account Status</h2>
          <p>
            {isVerified
              ? `Verified email: ${user?.email}`
              : "Your email is not verified yet."}
          </p>
          <Link to="/checkout" className="primary-action-link">
            Continue to Checkout
          </Link>
        </aside>
      </div>
    </div>
  );
}

export default Profile;