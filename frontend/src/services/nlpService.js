// src/services/nlpService.js

// Enhanced French sentiment analysis without external dependencies

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
    'qualité': 2,
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
    // Additional positive words
    'valeur': 2,
    'ajoutée': 2,
    'expertise': 3,
    'démontré': 2,
    'démontrée': 2,
    'capacité': 2,
    'comprendre': 2,
    'solutions': 2,
    'adaptées': 2,
    'réelle': 2,
    'partenariat': 1,
    'transparence': 2,
    'spécifiques': 1,
    'réactivité': 3,
    'professionnels': 2,
    'professionnelles': 2,
    'satisfaction': 3,
    'satisfaite': 3,
    'disponibilité': 3,
    'professionnalisme': 3,
    'connaissance': 2,
    'approfondie': 2,
    'atout': 3,
    'atouts': 3,
    'précieux': 3,
    'écoute': 2,
    'attentive': 2,
    'sait': 1,
    'anticiper': 2,
    'besoins': 1,
    'précis': 2,
    'précise': 2,
    'compétent': 3,
    'compétente': 3,
    'attentif': 2,
    'disponible': 2,
    'réactif': 3,
    'réactive': 3,
    'constructif': 2,
    'constructive': 2,
    'innovant': 2,
    'innovante': 2,
    'sérieux': 2,
    'sérieuse': 2,
    'proactif': 3,
    'proactive': 3,
    'rentable': 2,
    'engagement': 2,
    'fidèle': 2,
    'pertinent': 2,
    'pertinente': 2,
    'performant': 3,
    'performante': 3,
    'abordable': 2,
    'bénéfique': 2,
    'avantage': 2,
    'avantages': 2,
    'gagnant': 2,
    'convivial': 2,
    'conviviale': 2,
    'intuitif': 2,
    'intuitive': 2,
    'amélioration': 1,
    'professionnel': 2,
    'professionnelle': 2,
    'satisfaisant': 2,
    'satisfaisante': 2,
    'personnalisé': 2,
    'personnalisée': 2,
    'fidélité': 2,
    'ponctuel': 2,
    'ponctuelle': 2,
    'respect': 2,
    'respectueux': 2,
    'respectueuse': 2,
    'confiance': 2,
    'crédible': 2,
    'accessible': 2,
    'cohérent': 2,
    'cohérente': 2,
    'idéal': 3,
    'idéale': 3,
    'impeccable': 3,
    'adapté': 2,
    'adaptée': 2,
    'progresser': 1,
    'progressé': 1,
    'appréciable': 2,
    'pertinence': 2,
    'adéquat': 2,
    'adéquate': 2,
    'approprié': 2,
    'appropriée': 2,
    'enrichissant': 2,
    'enrichissante': 2,
    'fluide': 2,
    'harmonieux': 2,
    'harmonieuse': 2,
    'optimal': 3,
    'optimale': 3,
    'recommander': 3,
    'recommande': 3,
    'bienveillant': 2,
    'bienveillante': 2,
    'accomplissement': 2,
    'soigné': 2,
    'soignée': 2,
    'attrayant': 2,
    'attrayante': 2,
    'avantageux': 2,
    'avantageuse': 2,
    'stratégique': 1,
    'dynamique': 2,
    'enthousiaste': 3,
    'prometteur': 2,
    'prometteuse': 2,
    'fiabilité': 2,
    
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
    'plantage': -3,
    // Additional negative words
    'inadéquat': -2,
    'inadéquate': -2,
    'inadapté': -2,
    'inadaptée': -2,
    'insuffisant': -2,
    'insuffisante': -2,
    'améliorer': -1,
    'néanmoins': -1, // Signal for criticism following positive statement
    'cependant': -1,
    'toutefois': -1,
    'pourrait': -0.5, // Often introduces suggestions for improvement
    'pourraient': -0.5,
    'serait': -0.5,
    'seraient': -0.5,
    'plus courts': -1, // Implies current times are too long
    'plus efficace': -0.5, // Implies current efficiency could be better
    'plus régulière': -0.5, // Implies current regularity is insufficient
    'défaillant': -3,
    'défaillante': -3,
    'insupportable': -4,
    'inacceptable': -3,
    'désastreux': -4,
    'désastreuse': -4,
    'catastrophique': -4,
    'décevant': -3,
    'décevante': -3,
    'frustrant': -2,
    'frustrante': -2,
    'difficultés': -2,
    'complexe': -1,
    'contraignant': -2,
    'contraignante': -2,
    'inefficace': -2,
    'inefficience': -2,
    'obsolète': -2,
    'démodé': -1,
    'démodée': -1,
    'vieillot': -1,
    'vieillotte': -1,
    'ambigu': -1,
    'ambiguë': -1,
    'confusant': -2,
    'confusante': -2,
    'imprécis': -2,
    'imprécise': -2,
    'manque': -2,
    'manquant': -2,
    'manquante': -2,
    'dysfonctionne': -3,
    'dysfonctionnement': -3,
    'anomalie': -2,
    'délai': -1,
    'retard': -2,
    'bizarre': -1,
    'étrange': -1,
    'incohérent': -2,
    'incohérente': -2,
    'instable': -2,
    'fragile': -2,
    'risqué': -2,
    'risquée': -2,
    'dangereux': -3,
    'dangereuse': -3,
    'suspect': -2,
    'suspecte': -2,
    'échec': -3,
    'déclin': -2,
    'dégradation': -2,
    'dégradé': -2,
    'dégradée': -2,
    'insatisfaisant': -2,
    'insatisfaisante': -2,
    'dispendieux': -2,
    'dispendieuse': -2,
    'coûteux': -2,
    'coûteuse': -2,
    'cher': -1,
    'chère': -1,
    'laborieux': -2,
    'laborieuse': -2,
    'fastidieux': -2,
    'fastidieuse': -2,
    'embarrassant': -2,
    'embarrassante': -2,
    'honteux': -3,
    'honteuse': -3,
    'maladroit': -2,
    'maladroite': -2,
    'inapproprié': -2,
    'inappropriée': -2,
    'inconvénient': -2,
    'irrégulier': -2,
    'irrégulière': -2,
    'superficiel': -2,
    'superficielle': -2,
    'monotone': -1,
    'rigide': -2,
    'inflexible': -2,
    'insécurité': -2,
    'négligence': -3,
    'négligent': -3,
    'négligente': -3,
    'agacement': -2,
    'gêne': -2,
    'gênant': -2,
    'gênante': -2,
    'désordonné': -1,
    'désordonnée': -1,
    'chaos': -3,
    'chaotique': -3,
};

