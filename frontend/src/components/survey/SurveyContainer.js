import React from 'react';
import QuestionDisplay from '../QuestionDisplay';

const QuestionContainer = ({ isVisible, children }) => (
  <div className={`transition-all duration-500 ease-in-out transform 
    ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full'}`}>
    {children}
  </div>
);

const OptionalCommentInput = ({ questionId, value, onChange }) => (
  <div className="mt-6">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Commentaire (optionnel)
    </label>
    <textarea
      value={value}
      onChange={(e) => onChange(questionId, e.target.value)}
      className="w-full h-20 p-3 border border-gray-300 rounded-lg
                focus:ring-2 focus:ring-tetris-blue focus:border-transparent
                resize-none"
      placeholder="Des idées supplémentaires ? Écrivez-nous en quelques mots..."
    />
  </div>
);

const renderQuestionInput = (question, responses, onResponse) => {
    // Vérification si la question existe
    if (!question || !question.question_type) {
        return null;
    }

    switch (question.question_type) {
      case 'rating':
        // Vérification de max_value pour rating
        const maxRating = question.max_value || 5; // Valeur par défaut si null
        return (
          <div className="flex justify-center gap-2 flex-wrap my-8">
            {[...Array(maxRating + 1)].map((_, i) => (
              <button
                key={i}
                onClick={() => onResponse(question.id, i)}
                className={`w-12 h-12 rounded-full border-2 
                           ${responses[question.id]?.answer === i 
                             ? 'bg-tetris-blue text-white border-tetris-blue' 
                             : 'border-tetris-blue text-tetris-blue hover:bg-tetris-blue/10'} 
                           hover:border-tetris-blue
                           transition duration-150 ease-in-out
                           flex items-center justify-center text-lg font-medium
                           shadow-sm hover:shadow-md`}
              >
                {i}
              </button>
            ))}
          </div>
        );
  
      case 'stars':
        // Vérification de max_value pour stars
        const maxStars = question.max_value || 5; // Valeur par défaut si null
        return (
          <div className="flex justify-center gap-2 my-8">
            {[...Array(maxStars)].map((_, i) => (
              <button
                key={i}
                onClick={() => onResponse(question.id, i + 1)}
                className={`text-4xl transition duration-150 ease-in-out
                         ${responses[question.id]?.answer > i 
                           ? 'text-yellow-400' 
                           : 'text-gray-300 hover:text-yellow-200'}`}
              >
                ★
              </button>
            ))}
          </div>
        );
  
      case 'choice':
        if (!question.options || !Array.isArray(question.options)) {
          return null;
        }
        return (
          <div className="grid grid-cols-1 gap-3 my-8">
            {question.options.map(option => (
              <button
                key={option}
                onClick={() => onResponse(question.id, option)}
                className={`w-full px-6 py-4 text-left rounded-lg text-base
                         ${responses[question.id]?.answer === option
                           ? 'bg-tetris-blue text-white'
                           : 'border border-gray-300 text-gray-700 hover:border-tetris-blue hover:bg-blue-50'}
                         transition duration-150 ease-in-out shadow-sm hover:shadow-md`}
              >
                {option}
              </button>
            ))}
          </div>
        );
  
      case 'text':
        return (
          <div className="my-8">
            <textarea
              value={responses[question.id]?.answer || ''}
              onChange={(e) => onResponse(question.id, e.target.value)}
              className="w-full h-32 p-4 border border-gray-300 rounded-lg
                        focus:ring-2 focus:ring-tetris-blue focus:border-transparent
                        resize-none text-base"
              placeholder="Écrivez votre réponse ici..."
            />
          </div>
        );
  
      default:
        return null;
    }
  };

const SurveyContainer = ({ 
  currentStep, 
  responses, 
  onResponse, 
  onOptionalAnswer,
  isAnimating,
  questions 
}) => {
  // Vérifications de sécurité
  if (!Array.isArray(questions) || questions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-xl p-8">
        <div className="text-center text-gray-600">
          Aucune question disponible
        </div>
      </div>
    );
  }

  if (currentStep === undefined || currentStep < 0 || currentStep >= questions.length) {
    return (
      <div className="bg-white rounded-xl shadow-xl p-8">
        <div className="text-center text-gray-600">
          Question non trouvée
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentStep];
  if (!currentQuestion) {
    return (
      <div className="bg-white rounded-xl shadow-xl p-8">
        <div className="text-center text-gray-600">
          Question invalide
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden">
      <QuestionContainer isVisible={!isAnimating}>
        <div className="p-8 space-y-6">
          <div className="text-center">
            <QuestionDisplay question={currentQuestion} />
          </div>
          
          <div className="space-y-6">
            {renderQuestionInput(currentQuestion, responses, onResponse)}
          </div>

          {currentQuestion.question_type !== 'text' && (
            <OptionalCommentInput 
              questionId={currentQuestion.id}
              value={responses[currentQuestion.id]?.optionalAnswer || ''}
              onChange={onOptionalAnswer}
            />
          )}
        </div>
      </QuestionContainer>
    </div>
  );
};

export default SurveyContainer;