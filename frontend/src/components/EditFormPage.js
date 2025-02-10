import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, AlertCircle, Plus, Trash2,HelpCircle } from 'lucide-react';

const CustomAlert = ({ children, variant = 'default', className = '' }) => {
  const baseStyles = "p-4 rounded-lg mb-4 flex items-center gap-2";
  const variantStyles = {
    default: "bg-blue-50 text-blue-800 border border-blue-200",
    destructive: "bg-red-50 text-red-800 border border-red-200",
    success: "bg-green-50 text-green-800 border border-green-200"
  };

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {children}
    </div>
  );
};

const OptionsEditor = ({ options = [], onChange, onAdd, onRemove }) => {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Options de réponse
        </label>
        {options.map((option, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              type="text"
              value={option}
              onChange={(e) => onChange(idx, e.target.value)}
              className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tetris-blue focus:border-transparent"
              placeholder={`Option ${idx + 1}`}
            />
            <button
              onClick={() => onRemove(idx)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Supprimer l'option"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <button
          onClick={onAdd}
          className="w-full p-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-tetris-blue hover:text-tetris-blue transition-colors"
        >
          + Ajouter une option
        </button>
      </div>
    );
  };

  const ImportanceField = ({ question, index, questions, setQuestions }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [tempImportance, setTempImportance] = useState(question.importance);
  
    const handleBlur = () => {
      // Parse and validate the input value
      let newValue = parseFloat(tempImportance);
      if (isNaN(newValue)) newValue = 0;
      newValue = Math.min(Math.max(newValue, 0), 100);
      newValue = Number(newValue.toFixed(2));
  
      const updatedQuestions = [...questions];
      const oldValue = parseFloat(question.importance) || 0;
  
      // Calculate total importance excluding current question
      const totalOthers = updatedQuestions.reduce((sum, q, i) => 
        i !== index ? sum + (parseFloat(q.importance) || 0) : sum, 0);
  
      // Check if new total would exceed 100%
      if (totalOthers + newValue > 100.01) { // Allow small rounding error
        setTempImportance(oldValue.toFixed(2));
        alert("La somme des importances dépasse 100%. Valeur annulée.");
        return;
      }
  
      // Update the question with the new value
      updatedQuestions[index] = {
        ...updatedQuestions[index],
        importance: newValue.toFixed(2)
      };
  
      setQuestions(updatedQuestions);
      setTempImportance(newValue.toFixed(2));
    };
  
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center gap-2">
            Importance (%)
            <div className="relative">
              <HelpCircle size={16} className="text-gray-400 cursor-pointer hover:text-gray-600" 
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              />
              {showTooltip && (
                <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 
                              bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                  Sur un total de 100%, indiquez l'importance que vous accordez à cette question.
                </div>
              )}
            </div>
          </div>
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          max="100"
          value={tempImportance}
          onChange={(e) => setTempImportance(e.target.value)}
          onBlur={handleBlur}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tetris-blue focus:border-transparent"
        />
      </div>
    );
  };
  
  const EditFormPage = ({ onBack }) => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const bottomRef = useRef(null);
  
    const questionTypes = ['rating', 'stars', 'choice', 'text'];
    const classTypes = ['Satisfaction générale','Qualité du service','Processus et support'];
  
    useEffect(() => {
      fetchQuestions();
    }, []);
  
    const fetchQuestions = async () => {
      try {
          console.log('Fetching questions...');
          const response = await fetch('https://tetris-forms.azurewebsites.net/api/questions');
          const data = await response.json();
          console.log('Raw fetched data:', data);
  
          if (!response.ok) {
              const errorData = data;
              throw new Error(errorData.details || 'Failed to fetch questions');
          }
  
          const formattedData = data.map(q => ({
              ...q,
              importance: q.importance !== undefined ? Number(q.importance).toFixed(2) : "0.00",
              options: q.question_type === 'choice' 
                  ? (Array.isArray(q.options) ? q.options : [])
                  : []
          }));
  
          console.log('Formatted questions:', formattedData);
          setQuestions(formattedData);
          setLoading(false);
      } catch (err) {
          console.error('Error:', err);
          setError(err.message || 'Error fetching questions');
          setLoading(false);
      }
  };
  
    const handleOptionsChange = (questionIndex, optionIndex, value) => {
      const updatedQuestions = [...questions];
      if (!updatedQuestions[questionIndex].options) {
        updatedQuestions[questionIndex].options = [];
      }
      updatedQuestions[questionIndex].options[optionIndex] = value;
      setQuestions(updatedQuestions);
    };
  
    const handleAddOption = (questionIndex) => {
      const updatedQuestions = [...questions];
      if (!updatedQuestions[questionIndex].options) {
        updatedQuestions[questionIndex].options = [];
      }
      updatedQuestions[questionIndex].options.push('Nouvelle option');
      setQuestions(updatedQuestions);
    };
  
    const handleRemoveOption = (questionIndex, optionIndex) => {
      const updatedQuestions = [...questions];
      updatedQuestions[questionIndex].options = 
        updatedQuestions[questionIndex].options.filter((_, idx) => idx !== optionIndex);
      setQuestions(updatedQuestions);
    };
  
    
    const handleQuestionChange = (index, field, value) => {
      console.log(`Updating question ${index}:`, field, value); // Debug
      const updatedQuestions = [...questions];
      updatedQuestions[index] = {
        ...updatedQuestions[index],
        [field]: value
      };
      setQuestions(updatedQuestions);
    };
    
  
    const addNewQuestion = () => {
      const maxId = Math.max(...questions.map(q => q.id), 0);
      const newQuestion = {
        id: maxId + 1,
        question_text: 'Nouvelle question',
        question_type: 'choice',
        max_value: null,
        class: null,
        options: [],
        importance: "0.00"
      };
      
      setQuestions([...questions, newQuestion]);
      
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    };
  
    const deleteQuestion = async (index) => {
      try {
          if (questions.length <= 1) {
              setError("Vous ne pouvez pas supprimer toutes les questions");
              return;
          }
  
          const questionToDelete = questions[index];
          
          // Call the delete endpoint
          const response = await fetch('https://tetris-forms.azurewebsites.net/api/questions/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: questionToDelete.id })
          });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete question');
            }
    
            // Update local state
            const updatedQuestions = questions.filter((_, i) => i !== index);
            
            // Reorder remaining questions
            const reorderedQuestions = updatedQuestions.map((q, i) => ({
                ...q,
                id: i + 1
            }));
            
            setQuestions(reorderedQuestions);
            setSuccessMessage('Question supprimée avec succès !');
            setTimeout(() => setSuccessMessage(''), 3000);
            
            // Update the reordered questions in the database
            const updateResponse = await fetch('https://tetris-forms.azurewebsites.net/api/questions/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ questions: reorderedQuestions })
            });
    
            if (!updateResponse.ok) {
                throw new Error('Failed to update question order');
            }
        } catch (err) {
            console.error('Error deleting question:', err);
            setError(err.message || 'Erreur lors de la suppression de la question');
        }
    };
  
    const handleSubmit = async () => {
      try {
          setError(null);
          setSuccessMessage('');
          
          // Format questions for submission
          const formattedQuestions = questions.map(q => ({
              id: parseInt(q.id),
              question_text: q.question_text || '',
              question_type: q.question_type || 'choice',
              max_value: q.max_value ? parseInt(q.max_value) : null,
              class: q.class || null,
              importance: parseFloat(q.importance || 0),
              options: Array.isArray(q.options) ? q.options : null
          }));
  
          console.log('Submitting questions:', formattedQuestions);
  
          const response = await fetch('https://tetris-forms.azurewebsites.net/api/questions/update', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({ questions: formattedQuestions })
          });
  
          const responseData = await response.json();
          console.log('Server response:', responseData);
  
          if (!response.ok) {
              throw new Error(responseData.error || 'Failed to update questions');
          }
  
          // Force a fresh fetch from the server
          await fetchQuestions();
          
          setSuccessMessage('Questions mises à jour avec succès !');
          setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
          console.error('Error in handleSubmit:', err);
          setError(err.message || 'Error updating questions');
      }
  };
  
    if (loading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-tetris-blue"></div>
        </div>
      );
    }
  
    return (
      <div className="min-h-screen bg-gray-50 p-8">
    <div className="max-w-5xl mx-auto">
      <div className="sticky top-0 bg-gray-50 z-10 py-4">
        <div className="flex items-center justify-between w-full">
          <button
            onClick={addNewQuestion}
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus size={20} />
            Ajouter une question
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 bg-tetris-blue text-white px-6 py-3 rounded-lg hover:bg-tetris-light transition-colors ml-8"
          >
            <Save size={20} />
            Enregistrer les modifications
          </button>
        </div>
      </div>
  
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Éditer le formulaire</h1>
            <p className="mt-2 text-gray-600">Modifier les questions et leurs paramètres</p>
          </div>
  
          {error && (
            <CustomAlert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </CustomAlert>
          )}
  
          {successMessage && (
            <CustomAlert variant="success">
              <span>{successMessage}</span>
            </CustomAlert>
          )}
  
          <div className="space-y-6">
            {questions.map((question, index) => (
              <div 
                key={question.id}
                className="bg-white p-6 rounded-xl shadow-lg relative"
              >
                {/* Question order indicator */}
                <div className="absolute -left-4 -top-4 w-8 h-8 bg-tetris-blue text-white rounded-full flex items-center justify-center font-bold shadow-lg">
                  {index + 1}
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Question Text
                        </label>
                        <textarea
                          value={question.question_text}
                          onChange={(e) => handleQuestionChange(index, 'question_text', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tetris-blue focus:border-transparent"
                          rows="3"
                        />
                      </div>
  
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Type de question
                          </label>
                          <select
                            value={question.question_type}
                            onChange={(e) => handleQuestionChange(index, 'question_type', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tetris-blue focus:border-transparent"
                          >
                            {questionTypes.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>
                        {question.question_type === 'choice' && (
                            <OptionsEditor
                            options={question.options || []}
                            onChange={(idx, value) => handleOptionsChange(index, idx, value)}
                            onAdd={() => handleAddOption(index)}
                            onRemove={(idx) => handleRemoveOption(index, idx)}
                            />
                        )}
                        {(question.question_type === 'rating' || question.question_type === 'stars') && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Valeur maximale
                            </label>
                            <input
                              type="number"
                              value={question.max_value || ''}
                              onChange={(e) => handleQuestionChange(index, 'max_value', parseInt(e.target.value))}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tetris-blue focus:border-transparent"
                            />
                          </div>
                        )}
  
                        {question.question_type !== 'text' && (
                        <>
                          {/* Sélection de la Classe */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Classe
                            </label>
                            <select
                              value={question.class}
                              onChange={(e) => handleQuestionChange(index, 'class', e.target.value)}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tetris-blue focus:border-transparent"
                            >
                              {classTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                          </div>
                        </>
                      )}

                        {question.question_type  && (
                          <ImportanceField
                            question={question}
                            index={index}
                            questions={questions}
                            setQuestions={setQuestions}
                          />
                        )}


                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => deleteQuestion(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Supprimer la question"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>
      </div>
    );
  };
  
  export default EditFormPage;