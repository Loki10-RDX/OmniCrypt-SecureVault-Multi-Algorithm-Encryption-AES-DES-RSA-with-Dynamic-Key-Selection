import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preAuthEmail, setPreAuthEmail] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
        } catch (error) {
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.mfaRequired) {
      setPreAuthEmail(email);
      return { mfaRequired: true };
    }
    localStorage.setItem('token', res.data.token);
    setUser({ email: res.data.email, role: res.data.role });
    return { mfaRequired: false };
  };

  const verifyOtp = async (code) => {
    if (!preAuthEmail) throw new Error("No pending authentication");
    const res = await api.post('/auth/verify-otp', { email: preAuthEmail, code });
    localStorage.setItem('token', res.data.token);
    setUser({ email: res.data.email, role: res.data.role });
    setPreAuthEmail(null);
  };

  const register = async (email, password, enableMfa) => {
    const res = await api.post('/auth/register', { email, password, enableMfa });
    if (res.data.mfaRequired) {
      return { mfaRequired: true, qrCode: res.data.mfaQrCode };
    }
    localStorage.setItem('token', res.data.token);
    setUser({ email: res.data.email, role: res.data.role });
    return { mfaRequired: false };
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, verifyOtp, register, logout, preAuthEmail }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
