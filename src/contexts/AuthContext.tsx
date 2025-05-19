
'use client';

import type { User } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (userData: User, token?: string) => void;
  logout: () => void;
  checkAuth: () => void; 
  updateUser: (updatedUserData: Partial<User>) => void; // Function to update user in context
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); 
  const router = useRouter();

  const checkAuth = () => {
    setIsLoading(true);
    try {
      const storedUser = localStorage.getItem('currentUser');
      const storedToken = localStorage.getItem('authToken');

      if (storedUser && storedToken) {
        const parsedUser: User = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
      } else {
        setUser(null);
        setToken(null);
      }
    } catch (error) {
      console.error("Error reading auth state from storage:", error);
      setUser(null);
      setToken(null);
      localStorage.removeItem('currentUser');
      localStorage.removeItem('authToken');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);


  const login = (userData: User, jwtToken?: string) => {
    setUser(userData);
    localStorage.setItem('currentUser', JSON.stringify(userData));
    if (jwtToken) {
      setToken(jwtToken);
      localStorage.setItem('authToken', jwtToken); 
    }
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken'); 
    router.push('/auth/login');
    router.refresh(); 
    setIsLoading(false);
  };

  const updateUser = (updatedUserData: Partial<User>) => {
    if (user) {
      const newUser = { ...user, ...updatedUserData };
      setUser(newUser);
      localStorage.setItem('currentUser', JSON.stringify(newUser));
      // Token typically doesn't change on profile update unless reissued by backend
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, checkAuth, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthState => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
