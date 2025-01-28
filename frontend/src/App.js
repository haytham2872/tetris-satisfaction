import React, { useState, useEffect } from 'react';
import './index.css';
import logo from './assets/logo.png';
import { ThumbsUp, Heart, Star, CheckCircle2 } from 'lucide-react';
import { startSurvey, submitResponses } from './API';
import SatisfactionAnalytics from './components/SatisfactionAnalytics';
import AdditionalAnalytics from './components/AdditionalAnalytics';
import FloatingButton from './components/FloatingButton';
import VercelAnalytics from './components/VercelAnalytics';
import FeedbackAnalysisPage from './components/FeedbackAnalysisPage';
import { analyzeFeedback } from './services/nlpService';
import { ProgressBar, MilestoneIndicator } from './components/ProgressComponents';
import QuestionDisplay from './components/QuestionDisplay';
import { ChatConversation, getEngagementMessage } from './components/MessageBubble';
import CommentsAnalysis from './components/CommentsAnalysis';
import ContactDetails from './components/ContactDetails';
import ContactButton from './components/ContactButton';


// Container permettant la transition
const QuestionContainer = ({ children, isVisible }) => (
  <div
    className={`transition-all duration-500 ease-in-out transform 
    ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full'}`}
  >
    {children}
  </div>
);

