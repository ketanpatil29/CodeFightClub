import React, { useState } from "react";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";

const Login = ({ onClose, setToken, setUsername }) => {
  const [message, setMessage] = useState("");

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const googleToken = credentialResponse.credential;

      // Send Google token → backend
      const res = await axios.post(`${API_BASE}/auth/google`, {
        token: googleToken,
      });

      const user = res.data.user;

      // Clear previous data
      localStorage.clear();

      // Save logged user
      localStorage.setItem("userId", user._id);
      localStorage.setItem("userName", user.name || user.email);
      localStorage.setItem("userEmail", user.email);
      localStorage.setItem("googleId", user.googleId);

      if (setUsername) setUsername(user.name || user.email);
      if (setToken) setToken(user.googleId);

      setMessage("Login successful!");

      setTimeout(() => {
        if (onClose) onClose();
      }, 500);
    } catch (err) {
      console.error(err);
      setMessage("Google login failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl p-8">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="font-bold text-2xl">Login</h1>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:scale-110 hover:text-gray-900 text-2xl"
          >
            &times;
          </button>
        </div>

        {/* Google Login Button */}
        <div className="flex flex-col gap-6 items-center">

          <GoogleLogin
            onSuccess={handleGoogleLogin}
            onError={() => setMessage("Google login failed")}
            theme="filled_blue"
            size="large"
            width="280"
          />

        </div>

        {/* Message */}
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
