import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const useLogin = (props) => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false); 
  const navigate = useNavigate();
  const login = async (email, password, rememberPassword) => {
    setIsLoading(true);
    setError(null);
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ email, password, rememberPassword}),
      credentials: "include"
    });

    if (!response.ok) {
      const json = await response.json();
      setError(json.error);
      setIsLoading(false);
    }
    if (response.ok) {
      setIsLoading(false);
      if(props) {
        navigate(props.from);
      } else {
        navigate("/")
      }
      navigate(0)
    }
  };

  return [ login, isLoading, error ];
};