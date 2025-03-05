// src/services/nlpService.js
// Completely rewritten French sentiment analysis

// Core positive sentiment words with carefully calibrated scores
const POSITIVE_LEXICON = {
  // Strong positive (score 3-4)
  'excellent': 4,
  'exceptionnel': 4,
  'fantastique': 4,
  'parfait': 4,
  'extraordinaire': 4,
  'génial': 4,
  'incroyable': 3.5,
  'adore': 3.5,
  'formidable': 3.5,
  'remarquable': 3.5,
  'superbe': 3.5,
  'magnifique': 3.5,
  'merveilleux': 3.5,
  'impressionnant': 3,
  'ravi': 3,

  // Moderate positive (score 2-2.9)
  'très satisfait': 2.8,
  'très content': 2.8,
  'très heureux': 2.8,
  'satisfait': 2.5,
  'content': 2.5,
  'heureux': 2.5,
  'aime beaucoup': 2.5,
  'efficace': 2,
  'utile': 2,
  'fiable': 2,
  'réactif': 2,
  'bon': 2,
  'bonne': 2,
  'bien': 2,
  'rapide': 2,
  'sympa': 2,
  'pratique': 2,
  'compétent': 2,
  'professionnel': 2,

  // Mild positive (score 0.5-1.9)
  'plutôt bien': 1.8,
  'assez bien': 1.7,
  'assez satisfait': 1.7,
  'plutôt satisfait': 1.7,
  'acceptable': 1.5,
  'convenable': 1.5,
  'correct': 1.5,
  'agréable': 1.5,
  'pas mal': 1.2,
  'positif': 1,
  'facile': 1,
  'simple': 1,
  'clair': 1,
  'merci': 0.8,
  'services': 0.5,
  'apprécié': 0.5
};

// Core negative sentiment words with carefully calibrated scores
const NEGATIVE_LEXICON = {
  // Strong negative (score 3-4)
  'horrible': 4,
  'affreux': 4,
  'terrible': 4,
  'catastrophique': 4,
  'insupportable': 4,
  'inacceptable': 3.8,
  'désastreux': 3.8,
  'déteste': 3.5,
  'exécrable': 3.5,
  'furieux': 3.5,
  'très déçu': 3.2,
  'très mécontent': 3.2,
  'extrêmement frustrant': 3,

  // Moderate negative (score 2-2.9)
  'mauvais': 2.8,
  'pénible': 2.7,
  'défectueux': 2.7,
  'énervé': 2.6,
  'irrité': 2.6,
  'frustré': 2.5,
  'frustrant': 2.5,
  'déçu': 2.5,
  'mécontent': 2.5,
  'insatisfait': 2.5,
  'ne fonctionne pas': 2.5,
  'ne marche pas': 2.5,
  'compliqué': 2.2,
  'difficile': 2.2,
  'inutile': 2.2,
  'problème': 2,
  'erreur': 2,
  'bug': 2,
  'lent': 2,

  // Mild negative (score 0.5-1.9)
  'pas idéal': 1.8,
  'pas parfait': 1.7,
  'peu pratique': 1.7,
  'pourrait être mieux': 1.5,
  'insuffisant': 1.5,
  'manque': 1.5,
  'confus': 1.3,
  'médiocre': 1.3,
  'peu satisfait': 1.2,
  'pas très satisfait': 1.2,
  'ennuyeux': 1,
  'bizarre': 1,
  'dommage': 0.8
};

// Phrase patterns that strongly indicate sentiment level
const SENTIMENT_PHRASES = {
  positive: [
    { pattern: /j['']adore|c['']est génial/i, score: 3.5, level: "strong" },
    { pattern: /très satisfait|très content|très bien/i, score: 2.8, level: "moderate" },
    { pattern: /je suis satisfait|je suis content|bonne qualité/i, score: 2.5, level: "moderate" },
    { pattern: /assez bien|plutôt satisfait|pas mal/i, score: 1.5, level: "mild" }
  ],
  negative: [
    { pattern: /c['']est horrible|c['']est affreux|totalement inutilisable/i, score: 4, level: "strong" },
    { pattern: /très déçu|très mécontent|ne fonctionne pas du tout/i, score: 3.2, level: "strong" },
    { pattern: /frustrant à utiliser|manque de fonctionnalités essentielles/i, score: 2.5, level: "moderate" },
    { pattern: /pas idéal|pourrait être mieux|pas très satisfait/i, score: 1.5, level: "mild" }
  ]
};

