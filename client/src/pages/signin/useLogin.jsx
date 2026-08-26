import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../../context/AuthContext";

export const useLogin = (props) => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshUser } = useContext(AuthContext);

  const login = async (email, password, rememberMe) => {
    setIsLoading(true);
    setError(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, rememberMe }),
      credentials: "include",
    });

    setIsLoading(false);

    if (!response.ok) {
      const json = await response.json();
      setError(json.error?.message ?? "Could not sign in");
      return;
    }

    await refreshUser();
    navigate(props ? props.from : "/");
  };

  return [login, isLoading, error];
};
