
'use client';

import type { User } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (userData: User, token?: string) => void;
  logout: () => void;
  checkAuth: () => void; // Function to check auth status on load
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start as true until first check
  const router = useRouter();

  // Function to check auth status from localStorage (or other storage)
  const checkAuth = () => {
    setIsLoading(true);
    try {
      const storedUser = localStorage.getItem('currentUser');
      const storedToken = localStorage.getItem('authToken'); // Example: if you store a token

      if (storedUser && storedToken) {
        const parsedUser: User = JSON.parse(storedUser);
        setUser(parsedUser);
        // TODO: Optionally validate token with backend here
      } else {
        setUser(null); // Ensure user is null if no stored data
      }
    } catch (error) {
      console.error("Error reading auth state from storage:", error);
      setUser(null);
      localStorage.removeItem('currentUser');
      localStorage.removeItem('authToken');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);


  const login = (userData: User, token?: string) => {
    setUser(userData);
    localStorage.setItem('currentUser', JSON.stringify(userData));
    if (token) {
      localStorage.setItem('authToken', token); // Example: store token
    }
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken'); // Example: remove token
    // Optionally redirect to login or home page
    router.push('/auth/login');
    router.refresh(); // To ensure server components might re-evaluate if needed
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, checkAuth }}>
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