// French negation words
const NEGATION_WORDS = ['ne', 'pas', 'plus', 'jamais', 'aucun', 'aucune', 'non', 'sans', 'ni', 'personne', 'rien', 'nullement', 'guère'];

// French intensifier words - these amplify sentiment
const INTENSIFIER_WORDS = [
    'très', 'vraiment', 'extrêmement', 'particulièrement', 'totalement', 
    'complètement', 'absolument', 'tout à fait', 'fortement', 'hautement',
    'énormément', 'remarquablement', 'exceptionnellement', 'incroyablement',
    'terriblement', 'considérablement', 'profondément', 'intensément',
    'immensément', 'radicalement', 'vivement', 'puissamment',
    'parfaitement', 'pleinement', 'entièrement'
];

// French downtoner words - these reduce sentiment
const DOWNTONER_WORDS = [
    'un peu', 'légèrement', 'modérément', 'assez', 'relativement', 'plutôt',
    'partiellement', 'quelque peu', 'moyennement', 'vaguement', 'à peine',
    'presque', 'passablement', 'approximativement', 'sensiblement'
];


// Split text into sentences for more accurate analysis
const splitIntoSentences = (text) => {
  // Handle multiple punctuation patterns for sentence splitting including French patterns
  return text.replace(/([.!?])\s*(?=[A-Za-zÀ-ÖØ-öø-ÿ])/g, "$1|").split("|").filter(s => s.trim().length > 0);
};


