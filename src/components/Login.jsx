// src/components/Login.jsx
import React from "react";
import { GoogleLogin } from "@react-oauth/google";

const Login = ({ onClose, setToken, setUsername }) => {
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const token = credentialResponse.credential;

      // send token to backend
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (data.user) {
        localStorage.setItem("token", token);
        localStorage.setItem("userId", data.user._id);
        localStorage.setItem("userName", data.user.name);
        localStorage.setItem("userEmail", data.user.email);

        setToken(token);
        setUsername(data.user.name);

        if (onClose) onClose();
        console.log(`[LOGIN] ${data.user.name} connected`);
      }
    } catch (err) {
      console.error("Google login failed", err);
    }
  };

  const handleGoogleError = () => {
    console.error("Google login failed");
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl p-8">
        <h1 className="font-bold text-2xl mb-6 text-center">Login</h1>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
        />
      </div>
    </div>
  );
};

export default Login;
