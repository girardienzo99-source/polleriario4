'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, UserRole } from '@/types/database';

interface AuthContextType {
  user: Profile | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  login: (email: string, role?: UserRole) => boolean;
  logout: () => void;
  switchRole: (newRole: UserRole) => void;
}

const DEFAULT_ADMIN: Profile = {
  id: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
  business_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  branch_id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
  full_name: 'Enzo Garbarino (Administrador)',
  email: 'admin@polleria.com',
  phone: '+54 358 500-1111',
  role: 'admin',
  active: true,
};

const ROLE_PROFILES: Record<UserRole, Profile> = {
  admin: DEFAULT_ADMIN,
  encargado: {
    id: 'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a',
    business_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    full_name: 'Martina Rossi (Encargada)',
    email: 'encargado@polleria.com',
    role: 'encargado',
    active: true,
  },
  cajero: {
    id: 'e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b',
    business_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    full_name: 'Lucas Gómez (Cajero)',
    email: 'cajero@polleria.com',
    role: 'cajero',
    active: true,
  },
  cocinero: {
    id: 'f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c',
    business_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    full_name: 'Carlos Maidana (Cocinero Spiedo)',
    email: 'cocina@polleria.com',
    role: 'cocinero',
    active: true,
  },
  repartidor: {
    id: 'a7b8c9d0-e1f2-3a4b-5c6d-7e8f9a0b1c2d',
    business_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    full_name: 'Nicolás Pérez (Repartidor)',
    email: 'repartidor@polleria.com',
    role: 'repartidor',
    active: true,
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('polleria_auth_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        // Default to admin for fast testing/dev
        setUser(DEFAULT_ADMIN);
      }
    } catch (e) {
      setUser(DEFAULT_ADMIN);
    }
  }, []);

  const login = (email: string, preferredRole?: UserRole): boolean => {
    let matchedRole: UserRole = preferredRole || 'admin';
    if (email.includes('cocina')) matchedRole = 'cocinero';
    else if (email.includes('cajero')) matchedRole = 'cajero';
    else if (email.includes('encargado')) matchedRole = 'encargado';
    else if (email.includes('repartidor')) matchedRole = 'repartidor';

    const profile = ROLE_PROFILES[matchedRole];
    setUser(profile);
    localStorage.setItem('polleria_auth_user', JSON.stringify(profile));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('polleria_auth_user');
  };

  const switchRole = (newRole: UserRole) => {
    const profile = ROLE_PROFILES[newRole];
    setUser(profile);
    localStorage.setItem('polleria_auth_user', JSON.stringify(profile));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        role: user?.role || null,
        login,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
