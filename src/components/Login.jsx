import React, { useState } from "react";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";
import { API_BASE } from "./Api";

const Login = ({ onClose, setToken, setUser }) => {
  const [message, setMessage] = useState("");

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const googleToken = credentialResponse.credential;

      // Send Google token to backend
      const res = await axios.post(`${API_BASE}/auth/google`, {
        token: googleToken,
      });

      if (!res.data.success) {
        throw new Error("Login failed");
      }

      const { token, user } = res.data;

      console.log("✅ Login successful:", user);

      // ✅ CRITICAL: Save ALL user data to localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("userId", user.id);
      localStorage.setItem("userName", user.name); // ← This was missing!
      localStorage.setItem("userEmail", user.email);
      localStorage.setItem("user", JSON.stringify(user));

      // Update React state
      setToken(token);
      setUser(user);

      setMessage("Login successful!");

      console.log("📦 Saved to localStorage:", {
        userId: user.id,
        userName: user.name,
        userEmail: user.email
      });

      setTimeout(() => {
        if (onClose) onClose();
      }, 300);
    } catch (err) {
      console.error("❌ Login error:", err);
      setMessage(err.response?.data?.error || "Google login failed. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="font-bold text-2xl">Login</h1>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900 text-2xl"
          >
            &times;
          </button>
        </div>

        <div className="flex flex-col gap-6 items-center">
          <GoogleLogin
            onSuccess={handleGoogleLogin}
            onError={() => setMessage("Google login failed")}
          />
        </div>

        {message && (
          <p
            className={`mt-4 text-center text-sm ${
              message.includes("successful")
                ? "text-green-600"
                : "text-red-500"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;