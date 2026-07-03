import { useState } from "react";
import { useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { verifyCode, sendVerificationCode } from "../services/api";
import { useAuth } from "../context/AuthContext";

function AuthVerify() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const emailParam = searchParams.get("email") || "";
  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [messageType, setMessageType] = useState(() => {
    const delivery = location.state || {};
    return delivery.previewUrl || delivery.deliveryMode === "test" ? "info" : delivery.message ? "success" : "";
  });
  const [message, setMessage] = useState(() => {
    const delivery = location.state || {};
    const parts = [delivery.message, delivery.previewUrl ? `Preview: ${delivery.previewUrl}` : "", delivery.verificationCode ? `Dev code: ${delivery.verificationCode}` : ""];
    return parts.filter(Boolean).join(" ");
  });
  const navigate = useNavigate();
  const { confirmVerificationCode, requestVerificationCode } = useAuth();

  const sendCode = async (e) => {
    e.preventDefault();
    if (!email) {
      setMessage("Please enter your email first");
      setMessageType("error");
      return;
    }
    try {
      setSending(true);
      setMessage("");
      setMessageType("");
      const data = await requestVerificationCode(email);
      const parts = [
        data?.message || "✓ Code sent! Check your email or server logs.",
        data?.previewUrl ? `Preview: ${data.previewUrl}` : "",
        data?.verificationCode ? `Dev code: ${data.verificationCode}` : "",
      ];
      setMessage(parts.filter(Boolean).join(" "));
      setMessageType(data?.deliveryMode === "test" ? "info" : "success");
    } catch (err) {
      setMessage(err?.response?.data?.message || err?.message || "Failed to send code");
      setMessageType("error");
    } finally {
      setSending(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await confirmVerificationCode(email, code);
      navigate("/");
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: 40 }}>
      <h2>Verify Email</h2>
      
      <div style={{ marginBottom: "24px", padding: "12px", background: "#1a1a1a", borderRadius: "8px", color: "#aaa" }}>
        <p style={{ margin: "0 0 12px 0", fontSize: "14px" }}>
          <strong>Step 1:</strong> Enter your email and click "Send Code" to request a verification code.
        </p>
        <p style={{ margin: "0", fontSize: "14px" }}>
          <strong>Step 2:</strong> Check your email (or server console in development) for the 6-digit code.
        </p>
      </div>

      <form onSubmit={submit}>
        <input type="email" required placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <br /><br />
        
        <button type="button" className="gold-btn" onClick={sendCode} disabled={sending}>
          {sending ? "Sending..." : "Send Code"}
        </button>
        
        {message && (
          <p
            style={{
              margin: "12px 0",
              color: messageType === "success" ? "#7ded99" : messageType === "info" ? "#ffd36a" : "#ff7d7d",
            }}
          >
            {message}
          </p>
        )}
        
        <br /><br />
        
        <input type="text" required placeholder="6-digit code" value={code} onChange={(e)=>setCode(e.target.value)} />
        <br /><br />
        <button className="gold-btn" disabled={loading}>{loading? 'Verifying...' : 'Verify'}</button>
      </form>
    </div>
  );
}

export default AuthVerify;
