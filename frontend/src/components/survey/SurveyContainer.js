// src/components/survey/SurveyContainer.js
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
    switch (question.type) {
      case 'rating':
        return (
          <div className="flex justify-center gap-2 flex-wrap my-8">
            {[...Array(question.max + 1)].map((_, i) => (
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
        return (
          <div className="flex justify-center gap-2 my-8">
            {[...Array(question.max)].map((_, i) => (
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
  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden">
      <QuestionContainer isVisible={!isAnimating}>
        <div className="p-8 space-y-6">
          <div className="text-center">
            <QuestionDisplay question={questions[currentStep]} />
          </div>
          
          <div className="space-y-6">
            {renderQuestionInput(questions[currentStep], responses, onResponse)}
          </div>

          {questions[currentStep].type !== 'text' && (
            <OptionalCommentInput 
              questionId={questions[currentStep].id}
              value={responses[questions[currentStep].id]?.optionalAnswer || ''}
              onChange={onOptionalAnswer}
            />
          )}
        </div>
      </QuestionContainer>
    </div>
  );
};

export default SurveyContainer;