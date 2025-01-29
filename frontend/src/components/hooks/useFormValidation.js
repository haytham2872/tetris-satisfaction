// hooks/useFormValidation.js
import { useState } from 'react';

export const useFormValidation = () => {
  const [errors, setErrors] = useState({});

  const validateContactForm = (formData) => {
    const newErrors = {};

    // Name validation
    if (!formData.name?.trim()) {
      newErrors.name = 'Le nom est requis';
    }

    // Phone validation
    if (!formData.phone?.trim()) {
      newErrors.phone = 'Le numéro de téléphone est requis';
    } else if (!/^\d{10}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Numéro de téléphone invalide';
    }

    // Email validation
    if (!formData.email?.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Email invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSurveyResponse = (response, questionType) => {
    const errors = {};
    
    switch (questionType) {
      case 'rating':
        if (response === undefined || response < 0 || response > 10) {
          errors.rating = 'Veuillez sélectionner une note valide';
        }
        break;
      
      case 'stars':
        if (response === undefined || response < 1 || response > 5) {
          errors.stars = 'Veuillez sélectionner une note valide';
        }
        break;
      
      case 'choice':
        if (!response || response.trim() === '') {
          errors.choice = 'Veuillez sélectionner une option';
        }
        break;
      
      case 'text':
        // Optional validation for text responses if needed
        if (response && response.length > 1000) {
          errors.text = 'Le commentaire ne doit pas dépasser 1000 caractères';
        }
        break;

      default:
        break;
    }

    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateQuestionResponse = (questionId, response) => {
    const newErrors = {};

    // Specific validation rules for each question type
    switch (questionId) {
      case 1: // Rating 0-10
        if (response === undefined || response < 0 || response > 10) {
          newErrors.rating = 'Veuillez donner une note entre 0 et 10';
        }
        break;

      case 2: // Stars 1-5
        if (response === undefined || response < 1 || response > 5) {
          newErrors.stars = 'Veuillez donner une note entre 1 et 5 étoiles';
        }
        break;

      case 10: // Text feedback
        if (response && response.length > 1000) {
          newErrors.feedback = 'Votre commentaire est trop long (maximum 1000 caractères)';
        }
        break;

      default:
        // For choice questions (3-9)
        if (!response || response.trim() === '') {
          newErrors.choice = 'Veuillez sélectionner une option';
        }
        break;
    }

    setErrors(prevErrors => ({
      ...prevErrors,
      [questionId]: newErrors
    }));

    return Object.keys(newErrors).length === 0;
  };

  const validateOptionalComment = (comment) => {
    const newErrors = {};

    if (comment && comment.length > 500) {
      newErrors.optionalComment = 'Le commentaire ne doit pas dépasser 500 caractères';
    }

    setErrors(prevErrors => ({
      ...prevErrors,
      optionalComment: newErrors.optionalComment
    }));

    return Object.keys(newErrors).length === 0;
  };

  const clearErrors = () => {
    setErrors({});
  };

  const getError = (field) => {
    return errors[field] || '';
  };

  const hasErrors = () => {
    return Object.keys(errors).length > 0;
  };

  return {
    errors,
    validateContactForm,
    validateSurveyResponse,
    validateQuestionResponse,
    validateOptionalComment,
    clearErrors,
    getError,
    hasErrors
  };
};

export default useFormValidation;