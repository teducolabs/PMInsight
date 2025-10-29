import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/lib/api/client';

interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
  organizationId: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, twoFactorCode?: string) => Promise<void>;
  register: (email: string, password: string, name: string, organizationName: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const isAuthenticated = !!user;

  // Auto-refresh token periodically (every 10 minutes)
  useEffect(() => {
    if (!isAuthenticated) return;

    const intervalId = setInterval(async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          // Check if token is expired or about to expire
          const payload = JSON.parse(atob(token.split('.')[1]));
          const exp = payload.exp * 1000;
          const timeUntilExpiry = exp - Date.now();
          
          // Refresh if token expires in less than 10 minutes
          if (timeUntilExpiry < 10 * 60 * 1000) {
            await refreshToken();
          }
        } catch (error) {
          console.error('Auto-refresh failed:', error);
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(intervalId);
  }, [isAuthenticated]);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const response = await apiClient.get('/auth/me');
          setUser(response.data);
        } catch (error) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string, twoFactorCode?: string) => {
    try {
      console.log('Attempting login with:', { email, hasTwoFactorCode: !!twoFactorCode });
      
      const response = await apiClient.post('/auth/login', {
        email,
        password,
        twoFactorCode
      });

      console.log('Login response:', response.data);

      const data = response.data;
      
      // Backend returns flat structure: { userId, organizationId, name, requiresTwoFactor, accessToken, refreshToken }
      if (!data.accessToken) {
        throw new Error('Invalid response from server');
      }

      // Check if 2FA is required but no code was provided
      if (data.requiresTwoFactor && !twoFactorCode) {
        throw new Error('Two-factor authentication required');
      }

      // Transform backend response to frontend user structure
      const userData: User = {
        id: data.userId,
        email: email, // Backend doesn't return email, use the input
        name: data.name,
        roles: [], // TODO: Backend should return roles
        organizationId: data.organizationId
      };

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      setUser(userData);
      
      console.log('User set, navigating to dashboard...');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Login failed');
    }
  };

  const register = async (email: string, password: string, name: string, organizationName: string) => {
    try {
      const response = await apiClient.post('/auth/register', {
        email,
        password,
        name,
        organizationName
      });

      const data = response.data;
      
      // Backend returns flat structure: { userId, organizationId, accessToken, refreshToken }
      if (!data.accessToken) {
        throw new Error('Invalid response from server');
      }

      // Transform backend response to frontend user structure
      const userData: User = {
        id: data.userId,
        email: email, // Backend doesn't return email, use the input
        name: name, // Backend doesn't return name, use the input
        roles: [], // TODO: Backend should return roles
        organizationId: data.organizationId
      };
      
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      setUser(userData);
      
      navigate('/dashboard');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    navigate('/login');
  };

  const refreshToken = async () => {
    try {
      const token = localStorage.getItem('refreshToken');
      if (!token) throw new Error('No refresh token');

      const response = await apiClient.post('/auth/refresh', { refreshToken: token });
      const { accessToken, refreshToken: newRefreshToken } = response.data;
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', newRefreshToken);
    } catch (error) {
      logout();
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
