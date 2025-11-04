import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextProps {
  user: User | null;
  isLoading: boolean;
  login: (name: string, password: string) => Promise<void>;
  signup: (name: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
}

export const AuthContext = createContext<AuthContextProps>({
  user: null,
  isLoading: true,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
  error: null
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // For demo purposes, we'll simulate API calls
  const login = async (name: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Mock API call for login
      // In a real app, this would be an actual API call to the backend
      if (name === 'admin' && password === '23016570') {
        const adminUser: User = {
          id: 'admin',
          name: 'Admin',
          isAdmin: true
        };
        setUser(adminUser);
        localStorage.setItem('user', JSON.stringify(adminUser));
      } else {
        // Simulate API check of registered users
        const registeredIds = await getRegisteredIds();
        const allowedIds = await getAllowedIds();
        
        if (!allowedIds.includes(name)) {
          throw new Error('Not an AI Application Lab member.');
        }
        
        if (registeredIds.includes(name)) {
          // In a real app, we would verify the password here
          const user: User = {
            id: name,
            name: name,
            isAdmin: false
          };
          setUser(user);
          localStorage.setItem('user', JSON.stringify(user));
        } else {
          throw new Error('Invalid credentials.');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Mock API calls for signup
      const registeredIds = await getRegisteredIds();
      const allowedIds = await getAllowedIds();
      
      if (registeredIds.includes(name)) {
        throw new Error('Already registered user.');
      }
      
      if (!allowedIds.includes(name)) {
        throw new Error('Not an AI Application Lab member.');
      }
      
      // In a real app, we would make an API call to register the user
      const newUser: User = {
        id: name,
        name: name,
        isAdmin: false
      };
      
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // Mock API functions
  const getRegisteredIds = async (): Promise<string[]> => {
    // In a real app, this would be an API call to /api/users/get_ids/
    return ['john', 'jane', 'bob'];
  };

  const getAllowedIds = async (): Promise<string[]> => {
    // In a real app, this would be an API call to /api/users/get_allowed_ids/
    return ['john', 'jane', 'bob', 'alice', 'charlie'];
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return React.useContext(AuthContext);
};