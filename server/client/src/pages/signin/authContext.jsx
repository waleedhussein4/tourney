import { createContext, useReducer } from "react";
export const authContext = createContext();
export const authReducer = (state , action)=>{
switch (action.type){
    case 'Login':
        return{user:action.payload}
        case 'Logout':
        return {user:null}
        default:
            return state
}
}
export const AuthContextProvider = ({children})=>{
    const[state , dispatch] = useReducer(authReducer ,{
        user:null
    })
    console.log('authContext state:', state)
    return(
        <authContext.Provider value={{...state, dispatch}}>
            {children}
        </authContext.Provider>
    )
}