// Écran de remerciement
const ThankYouScreen = () => {
  return (
    <div className="fixed inset-0 bg-tetris-blue bg-opacity-95 flex items-center justify-center z-50 animate-fadeIn">
      <div className="text-center">
        <div className="space-y-6">
          {/* Icônes animées */}
          <div className="flex justify-center space-x-4 mb-8">
            <ThumbsUp className="w-12 h-12 text-white animate-bounce" />
            <Heart className="w-12 h-12 text-white animate-pulse" />
            <Star className="w-12 h-12 text-white animate-bounce delay-100" />
            <CheckCircle2 className="w-12 h-12 text-white animate-pulse delay-100" />
          </div>

          {/* Message de remerciement animé */}
          <h2 className="text-4xl font-bold text-white mb-4 animate-slideUp">
            Merci pour vos réponses !
          </h2>
          <p className="text-xl text-white opacity-90 animate-slideUp animation-delay-200">
            Votre avis est précieux pour nous aider à améliorer nos services.
          </p>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [surveyId, setSurveyId] = useState(null); // ID du survey en cours
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState({});
  const [showThankYou, setShowThankYou] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsView, setAnalyticsView] = useState('main');
  const [showFeedbackAnalysis, setShowFeedbackAnalysis] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [messageHistory, setMessageHistory] = useState([]);
  const [lastResponse, setLastResponse] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showContactButton, setShowContactButton] = useState(false);



  // Tableau des questions
  const questions = [
    { id: 1, text: "Recommanderiez-vous notre service à d'autres courtiers ?", type: "rating", max: 10 },
    { id: 2, text: "Quel est votre niveau de satisfaction globale concernant nos services ?", type: "stars", max: 5 },
    { id: 3, text: "Comment évaluez-vous la rapidité de nos réponses à vos demandes ?", type: "choice", options: ["Excellent", "Bon", "Moyen", "Insuffisant"] },
    { id: 4, text: "Les solutions d'assurance proposées correspondent-elles à vos besoins ?", type: "choice", options: ["Toujours", "Souvent", "Parfois", "Rarement"] },
    { id: 5, text: "Comment jugez-vous la clarté des informations fournies ?", type: "choice", options: ["Très clair", "Clair", "Peu clair", "Pas clair du tout"] },
    { id: 6, text: "Le processus de soumission des dossiers est-il simple à utiliser ?", type: "choice", options: ["Oui, très simple", "Plutôt simple", "Plutôt compliqué", "Très compliqué"] },
    { id: 7, text: "Les délais de traitement des dossiers sont-ils respectés ?", type: "choice", options: ["Toujours", "Souvent", "Parfois", "Rarement"] },
    { id: 8, text: "Comment évaluez-vous le support technique fourni ?", type: "choice", options: ["Excellent", "Bon", "Moyen", "Insuffisant"] },
    { id: 9, text: "La tarification proposée est-elle compétitive ?", type: "choice", options: ["Très compétitive", "Assez compétitive", "Peu compétitive", "Pas du tout compétitive"] },
    { id: 10, text: "Avez-vous des suggestions d'amélioration ou des commentaires ?", type: "text" },
  ];

  // Effet pour gérer la génération de messages automatiques (chat) selon les réponses
  useEffect(() => {
    const messageData = getEngagementMessage(
      currentStep, 
      questions.length, 
      responses,
      lastResponse
    );
    
    if (messageData) {
      // Ajouter le nouveau message à l'historique
      setMessageHistory(prev => [...prev, messageData]);
      
      // Faire défiler automatiquement vers le bas
      setTimeout(() => {
        const chatContainer = document.querySelector('.chat-container');
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }, 100);
    }
  }, [currentStep, responses, lastResponse, questions.length]);

  // Initialisation du survey
  useEffect(() => {
    const initializeSurvey = async () => {
      try {
        const response = await startSurvey(); // Démarre un nouveau survey
        if (response && response.id) {
          setSurveyId(response.id);
        } else {
          console.error('Impossible de démarrer un nouveau survey.');
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation du survey:', error);
      }
    };
    initializeSurvey();
  }, []);
  
  const handleContactSubmit = async (contactData) => {
    try {
      const response = await fetch('http://localhost:5000/api/low-satisfaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: surveyId,
          ...contactData
        })
      });
  
      if (!response.ok) {
        throw new Error('Failed to submit contact details');
      }
  
      // Submit the survey responses first
      const success = await submitResponses(surveyId, responses);
      
      if (success) {
        // After successful submission, show thank you screen
        setShowThankYou(true);
      } else {
        console.error('Failed to submit survey responses');
      }
    } catch (error) {
      console.error('Error submitting contact details:', error);
    }
  };
  const handleResponse = (questionId, value) => {
    // First update the responses state
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        optionalAnswer: prev[questionId]?.optionalAnswer || '',
        answer: value
      }
    }));
    setLastResponse({ questionId, answer: value });
  
    // Check conditions for showing contact button
    const shouldShowContact = () => {
      // First question must be less than 4
      if (questionId === 1) {
        return parseInt(value) < 4;
      }
  
      // Define most negative responses
      const mostNegativeResponses = {
        2: 1,
        3: "Insuffisant",
        4: "Rarement",
        5: "Pas clair du tout",
        6: "Très compliqué",
        7: "Rarement",
        8: "Insuffisant",
        9: "Pas du tout compétitive"
      };
  
      const updatedResponses = {
        ...responses,
        [questionId]: { answer: value }
      };
  
      const firstResponse = updatedResponses[1]?.answer;
      if (firstResponse === undefined || parseInt(firstResponse) >= 4) {
        return false;
      }
  
      let answeredQuestions = 0;
      let negativeResponses = 0;
  
      for (let qId = 2; qId <= questionId; qId++) {
        const response = updatedResponses[qId]?.answer;
        if (response !== undefined) {
          answeredQuestions++;
          if (qId === 2) {
            if (parseInt(response) <= mostNegativeResponses[2]) {
              negativeResponses++;
            }
          } else if (response === mostNegativeResponses[qId]) {
            negativeResponses++;
          }
        }
      }
  
      return answeredQuestions > 0 && negativeResponses === answeredQuestions;
    };
  
    // Update showContactButton state based on conditions
    setShowContactButton(shouldShowContact());
  };

  // Gestion du commentaire optionnel
  const handleOptionalAnswer = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        // On conserve l'existant pour la réponse principale
        answer: prev[questionId]?.answer || '',
        optionalAnswer: value
      }
    }));
  };

  // Soumission des réponses
  const handleSubmit = async () => {
    if (!surveyId) {
      console.error('Survey ID manquant !');
      return;
    }
  
    try {
      console.log('Submitting responses...', responses); // Debug log
  
      // Envoi de toutes les réponses vers l'API
      const success = await submitResponses(surveyId, responses);
      
      if (success) {
        // Si la question 10 (feedback global) a un "answer" texte, on l'analyse
        if (responses[10]?.answer) {
          try {
            console.log('Analyzing feedback text:', responses[10].answer);
            const analysis = await analyzeFeedback(responses[10].answer);
            
            console.log('Analysis completed, storing results...', analysis);
            // Enregistrement de l'analyse côté back
            const analysisResponse = await fetch('http://localhost:5000/api/feedback/analyze', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                survey_id: surveyId,
                analysis: analysis
              })
            });
  
            if (!analysisResponse.ok) {
              console.error('Failed to store analysis:', await analysisResponse.text());
            } else {
              console.log('Analysis stored successfully');
            }
          } catch (error) {
            console.error('Error in feedback analysis:', error);
            // On continue vers l'écran de remerciement même si l'analyse échoue
          }
        }
        
        setShowThankYou(true);
      } else {
        console.error('Échec de l\'enregistrement des réponses.');
      }
    } catch (error) {
      console.error('Erreur lors de la soumission des réponses:', error);
    }
  };

  // Rendu selon le type de question (réponse principale)
  const renderQuestionInput = (question) => {
    switch (question.type) {
      case 'rating':
        return (
          <div className="flex justify-center gap-2 flex-wrap">
            {[...Array(question.max + 1)].map((_, i) => (
              <button
                key={i}
                onClick={() => handleResponse(question.id, i)}
                className={`w-12 h-12 rounded-full border-2 
                           ${responses[question.id]?.answer === i 
                             ? 'bg-tetris-blue text-white' 
                             : 'border-tetris-blue text-tetris-blue'} 
                           hover:bg-tetris-blue hover:text-white
                           transition duration-150 ease-in-out
                           flex items-center justify-center text-lg font-medium`}
              >
                {i}
              </button>
            ))}
          </div>
        );

      case 'stars':
        return (
          <div className="flex justify-center gap-2">
            {[...Array(question.max)].map((_, i) => (
              <button
                key={i}
                onClick={() => handleResponse(question.id, i + 1)}
                className={`text-4xl transition duration-150 ease-in-out
                         ${responses[question.id]?.answer > i 
                           ? 'text-yellow-400' 
                           : 'text-gray-300'}`}
              >
                ★
              </button>
            ))}
          </div>
        );

      case 'choice':
        return (
          <div className="grid grid-cols-1 gap-3">
            {question.options.map(option => (
              <button
                key={option}
                onClick={() => handleResponse(question.id, option)}
                className={`w-full px-4 py-3 text-left rounded-lg
                         ${responses[question.id]?.answer === option
                           ? 'bg-tetris-blue text-white'
                           : 'border border-gray-300 text-gray-700 hover:border-tetris-blue hover:bg-blue-50'}
                         transition duration-150 ease-in-out`}
              >
                {option}
              </button>
            ))}
          </div>
        );

      case 'text':
        return (
          <textarea
            value={responses[question.id]?.answer || ''}
            onChange={(e) => handleResponse(question.id, e.target.value)}
            className="w-full h-32 p-3 border border-gray-300 rounded-lg
                     focus:ring-2 focus:ring-tetris-blue focus:border-transparent
                     resize-none"
            placeholder="Écrivez votre réponse ici..."
          />
        );

      default:
        return null;
    }
  };

  // Si on a soumis et qu'on montre l'écran de remerciement
  if (showThankYou) {
    return <ThankYouScreen />;
  }
  
  // 2. Second check - Contact Form
  if (showContactForm) {
    return (
      <div className="min-h-screen animated-gradient py-12 animate-fadeIn">
        <ContactDetails
          responses={responses}
          onSubmit={handleContactSubmit}
          onSkip={() => {
            setShowContactForm(false);
            setCurrentStep(1);
          }}
        />
      </div>
    );
  }
  
  // 3. Third check - Analytics views
  if (showAnalytics) {
    if (showFeedbackAnalysis) {
      return (
        <FeedbackAnalysisPage
          onBack={() => setShowFeedbackAnalysis(false)}
        />
      );
    }
    if (showComments) {
      return (
        <CommentsAnalysis
          onBack={() => setShowComments(false)}
          onShowAdditional={() => {
            setShowComments(false);
            setAnalyticsView('additional');
          }}
        />
      );
    }
    if (analyticsView === 'additional') {
      return (
        <AdditionalAnalytics
          onBack={() => setAnalyticsView('main')}
          onShowFeedback={() => setShowFeedbackAnalysis(true)}
        />
      );
    }
    
    return (
      <SatisfactionAnalytics
        onBack={() => {
          setShowAnalytics(false);
          setAnalyticsView('main');
        }}
        onShowAdditional={() => setAnalyticsView('additional')}
        onShowComments={() => setShowComments(true)}
        onShowFeedback={() => setShowFeedbackAnalysis(true)}
      />
    );
}

  // Gestion des boutons "Suivant" / "Précédent"
  const handleNextStep = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(currentStep + 1);
      setIsAnimating(false);
    }, 300);
  };

  const handlePrevStep = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(Math.max(0, currentStep - 1));
      setIsAnimating(false);
    }, 300);
  };

  // Rendu principal
  return (
    <>
      <VercelAnalytics />
      <div className="min-h-screen bg-tetris-blue">
        {messageHistory.length > 0 && (
          <ChatConversation messages={messageHistory} />
        )}
        {/* Add the contact button here */}
        {showContactButton && !showContactForm && (
          <ContactButton 
            onClick={() => setShowContactForm(true)}
          />
        )}
        <header className="sticky top-0 z-50 bg-white shadow-lg">
          <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <img src={logo} alt="Tetris Assurance" className="h-12 w-auto" />
              <div className="text-tetris-blue font-medium text-lg">
                Question {currentStep + 1} sur {questions.length}
              </div>
            </div>
            
            <div className="mt-2">
              <ProgressBar 
                currentStep={currentStep} 
                totalSteps={questions.length} 
              />
              <MilestoneIndicator 
                currentStep={currentStep} 
                totalSteps={questions.length} 
              />
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            <QuestionContainer isVisible={!isAnimating}>
              <div className="p-8">
                {/* Affichage du texte de la question */}
                <QuestionDisplay question={questions[currentStep]} />
                
                {/* Bloc de réponses principal (rating, étoiles, choix, texte...) */}
                <div className="space-y-6">
                  {renderQuestionInput(questions[currentStep])}
                </div>

                {/* Affiche le commentaire optionnel si ce n’est PAS un type 'text' */}
                {questions[currentStep].type !== 'text' && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Commentaire (optionnel)
                    </label>
                    <textarea
                      value={responses[questions[currentStep].id]?.optionalAnswer || ''}
                      onChange={(e) => handleOptionalAnswer(questions[currentStep].id, e.target.value)}
                      className="w-full h-20 p-3 border border-gray-300 rounded-lg
                                focus:ring-2 focus:ring-tetris-blue focus:border-transparent
                                resize-none"
                      placeholder="Des idées supplémentaires ? Écrivez-nous-en quelques mots..."
                    />
                  </div>
                )}
              </div>
            </QuestionContainer>

            {/* Boutons "Précédent" / "Suivant"/"Terminer" */}
            <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
              <button
                onClick={handlePrevStep}
                disabled={currentStep === 0}
                className={`
                  px-6 py-3 rounded-lg text-lg transition-all duration-300
                  ${currentStep === 0
                    ? 'bg-gray-300 cursor-not-allowed opacity-50'
                    : 'bg-white border border-gray-300 hover:bg-gray-50 hover:shadow-md'
                  }
                `}
              >
                Précédent
              </button>

              {currentStep === questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  className="px-6 py-3 bg-tetris-blue text-white rounded-lg
                             hover:bg-blue-700 transition-all duration-300 hover:shadow-lg
                             transform hover:-translate-y-1"
                >
                  Terminer
                </button>
              ) : (
                <button
                  onClick={handleNextStep}
                  className="px-6 py-3 bg-tetris-blue text-white rounded-lg
                             hover:bg-blue-700 transition-all duration-300 hover:shadow-lg
                             transform hover:-translate-y-1"
                >
                  Suivant
                </button>
              )}
            </div>
          </div>
        </main>

        {/* Bouton flottant pour accéder aux analytics */}
        <FloatingButton onClick={() => setShowAnalytics(true)} />
      </div>
    </>
  );
}

export default App;