// Improved sentiment analysis function with contextual awareness
const analyzeSentiment = (text) => {
  try {
    // Basic text preprocessing
    const lowercaseText = text.toLowerCase();
    
    // Check for explicit satisfaction statements that should override other sentiment
    const explicitPositivePhrases = [
      'je suis satisfait', 'nous sommes satisfaits', 'je suis content', 
      'nous sommes contents', 'je suis heureux', 'nous sommes heureux',
      'je suis très satisfait', 'globalement satisfait', 'globalement, je suis satisfait'
    ];
    
    const explicitNegativePhrases = [
      'je ne suis pas satisfait', 'nous ne sommes pas satisfaits', 'je suis mécontent',
      'nous sommes mécontents', 'je suis déçu', 'nous sommes déçus',
      'je suis très déçu', 'globalement insatisfait', 'globalement, je suis déçu'
    ];
    
    let hasExplicitPositive = explicitPositivePhrases.some(phrase => lowercaseText.includes(phrase));
    let hasExplicitNegative = explicitNegativePhrases.some(phrase => lowercaseText.includes(phrase));
    
    // Split into sentences for better analysis
    const sentences = splitIntoSentences(lowercaseText);
    let overallScore = 0;
    let totalWordHits = 0;
    let sentenceScores = [];
    
    // Detect if this is an improvement suggestion question vs a satisfaction question
    const isImprovementQuestion = lowercaseText.includes('améliorer') || 
                               lowercaseText.includes('points à améliorer') ||
                               lowercaseText.includes('points d\'amélioration') ||
                               lowercaseText.includes('suggestions d\'amélioration');
    
    // Process each sentence separately
    sentences.forEach(sentence => {
      const words = sentence.split(/\s+/).filter(word => word.length > 0);
      let sentenceScore = 0;
      let sentenceWordHits = 0;
      
      // Identify negation spans in this sentence
      const negationSpans = [];
      for (let i = 0; i < words.length; i++) {
        if (NEGATION_WORDS.some(negWord => words[i].includes(negWord))) {
          // A negation word affects the next 4 words
          negationSpans.push({start: i, end: i + 4});
        }
      }
      
      // Identify intensifier locations
      const intensifierPositions = [];
      words.forEach((word, index) => {
        if (INTENSIFIER_WORDS.some(intensifier => word.includes(intensifier))) {
          intensifierPositions.push(index);
        }
      });
      
      // Identify downtoner locations
      const downtonePositions = [];
      words.forEach((word, index) => {
        if (DOWNTONER_WORDS.some(downtoner => word.includes(downtoner))) {
          downtonePositions.push(index);
        }
      });
      
      // Process each word in the sentence
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        // Clean the word from punctuation for better matching
        const cleanWord = word.replace(/[.,!?;:]/g, '');
        
        let wordSentiment = FRENCH_SENTIMENT_LEXICON[cleanWord];
        
        if (wordSentiment !== undefined) {
          let sentimentMultiplier = 1;
          
          // Check if this word is in a negation span
          let isNegated = false;
          for (const span of negationSpans) {
            if (i > span.start && i <= span.end) {
              isNegated = true;
              break;
            }
          }
          
          // Check if this word is affected by an intensifier (word that comes before)
          const isIntensified = intensifierPositions.some(pos => Math.abs(pos - i) === 1);
          if (isIntensified) {
            sentimentMultiplier = 1.5;
          }
          
          // Check if this word is affected by a downtoner (word that comes before)
          const isDowntoned = downtonePositions.some(pos => Math.abs(pos - i) === 1);
          if (isDowntoned) {
            sentimentMultiplier = 0.5;
          }
          
          // Apply sentiment with proper adjustments
          if (isNegated) {
            sentenceScore -= wordSentiment * sentimentMultiplier;
          } else {
            sentenceScore += wordSentiment * sentimentMultiplier;
          }
          
          sentenceWordHits++;
        }
      }
      
      // Handle common phrases in this sentence
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
        { pattern: /je n'aime pas/, score: -2 },
        // Additional common phrases
        { pattern: /valeur ajoutée/, score: 3 },
        { pattern: /capacité à comprendre/, score: 3 },
        { pattern: /solutions adaptées/, score: 3 },
        { pattern: /réelle valeur/, score: 3 },
        { pattern: /qualité des/, score: 2 },
        { pattern: /j'apprécie/, score: 3 },
        { pattern: /nous apprécions/, score: 3 },
        { pattern: /particulièrement (apprécié|satisfait)/, score: 3 },
        { pattern: /très (satisfait|content)/, score: 3 },
        { pattern: /parfaitement (adapté|adaptée)/, score: 3 },
        { pattern: /expertise démontrée/, score: 3 },
        { pattern: /transparence dans la communication/, score: 3 },
        { pattern: /besoins spécifiques/, score: 1 },
        { pattern: /comprendre nos besoins/, score: 3 },
        { pattern: /relations professionnelles/, score: 2 },
        { pattern: /échanges professionnels/, score: 2 },
        { pattern: /grand merci/, score: 3 },
        { pattern: /très satisfait/, score: 4 },
        { pattern: /pas satisfait/, score: -3 },
        { pattern: /ne fonctionne pas/, score: -3 },
        { pattern: /ne marche pas/, score: -3 },
        { pattern: /ne répond pas/, score: -3 },
        { pattern: /temps de réponse/, score: 0 }, // Neutral unless modified
        { pattern: /rapidité de/, score: 2 },
        { pattern: /lenteur de/, score: -2 },
        { pattern: /manque de/, score: -2 },
        { pattern: /absence de/, score: -2 },
        { pattern: /défaut de/, score: -2 },
        { pattern: /avantages de/, score: 2 },
        { pattern: /bénéfices de/, score: 2 },
        { pattern: /points forts/, score: 2 },
        { pattern: /points faibles/, score: -2 },
        { pattern: /forces de/, score: 2 },
        { pattern: /faiblesses de/, score: -2 },
        { pattern: /atouts de/, score: 2 },
        { pattern: /problèmes de/, score: -2 },
        { pattern: /difficultés avec/, score: -2 },
        { pattern: /facilité d'utilisation/, score: 3 },
        { pattern: /difficulté d'utilisation/, score: -3 },
        { pattern: /simple à utiliser/, score: 3 },
        { pattern: /compliqué à utiliser/, score: -3 },
        { pattern: /rapport qualité(-| )prix/, score: 1 }, // Neutral unless modified
        { pattern: /bon rapport qualité(-| )prix/, score: 3 },
        { pattern: /mauvais rapport qualité(-| )prix/, score: -3 },
        { pattern: /excellent rapport qualité(-| )prix/, score: 4 },
        { pattern: /service client/, score: 0 }, // Neutral unless modified
        { pattern: /excellent service client/, score: 4 },
        { pattern: /bon service client/, score: 3 },
        { pattern: /mauvais service client/, score: -3 },
        { pattern: /service après(-| )vente/, score: 0 }, // Neutral unless modified
        { pattern: /à améliorer/, score: -1 },
        { pattern: /peut mieux faire/, score: -1 },
        { pattern: /laisse à désirer/, score: -2 },
        { pattern: /s'est amélioré/, score: 2 },
        { pattern: /s'est dégradé/, score: -2 },
        { pattern: /a progressé/, score: 2 },
        { pattern: /a régressé/, score: -2 },
      ];
      
      for (const phrase of phrases) {
        if (phrase.pattern.test(sentence)) {
          sentenceScore += phrase.score;
          sentenceWordHits++;
        }
      }
      
      // Store this sentence's score if it had sentiment words
      if (sentenceWordHits > 0) {
        sentenceScores.push({
          score: sentenceScore,
          hits: sentenceWordHits,
          text: sentence
        });
        
        overallScore += sentenceScore;
        totalWordHits += sentenceWordHits;
      }
    });
    
    // Calculate final score with context awareness and balanced weighting
    let finalScore;
    if (totalWordHits > 0) {
      // If we have multiple sentences with sentiment, give more weight to the last ones
      if (sentenceScores.length > 1) {
        // Give 1.5x weight to the last sentence that had sentiment
        const lastSentenceWithSentiment = sentenceScores[sentenceScores.length - 1];
        overallScore += lastSentenceWithSentiment.score * 0.5; // Extra 50% weight
        totalWordHits += lastSentenceWithSentiment.hits * 0.5;
      }
      
      // Handle explicit satisfaction statements - they should strongly influence the result
      if (hasExplicitPositive && !hasExplicitNegative) {
        // Boost the positive score, but still allow for some negativity
        overallScore = Math.max(overallScore, totalWordHits * 0.5);
      } else if (hasExplicitNegative && !hasExplicitPositive) {
        // Boost the negative score, but still allow for some positivity
        overallScore = Math.min(overallScore, -totalWordHits * 0.5);
      }
      
      // Adjust for improvement questions - these naturally have more negative terms
      // but shouldn't be interpreted as negative sentiment
      if (isImprovementQuestion) {
        // Reduce the impact of improvement suggestions in an improvement question context
        overallScore = overallScore * 0.5 + totalWordHits * 0.5;
      }
      
      // Normalize based on sentence length - longer texts shouldn't get extreme scores as easily
      const normalizationFactor = Math.log10(totalWordHits + 1) * 2;
      finalScore = Math.tanh(overallScore / normalizationFactor);
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
    
    // Apply minimum thresholds for explicit satisfaction statements
    if (hasExplicitPositive && !hasExplicitNegative && finalScore < 0.3) {
      finalScore = Math.max(finalScore, 0.3); // Ensure minimum positivity with explicit satisfaction
    } else if (hasExplicitNegative && !hasExplicitPositive && finalScore > -0.3) {
      finalScore = Math.min(finalScore, -0.3); // Ensure minimum negativity with explicit dissatisfaction
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

// Emotion patterns - enhanced with context awareness
const EMOTIONS = {
  SATISFACTION: {
    patterns: [
      'satisfait', 'content', 'heureux', 'ravi', 'excellent',
      'enchanté', 'comblé', 'réjoui', 'conquis', 'impressionné',
      'reconnaissant', 'agréable', 'favorable', 'positif', 'apprécié',
      'épanoui', 'serein', 'gratifié', 'optimiste', 'confiant', 'qualité',
      'apprécie', 'apprécions', 'valeur', 'ajoutée', 'confortable',
      'confiance', 'facile', 'simple', 'pratique', 'utile', 'efficace',
      'efficient', 'fiable', 'stable', 'intéressant', 'recommande',
      'recommandable', 'adéquat', 'adapté', 'solide', 'robuste',
      'avantage', 'bénéfice', 'atout', 'force', 'progrès', 'amélioration',
      'plaisir', 'joie', 'satisfaction', 'contentement', 'convivial',
      'intuitive', 'clair', 'approprié', 'pertinent', 'opportun',
      'progresser', 'performant', 'rentable', 'économique', 'fluide',
      'harmonieux', 'cohérent', 'consistant', 'soutien', 'assistance',
      'sympathique', 'attentionné', 'attentif', 'réactif', 'ponctuel',
      'à temps', 'disponible', 'accessible', 'professionnel'
    ],
    weight: 1
  },
  FRUSTRATION: {
    patterns: [
      'frustré', 'déçu', 'mécontent', 'agacé', 'difficile',
      'contrarié', 'insatisfait', 'énervé', 'irrité', 'excédé',
      'exaspéré', 'fâché', 'furieux', 'dépité', 'découragé',
      'désappointé', 'désemparé', 'ennuyé', 'tendu', 'stressé',
      'problème', 'problèmes', 'erreur', 'erreurs', 'défaut',
      'défauts', 'bug', 'bugs', 'dysfonctionnement', 'panne',
      'plantage', 'échec', 'mauvais', 'inadéquat', 'inadapté',
      'inefficace', 'inutile', 'médiocre', 'décevant', 'insupportable',
      'inacceptable', 'manque', 'absence', 'insuffisant', 'défaillant',
      'catastrophique', 'désastreux', 'terrible', 'horrible', 'affreux',
      'pénible', 'embêtant', 'gênant', 'agaçant', 'irritant',
      'disfonctionnement', 'lent', 'lenteur', 'retard', 'délai',
      'compliqué', 'complexe', 'confus', 'impraticable', 'incommode',
      'coûteux', 'onéreux', 'cher', 'dispendieux', 'démodé',
      'obsolète', 'vieux', 'archaïque', 'inflexible', 'rigide',
      'contraignant', 'restrictif', 'laborieux', 'fastidieux'
    ],
    weight: -1
  },
  ENTHUSIASM: {
    patterns: [
      'génial', 'extraordinaire', 'fantastique', 'parfait',
      'exceptionnel', 'incroyable', 'remarquable', 'formidable',
      'superbe', 'magnifique', 'merveilleux', 'impressionnant',
      'brillant', 'spectaculaire', 'fabuleux', 'sensationnel',
      'phénoménal', 'époustouflant', 'stupéfiant', 'éblouissant',
      'splendide', 'grandiose', 'sublime', 'excellent', 'adore',
      'passionné', 'passionnant', 'excité', 'fou de', 'emballé',
      'enthousiaste', 'enchanté', 'ravi', 'comblé', 'fasciné',
      'captivé', 'exalté', 'super', 'top', 'hyper', 'ultra',
      'méga', 'extra', 'absolument', 'totalement', 'complètement',
      'vraiment', 'terriblement', 'extrêmement', 'incroyablement',
      'étonnamment', 'remarquablement', 'réellement', 'véritablement',
      'idéal', 'impeccable', 'irréprochable', 'parfait', 'sans faille',
      'sans défaut', 'sans reproche', 'bravo', 'félicitations',
      'chapeau', 'respect', 'admiration', 'ébahi', 'émerveillé'
    ],
    weight: 2
  },
  CONCERN: {
    patterns: [
      'inquiet', 'préoccupé', 'soucieux', 'craintif',
      'anxieux', 'alarmé', 'troublé', 'perturbé', 'dérangé',
      'tracassé', 'incertain', 'hésitant', 'méfiant', 'dubitatif',
      'appréhensif', 'tourmenté', 'angoissé', 'nerveux', 'agité',
      'peur', 'crainte', 'doute', 'méfiance', 'suspicion',
      'appréhension', 'incertitude', 'hésitation', 'réserve',
      'prudence', 'précaution', 'vigilance', 'alerte', 'garde',
      'risque', 'danger', 'menace', 'insécurité', 'vulnérabilité',
      'fragilité', 'instabilité', 'problématique', 'inquiétant',
      'alarmant', 'préoccupant', 'menaçant', 'effrayant', 'intimidant',
      'suspect', 'douteux', 'ambigu', 'équivoque', 'ambigu',
      'flou', 'vague', 'imprécis', 'trouble', 'confus',
      'perplexe', 'embarrassé', 'empêtré', 'embrouillé', 'embêté',
      'ennuyé', 'décontenancé', 'désemparé', 'désorganisé',
      'désorienté', 'perdu', 'confus', 'perplexe', 'indécis'
    ],
    weight: -0.5
  },
  TRUST: {
    patterns: [
      'confiance', 'fiable', 'sûr', 'certain', 'sécurisé',
      'sécurisant', 'fiabilité', 'honnête', 'honnêteté', 'intègre',
      'intégrité', 'transparent', 'transparence', 'sincère',
      'sincérité', 'authentique', 'authenticité', 'véritable',
      'vrai', 'loyal', 'loyauté', 'fidèle', 'fidélité',
      'engagé', 'engagement', 'crédible', 'crédibilité',
      'comptable', 'responsable', 'responsabilité', 'solide',
      'solidité', 'stable', 'stabilité', 'constant', 'constance',
      'cohérent', 'cohérence', 'prévisible', 'fiabilité',
      'sécurité', 'assurance', 'conviction', 'conviction',
      'foi', 'espoir', 'espérance', 'optimisme', 'certain',
      'convaincu', 'persuadé', 'assuré', 'rassuré', 'tranquille',
      'serein', 'paisible', 'calme', 'confiant', 'sûr de soi'
    ],
    weight: 1.5
  },
  IMPATIENCE: {
    patterns: [
      'impatient', 'pressé', 'pressant', 'urgent', 'hâte',
      'attendre', 'attente', 'délai', 'retard', 'tardif',
      'lent', 'lenteur', 'long', 'longueur', 'traîner',
      'traînant', 'interminable', 'éternel', 'sans fin',
      'n\'en plus pouvoir', 'à bout', 'énervé', 'irrité',
      'agacé', 'exaspéré', 'frustré', 'rapidement', 'vite',
      'immédiatement', 'tout de suite', 'sans délai', 'sans attendre',
      'au plus vite', 'dès que possible', 'promptement', 'prestement',
      'vivement', 'expéditivement', 'célérité', 'instantanément',
      'sur-le-champ', 'incessamment', 'précipitamment', 'urgemment',
      'sans tarder', 'fébrilement', 'frénétiquement', 'impatiemment',
      'bouillant', 'fébrile', 'frénétique', 'empressé', 'excité'
    ],
    weight: -0.5
  }
};

// Detect emotions in text with improved context awareness
const detectEmotions = (text) => {
  try {
    const lowercaseText = text.toLowerCase();
    const detectedEmotions = {};
    let dominantEmotion = null;
    let maxScore = 0;
    
    // Detect if text is an improvement suggestion vs a satisfaction statement
    const isImprovementContext = lowercaseText.includes('améliorer') || 
                               lowercaseText.includes('points à améliorer') ||
                               lowercaseText.includes('points d\'amélioration') ||
                               lowercaseText.includes('suggestions') ||
                               lowercaseText.includes('problèmes') ||
                               lowercaseText.includes('difficultés');
    
    // Split text into sentences for more accurate analysis
    const sentences = splitIntoSentences(lowercaseText);
    
    // Process each sentence separately
    sentences.forEach(sentence => {
      const words = sentence.split(/\s+/).filter(word => word.length > 0);
      
      // Find negation words in the sentence
      const negationIndices = words
        .map((word, index) => NEGATION_WORDS.some(negWord => word.includes(negWord)) ? index : -1)
        .filter(index => index !== -1);
      
      // Check for self-referential indicators (je, nous, mon, notre, etc.)
      const selfReferential = ['je', 'j\'', 'nous', 'mon', 'ma', 'mes', 'notre', 'nos']
        .some(pronoun => words.some(word => word === pronoun || word.startsWith(pronoun + ' ')));
      
      // Process each emotion type
      Object.entries(EMOTIONS).forEach(([emotion, data]) => {
        // Reset emotion score for this sentence
        let emotionScore = 0;
        
        // Check for each emotion pattern in this sentence
        data.patterns.forEach(pattern => {
          // Find all instances of this pattern in the words
          const patternIndices = words
            .map((word, index) => word.includes(pattern) ? index : -1)
            .filter(index => index !== -1);
          
          patternIndices.forEach(patternIndex => {
            // Start with the base weight
            let weight = data.weight;
            
            // Check for negation - look within 3 words before the emotion word
            const hasNegation = negationIndices.some(negIndex => 
              negIndex < patternIndex && patternIndex - negIndex <= 3
            );
            
            // Check for intensifiers near the emotion word
            const hasIntensifier = words
              .slice(Math.max(0, patternIndex - 2), patternIndex)
              .some(word => INTENSIFIER_WORDS.some(intensifier => word.includes(intensifier)));
            
            // Check for downtoners near the emotion word
            const hasDowntoner = words
              .slice(Math.max(0, patternIndex - 2), patternIndex)
              .some(word => DOWNTONER_WORDS.some(downtoner => word.includes(downtoner)));
            
            // Modify weight based on negation
            if (hasNegation) {
              weight = -weight;
            }
            
            // Modify weight based on intensifiers and downtoners
            if (hasIntensifier) {
              weight *= 1.5;
            } else if (hasDowntoner) {
              weight *= 0.5;
            }
            
            // For positive emotions, boost weight if it's self-referential
            if ((emotion === 'SATISFACTION' || emotion === 'ENTHUSIASM' || emotion === 'TRUST') && selfReferential) {
              weight *= 1.5;
            }
            
            // For negative emotions, reduce weight if not self-referential
            // (talking about problems is less significant than having problems)
            if ((emotion === 'FRUSTRATION' || emotion === 'CONCERN' || emotion === 'IMPATIENCE') && !selfReferential) {
              weight *= 0.7;
            }
            
            // In improvement suggestion contexts, frustration should be detected more readily
            // since constructive criticism often comes from mild frustration
            if (emotion === 'FRUSTRATION' && isImprovementContext) {
              weight *= 1.5;
            }
            
            // Add weighted score to emotion total
            emotionScore += weight;
          });
        });
        
        // If we detected this emotion in this sentence
        if (emotionScore !== 0) {
          // Add to overall emotion score
          detectedEmotions[emotion] = detectedEmotions[emotion] || { score: 0, isNegated: false };
          detectedEmotions[emotion].score += emotionScore;
          detectedEmotions[emotion].isNegated = emotionScore < 0;
          
          // Update dominant emotion if needed
          if (Math.abs(detectedEmotions[emotion].score) > Math.abs(maxScore)) {
            maxScore = detectedEmotions[emotion].score;
            dominantEmotion = emotion;
          }
        }
      });
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

// Define urgency patterns with better context awareness
const URGENCY_PATTERNS = {
  HIGH: {
    // Phrases that typically indicate actual high urgency
    direct_request: [
      'urgent', 'immédiat', 'critique', 'au plus vite',
      'sans délai', 'pressant', 'prioritaire',
      'impératif', 'crucial', 'sans attendre', 'imminent',
      'en urgence', 'capital', 'extrêmement pressé',
      'deadline', 'date butoir', 'date limite', 'délai dépassé',
      'retard important', 'situation critique', 'immédiatement'
    ],
    // Phrases that when preceded by 'je/nous' actually indicate urgency
    with_subject: [
      'besoin rapidement', 'nécessite immédiatement', 'demande urgemment',
      'requiert au plus vite', 'exige sans délai', 'attends avec urgence',
      'ai besoin maintenant', 'avons besoin maintenant', 'demande expressément',
      'vous prie urgemment', 'sollicite immédiatement', 'pouvoir obtenir rapidement',
      'avoir une réponse immédiate', 'réclame rapidement', 'besoin de résolution immédiate'
    ]
  },
  MEDIUM: {
    direct_request: [
      'dès que possible', 'bientôt', 'prochainement',
      'sous peu', 'dans les meilleurs délais',
      'assez urgent', 'relativement pressé', 'promptement',
      'rapidement', 'vite', 'prestement', 'sans trop tarder',
      'aussitôt que possible', 'dans un délai raisonnable',
      'à court terme', 'proche avenir', 'dès demain',
      'dans la semaine', 'cette semaine', 'important'
    ],
    with_subject: [
      'apprécierais bientôt', 'voudrais prochainement',
      'souhaite rapidement', 'aimerais dès que possible',
      'ai besoin bientôt', 'avons besoin prochainement',
      'compte sur une réponse rapide', 'espère une action prochaine',
      'voudrais recevoir bientôt', 'espère obtenir rapidement',
      'attends avec impatience', 'serais reconnaissant d\'avoir rapidement'
    ]
  },
  LOW: {
    direct_request: [
      'quand possible', 'pas urgent', 'à l\'occasion',
      'peu pressé', 'sans empressement', 'tranquillement',
      'progressivement', 'doucement', 'calmement',
      'à votre convenance', 'lorsque vous aurez le temps',
      'prendre votre temps', 'pas de précipitation', 'en temps voulu',
      'quand vous pourrez', 'à long terme', 'un jour',
      'éventuellement', 'ultérieurement', 'plus tard', 'un de ces jours',
      'sans stress', 'quand bon vous semble', 'sans contrainte de temps'
    ],
    with_subject: [
      'ne suis pas pressé', 'pouvons attendre', 'n\'est pas urgent pour nous',
      'avons le temps', 'n\'est pas prioritaire', 'peut attendre',
      'pas d\'urgence', 'pas de rush', 'patience', 'comprends que cela prendra du temps',
      'accepte le délai normal', 'pas besoin de se précipiter'
    ]
  }
};

// Context indicators for urgency analysis
const URGENCY_CONTEXT = {
  descriptive: [
    // Patterns indicating the person is describing situations rather than making urgent requests
    'apprécier', 'valoriser', 'reconnaître', 'aimer', 'préférer',
    'j\'apprécie', 'nous apprécions', 'j\'aime', 'nous aimons',
    'je valorise', 'nous valorisons', 'je reconnais', 'nous reconnaissons',
    'une qualité que j\'apprécie', 'ce que j\'aime', 'un aspect que je valorise',
    'mentionner', 'décrire', 'souligner', 'noter', 'observer',
    'évoquer', 'parler de', 'faire référence à', 'citer', 'énoncer',
    'il y a', 'c\'est', 'ce sont', 'était', 'étaient', 'furent',
    'a été', 'ont été', 'lors de', 'pendant', 'durant', 'au cours de',
    'en cas de', 'face à', 'confronté à', 'dans le cadre de',
    'situation', 'contexte', 'circonstance', 'scénario', 'cas',
    'exemple', 'illustration', 'démonstration', 'preuve'
  ],
  appreciation: [
    // Patterns indicating appreciation of promptness rather than requesting it
    'merci pour votre', 'merci de votre', 'j\'apprécie votre', 'nous apprécions votre',
    'reconnaissant pour votre', 'satisfait de votre', 'content de votre',
    'impressionné par votre', 'heureux de votre', 'agréablement surpris par votre',
    'réactivité', 'promptitude', 'rapidité', 'célérité', 'diligence',
    'efficacité', 'ponctualité', 'prompte réponse', 'action rapide',
    'intervention rapide', 'réponse rapide', 'traitement rapide',
    'apprécions particulièrement', 'valeur ajoutée', 'point fort',
    'atout majeur', 'qualité remarquable', 'grande force'
  ],
  negation: [
    // Terms that might negate urgency
    'ne pas être urgent', 'ne pas être pressé', 'pas urgent', 'pas pressé',
    'pas pressant', 'pas important', 'pas critique', 'pas prioritaire',
    'peut attendre', 'pourra attendre', 'pourrait attendre',
    'sans urgence', 'sans caractère urgent', 'sans importance',
    'faible priorité', 'basse priorité', 'moindre importance'
  ],
  past_reference: [
    // References to past situations that no longer require urgency
    'a été', 'ont été', 'était', 'étaient', 'fut', 'furent',
    'avait été', 'avaient été', 'dans le passé', 'précédemment',
    'auparavant', 'antérieurement', 'autrefois', 'jadis', 'naguère',
    'historiquement', 'traditionnellement', 'habituellement',
    'à l\'époque', 'par le passé', 'jusqu\'à présent', 'jusqu\'alors',
    'a su', 'avez su', 'ont su', 'a démontré', 'avez démontré',
    'ont démontré', 'a montré', 'avez montré', 'ont montré'
  ]
};

// Detect urgency level with improved context awareness
const detectUrgency = (text) => {
  try {
    const lowercaseText = text.toLowerCase();
    
    // Split into sentences for better context analysis
    const sentences = splitIntoSentences(lowercaseText);
    
    // Check for references to urgency rather than actual urgency
    const hasDescriptiveContext = URGENCY_CONTEXT.descriptive.some(context => 
      lowercaseText.includes(context)
    );
    
    // Check for appreciation contexts (which would indicate describing behavior, not requesting)
    const hasAppreciationContext = URGENCY_CONTEXT.appreciation.some(context => 
      lowercaseText.includes(context)
    );
    
    // Check for past references (indicating historical observations, not current urgency)
    const hasPastReferenceContext = URGENCY_CONTEXT.past_reference.some(context => 
      lowercaseText.includes(context)
    );
    
    // Detect if this is an improvement suggestion context (which may mention urgency without being urgent)
    const isImprovementSuggestion = lowercaseText.includes('améliorer') || 
                                 lowercaseText.includes('pourrait') ||
                                 lowercaseText.includes('pourraient') ||
                                 lowercaseText.includes('serait') ||
                                 lowercaseText.includes('seraient') ||
                                 lowercaseText.includes('suggestions') ||
                                 lowercaseText.includes('recommandations');
    
    // Function to check if a pattern appears in a direct request context
    const isDirectRequest = (sentence, pattern) => {
      // Check if the pattern is preceded by a request indicator
      const requestIndicators = [
        'je voudrais', 'j\'ai besoin', 'pourriez-vous', 'pouvez-vous',
        'je demande', 'je souhaite', 'je requiers', 'il faut', 'il faudrait',
        'je veux', 'nous voulons', 'nous souhaitons', 'nous avons besoin',
        'je dois', 'nous devons', 'je nécessite', 'nous nécessitons',
        'j\'exige', 'nous exigeons', 'je vous prie de', 'merci de',
        'prière de', 'veuillez', 'svp', 's\'il vous plaît',
        'je compte sur', 'nous comptons sur', 'j\'attends', 'nous attendons',
        'je recherche', 'nous recherchons', 'j\'espère', 'nous espérons'
      ];
      
      // If we find the pattern
      if (sentence.includes(pattern)) {
        // Check if any request indicator precedes it
        return requestIndicators.some(indicator => 
          sentence.indexOf(indicator) !== -1 && 
          sentence.indexOf(indicator) < sentence.indexOf(pattern)
        );
      }
      return false;
    };
    
    // Check for negations of urgency
    const hasUrgencyNegation = sentences.some(sentence => {
      // Lower case and split into words
      const words = sentence.toLowerCase().split(/\s+/);
      
      // Find urgency terms
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        
        // Check if this is an urgency word
        const isUrgencyWord = URGENCY_PATTERNS.HIGH.direct_request.includes(word) || 
                             URGENCY_PATTERNS.MEDIUM.direct_request.includes(word);
        
        if (isUrgencyWord) {
          // Check for negation within 3 words before the urgency word
          for (let j = Math.max(0, i-3); j < i; j++) {
            if (NEGATION_WORDS.includes(words[j])) {
              return true; // Found negated urgency
            }
          }
        }
      }
      
      // Check for explicit negation patterns
      return URGENCY_CONTEXT.negation.some(negation => sentence.includes(negation));
    });
    
    // If we have negated urgency, or urgency appears in a descriptive/appreciation context
    // and not in a direct request, then it's likely NOT urgent
    if (hasUrgencyNegation || 
        isImprovementSuggestion ||
        ((hasDescriptiveContext || hasAppreciationContext || hasPastReferenceContext) && 
         !sentences.some(sentence => 
           URGENCY_PATTERNS.HIGH.direct_request.some(pattern => isDirectRequest(sentence, pattern)) ||
           URGENCY_PATTERNS.HIGH.with_subject.some(pattern => isDirectRequest(sentence, pattern))
         ))) {
      
      // Check if there are any LOW urgency indicators
      if (URGENCY_PATTERNS.LOW.direct_request.some(pattern => lowercaseText.includes(pattern)) ||
          URGENCY_PATTERNS.LOW.with_subject.some(pattern => 
            sentences.some(sentence => isDirectRequest(sentence, pattern))
          )) {
        // If this is specifically an improvement suggestion context, bias toward LOW urgency
        if (isImprovementSuggestion && !hasUrgencyNegation) {
          return { level: 'LOW' };
        }
        return { level: 'LOW' };
      }
      
      // If we're in an improvement suggestion context, default to LOW unless explicitly normal/no urgency
      if (isImprovementSuggestion && !hasUrgencyNegation) {
        return { level: 'LOW' };
      }
      
      return { level: 'NORMAL' };
    }
    
    // Check for direct requests of high urgency
    for (const sentence of sentences) {
      // If we find a direct request with high urgency pattern
      if (URGENCY_PATTERNS.HIGH.direct_request.some(pattern => isDirectRequest(sentence, pattern)) ||
          URGENCY_PATTERNS.HIGH.with_subject.some(pattern => isDirectRequest(sentence, pattern))) {
        return { level: 'HIGH' };
      }
    }
    
    // Check for medium urgency if high urgency not found
    for (const sentence of sentences) {
      if (URGENCY_PATTERNS.MEDIUM.direct_request.some(pattern => isDirectRequest(sentence, pattern)) ||
          URGENCY_PATTERNS.MEDIUM.with_subject.some(pattern => isDirectRequest(sentence, pattern))) {
        return { level: 'MEDIUM' };
      }
    }
    
    // Check if any HIGH or MEDIUM urgency words exist in the text (not necessarily direct requests)
    if (URGENCY_PATTERNS.HIGH.direct_request.some(pattern => lowercaseText.includes(pattern)) ||
        URGENCY_PATTERNS.HIGH.with_subject.some(pattern => lowercaseText.includes(pattern))) {
      // Not a direct request but has urgency terminology
      // If in appreciation context, don't mark as urgent
      if (hasAppreciationContext || hasDescriptiveContext || hasPastReferenceContext) {
        return { level: 'NORMAL' };
      }
      return { level: 'MEDIUM' }; // Downgrade to medium if not direct request
    }
    
    if (URGENCY_PATTERNS.MEDIUM.direct_request.some(pattern => lowercaseText.includes(pattern)) ||
        URGENCY_PATTERNS.MEDIUM.with_subject.some(pattern => lowercaseText.includes(pattern))) {
      // Not a direct request but has medium urgency terminology
      // If in appreciation context, don't mark as urgent
      if (hasAppreciationContext || hasDescriptiveContext || hasPastReferenceContext) {
        return { level: 'NORMAL' };
      }
      return { level: 'LOW' }; // Downgrade to low if not direct request
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

// Improved entity extraction function
const extractEntities = (text) => {
  try {
    const lowercaseText = text.toLowerCase();
    const entities = [];
    
    // Define common entity patterns in French feedback
    const entityPatterns = [
      // Products & services
      { type: 'PRODUCT', patterns: [
        'produit', 'service', 'logiciel', 'application', 'plateforme', 
        'système', 'outil', 'solution', 'offre', 'programme', 
        'package', 'formule', 'forfait', 'abonnement', 'souscription'
      ]},
      // People & teams
      { type: 'PERSON', patterns: [
        'équipe', 'conseiller', 'agent', 'représentant', 'support', 
        'technicien', 'vendeur', 'commercial', 'consultant', 'expert',
        'spécialiste', 'collaborateur', 'partenaire', 'intervenant',
        'contact', 'interlocuteur', 'gestionnaire', 'responsable',
        'chargé', 'directeur', 'manager', 'chef'
      ]},
      // Features
      { type: 'FEATURE', patterns: [
        'fonctionnalité', 'option', 'fonction', 'capacité', 'caractéristique',
        'propriété', 'attribut', 'qualité', 'aspect', 'élément',
        'composant', 'module', 'paramètre', 'réglage', 'configuration'
      ]},
      // Time-related
      { type: 'TIME', patterns: [
        'délai', 'temps', 'durée', 'période', 'attente',
        'retard', 'rapidité', 'promptitude', 'célérité', 'lenteur',
        'instantanéité', 'immédiateté', 'ponctualité', 'échéance', 'date limite'
      ]},
      // Support/help
      { type: 'SUPPORT', patterns: [
        'aide', 'assistance', 'support', 'dépannage', 'conseil',
        'accompagnement', 'guidage', 'formation', 'explication', 'documentation',
        'tutoriel', 'guide', 'faq', 'service client', 'sav', 'helpdesk'
      ]},
      // Quality
      { type: 'QUALITY', patterns: [
        'qualité', 'performance', 'fiabilité', 'stabilité', 'robustesse',
        'solidité', 'efficacité', 'efficience', 'précision', 'exactitude',
        'cohérence', 'consistance', 'fluidité', 'rapidité', 'réactivité'
      ]},
      // Communication
      { type: 'COMMUNICATION', patterns: [
        'communication', 'information', 'notification', 'alerte', 'message',
        'contact', 'dialogue', 'échange', 'interaction', 'retour',
        'feedback', 'transparence', 'clarté', 'précision', 'explication'
      ]},
      // Value
      { type: 'VALUE', patterns: [
        'valeur', 'prix', 'coût', 'tarif', 'bénéfice',
        'avantage', 'profit', 'gain', 'économie', 'rentabilité',
        'retour sur investissement', 'roi', 'rapport qualité prix', 'investissement'
      ]},
      // Process
      { type: 'PROCESS', patterns: [
        'processus', 'procédure', 'démarche', 'méthode', 'approche',
        'technique', 'pratique', 'opération', 'workflow', 'flux',
        'étape', 'phase', 'cycle', 'séquence', 'enchaînement'
      ]},
      // Partnership
      { type: 'PARTNERSHIP', patterns: [
        'partenariat', 'collaboration', 'coopération', 'alliance', 'relation',
        'association', 'synergie', 'accompagnement', 'engagement', 'accord',
        'contrat', 'convention', 'entente', 'protocole', 'projet commun'
      ]}
    ];
    
    // Split text into sentences for better context analysis
    const sentences = splitIntoSentences(lowercaseText);
    
    sentences.forEach(sentence => {
      const words = sentence.split(/\s+/).filter(word => word.length > 0);
      
      // Check each pattern against the sentence
      entityPatterns.forEach(entityType => {
        entityType.patterns.forEach(pattern => {
          if (sentence.includes(pattern)) {
            // Check words surrounding the pattern to extract the full entity
            const patternIndex = words.findIndex(word => word.includes(pattern));
            if (patternIndex !== -1) {
              // Look for adjectives or nouns around the pattern
              let entityText = words[patternIndex];
              let entityStart = patternIndex;
              let entityEnd = patternIndex;
              
              // Check up to 2 words before (usually adjectives or determiners in French)
              for (let i = patternIndex - 1; i >= Math.max(0, patternIndex - 2); i--) {
                if (i >= 0 && 
                    !['le', 'la', 'les', 'un', 'une', 'des', 'ce', 'cette', 'ces', 'du', 'de', 'à', 'au', 'aux'].includes(words[i])) {
                  entityStart = i;
                } else {
                  break;
                }
              }
              
              // Check up to 2 words after (could be descriptive or part of a compound noun)
              for (let i = patternIndex + 1; i <= Math.min(words.length - 1, patternIndex + 2); i++) {
                if (!['est', 'sont', 'a', 'ont', 'avec', 'sans', 'pour', 'par', 'dans', 'sur', 'en'].includes(words[i])) {
                  entityEnd = i;
                } else {
                  break;
                }
              }
              
              // Construct the complete entity text
              entityText = words.slice(entityStart, entityEnd + 1).join(' ');
              
              // Add entity if not already found
              if (!entities.some(e => e.text === entityText && e.type === entityType.type)) {
                entities.push({
                  type: entityType.type,
                  text: entityText,
                  sentence: sentence,
                  confidence: 0.8  // Basic confidence score
                });
              }
            }
          }
        });
      });
    });
    
    return entities;
  } catch (error) {
    console.error('Error in extractEntities:', error);
    return [];
  }
};

// Main analysis function (improved with all enhancements)
export const analyzeFeedback = async (text) => {
  try {
    console.log('Starting analyzeFeedback for text:', text);
    
    // Use enhanced sentiment analysis
    const sentimentResult = analyzeSentiment(text);
    
    // Use improved entity extraction
    const entities = extractEntities(text);
    
    // Detect emotions and urgency with improved context awareness
    const emotionsAnalysis = detectEmotions(text);
    const urgencyAnalysis = detectUrgency(text);
    
    // Analyze the type of feedback (question, statement, request)
    const feedbackType = determineFeedbackType(text);
    
    // Prepare analysis result with more detailed structure
    const result = {
      overall: {
        sentiment: {
          score: sentimentResult.score,
          displayPercentage: sentimentResult.displayPercentage,
          intensity: Math.abs(sentimentResult.score) > 0.7 ? 'HIGH' : 
                    Math.abs(sentimentResult.score) > 0.3 ? 'MEDIUM' : 'LOW'
        },
        emotions: emotionsAnalysis,
        urgency: urgencyAnalysis,
        feedbackType: feedbackType
      },
      metadata: {
        timestamp: new Date().toISOString(),
        wordCount: getWordCount(text),
        language: 'fr',
        textLength: text.length,
        sentences: splitIntoSentences(text).length
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
          displayPercentage: 50,
          intensity: 'LOW'
        },
        emotions: { emotions: {}, dominant: null },
        urgency: { level: 'NORMAL' },
        feedbackType: 'STATEMENT'
      },
      metadata: {
        timestamp: new Date().toISOString(),
        wordCount: getWordCount(text) || 0,
        language: 'fr',
        textLength: text ? text.length : 0,
        sentences: text ? splitIntoSentences(text).length : 0
      },
      entities: []
    };
  }
};

// Determine the type of feedback
const determineFeedbackType = (text) => {
  try {
    const lowercaseText = text.toLowerCase();
    
    // Check if this is a question
    if (lowercaseText.includes('?') || 
        lowercaseText.match(/^(pourquoi|comment|quand|où|qui|que|qu'|quoi|combien|est-ce que|pouvez-vous|pourriez-vous)/)) {
      return 'QUESTION';
    }
    
    // Check if this is a request
    if (lowercaseText.match(/^(je voudrais|j'aimerais|pouvez-vous|pourriez-vous|merci de|prière de|svp|s'il vous plaît|veuillez)/)) {
      return 'REQUEST';
    }
    
    // Check if this is a complaint
    const complaintIndicators = [
      'problème', 'pas content', 'mécontent', 'déçu', 'insatisfait', 
      'ne fonctionne pas', 'ne marche pas', 'défaut', 'bug', 'erreur',
      'plainte', 'réclamation', 'dysfonctionnement', 'panne', 'incident',
      'plantage', 'échec', 'échoué', 'défaillance', 'défectueux',
      'insupportable', 'inacceptable', 'inadmissible', 'scandaleux',
      'honteux', 'décevant', 'frustrant', 'agaçant', 'irritant', 
      'embêtant', 'ennuyeux', 'pénible', 'gênant', 'difficile'
    ];
    
    if (complaintIndicators.some(indicator => lowercaseText.includes(indicator))) {
      return 'COMPLAINT';
    }
    
    // Check if this is praise
    const praiseIndicators = [
      'merci', 'bravo', 'félicitations', 'excellent', 'parfait',
      'génial', 'super', 'formidable', 'j\'apprécie', 'nous apprécions',
      'fantastique', 'remarquable', 'exceptionnel', 'impressionnant',
      'magnifique', 'superbe', 'incroyable', 'très bien', 'très bon',
      'très satisfait', 'enchanté', 'ravi', 'content', 'heureux',
      'reconnaissance', 'remerciement', 'gratitude', 'qualité', 'efficace'
    ];
    
    if (praiseIndicators.some(indicator => lowercaseText.includes(indicator))) {
      return 'PRAISE';
    }
    
    // Check for suggestions
    const suggestionIndicators = [
      'suggestion', 'proposer', 'propose', 'idée', 'amélioration',
      'pourrait être', 'pourrait avoir', 'serait bien', 'serait utile',
      'serait intéressant', 'devrait', 'il faudrait', 'il serait bien',
      'peut-être', 'éventuellement', 'potentiellement', 'possiblement',
      'à considérer', 'à envisager', 'pensez à', 'n\'oubliez pas',
      'vous pourriez', 'vous devriez', 'avez-vous pensé à'
    ];
    
    if (suggestionIndicators.some(indicator => lowercaseText.includes(indicator))) {
      return 'SUGGESTION';
    }
    
    // Default to statement
    return 'STATEMENT';
  } catch (error) {
    console.error('Error in determineFeedbackType:', error);
    return 'STATEMENT';
  }
};