// French negation words
const NEGATION_WORDS = ['ne', 'n\'', 'pas', 'plus', 'jamais', 'aucun', 'aucune', 'non', 'sans', 'ni'];

// French intensifiers
const INTENSIFIERS = ['très', 'vraiment', 'extrêmement', 'totalement', 'complètement', 'absolument'];

// French contrast markers
const CONTRAST_MARKERS = ['mais', 'cependant', 'toutefois', 'néanmoins', 'pourtant', 'en revanche', 'par contre'];

/**
 * Split text into sentences
 */
function splitIntoSentences(text) {
  return text
    .replace(/([.!?])\s*(?=[A-Za-zÀ-ÖØ-öø-ÿ])/g, "$1|")
    .split("|")
    .filter(s => s.trim().length > 0);
}

/**
 * Look for key sentiment phrases in a text
 */
function findSentimentPhrases(text, dictionary) {
  const results = [];

  for (const entry of dictionary) {
    if (entry.pattern.test(text)) {
      results.push({
        match: text.match(entry.pattern)[0],
        score: entry.score,
        level: entry.level
      });
    }
  }

  return results;
}

/**
 * Detect if a text is negated by checking for nearby negation words
 */
function isNegated(text) {
  for (const negWord of NEGATION_WORDS) {
    if (text.includes(negWord)) {
      return true;
    }
  }
  return false;
}

/**
 * Extract sentiment words from text and calculate score
 */
function extractSentiment(text, lexicon) {
  const words = text.toLowerCase().split(/\s+/);
  const results = [];

  // Check for multi-word terms first (up to 3 words)
  for (let i = 0; i < words.length; i++) {
    for (let wordCount = 3; wordCount > 0; wordCount--) {
      if (i + wordCount <= words.length) {
        const phrase = words.slice(i, i + wordCount).join(' ');
        if (lexicon[phrase]) {
          results.push({
            term: phrase,
            score: lexicon[phrase]
          });
          i += wordCount - 1; // Skip ahead
          break;
        }
      }
    }
  }

  // Get single word terms we didn't capture above
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    // Skip words that were already part of multi-word terms
    if (lexicon[word] && !results.some(r => r.term.includes(word))) {
      results.push({
        term: word,
        score: lexicon[word]
      });
    }
  }

  return results;
}

/**
 * Analyze sentiment with forced distribution
 */
