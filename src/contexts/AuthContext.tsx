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
      // Auto-login with demo user for this internal app
      try {
        if (supabase) {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('email', company.demoEmail)
            .maybeSingle();

          if (userData) {
            setUser(userData);
          } else {
            // Fallback: try to get any active user
            const { data: anyUser } = await supabase
              .from('users')
              .select('*')
              .eq('active', true)
              .limit(1)
              .maybeSingle();

            if (anyUser) {
              setUser(anyUser);
            }
          }
        }
      } catch {
        // Ignore errors, user stays null
      }
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