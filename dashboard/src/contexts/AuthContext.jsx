import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleAuthInitialization = async () => {
      try {
        console.log('🚀 AuthContext initializing...');
        console.log('Current URL:', window.location.href);
        console.log('Hash:', window.location.hash);

        // Try to recover the session from Supabase
        const { data, error } = await supabase.auth.refreshSession();
        console.log('Session recovery result:', { hasData: !!data, error: error?.message });

        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (session && !sessionError) {
          console.log('✅ Session found:', session.user?.email);
          setSession(session);
          setUser(session.user ?? null);
          setLoading(false);

          // Clean the URL hash if it contains OAuth params
          if (window.location.hash.includes('access_token')) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } else {
          console.log('ℹ️ No session found');
          setLoading(false);
        }
      } catch (err) {
        console.error('❌ Error in handleAuthInitialization:', err);
        setLoading(false);
      }
    };

    handleAuthInitialization();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('🔄 Auth state changed:', { event: _event, email: session?.user?.email });
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth.html';
  };

  const isAdmin = user?.email === 'ajaykumarreddynelavetla@gmail.com';

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

