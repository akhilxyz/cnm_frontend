import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  fullName: string;
  email: string;
  role: string;
  lang: string;
  aboutMe: string | null;
  image: string | null;
  isActive: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  token: string | any;
  user: User | any;
  profile: User | null; // if profile = user data in your API
  setAuthData: (token: string, user: User, profile: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      profile: null,

      setAuthData: (token, user, profile) => set({ token, user, profile }),
      logout: () => set({ token: null, user: null, profile: null }),
    }),
    {
      name: 'auth-storage', // key in localStorage
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        profile: state.profile,
      }),
    }
  )
);
