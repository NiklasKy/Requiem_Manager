import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => {
    return localStorage.getItem('auth_token');
  });

  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      setLoading(false);
    }
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token is invalid
        logout();
      }
    } catch (error) {
      console.error('Error validating token:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (userToken, userData) => {
    localStorage.setItem('auth_token', userToken);
    setToken(userToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  };

  const startDiscordLogin = () => {
    const clientId = process.env.REACT_APP_DISCORD_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/callback`;
    const guildId = process.env.REACT_APP_DEFAULT_GUILD_ID;
    
    if (!clientId) {
      console.error('Discord Client ID not configured');
      return;
    }

    const scope = 'identify guilds';
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${guildId}`;
    
    window.location.href = discordAuthUrl;
  };

  const handleDiscordCallback = async (code, state) => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/discord/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, state }),
      });

      if (response.ok) {
        const { token: userToken, user: userData } = await response.json();
        login(userToken, userData);
        return true;
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Authentication failed');
      }
    } catch (error) {
      console.error('Discord auth callback error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = () => {
    return !!user && !!token;
  };

  const hasRole = (roleName) => {
    return user?.roles?.some(role => role.role_name?.toLowerCase() === roleName.toLowerCase()) || false;
  };

  const isAdmin = () => {
    // Use the is_admin flag from the backend instead of checking individual roles
    return user?.is_admin || false;
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    hasRole,
    isAdmin,
    login,
    logout,
    startDiscordLogin,
    handleDiscordCallback,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
