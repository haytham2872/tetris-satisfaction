import React, { useState, useEffect,useRef } from 'react';
import { ArrowLeft, Save, AlertCircle, Plus, Trash2 } from 'lucide-react';
// Custom Alert component
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
const OptionsEditor = ({ options, onChange, onAdd, onRemove }) => {
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

const EditFormPage = ({ onBack }) => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const bottomRef = useRef(null);
    const [questionsWithOptions, setQuestionsWithOptions] = useState([]);
  
  
    const questionTypes = ['rating', 'stars', 'choice', 'text'];
    const classTypes = ['satisfaction', 'performance', 'adequacy', 'clarity', 'usability', 'support', 'pricing', 'feedback'];
  
    useEffect(() => {
      fetchQuestions();
    }, []);
  
    const fetchQuestions = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/questions');
        if (!response.ok) throw new Error('Failed to fetch questions');
        const data = await response.json();

        const transformedData = data.map(q => ({
            ...q,
            options: q.options || (q.question_type === 'choice' ? [] : undefined)
          })); 

        setQuestions(data);
        setLoading(false);
      } catch (err) {
        console.error('Error:', err);
        setError('Error fetching questions');
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


    const handleQuestionTypeChange = (index, value) => {
        const updatedQuestions = [...questions];
        updatedQuestions[index] = {
          ...updatedQuestions[index],
          question_type: value,
          options: value === 'choice' ? [] : undefined,
          max_value: value === 'choice' ? null : updatedQuestions[index].max_value
        };
        setQuestions(updatedQuestions);
      }; 

    const handleQuestionChange = (index, field, value) => {
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
        class: 'satisfaction'
      };
      
      setQuestions([...questions, newQuestion]);
      
      // Scroll to bottom after state update
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
          
          // First, delete from database
          const response = await fetch('http://localhost:5000/api/questions/delete', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: questionToDelete.id })
          });
      
          if (!response.ok) {
            throw new Error('Failed to delete question');
          }
      
          // If database deletion successful, update local state
          const updatedQuestions = questions.filter((_, i) => i !== index);
          
          // Update IDs to be sequential
          const reorderedQuestions = updatedQuestions.map((q, i) => ({
            ...q,
            id: i + 1
          }));
          
          setQuestions(reorderedQuestions);
          
          // Show success message
          setSuccessMessage('Question supprimée avec succès !');
          setTimeout(() => setSuccessMessage(''), 3000);
          
          // Save the reordered questions to the database
          await handleSubmit();
        } catch (err) {
          console.error('Error deleting question:', err);
          setError('Erreur lors de la suppression de la question');
        }
      };
  
    const handleSubmit = async () => {
        try {
          const response = await fetch('http://localhost:5000/api/questions/update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              questions: questions.map(q => ({
                ...q,
                options: q.question_type === 'choice' ? q.options : undefined
              }))
            }),
          });
    
          if (!response.ok) throw new Error('Failed to update questions');
          
          setSuccessMessage('Questions mises à jour avec succès !');
          await fetchQuestions(); // Refresh questions after successful update
          setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
          console.error('Error:', err);
          setError('Error updating questions');
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
          <div className="flex justify-between items-center mb-8 sticky top-0 bg-gray-50 z-10 py-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-tetris-blue hover:text-tetris-light transition-colors"
            >
              <ArrowLeft size={20} />
              Retour aux statistiques
            </button>
            <div className="flex gap-4">
              <button
                onClick={addNewQuestion}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus size={20} />
                Ajouter une question
              </button>
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 bg-tetris-blue text-white px-6 py-3 rounded-lg hover:bg-tetris-light transition-colors"
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