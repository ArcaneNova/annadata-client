import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { isAuthenticated as checkAuth, getUser, getUserRole, logout as authLogout } from '@/utils/auth';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'consumer' | 'vendor' | 'farmer' | 'admin';
  phone: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isConsumer: () => boolean;
  isFarmer: () => boolean;
  isVendor: () => boolean;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setUser: (user) => {
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        } else {
          localStorage.removeItem('user');
        }
        set({ user });
      },
      setToken: (token) => {
        if (token) {
          localStorage.setItem('token', token);
        } else {
          localStorage.removeItem('token');
        }
        set({ token });
      },
      logout: () => {
        authLogout();
        set({ user: null, token: null });
      },
      isAuthenticated: () => {
        return checkAuth();
      },
      isConsumer: () => {
        const role = getUserRole();
        return role === 'consumer';
      },
      isFarmer: () => {
        const role = getUserRole();
        return role === 'farmer';
      },
      isVendor: () => {
        const role = getUserRole();
        return role === 'vendor';
      }
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => {
        // Initialize state from localStorage on page load
        return (state) => {
          const user = getUser();
          const token = localStorage.getItem('token');
          if (user && token) {
            state?.setUser(user);
            state?.setToken(token);
          }
        };
      }
    }
  )
); 