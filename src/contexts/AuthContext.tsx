import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { company } from '../lib/company';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (supabase) {
          // Try manager first, then any active user
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('email', 'manager@antilia.com')
            .maybeSingle();

          if (userData) {
            setUser(userData);
            setLoading(false);
            return;
          }

          const { data: anyUser } = await supabase
            .from('users')
            .select('*')
            .eq('active', true)
            .limit(1)
            .maybeSingle();

          if (anyUser) {
            setUser(anyUser);
            setLoading(false);
            return;
          }
        }
      } catch {
        // ignore
      }

      // Fallback: use a default admin so the app is always accessible
      setUser({
        id: 'default',
        name: 'Διαχειριστής',
        email: 'admin@system.local',
        role: 'admin',
        active: true,
        created_at: new Date().toISOString(),
      } as any);
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, _password: string) => {
    try {
      if (supabase) {
        // Simple login: just check if user exists in users table
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .eq('active', true)
          .maybeSingle();

        if (error) throw error;

        if (userData) {
          setUser(userData);
          // Update last login
          await supabase
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', userData.id);
        } else {
          throw new Error('Invalid credentials');
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};