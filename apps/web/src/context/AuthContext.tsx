import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { AuthUser, UserRole } from '@esushrut/shared';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  isSuperAdmin: boolean;
  isDeptHead: boolean;
  isOfficer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('es_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('es_access_token');
    if (token && !user) {
      apiClient
        .get('/auth/me')
        .then((res) => {
          setUser(res.data);
          localStorage.setItem('es_user', JSON.stringify(res.data));
        })
        .catch(() => {
          setUser(null);
          localStorage.removeItem('es_user');
          localStorage.removeItem('es_access_token');
          localStorage.removeItem('es_refresh_token');
        });
    }
  }, [user]);

  const login = async (username: string, pass: string) => {
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/login', { username, password: pass });
      const { accessToken, refreshToken, user: authUser } = res.data;
      localStorage.setItem('es_access_token', accessToken);
      localStorage.setItem('es_refresh_token', refreshToken);
      localStorage.setItem('es_user', JSON.stringify(authUser));
      setUser(authUser);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore
    } finally {
      localStorage.removeItem('es_access_token');
      localStorage.removeItem('es_refresh_token');
      localStorage.removeItem('es_user');
      setUser(null);
      window.location.href = '/admin/login';
    }
  };

  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
  const isDeptHead = user?.role === UserRole.DEPT_HEAD;
  const isOfficer = user?.role === UserRole.FEEDBACK_OFFICER;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
        isSuperAdmin,
        isDeptHead,
        isOfficer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
