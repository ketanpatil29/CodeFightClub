import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function OAuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get("token");
    const email = params.get("email");
    const username = params.get("username");

    if (token) {
      // Save only if values exist
      localStorage.setItem("token", token);

      if (email) localStorage.setItem("email", email);
      if (username) localStorage.setItem("username", username);

      // Delay so user sees "Logging you in…" and token is saved properly
      setTimeout(() => navigate("/"), 500);
    } else {
      console.error("OAuth failed → no token found in URL");
      setTimeout(() => navigate("/login"), 800);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Logging you in…</p>
    </div>
  );
}
