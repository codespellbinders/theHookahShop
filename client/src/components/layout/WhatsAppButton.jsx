import React from "react";
import { FaWhatsapp } from "react-icons/fa";

const WHATSAPP_NUMBER = "+923178154864";
const PREFILL = "Hello, I want to place an order.";

export default function WhatsAppButton() {
  const href = `https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
    PREFILL
  )}`;

  return (
    <a
      className="whatsapp-float"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
    >
      <button className="wa-btn" title="Chat with us on WhatsApp">
        <FaWhatsapp size={22} />
      </button>
    </a>
  );
}
