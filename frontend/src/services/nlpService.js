// src/services/nlpService.js

const API_KEY = 'AIzaSyAfZZHB8spNmDWi9F-rXlCfkD0WLbWJk44';
const SENTIMENT_ENDPOINT = 'https://language.googleapis.com/v1/documents:analyzeSentiment';
const ENTITY_ENDPOINT = 'https://language.googleapis.com/v1/documents:analyzeEntities';

// Basic API key validation
if (!API_KEY) {
    console.error('Google Cloud API key is not set!');
}

// Emotion patterns
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

// Urgency patterns
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

// Detect emotions in text
const detectEmotions = (text) => {
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
};

// Detect urgency level
const detectUrgency = (text) => {
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
};

// Get accurate word count
const getWordCount = (text) => {
    return text
        .trim()
        .split(/\s+/)
        .filter(word => word.length > 0)
        .length;
};

// Main analysis function
export const analyzeFeedback = async (text) => {
    try {
        console.log('Starting analyzeFeedback for text:', text);

        const requestBody = {
            document: {
                content: text,
                type: 'PLAIN_TEXT',
                language: 'fr'
            },
            encodingType: 'UTF8'
        };

        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        // Make API calls
        const [sentimentResponse, entityResponse] = await Promise.all([
            fetch(`${SENTIMENT_ENDPOINT}?key=${API_KEY}`, {
                method: 'POST',
                headers,
                body: JSON.stringify(requestBody)
            }),
            fetch(`${ENTITY_ENDPOINT}?key=${API_KEY}`, {
                method: 'POST',
                headers,
                body: JSON.stringify(requestBody)
            })
        ]);

        const [sentimentData, entityData] = await Promise.all([
            sentimentResponse.json(),
            entityResponse.json()
        ]);

        // Get sentiment score and convert to percentage
        const googleSentiment = sentimentData.documentSentiment.score;
        const sentimentPercentage = Math.round((googleSentiment + 1) * 50);

        // Detect emotions and urgency
        const emotionsAnalysis = detectEmotions(text);
        const urgencyAnalysis = detectUrgency(text);

        // Prepare analysis result
        const result = {
            overall: {
                sentiment: {
                    score: googleSentiment,
                    displayPercentage: sentimentPercentage
                },
                emotions: emotionsAnalysis,
                urgency: urgencyAnalysis
            },
            metadata: {
                timestamp: new Date().toISOString(),
                wordCount: getWordCount(text),
                language: 'fr'
            },
            entities: entityData.entities || []
        };

        console.log('Final analysis result:', result);
        return result;

    } catch (error) {
        console.error('Error in analyzeFeedback:', error);
        throw error;
    }
};