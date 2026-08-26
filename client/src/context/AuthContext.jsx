import { createContext, useCallback, useEffect, useState } from "react";

export const AuthContext = createContext();

export const AuthContextProvider = (props) => {
  // `undefined` means "not known yet" and keeps guards from redirecting during
  // the first render; `null` means "definitely signed out".
  const [user, setUser] = useState(undefined);

  const refreshUser = useCallback(async () => {
    const response = await fetch("/api/users/me", { credentials: "include" });
    // A 401 is the signed-out answer, not an error — and, unlike the old
    // endpoints, its body can never be mistaken for a truthy isHost/isAdmin.
    const nextUser = response.ok ? (await response.json()).user : null;
    setUser(nextUser);
    return nextUser;
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const value = {
    user,
    loggedIn: user === undefined ? undefined : user !== null,
    isHost: user === undefined ? undefined : Boolean(user?.isHost),
    isAdmin: user === undefined ? undefined : Boolean(user?.isAdmin),
    getLoggedIn: refreshUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
};

export default AuthContext;
