import { createContext, useEffect, useState } from "react";

export const AuthContext = createContext();

export const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return { user: action.payload }
    case 'LOGOUT':
      return { user: null }
    default:
      return state
  }
}

export const AuthContextProvider = (props) => {
  const [loggedIn, setLoggedIn] = useState(undefined);
  const [isHost, setIsHost] = useState(undefined);
  const [isAdmin, setIsAdmin] = useState(undefined);

  async function getLoggedIn() {
    await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/loggedIn`, {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        setLoggedIn(data)
        return data
      })
  }

  async function getIsHost() {
    await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/isHost`, {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        setIsHost(data)
        return data
      })
  }

  async function getIsAdmin() {
    await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/isAdmin`, {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        setIsAdmin(data)
        return data
      })
  }

  useEffect(() => {
    getLoggedIn()
    getIsHost()
    getIsAdmin()
  }, [])

  return <AuthContext.Provider value={{ loggedIn, getLoggedIn, isHost, isAdmin }}>
    {props.children}
  </AuthContext.Provider>
}

export default AuthContext