import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "/src/hooks/useAuthContext";

export const useSignup = (props) => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false); 

  const navigate = useNavigate()

  const signup = async (email, userName, password) => {
    setIsLoading(true);
    setError(null);

    const response = await fetch("${import.meta.env.VITE_BACKEND_URL}/api/user/signup", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ email, userName, password }),
      credentials: "include"
    });

    if (!response.ok) {
      const json = await response.json();
      setIsLoading(false);
      setError(json.error);
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

  return [ signup, isLoading, error ];
};