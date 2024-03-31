import { useState } from "react";
import { useAuthContext } from "/src/hooks/useAuthContext";
import { useNavigate } from "react-router-dom";

export const useLogin = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false); 
  const { dispatch } = useAuthContext();
  const navigate = useNavigate();
  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    const response = await fetch("http://localhost:2000/api/user/login", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ email, password}),
      credentials: "include"
    });

    // const json = await response.json();

    if (!response.ok) {
      setIsLoading(false);
      // setError(json.error);
    }
    if (response.ok) {
      setIsLoading(false);
      navigate("/")
    }
  };

  return [ login, isLoading, error ];
};