import { authContext } from "./authContext";
import { useContext } from "react";

export const useAuthContext = ()=>{
    const context  = useContext(authContext)
    if(!context){
        throw Error('useAuthContext must be used inside anAuthContextProvider')
    }
    return context
}