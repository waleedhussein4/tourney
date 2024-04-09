import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const useLogin = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false); 
  const navigate = useNavigate();
  const login = async (email, password, rememberPassword) => {
    setIsLoading(true);
    setError(null);
    const response = await fetch("http://localhost:2000/api/user/login", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ email, password, rememberPassword}),
      credentials: "include"
    });

    if (!response.ok) {
      setIsLoading(false);
      // setError(json.error);
    }
    if (response.ok) {
      setIsLoading(false);
      navigate("/")
      navigate(0)
    }
  };

  return [ login, isLoading, error ];
};