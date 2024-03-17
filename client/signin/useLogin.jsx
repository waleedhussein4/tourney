import { useState } from "react";
import { useAuthContext } from "./useAuthContext";

export const useLogin = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false); 
  const { dispatch } = useAuthContext();

  const login = async (email, pass, rememberPassword) => {
    setIsLoading(true);
    setError(null);
    const response = await fetch("http://localhost:2000/api/user/login", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ email, pass, rememberPassword })
    });
    const json = await response.json();
    if (!response.ok) {
      setIsLoading(false);
      setError(json.error);
    }
    if (response.ok) {
      localStorage.setItem('user', JSON.stringify(json));
      dispatch({ type: 'Login', payload: json });
      setIsLoading(false);
    }
  };

  return { login, isLoading, error };
};
