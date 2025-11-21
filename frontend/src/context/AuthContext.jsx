import { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'; // Fix import syntax
import api from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      // Verify token is valid and get user details
      const decode = jwtDecode(token);
      if (decode.exp * 1000 < Date.now()) {
        logout();
      } else {
        api.get('/users/me')
          .then(res => setUser(res.data))
          .catch(() => logout())
          .finally(() => setLoading(false));
      }
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const formData = new URLSearchParams(); // OAuth2PasswordRequestForm usually expects form data, but your schema uses JSON
    // Based on your auth_router.py: login takes UserLogin Pydantic model (JSON)
    const res = await api.post('/auth/login', { email, password });
    const newToken = res.data.access_token;
    
    localStorage.setItem('token', newToken);
    setToken(newToken);
    // Fetch user immediately after login
    const userRes = await api.get('/users/me', {
        headers: { Authorization: `Bearer ${newToken}` }
    });
    setUser(userRes.data);
  };

  const register = async (email, username, password) => {
    await api.post('/auth/register', { email, username, password });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};