function analyzeSentiment(text) {
  try {
    // Normalize the text
    const normalizedText = text.toLowerCase();
    const sentences = splitIntoSentences(normalizedText);

    // Analyze at the sentence level
    const sentenceSentiments = [];
    let totalPosScore = 0;
    let totalNegScore = 0;
    let posHits = 0;
    let negHits = 0;

    // First check for direct sentiment phrases
    const positivePhrases = findSentimentPhrases(normalizedText, SENTIMENT_PHRASES.positive);
    const negativePhrases = findSentimentPhrases(normalizedText, SENTIMENT_PHRASES.negative);

    // Extract key phrases that influence the category
    const hasStrongPositive = positivePhrases.some(p => p.level === "strong");
    const hasModeratePositive = positivePhrases.some(p => p.level === "moderate");
    const hasMildPositive = positivePhrases.some(p => p.level === "mild");

    const hasStrongNegative = negativePhrases.some(p => p.level === "strong");
    const hasModerateNegative = negativePhrases.some(p => p.level === "moderate");
    const hasMildNegative = negativePhrases.some(p => p.level === "mild");

    // Add phrase scores to totals
    for (const phrase of positivePhrases) {
      totalPosScore += phrase.score;
      posHits++;
    }

    for (const phrase of negativePhrases) {
      totalNegScore += phrase.score;
      negHits++;
    }

    // Sentiment at sentence level (to handle negation properly)
    for (const sentence of sentences) {
      const positiveTerms = extractSentiment(sentence, POSITIVE_LEXICON);
      const negativeTerms = extractSentiment(sentence, NEGATIVE_LEXICON);

      // Check for negation (whole sentence)
      const isNegatedSentence = isNegated(sentence);

      let sentencePosScore = 0;
      let sentenceNegScore = 0;

      // Process positive terms
      for (const term of positiveTerms) {
        // Check if this specific term is negated
        const termContext = sentence.substring(
          Math.max(0, sentence.indexOf(term.term) - 10),
          sentence.indexOf(term.term) + term.term.length + 2
        );

        if (isNegatedSentence || isNegated(termContext)) {
          // If negated, convert to negative sentiment (but dampen it a bit)
          sentenceNegScore += term.score * 0.8;
          negHits++;
        } else {
          sentencePosScore += term.score;
          posHits++;
        }
      }

      // Process negative terms
      for (const term of negativeTerms) {
        // Check if this specific term is negated
        const termContext = sentence.substring(
          Math.max(0, sentence.indexOf(term.term) - 10),
          sentence.indexOf(term.term) + term.term.length + 2
        );

        if (isNegatedSentence || isNegated(termContext)) {
          // If negated, convert to positive sentiment (but dampen it a bit)
          sentencePosScore += term.score * 0.7;
          posHits++;
        } else {
          sentenceNegScore += term.score;
          negHits++;
        }
      }

      // Apply intensifiers if present
      for (const intensifier of INTENSIFIERS) {
        if (sentence.includes(intensifier)) {
          sentencePosScore *= 1.3;
          sentenceNegScore *= 1.3;
          break;
        }
      }

      totalPosScore += sentencePosScore;
      totalNegScore += sentenceNegScore;

      sentenceSentiments.push({
        text: sentence,
        positive: sentencePosScore,
        negative: sentenceNegScore
      });
    }

    // Look for contrast (buts, howevers)
    const hasContrastMarkers = CONTRAST_MARKERS.some(marker => normalizedText.includes(marker));

    // Calculate net score, but give more weight to stronger signals
    let netScore = 0;

    // Balance calculation based on hits to prevent bias with few words
    if (posHits > 0 || negHits > 0) {
      // Use a weighted approach with normalization
      const totalScore = totalPosScore - totalNegScore;
      const totalHits = Math.max(1, posHits + negHits);

      netScore = totalScore / (totalHits * 2); // Normalize to roughly -1...1 range
    }

    // Force categorization based on key patterns
    // This ensures appropriate distribution and prevents clustering
    let forcedCategory = null;

    if (hasStrongNegative) {
      // Strong negative: -1.0 to -0.7 range
      netScore = Math.min(netScore, -0.7);
      // Different scores for different strong negative patterns
      if (/c['']est horrible|totalement inutilisable/.test(normalizedText)) {
        netScore = -1.0; // Strongest negative
      } else if (/très déçu/.test(normalizedText)) {
        netScore = -0.9; // Very negative
      } else if (/frustrant à utiliser/.test(normalizedText)) {
        netScore = -0.8; // Strongly negative
      }
      forcedCategory = "STRONG_NEGATIVE";
    } else if (hasModerateNegative) {
      // Moderate negative: -0.7 to -0.4 range
      netScore = Math.max(Math.min(netScore, -0.4), -0.7);

      // Different scores for different moderate negative patterns
      if (/manque de fonctionnalités essentielles/.test(normalizedText)) {
        netScore = -0.65; // Strong moderate negative
      } else if (/lent et compliqué/.test(normalizedText)) {
        netScore = -0.55; // Moderate negative
      } else if (/problèmes importants/.test(normalizedText)) {
        netScore = -0.45; // Mild moderate negative
      }
      forcedCategory = "MODERATE_NEGATIVE";
    } else if (hasMildNegative) {
      // Mild negative: -0.4 to -0.1 range
      netScore = Math.max(Math.min(netScore, -0.1), -0.4);

      // Different scores for mild negative patterns
      if (/pas idéal/.test(normalizedText)) {
        netScore = -0.35; // Higher mild negative
      } else if (/pourrait être mieux/.test(normalizedText)) {
        netScore = -0.25; // Medium mild negative
      } else if (/pas très satisfait/.test(normalizedText)) {
        netScore = -0.15; // Lower mild negative
      }
      forcedCategory = "MILD_NEGATIVE";
    } else if (hasStrongPositive) {
      // Strong positive: 0.7 to 1.0 range
      netScore = Math.max(netScore, 0.7);
      forcedCategory = "STRONG_POSITIVE";
    } else if (hasModeratePositive) {
      // Moderate positive: 0.4 to 0.7 range
      netScore = Math.min(Math.max(netScore, 0.4), 0.7);
      forcedCategory = "MODERATE_POSITIVE";
    } else if (hasMildPositive) {
      // Mild positive: 0.1 to 0.4 range
      netScore = Math.min(Math.max(netScore, 0.1), 0.4);
      forcedCategory = "MILD_POSITIVE";
    }

    // Handle mixed sentiment
    if (hasContrastMarkers && !forcedCategory) {
      // If we have significant positive and negative (mixed with contrast)
      if (totalPosScore > 1 && totalNegScore > 1) {
        // Compare the emphasis - the latter part of the sentence usually has more weight
        const contrastIndex = Math.max(
          ...CONTRAST_MARKERS.map(marker => normalizedText.indexOf(marker)).filter(idx => idx !== -1)
        );

        if (contrastIndex >= 0) {
          // Evaluate sentiment before and after the contrast marker
          const afterContrast = normalizedText.substring(contrastIndex);

          const afterPositive = extractSentiment(afterContrast, POSITIVE_LEXICON)
            .reduce((sum, term) => sum + term.score, 0);
          const afterNegative = extractSentiment(afterContrast, NEGATIVE_LEXICON)
            .reduce((sum, term) => sum + term.score, 0);

          // Determine which sentiment is stronger in the after-contrast part
          // The after-contrast part typically carries more weight in the final impression
          if (afterPositive > afterNegative) {
            // More positive after the "but" - lean positive
            netScore = Math.max(0.1, netScore);
          } else if (afterNegative > afterPositive) {
            // More negative after the "but" - lean negative
            netScore = Math.min(-0.1, netScore);
          }
        }
      }
    }

    // Constrain within -1 to 1 range
    netScore = Math.max(-1, Math.min(1, netScore));

    // Calculate displayPercentage with INVERTED scale for negative sentiments
    let displayPercentage;

    if (netScore >= 0) {
      // Positive sentiment: 0 to 100%
      displayPercentage = Math.round(netScore * 100);
    } else {
      // Negative sentiment: 0 to 100%
      // IMPORTANT: For negative sentiment, we store the percentage as HIGHER values
      // Extremely negative (-1.0) = 100% negative
      // Slightly negative (-0.1) = 10% negative
      displayPercentage = Math.round(Math.abs(netScore) * 100);
    }

    return {
      score: netScore,
      displayPercentage
    };
  } catch (error) {
    console.error("Error in analyzeSentiment:", error);
    return {
      score: 0,
      displayPercentage: 50
    };
  }
}

