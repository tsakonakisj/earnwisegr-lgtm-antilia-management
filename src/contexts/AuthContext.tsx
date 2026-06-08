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
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            // Get user details from our users table
            const { data: userData } = await supabase
              .from('users')
              .select('*')
              .eq('email', session.user.email)
              .single();
            
            if (userData) {
              setUser(userData);
            }
          }
        } else {
          // Demo mode - set demo user
          const demoUser: User = {
            id: '1',
            email: company.demoEmail,
            role: 'manager',
            name: 'Demo User',
            created_at: new Date().toISOString()
          };
          setUser(demoUser);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
      }
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) throw error;
        
        if (data.user) {
          // Get user details from our users table
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('email', data.user.email)
            .single();
          
          if (userData) {
            setUser(userData);
            // Update last login
            await supabase
              .from('users')
              .update({ last_login: new Date().toISOString() })
              .eq('id', userData.id);
          }
        }
      } else {
        // Demo mode login
        if (email === company.demoEmail && password === company.demoPassword) {
          const demoUser: User = {
            id: '1',
            email,
            role: 'manager',
            name: 'Demo User',
            created_at: new Date().toISOString()
          };
          setUser(demoUser);
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
    if (supabase) {
      supabase.auth.signOut();
    }
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