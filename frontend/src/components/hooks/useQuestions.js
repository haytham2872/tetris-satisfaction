// src/components/hooks/useQuestions.js
import { useState, useEffect,useCallback } from 'react';
import { getQuestions } from '../../API';  // Utiliser la nouvelle fonction de l'API

export const useQuestions = (formId) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadQuestions = useCallback(async () => {
    if (!formId) {
      setError('Form ID is required');
      setLoading(false);
      return;
    }
  
    try {
      setLoading(true);
      const fetchedQuestions = await getQuestions(formId);
      
      if (Array.isArray(fetchedQuestions)) {
        setQuestions(fetchedQuestions);
        setError(null);
      } else {
        setError('Invalid questions data received');
        setQuestions([]);
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      setError(error.message || 'Error loading questions');
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [formId]);
  
  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const refreshQuestions = () => {
    loadQuestions();
  };

  return {
    questions,
    loading,
    error,
    refreshQuestions
  };
};