// src/services/nlpService.js

// Custom French sentiment analysis without external dependencies

// French sentiment lexicon (comprehensive version)
const FRENCH_SENTIMENT_LEXICON = {
    // Positive words
    'satisfait': 2,
    'content': 2,
    'heureux': 3,
    'ravi': 3,
    'excellent': 4,
    'génial': 4,
    'extraordinaire': 4,
    'fantastique': 4,
    'parfait': 4,
    'exceptionnel': 4,
    'incroyable': 3,
    'remarquable': 3,
    'formidable': 3,
    'superbe': 3,
    'magnifique': 3,
    'merveilleux': 3,
    'impressionnant': 3,
    'agréable': 2,
    'favorable': 2,
    'positif': 2,
    'apprécié': 2,
    'enchanté': 2,
    'comblé': 2,
    'réjoui': 2,
    'conquis': 2,
    'reconnaissant': 2,
    'épanoui': 2,
    'serein': 1,
    'gratifié': 1,
    'optimiste': 1,
    'confiant': 1,
    'qualité': 1,
    'facile': 1,
    'bien': 1,
    'bon': 2,
    'bonne': 2,
    'efficace': 2,
    'utile': 2,
    'pratique': 1,
    'fiable': 2,
    'rapide': 2,
    'aime': 2,
    'adore': 3,
    'bravo': 2,
    'merci': 1,
    'simple': 1,
    'clair': 1,
    'sympa': 2,
    'sympathique': 2,
    'top': 3,
    
    // Negative words
    'frustré': -2,
    'déçu': -3,
    'mécontent': -2,
    'agacé': -2,
    'difficile': -1,
    'contrarié': -2,
    'insatisfait': -3,
    'énervé': -3,
    'irrité': -3,
    'excédé': -3,
    'exaspéré': -3,
    'fâché': -3,
    'furieux': -4,
    'dépité': -2,
    'découragé': -2,
    'désappointé': -2,
    'désemparé': -2,
    'ennuyé': -1,
    'tendu': -1,
    'stressé': -2,
    'inquiet': -1,
    'préoccupé': -1,
    'soucieux': -1,
    'craintif': -2,
    'anxieux': -2,
    'alarmé': -3,
    'troublé': -2,
    'perturbé': -2,
    'dérangé': -2,
    'tracassé': -1,
    'incertain': -1,
    'hésitant': -1,
    'méfiant': -2,
    'dubitatif': -1,
    'appréhensif': -2,
    'tourmenté': -3,
    'angoissé': -3,
    'nerveux': -2,
    'agité': -1,
    'mauvais': -2,
    'horrible': -4,
    'terrible': -4,
    'affreux': -4,
    'pénible': -2,
    'ennuyeux': -2,
    'désagréable': -2,
    'lent': -1,
    'incompétent': -3,
    'inutile': -2,
    'compliqué': -2,
    'défectueux': -2,
    'médiocre': -2,
    'pire': -3,
    'nul': -3,
    'déteste': -3,
    'dommage': -1,
    'bof': -1,
    'confus': -1,
    'bug': -2,
    'erreur': -2,
    'problème': -2,
    'plantage': -3
  };
  
  // French negation words
  const NEGATION_WORDS = ['ne', 'pas', 'plus', 'jamais', 'aucun', 'non', 'sans', 'ni'];
  
  // Custom sentiment analysis function that doesn't rely on external libraries
  const analyzeSentiment = (text) => {
    try {
      // Basic text preprocessing
      const lowercaseText = text.toLowerCase();
      const words = lowercaseText.split(/\s+/);
      
      let customScore = 0;
      let wordHits = 0;
      
      // Identify negation spans
      const negationSpans = [];
      for (let i = 0; i < words.length; i++) {
        if (NEGATION_WORDS.includes(words[i])) {
          // A negation word affects the next 4 words
          negationSpans.push({start: i, end: i + 4});
        }
      }
      
      // Process each word
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const wordSentiment = FRENCH_SENTIMENT_LEXICON[word];
        
        if (wordSentiment !== undefined) {
          // Check if this word is in a negation span
          let isNegated = false;
          for (const span of negationSpans) {
            if (i > span.start && i <= span.end) {
              isNegated = true;
              break;
            }
          }
          
          // Apply sentiment with negation if needed
          if (isNegated) {
            customScore -= wordSentiment; // Reverse the sentiment
          } else {
            customScore += wordSentiment;
          }
          
          wordHits++;
        }
      }
      
      // Handle common phrases
      const phrases = [
        { pattern: /pas (bien|bon)/, score: -2 },
        { pattern: /très (bien|bon)/, score: 3 },
        { pattern: /vraiment (génial|super|excellent)/, score: 4 },
        { pattern: /pas du tout/, score: -2 },
        { pattern: /tout à fait/, score: 2 },
        { pattern: /pas (mal|mauvais)/, score: 1 },
        { pattern: /très (mauvais|mal)/, score: -3 },
        { pattern: /trop (lent|compliqué)/, score: -3 },
        { pattern: /j'aime (bien|beaucoup)/, score: 3 },
        { pattern: /je n'aime pas/, score: -2 }
      ];
      
      for (const phrase of phrases) {
        if (phrase.pattern.test(lowercaseText)) {
          customScore += phrase.score;
          wordHits++;
        }
      }
      
      // Normalize scores using hyperbolic tangent for smoother results
      let finalScore;
      if (wordHits > 0) {
        finalScore = Math.tanh(customScore / 4);
      } else {
        // If no sentiment words found, try to estimate based on punctuation
        if (text.includes('!') && !text.includes('?')) {
          finalScore = 0.3; // Exclamation marks often indicate positive sentiment
        } else if (text.includes('...') || text.includes('…')) {
          finalScore = -0.2; // Ellipsis often indicates hesitation or doubt
        } else {
          finalScore = 0; // Neutral
        }
      }
      
      // Ensure the score is between -1 and 1
      finalScore = Math.max(-1, Math.min(1, finalScore));
      
      // Return the score and display percentage
      return {
        score: finalScore,
        displayPercentage: Math.round((finalScore + 1) * 50)
      };
    } catch (error) {
      console.error('Error in analyzeSentiment:', error);
      // Return neutral sentiment in case of error
      return { 
        score: 0, 
        displayPercentage: 50 
      };
    }
  };
  
  // Emotion patterns from the original code
  const EMOTIONS = {
      SATISFACTION: {
          patterns: [
              'satisfait', 'content', 'heureux', 'ravi', 'excellent',
              'enchanté', 'comblé', 'réjoui', 'conquis', 'impressionné',
              'reconnaissant', 'agréable', 'favorable', 'positif', 'apprécié',
              'épanoui', 'serein', 'gratifié', 'optimiste', 'confiant'
          ],
          weight: 1
      },
      FRUSTRATION: {
          patterns: [
              'frustré', 'déçu', 'mécontent', 'agacé', 'difficile',
              'contrarié', 'insatisfait', 'énervé', 'irrité', 'excédé',
              'exaspéré', 'fâché', 'furieux', 'dépité', 'découragé',
              'désappointé', 'désemparé', 'ennuyé', 'tendu', 'stressé'
          ],
          weight: -1
      },
      ENTHUSIASM: {
          patterns: [
              'génial', 'extraordinaire', 'fantastique', 'parfait',
              'exceptionnel', 'incroyable', 'remarquable', 'formidable',
              'superbe', 'magnifique', 'merveilleux', 'impressionnant',
              'brillant', 'spectaculaire', 'fabuleux', 'sensationnel'
          ],
          weight: 2
      },
      CONCERN: {
          patterns: [
              'inquiet', 'préoccupé', 'soucieux', 'craintif',
              'anxieux', 'alarmé', 'troublé', 'perturbé', 'dérangé',
              'tracassé', 'incertain', 'hésitant', 'méfiant', 'dubitatif',
              'appréhensif', 'tourmenté', 'angoissé', 'nerveux', 'agité'
          ],
          weight: -0.5
      }
  };
  
  // Urgency patterns from the original code
  const URGENCY_PATTERNS = {
      HIGH: {
          patterns: [
              'urgent', 'immédiat', 'critique', 'au plus vite',
              'rapidement', 'sans délai', 'pressant', 'prioritaire',
              'impératif', 'crucial', 'sans attendre', 'imminent',
              'dès maintenant', 'en urgence', 'capital'
          ]
      },
      MEDIUM: {
          patterns: [
              'dès que possible', 'bientôt', 'prochainement',
              'sous peu', 'dans les meilleurs délais', 'rapidement',
              'assez urgent', 'relativement pressé', 'important'
          ]
      },
      LOW: {
          patterns: [
              'quand possible', 'pas urgent', 'à l\'occasion',
              'peu pressé', 'sans empressement', 'tranquillement',
              'progressivement', 'doucement', 'calmement'
          ]
      }
  };
  
  // Detect emotions in text (kept the same as original)
  const detectEmotions = (text) => {
      try {
          const lowercaseText = text.toLowerCase();
          const detectedEmotions = {};
          let dominantEmotion = null;
          let maxScore = 0;
  
          // Split text into words for negation checking
          const words = lowercaseText.split(/\s+/);
          
          // Find negation words in the text
          const negationWords = ['ne', 'pas', 'plus', 'jamais', 'aucun', 'non'];
          
          Object.entries(EMOTIONS).forEach(([emotion, data]) => {
              let emotionScore = 0;
              
              data.patterns.forEach(pattern => {
                  if (lowercaseText.includes(pattern)) {
                      // Find the position of the emotion word
                      const patternIndex = words.findIndex(word => word.includes(pattern));
                      if (patternIndex !== -1) {
                          // Check for negation words before the emotion word
                          const hasNegation = words
                              .slice(Math.max(0, patternIndex - 3), patternIndex)
                              .some(word => negationWords.includes(word));
  
                          // If negation is found, reverse the emotion
                          if (hasNegation) {
                              if (emotion === 'SATISFACTION') {
                                  emotionScore -= data.weight;
                              } else if (emotion === 'FRUSTRATION') {
                                  emotionScore += Math.abs(data.weight);
                              }
                          } else {
                              emotionScore += data.weight;
                          }
                      }
                  }
              });
  
              if (emotionScore !== 0) {
                  detectedEmotions[emotion] = {
                      score: emotionScore,
                      isNegated: emotionScore < 0
                  };
  
                  if (Math.abs(emotionScore) > Math.abs(maxScore)) {
                      maxScore = emotionScore;
                      dominantEmotion = emotion;
                  }
              }
          });
  
          return {
              emotions: detectedEmotions,
              dominant: dominantEmotion
          };
      } catch (error) {
          console.error('Error in detectEmotions:', error);
          return {
              emotions: {},
              dominant: null
          };
      }
  };
  
  // Detect urgency level (kept the same as original)
  const detectUrgency = (text) => {
      try {
          const lowercaseText = text.toLowerCase();
          
          if (URGENCY_PATTERNS.HIGH.patterns.some(pattern => lowercaseText.includes(pattern))) {
              return { level: 'HIGH' };
          }
          if (URGENCY_PATTERNS.MEDIUM.patterns.some(pattern => lowercaseText.includes(pattern))) {
              return { level: 'MEDIUM' };
          }
          if (URGENCY_PATTERNS.LOW.patterns.some(pattern => lowercaseText.includes(pattern))) {
              return { level: 'LOW' };
          }
          return { level: 'NORMAL' };
      } catch (error) {
          console.error('Error in detectUrgency:', error);
          return { level: 'NORMAL' };
      }
  };
  
  // Get accurate word count (kept the same as original)
  const getWordCount = (text) => {
      try {
          return text
              .trim()
              .split(/\s+/)
              .filter(word => word.length > 0)
              .length;
      } catch (error) {
          console.error('Error in getWordCount:', error);
          return 0;
      }
  };
  
  // Simple entity extraction function (basic implementation)
  const extractEntities = (text) => {
      const entities = [];
      // Basic entity recognition could be implemented here if needed
      return entities;
  };
  
  // Main analysis function (modified to use local sentiment analysis)
  export const analyzeFeedback = async (text) => {
      try {
          console.log('Starting analyzeFeedback for text:', text);
  
          // Use local sentiment analysis
          const sentimentResult = analyzeSentiment(text);
          
          // Use local entity extraction
          const entities = extractEntities(text);
  
          // Detect emotions and urgency
          const emotionsAnalysis = detectEmotions(text);
          const urgencyAnalysis = detectUrgency(text);
  
          // Prepare analysis result (structure kept the same for compatibility)
          const result = {
              overall: {
                  sentiment: {
                      score: sentimentResult.score,
                      displayPercentage: sentimentResult.displayPercentage
                  },
                  emotions: emotionsAnalysis,
                  urgency: urgencyAnalysis
              },
              metadata: {
                  timestamp: new Date().toISOString(),
                  wordCount: getWordCount(text),
                  language: 'fr'
              },
              entities: entities
          };
  
          console.log('Final analysis result:', result);
          return result;
  
      } catch (error) {
          console.error('Error in analyzeFeedback:', error);
          // Return a default result in case of error
          return {
              overall: {
                  sentiment: {
                      score: 0,
                      displayPercentage: 50
                  },
                  emotions: { emotions: {}, dominant: null },
                  urgency: { level: 'NORMAL' }
              },
              metadata: {
                  timestamp: new Date().toISOString(),
                  wordCount: getWordCount(text) || 0,
                  language: 'fr'
              },
              entities: []
          };
      }
  };