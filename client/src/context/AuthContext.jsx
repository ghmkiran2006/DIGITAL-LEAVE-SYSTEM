import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAuthToken, removeAuthToken, getAuthToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadUser() {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.getMe();
        if (res.success && res.user) {
          setUser(res.user);
        } else {
          removeAuthToken();
        }
      } catch (err) {
        console.error('Session restore failed:', err);
        removeAuthToken();
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const loginStudent = async (credentials) => {
    setError(null);
    try {
      const res = await api.studentLogin(credentials);
      if (res.success && res.token) {
        setAuthToken(res.token);
        setUser(res.user);
        return res;
      }
      throw new Error(res.message || 'Student login failed');
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const loginAuthority = async (credentials, passArg) => {
    setError(null);
    try {
      const res = await api.authorityLogin(credentials, passArg);
      if (res.success && res.token) {
        setAuthToken(res.token);
        setUser(res.user);
        return res;
      }
      throw new Error(res.message || 'Authority login failed');
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      if (res.success) {
        setUser(res.user);
      }
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isStudent: user?.userType === 'student',
        isAuthority: user?.userType === 'authority',
        loginStudent,
        loginAuthority,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
