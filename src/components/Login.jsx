// src/components/Login.jsx
import React from "react";

const Login = ({ onClose, setToken, setUsername }) => {
  const handleGoogleLogin = () => {
    /* global google */
    google.accounts.id.initialize({
      client_id: import.meta.env.GOOGLE_CLIENT_ID, // use Vite env variable
      callback: async (response) => {
        try {
          // send token to backend
          const res = await fetch(`${import.meta.env.BACKEND_URL}/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: response.credential }),
          });
          const data = await res.json();

          if (data.user) {
            localStorage.setItem("token", response.credential);
            localStorage.setItem("userId", data.user._id);
            localStorage.setItem("userName", data.user.name);
            localStorage.setItem("userEmail", data.user.email);

            setToken(response.credential);
            setUsername(data.user.name);

            if (onClose) onClose();
            console.log(`[LOGIN] ${data.user.name} connected`);
          }
        } catch (err) {
          console.error("Google login failed", err);
        }
      },
    });

    google.accounts.id.prompt();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl p-8">
        <h1 className="font-bold text-2xl mb-6 text-center">Login</h1>
        <button
          onClick={handleGoogleLogin}
          className="bg-red-500 text-white rounded-lg py-3 font-semibold w-full hover:scale-105 transition"
        >
          Login with Google
        </button>
      </div>
    </div>
  );
};

export default Login;