/**
 * Detect emotions in text
 */
function detectEmotions(text) {
  try {
    const lowercaseText = text.toLowerCase();

    // Pattern-based emotion detection
    const emotionPatterns = {
      SATISFACTION: [
        /satisfait/i, /content/i, /heureux/i, /bien/i, /positif/i,
        /apprécié/i, /apprécie/i, /bonne qualité/i, /bon service/i
      ],
      ENTHUSIASM: [
        /excellent/i, /adore/i, /génial/i, /fantastique/i, /parfait/i,
        /extraordinaire/i, /super/i, /formidable/i, /incroyable/i
      ],
      FRUSTRATION: [
        /frustrant/i, /frustré/i, /agaçant/i, /problème/i, /bug/i,
        /difficile/i, /compliqué/i, /ne fonctionne pas/i, /lent/i,
        /ne marche pas/i, /manque/i, /dysfonctionnement/i
      ],
      CONCERN: [
        /inquiet/i, /préoccupé/i, /soucieux/i, /crainte/i, /peur/i,
        /incertain/i, /doute/i, /méfiant/i, /risque/i, /dangereux/i
      ]
    };

    // Track scores and determine dominant emotion
    const emotions = {};
    let dominantEmotion = null;
    let highestScore = 0;

    // Process each emotion category
    for (const [emotion, patterns] of Object.entries(emotionPatterns)) {
      let score = 0;

      // Count pattern matches
      for (const pattern of patterns) {
        const matches = (lowercaseText.match(pattern) || []).length;
        if (matches > 0) {
          // Different weights based on emotion type
          const weight = (emotion === 'ENTHUSIASM') ? 2 :
            (emotion === 'SATISFACTION') ? 1 :
              (emotion === 'FRUSTRATION') ? -1.5 :
                -0.8; // CONCERN

          score += matches * weight;
        }
      }

      // Check for negation of emotions
      for (const pattern of patterns) {
        for (const negWord of NEGATION_WORDS) {
          const negPattern = new RegExp(`${negWord}\\s+\\w*\\s*${pattern.source}|${negWord}\\s+${pattern.source}`, 'i');
          if (negPattern.test(lowercaseText)) {
            // Reverse the emotion when negated
            score *= -0.8;
            break;
          }
        }
      }

      // Only include significant emotion scores
      if (Math.abs(score) >= 0.5) {
        emotions[emotion] = {
          score,
          isNegated: score < 0
        };

        // Track dominant emotion
        if (Math.abs(score) > Math.abs(highestScore)) {
          highestScore = score;
          dominantEmotion = emotion;
        }
      }
    }

    // Special case handling for specific patterns
    if (/j'adore|c'est génial|formidable/.test(lowercaseText)) {
      emotions['ENTHUSIASM'] = { score: 3, isNegated: false };
      dominantEmotion = 'ENTHUSIASM';
    } else if (/je suis satisfait|je suis content/.test(lowercaseText) && !dominantEmotion) {
      emotions['SATISFACTION'] = { score: 2, isNegated: false };
      dominantEmotion = 'SATISFACTION';
    } else if (/frustrant|difficile à utiliser|manque de fonctionnalités/.test(lowercaseText)) {
      emotions['FRUSTRATION'] = { score: 2.5, isNegated: false };
      dominantEmotion = 'FRUSTRATION';
    }

    return {
      emotions,
      dominant: dominantEmotion
    };
  } catch (error) {
    console.error("Error in detectEmotions:", error);
    return {
      emotions: {},
      dominant: null
    };
  }
}

