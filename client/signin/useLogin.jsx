import { useState } from "react";
import { useAuthContext } from "./useAuthContext";

export const useLogin = ()=>{
    const[error , setError] = useState(null)
    const[isLoading , setIsLoading] = useState(null)
    const{dispatch} = useAuthContext()
    const login = async(username , password , rememberPassword)=>{
        setIsLoading(true)
        setError(null)
        const response = await fetch("/api/user/signup",{
            method : 'POST',
            header:{'Content type':'application/json'},
            body:JSON.stringify({username , password , rememberPassword})

        })
        const json = await response.json()
        if (!response.ok){
            setIsLoading(false)
            setError(json.error)
        }
        if(response.ok){
         localStorage.setItem('user', JSON.stringify(json))
         dispatch({type:'Login' , payload: json})
         setIsLoading(false)
        }
    }
    return {login , isLoading , error}
}