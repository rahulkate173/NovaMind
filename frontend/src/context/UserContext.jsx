import { createContext, useContext, useState, useEffect, useCallback } from 'react';

/**
 * UserContext – Manages JWT token, authenticated user profile from Google OAuth,
 * and the active user_id passed to the learning agent backend.
 */
const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('jwt_token') || null);
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // userId is used by all agent routes (/api/tasks/daily/${userId}, /api/workflow/start, etc.)
  // If user logged in via Google OAuth, use their unique ID. Otherwise fallback or null.
  const userId = user?.id || null;

  const login = useCallback((jwtToken, userData) => {
    if (jwtToken) {
      localStorage.setItem('jwt_token', jwtToken);
      setToken(jwtToken);
    }
    if (userData) {
      localStorage.setItem('auth_user', JSON.stringify(userData));
      setUser(userData);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <UserContext.Provider value={{ token, user, userId, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>');
  return ctx;
}
