import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { http } from "../api";


// Logout function to clear localStorage and redirect
export const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("profile");
  // window.location.href = "/"; // adjust your login route
};



interface User {
  id: string;
  email: string;
  [key: string]: any;
}

interface Profile {
  username?: string;
  plan_name?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  token: string;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error?: string }>;
  signOut: () => void;
  resetPassword: (email: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { token, user, profile, setAuthData, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Zustand persist automatically restores state
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const res = await http.post('/user/login', { email, password, loginWith: 'email' });

      if (res.data?.status === false || res.data?.error) {
        return { error: res.data?.message || 'Invalid credentials' };
      }

      const userData = res.data?.responseObject?.user || res.data?.user;
      const profileData = res.data?.responseObject?.user || res.data?.user;
      const token = res.data?.responseObject?.token;

      // ✅ store everything in Zustand
      setAuthData(token, userData, profileData);

      return { error: undefined };
    } catch (err: any) {
      console.error('Login failed:', err);
      return { error: err.response?.data?.message || 'Login failed', errorResponse : err.response?.data?.responseObject  ?? null};
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const res = await http.post('/whatsapp/register', { email, password, username });
      if (res.data?.status === false || res.data?.error) {
        return { error: res.data?.message || 'Registration failed' };
      }
      return { error: undefined };
    } catch (err: any) {
      console.error('SignUp failed:', err);
      return { error: err.response?.data?.message || 'SignUp failed' };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const res = await http.post('/whatsapp/reset-password', { email });
      if (res.data?.status === false || res.data?.error) {
        return { error: res.data?.message || 'Reset password failed' };
      }
      return { error: undefined };
    } catch (err: any) {
      console.error('Reset password failed:', err);
      return { error: err.response?.data?.message || 'Reset password failed' };
    }
  };

  const signOut = () => logout();

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
