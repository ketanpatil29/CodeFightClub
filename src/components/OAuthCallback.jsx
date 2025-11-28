// src/components/OAuthCallback.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function OAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const email = params.get("email");
    const username = params.get("username");

    if (token) {
      localStorage.setItem("token", token);
      if (email) localStorage.setItem("userEmail", email);
      if (username) {
        localStorage.setItem("userName", username);
        localStorage.setItem("username", username);
      }
      // small delay so user sees "Logging in..."
      setTimeout(() => navigate("/"), 400);
    } else {
      // failure
      console.error("OAuth callback: no token");
      setTimeout(() => navigate("/"), 1000);
    }
  }, [navigate]);

  return <div className="min-h-screen flex items-center justify-center"><p>Logging you in…</p></div>;
}
