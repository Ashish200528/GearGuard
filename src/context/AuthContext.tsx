'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { StoredUser } from '@/lib/auth';
import { authAPI } from '@/lib/api';

interface AuthContextType {
  user: StoredUser | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string, role: string, adminCode?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for existing session
    const sessionUser = localStorage.getItem('gearguard_session');
    if (sessionUser) {
      try {
        const parsedUser = JSON.parse(sessionUser);
        // Ensure role is properly mapped (in case old data exists)
        if (['admin', 'technician', 'employee'].includes(parsedUser.role)) {
          parsedUser.role = mapRoleToFrontend(parsedUser.role);
          localStorage.setItem('gearguard_session', JSON.stringify(parsedUser));
        }
        setUser(parsedUser);
      } catch (e) {
        console.error('Failed to parse session', e);
        localStorage.removeItem('gearguard_session');
      }
    }
    setIsLoading(false);
  }, []);

  // Map database roles to frontend roles
  const mapRoleToFrontend = (dbRole: string): string => {
    const roleMap: Record<string, string> = {
      'admin': 'super_admin',
      'technician': 'maintenance_staff',
      'employee': 'end_user'
    };
    return roleMap[dbRole] || 'end_user';
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      
      const userData: StoredUser = {
        id: response.user.id,
        name: response.user.name,
        email: email,
        role: mapRoleToFrontend(response.user.role), // Map DB role to frontend role
        token: response.token,
      };
      
      setUser(userData);
      localStorage.setItem('gearguard_session', JSON.stringify(userData));
      router.push('/dashboard');
      
      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const signup = async (
    name: string, 
    email: string, 
    password: string, 
    role: string,
    adminCode?: string
  ) => {
    try {
      const response = await authAPI.signup(name, email, password, role);
      
      const userData: StoredUser = {
        id: response.user.id,
        name: response.user.name,
        email: email,
        role: mapRoleToFrontend(response.user.role), // Map DB role to frontend role
        token: response.token,
      };
      
      setUser(userData);
      localStorage.setItem('gearguard_session', JSON.stringify(userData));
      router.push('/dashboard');
      
      return { success: true };
    } catch (error: any) {
      console.error('Signup error:', error);
      return { success: false, error: error.message || 'Signup failed' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('gearguard_session');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
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
