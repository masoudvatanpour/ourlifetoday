import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';
import { loadFamilyData, clearLocalData } from './db';
import { getKids, getSettings } from './storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [supabaseUser, setSupabaseUser] = useState(null);
  const [currentKid, setCurrentKid] = useState(null);
  const [isParent, setIsParent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        loadFamilyData(session.user.id).then(() => {
          setDataReady(true);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setSupabaseUser(session.user);
        await loadFamilyData(session.user.id);
        setDataReady(true);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setSupabaseUser(null);
        setCurrentKid(null);
        setIsParent(false);
        setDataReady(false);
        clearLocalData();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = () =>
    supabase?.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });

  const signOut = async () => {
    await supabase?.auth.signOut();
    clearLocalData();
    setSupabaseUser(null);
    setCurrentKid(null);
    setIsParent(false);
    setDataReady(false);
  };

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

  const logout = () => { setCurrentKid(null); setIsParent(false); };

  const refreshKid = () => {
    if (currentKid) {
      const updated = getKids().find((k) => k.id === currentKid.id);
      if (updated) setCurrentKid(updated);
    }
  };

  return (
    <AuthContext.Provider value={{
      supabaseUser, currentKid, isParent, loading, dataReady,
      signInWithGoogle, signOut, loginKid, loginParent, logout, refreshKid,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
