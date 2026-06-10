import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { sendVerificationCode, verifyCode } from "../services/api";

const AuthContext = createContext(null);
const STORAGE_KEY = "thehookahshop-user";

function readStoredUser() {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function formatVerificationMessage(data, fallbackMessage) {
  const parts = [
    data?.message || fallbackMessage,
    data?.previewUrl ? `Preview: ${data.previewUrl}` : "",
    data?.verificationCode ? `Dev code: ${data.verificationCode}` : "",
  ];

  return parts.filter(Boolean).join(" ");
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [pendingEmail, setPendingEmail] = useState(readStoredUser()?.email || "");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (user) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else window.localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  const requestVerificationCode = async (email) => {
    const normalized = String(email || "").trim().toLowerCase();
    const res = await sendVerificationCode(normalized);
    setPendingEmail(normalized);
    setStatusMessage(formatVerificationMessage(res.data, "Verification code sent."));
    return res.data;
  };

  const confirmVerificationCode = async (email, code) => {
    const normalized = String(email || "").trim().toLowerCase();
    const res = await verifyCode(normalized, String(code || "").trim());
    const u = res.data?.user || { email: normalized, verified: true };
    setUser(u);
    setPendingEmail(normalized);
    setStatusMessage(res.data?.message || "Email verified.");
    return res.data;
  };

  const logout = () => {
    setUser(null);
    setPendingEmail("");
    setStatusMessage("Logged out.");
  };

  const value = useMemo(
    () => ({
      user,
      pendingEmail,
      statusMessage,
      isVerified: Boolean(user?.verified),
      requestVerificationCode,
      confirmVerificationCode,
      logout,
      setStatusMessage,
    }),
    [user, pendingEmail, statusMessage]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

export default AuthContext;