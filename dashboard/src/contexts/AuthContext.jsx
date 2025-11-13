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
        // Check if we have an OAuth callback in the URL hash
        const hash = window.location.hash;
        console.log('🔍 Checking for OAuth callback - Hash present:', !!hash);

        if (hash && hash.includes('access_token')) {
          console.log('✅ OAuth callback detected, processing...');

          // Give Supabase time to parse the hash
          await new Promise(resolve => setTimeout(resolve, 1500));

          // Retry multiple times to get the session
          let sessionFound = false;
          for (let i = 0; i < 15; i++) {
            try {
              const { data: { session: currentSession }, error } = await supabase.auth.getSession();

              console.log(`📍 Session check attempt ${i + 1}:`, {
                hasSession: !!currentSession,
                email: currentSession?.user?.email,
                error: error?.message
              });

              if (currentSession && !error) {
                console.log('✅ Session established! User:', currentSession.user.email);
                setSession(currentSession);
                setUser(currentSession.user);
                sessionFound = true;

                // Clean the URL hash
                window.history.replaceState({}, document.title, window.location.pathname);
                break;
              }
            } catch (e) {
              console.error(`❌ Session check error ${i + 1}:`, e.message);
            }

            if (!sessionFound && i < 14) {
              await new Promise(resolve => setTimeout(resolve, 300));
            }
          }

          if (!sessionFound) {
            console.warn('⚠️ Session not established via getSession, trying getUser() fallback...');
            try {
              const { data: { user: authUser }, error } = await supabase.auth.getUser();
              if (authUser && !error) {
                console.log('✅ User found via getUser():', authUser.email);
                setUser(authUser);

                // Try to get session one more time
                const { data: { session: finalSession } } = await supabase.auth.getSession();
                if (finalSession) {
                  setSession(finalSession);
                }

                window.history.replaceState({}, document.title, window.location.pathname);
              } else {
                console.error('❌ No user found after OAuth');
              }
            } catch (e) {
              console.error('❌ getUser() fallback error:', e);
            }
          }

          setLoading(false);
        } else {
          // No OAuth callback - just get the existing session
          const { data: { session: initialSession }, error } = await supabase.auth.getSession();

          if (initialSession && !error) {
            console.log('✅ Existing session found:', initialSession.user?.email);
            setSession(initialSession);
            setUser(initialSession.user ?? null);
          } else if (error) {
            console.error('❌ Session error:', error.message);
          } else {
            console.log('ℹ️ No session found - user not authenticated');
          }

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
      console.log('🔄 Auth state changed:', { event: _event, hasSession: !!session });
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth.html';
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

