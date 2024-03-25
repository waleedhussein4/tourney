import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const useSignup = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false); 
 const navigate = useNavigate
  const signup = async (email, userName, password) => {
    setIsLoading(true);
    setError(null);
    const response = await fetch("http://localhost:2000/api/user/signup", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ email, userName, password })
    });console.log("1")
    const json = await response.json();
    if (!response.ok) {
      setIsLoading(false);
      setError(json.error);
      console.log("not done")
    }
    if (response.ok) {
      localStorage.setItem('user', JSON.stringify(json));
      setIsLoading(false);
      console.log("done")
      navigate("/signin/")
    }
  };

  return [ signup, error, isLoading ];
};