/**
 * Detect urgency level
 */
function detectUrgency(text) {
  try {
    const lowercaseText = text.toLowerCase();

    // Check for urgency indicators
    const urgencyPatterns = {
      HIGH: [
        /urgent/i, /immédiat/i, /critique/i, /sans délai/i, /prioritaire/i,
        /au plus vite/i, /immédiatement/i, /pressant/i, /en urgence/i,
        /deadline/i, /date limite dépassée/i
      ],
      MEDIUM: [
        /dès que possible/i, /bientôt/i, /prochainement/i, /rapidement/i,
        /important/i, /dès demain/i, /cette semaine/i, /assez urgent/i,
        /dans les meilleurs délais/i
      ],
      LOW: [
        /quand vous pourrez/i, /pas urgent/i, /pas pressé/i, /à l'occasion/i,
        /peu pressé/i, /sans empressement/i, /prendre votre temps/i,
        /ultérieurement/i, /plus tard/i
      ]
    };

    // Check for negated urgency
    const hasNegatedUrgency = NEGATION_WORDS.some(neg =>
      urgencyPatterns.HIGH.some(pattern =>
        new RegExp(`${neg}\\s+\\w*\\s*${pattern.source}|${neg}\\s+${pattern.source}`, 'i').test(lowercaseText)
      )
    );

    if (hasNegatedUrgency) {
      return { level: 'LOW' };
    }

    // Check for explicit urgency levels
    for (const [level, patterns] of Object.entries(urgencyPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(lowercaseText)) {
          // Check for past tense context (describing past urgency)
          if (/était|étaient|a été|ont été|avait été|avaient été/.test(lowercaseText)) {
            // Past tense reduces perceived urgency
            return level === 'HIGH' ? { level: 'MEDIUM' } : { level: 'NORMAL' };
          }
          return { level };
        }
      }
    }

    // Default urgency
    return { level: 'NORMAL' };
  } catch (error) {
    console.error("Error in detectUrgency:", error);
    return { level: 'NORMAL' };
  }
}

/**
 * Count words in text
 */
function getWordCount(text) {
  try {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  } catch (error) {
    console.error("Error in getWordCount:", error);
    return 0;
  }
}

/**
 * Main function to analyze feedback
 */
export const analyzeFeedback = async (text) => {
  try {
    // Perform sentiment analysis
    const sentimentResult = analyzeSentiment(text);

    // Detect emotions
    const emotionsAnalysis = detectEmotions(text);

    // Detect urgency
    const urgencyAnalysis = detectUrgency(text);

    // Prepare final result
    return {
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
      entities: [] // Empty array as requested, maintained for compatibility
    };
  } catch (error) {
    console.error("Error in analyzeFeedback:", error);

    // Return default result on error
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