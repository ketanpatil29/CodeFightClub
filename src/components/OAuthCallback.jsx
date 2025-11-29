import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function OauthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const token = params.get("token");
    const email = params.get("email");
    const username = params.get("username");

    if (token) {
      localStorage.setItem("token", token);
      localStorage.setItem("userEmail", email);
      localStorage.setItem("username", username);

      console.log("OAuth Success:", email);
    }

    navigate("/"); // redirect home after saving session
  }, []);

  return <div>Signing you in...</div>;
}
