import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AdminUser {
  id: string;
  user_id: string;
  nome: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  adminUser: AdminUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateAdminUser: (newData: Partial<AdminUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAdminUser = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Admin user não existe - criar um registro básico ou mostrar erro
          console.warn('Admin user not found for user:', userId);
          setAdminUser(null);
          return;
        }
        console.error('Error fetching admin user:', error);
        return;
      }

      setAdminUser(data);
    } catch (error) {
      console.error('Error fetching admin user:', error);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        console.log('Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer admin user fetch to avoid callback deadlock
          setTimeout(() => {
            if (isMounted) {
              fetchAdminUser(session.user.id);
            }
          }, 0);
        } else {
          setAdminUser(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session on mount
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }

        if (!isMounted) return;

        console.log('Initial session check:', session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchAdminUser(session.user.id);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error checking initial session:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: 'Erro interno. Tente novamente.' };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setAdminUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const updateAdminUser = (newData: Partial<AdminUser>) => {
    if (adminUser) {
      setAdminUser({ ...adminUser, ...newData });
    }
  };

  const value = {
    user,
    session,
    adminUser,
    loading,
    signIn,
    signOut,
    updateAdminUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};