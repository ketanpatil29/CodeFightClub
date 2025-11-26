import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login = ({ onClose, setToken, setUsername }) => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const sendOtp = async () => {
    try {
      const res = await axios.post("http://localhost:5000/auth/send-otp", { email });
      setMessage(res.data.message || "OTP sent to your email!");
      setTimeout(() => {
        setOtpSent(true);
      }, 1000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Error sending OTP");
    }
  };

  const verifyOtp = async () => {
    try {
      const res = await axios.post("http://localhost:5000/auth/verify-otp", {
        email,
        otp,
        password
      });
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.message || "Invalid OTP or password");
    }
  };

  const loginUser = async () => {
    try {
      const res = await axios.post("http://localhost:5000/auth/login", {
        email,
        password
      });

      const user = res.data.user;
      const token = res.data.token;

      // Store user info in localStorage
      localStorage.setItem("userId", user._id);
      localStorage.setItem("userName", user.userName || user.email);
      localStorage.setItem("username", user.userName || user.email); // Added this!
      localStorage.setItem("userEmail", user.email);
      localStorage.setItem("token", token);

      // Update parent component states
      setToken(token);
      if (setUsername) {
        setUsername(user.userName || user.email);
      }

      setMessage("Login successful!");
      
      // Close modal and redirect
      setTimeout(() => {
        onClose();
      }, 500);

    } catch (err) {
      setMessage(err.response?.data?.message || "Login failed");
    }
  };

  const handleClose = () => {
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="font-bold text-2xl">Login / Register</h1>
          <button 
            type="button" 
            onClick={handleClose} 
            className="text-gray-500 hover:scale-110 hover:text-gray-900 text-2xl"
          >
            &times;
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />

          {!otpSent && (
            <button
              onClick={sendOtp}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold py-3 shadow-md hover:scale-105 hover:shadow-lg transition-all duration-300"
            >
              Send OTP
            </button>
          )}

          {otpSent && (
            <>
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="password"
                placeholder="Set / Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={verifyOtp}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold py-3 shadow-md hover:scale-105 hover:shadow-lg transition-all duration-300"
              >
                Verify OTP & Set Password
              </button>
              <button
                onClick={loginUser}
                className="bg-gray-200 text-gray-800 rounded-lg font-semibold py-3 shadow-md hover:scale-105 hover:shadow-lg transition-all duration-300"
              >
                Login
              </button>
            </>
          )}
        </div>

        {message && (
          <p className={`mt-4 text-center text-sm ${
            message.includes("successful") ? "text-green-600" : "text-red-500"
          }`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;