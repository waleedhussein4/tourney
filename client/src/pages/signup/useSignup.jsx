import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../../context/AuthContext";

export const useSignup = (props) => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshUser } = useContext(AuthContext);

  const signup = async (email, username, password) => {
    setIsLoading(true);
    setError(null);

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username, password }),
      credentials: "include",
    });

    setIsLoading(false);

    if (!response.ok) {
      const json = await response.json();
      setError(json.error?.message ?? "Could not create the account");
      return;
    }

    await refreshUser();
    navigate(props ? props.from : "/");
  };

  return [signup, isLoading, error];
};
