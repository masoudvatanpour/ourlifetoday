import { createContext, useContext, useState } from 'react';
import { getKids, getSettings } from './storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentKid, setCurrentKid] = useState(null);
  const [isParent, setIsParent] = useState(false);

  const loginKid = (kidId, pin) => {
    const kid = getKids().find((k) => k.id === kidId);
    if (kid && kid.pin === pin) {
      setCurrentKid(kid);
      setIsParent(false);
      return true;
    }
    return false;
  };

  const loginParent = (pin) => {
    if (getSettings().parentPin === pin) {
      setIsParent(true);
      setCurrentKid(null);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentKid(null);
    setIsParent(false);
  };

  const refreshKid = () => {
    if (currentKid) {
      const updated = getKids().find((k) => k.id === currentKid.id);
      if (updated) setCurrentKid(updated);
    }
  };

  return (
    <AuthContext.Provider value={{ currentKid, isParent, loginKid, loginParent, logout, refreshKid }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
