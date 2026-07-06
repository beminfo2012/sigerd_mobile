import React, { createContext, useState, useEffect, useContext } from 'react';
import { operacoesService } from '../services/operacoesService';
import { UserContext } from '../App'; // UserContext doesn't seem to be exported properly or it's just created. We can pass userProfile or rely on a global store. 
// Wait, looking at App.jsx, UserContext is exported. Let's use it or just pass userProfile.
// Actually, App.jsx has `export const UserContext = createContext(null)` but it's not wrapped around everything.
// Let's use the local storage or a prop. We can wrap the App with it.

export const OperacaoContext = createContext(null);

export const OperacaoProvider = ({ children, municipioId }) => {
  const [operacaoAtiva, setOperacaoAtiva] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOperacaoAtiva = async () => {
    if (!municipioId || municipioId === 'undefined') {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const data = await operacoesService.getOperacaoAtiva(municipioId);
      setOperacaoAtiva(data || null);
      if (data) {
        localStorage.setItem('operacao_id', data.id);
      } else {
        localStorage.removeItem('operacao_id');
      }
    } catch (error) {
      console.error('Erro ao buscar operação ativa no context:', error);
      setOperacaoAtiva(null);
      localStorage.removeItem('operacao_id');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOperacaoAtiva();
  }, [municipioId]);

  return (
    <OperacaoContext.Provider value={{
      operacaoAtiva,
      operacaoId: operacaoAtiva?.id || null,
      isLoadingOperacao: isLoading,
      refreshOperacao: fetchOperacaoAtiva
    }}>
      {children}
    </OperacaoContext.Provider>
  );
};

export const useOperacao = () => useContext(OperacaoContext);
