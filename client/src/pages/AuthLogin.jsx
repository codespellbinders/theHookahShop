import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendVerificationCode } from "../services/api";

function AuthLogin() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sendVerificationCode(email);
      navigate(`/auth/verify?email=${encodeURIComponent(email)}`);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: 40 }}>
      <h2>Login (email)</h2>
      <form onSubmit={handleSubmit}>
        <input type="email" required placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <br /><br />
        <button className="gold-btn" disabled={loading}>{loading? 'Sending...':'Send Login Code'}</button>
      </form>
    </div>
  );
}

export default AuthLogin;
