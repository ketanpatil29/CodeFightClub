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
      localStorage.setItem("token", token);
      localStorage.setItem("email", email);
      localStorage.setItem("username", username);
    }

    navigate("/"); // redirect to home/dashboard
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Logging you in…</p>
    </div>
  );
}
