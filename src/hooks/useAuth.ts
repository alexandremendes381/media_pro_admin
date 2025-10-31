"use client";

import { useState, useEffect } from 'react';
import { authAPI, apiUtils } from '@/lib/api';
import { Admin } from '@/types/api';

interface UseAuthReturn {
  admin: Admin | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

export const useAuth = (): UseAuthReturn => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verificar se há token salvo e buscar dados do admin
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (apiUtils.isAuthenticated()) {
          const adminData = await authAPI.getMe();
          setAdmin(adminData);
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        apiUtils.removeAuthToken();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Fazendo chamada para API de login...');
      const response = await authAPI.login(email, password);
      console.log('Resposta da API:', response);
      
      if (response && response.access_token && response.admin) {
        console.log('Login bem-sucedido, salvando token e admin...', response);
        
        // Salvar token
        apiUtils.saveAuthToken(response.access_token);
        
        // Definir admin
        setAdmin(response.admin);
        
        console.log('Admin definido no estado:', response.admin);
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (error) {
      console.error('Erro na função login:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Tentar fazer logout no servidor
      await authAPI.logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      // Sempre limpar dados locais
      apiUtils.removeAuthToken();
      setAdmin(null);
      setIsLoading(false);
    }
  };

  return {
    admin,
    isLoading,
    isAuthenticated: !!admin,
    login,
    logout,
    error,
  };
};