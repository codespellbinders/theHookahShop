import React, { useEffect, useState } from "react";
import "./AgeVerification.css";

export default function AgeVerification() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let isVerified = false;
    try {
      isVerified = localStorage.getItem("ageVerified") === "true";
    } catch (e) {
      // localStorage not available — assume not verified
      isVerified = false;
    }

    if (!isVerified) {
      setVisible(true);
      // prevent background scroll while modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleYes = () => {
    try {
      localStorage.setItem("ageVerified", "true");
    } catch (e) {
      // ignore
    }
    setVisible(false);
    document.body.style.overflow = "";
  };

  const handleNo = () => {
    // Redirect to Google to block access
    window.location.href = "https://google.com";
  };

  if (!visible) return null;

  return (
    <div className="age-overlay" role="dialog" aria-modal="true" aria-labelledby="age-heading">
      <div className="age-card">
        <h2 id="age-heading" className="age-heading">Are you 18 or older?</h2>
        <p className="age-desc">You must be 18 or older to enter this site. Please confirm your age to continue.</p>

        <div className="age-actions">
          <button className="age-yes" onClick={handleYes}>YES I'M 18 OR OLDER</button>
          <button className="age-no" onClick={handleNo}>NO I'M UNDER 18</button>
        </div>
      </div>
    </div>
  );
}
