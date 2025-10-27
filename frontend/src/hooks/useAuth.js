import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Fetched user data:', response.data);
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    }
  }, [token, logout]);

  useEffect(() => {
    if (token) {
      fetchUser();
    }
  }, [token, fetchUser]);

  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:8000/api/auth/login', {
        email,
        password,
      });
      setToken(response.data.access_token);
      setUser(response.data.user);
      localStorage.setItem('token', response.data.access_token);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const register = async (email, password, name, role) => {
    try {
      const response = await axios.post('http://localhost:8000/api/auth/register', {
        email,
        password,
        name,
        role,
      });
      setToken(response.data.access_token);
      setUser(response.data.user);
      localStorage.setItem('token', response.data.access_token);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

