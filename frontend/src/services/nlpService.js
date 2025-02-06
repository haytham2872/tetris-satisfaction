// src/services/nlpService.js

const API_KEY = 'AIzaSyAfZZHB8spNmDWi9F-rXlCfkD0WLbWJk44';
const SENTIMENT_ENDPOINT = 'https://language.googleapis.com/v1/documents:analyzeSentiment';
const ENTITY_ENDPOINT = 'https://language.googleapis.com/v1/documents:analyzeEntities';

const TOPICS = {
    SUPPORT: {
        keywords: ['support', 'aide', 'assistance', 'service', 'soutien', 'accompagnement', 'dépannage', 'maintenance', 'support technique', 'helpdesk', 'sav', 'assistance téléphonique', 'aide en ligne', 'support client', 'centre d\'aide'],
        subtopics: {
            TECHNICAL: [
                'technique', 'bug', 'problème technique', 'erreur', 'fonctionnalité',
                'dysfonctionnement', 'panne', 'incident', 'problème', 'bogue',
                'défaut', 'anomalie', 'plantage', 'défaillance', 'configuration',
                'mise à jour', 'maintenance', 'réparation', 'diagnostic',
                'installation', 'compatibilité', 'serveur', 'réseau', 'connexion',
                'base de données', 'sécurité', 'authentification', 'performance'
            ],
            CUSTOMER_SERVICE: [
                'service client', 'conseiller', 'équipe', 'accompagnement',
                'assistance client', 'relation client', 'support client',
                'agent', 'représentant', 'chargé de clientèle', 'interlocuteur',
                'responsable', 'gestionnaire', 'expert', 'professionnel',
                'commercial', 'technicien', 'consultant', 'spécialiste',
                'superviseur', 'manager', 'formateur', 'coach', 'médiateur'
            ],
            RESPONSE_TIME: [
                'temps de réponse', 'délai', 'rapidité', 'attente',
                'temps d\'attente', 'réactivité', 'durée', 'retard',
                'traitement', 'prise en charge', 'intervention',
                'promptitude', 'célérité', 'timing', 'ponctualité',
                'disponibilité', 'immédiat', 'urgent', 'prioritaire',
                'temps réel', 'instantané', 'différé', 'planifié'
            ]
        }
    },
    PLATFORM: {
        keywords: ['plateforme', 'site', 'interface', 'application', 'système', 'portail', 'logiciel', 'outil en ligne', 'solution', 'environnement', 'dashboard', 'webapp', 'back-office', 'front-end', 'saas'],
        subtopics: {
            USABILITY: [
                'utilisation', 'navigation', 'ergonomie', 'accessible',
                'facilité', 'intuitif', 'convivial', 'pratique', 'utilisable',
                'compréhensible', 'maniable', 'adapté', 'simple d\'utilisation',
                'user-friendly', 'prise en main', 'apprentissage',
                'interface utilisateur', 'expérience utilisateur', 'ux', 'ui',
                'design', 'responsive', 'mobile', 'tablette', 'adaptation'
            ],
            FEATURES: [
                'fonctionnalité', 'option', 'outil', 'module',
                'fonction', 'capacité', 'possibilité', 'caractéristique',
                'composant', 'élément', 'service', 'paramètre', 'configuration',
                'paramétrage', 'personnalisation', 'extension',
                'widget', 'plugin', 'add-on', 'intégration', 'api',
                'automatisation', 'import', 'export', 'synchronisation'
            ],
            PERFORMANCE: [
                'vitesse', 'performance', 'rapidité', 'chargement',
                'réactivité', 'fluidité', 'efficacité', 'temps de réponse',
                'stabilité', 'fiabilité', 'robustesse', 'optimisation',
                'fonctionnement', 'exécution', 'débit', 'vélocité',
                'cache', 'mémoire', 'processeur', 'bande passante',
                'latence', 'disponibilité', 'scalabilité', 'charge'
            ]
        }
    },
    SECURITY: {
        keywords: ['sécurité', 'protection', 'confidentialité', 'authentification', 'autorisation', 'cryptage', 'firewall', 'antivirus', 'cybersécurité', 'données personnelles'],
        subtopics: {
            ACCESS_CONTROL: [
                'mot de passe', 'login', 'connexion', 'authentification',
                'droits d\'accès', 'permission', 'habilitation', 'profil',
                'rôle', 'identifiant', 'compte utilisateur', 'session',
                'déconnexion', 'double authentification', 'sso'
            ],
            DATA_PROTECTION: [
                'chiffrement', 'cryptage', 'confidentialité', 'rgpd',
                'backup', 'sauvegarde', 'archivage', 'restauration',
                'protection des données', 'conformité', 'audit', 'traçabilité',
                'journalisation', 'logs', 'surveillance'
            ]
        }
    }
};

const EMOTIONS = {
    SATISFACTION: {
        patterns: [
            'satisfait', 'content', 'heureux', 'ravi', 'excellent',
            'enchanté', 'comblé', 'réjoui', 'conquis', 'impressionné',
            'reconnaissant', 'agréable', 'favorable', 'positif', 'apprécié',
            'épanoui', 'ravi', 'serein', 'comblé', 'gratifié',
            'optimiste', 'confiant', 'emballé', 'enthousiasmé', 'radieux'
        ],
        weight: 1
    },
    FRUSTRATION: {
        patterns: [
            'frustré', 'déçu', 'mécontent', 'agacé', 'difficile',
            'contrarié', 'insatisfait', 'énervé', 'irrité', 'excédé',
            'exaspéré', 'fâché', 'furieux', 'dépité', 'découragé',
            'désappointé', 'désemparé', 'contrarié', 'ennuyé', 'tendu',
            'stressé', 'démotivé', 'démoralisé', 'accablé', 'las'
        ],
        weight: -1
    },
    ENTHUSIASM: {
        patterns: [
            'génial', 'extraordinaire', 'fantastique', 'parfait',
            'exceptionnel', 'incroyable', 'remarquable', 'formidable',
            'excellent', 'superbe', 'magnifique', 'merveilleux',
            'impressionnant', 'brillant', 'spectaculaire',
            'fabuleux', 'sensationnel', 'prodigieux', 'stupéfiant', 'éblouissant',
            'grandiose', 'sublime', 'phénoménal', 'fascinant', 'admirable'
        ],
        weight: 2
    },
    CONCERN: {
        patterns: [
            'inquiet', 'préoccupé', 'soucieux', 'craintif',
            'anxieux', 'alarmé', 'troublé', 'perturbé', 'dérangé',
            'tracassé', 'incertain', 'hésitant', 'méfiant', 'dubitatif',
            'appréhensif', 'tourmenté', 'angoissé', 'nerveux', 'agité',
            'instable', 'perplexe', 'confus', 'déstabilisé', 'embarrassé'
        ],
        weight: -0.5
    }
};

const URGENCY_PATTERNS = {
    HIGH: {
        patterns: [
            'urgent', 'immédiat', 'critique', 'au plus vite',
            'rapidement', 'sans délai', 'pressant', 'prioritaire',
            'impératif', 'crucial', 'sans attendre', 'imminent',
            'dès maintenant', 'en urgence', 'capital',
            'vital', 'primordial', 'essentiel', 'décisif', 'urgent urgent',
            'extrêmement urgent', 'ultra prioritaire', 'sans plus tarder',
            'action immédiate', 'urgence absolue'
        ],
        score: 3
    },
    MEDIUM: {
        patterns: [
            'dès que possible', 'bientôt', 'prochainement',
            'sous peu', 'dans les meilleurs délais', 'rapidement',
            'assez urgent', 'relativement pressé', 'important',
            'à traiter', 'à suivre', 'à faire', 'à prévoir', 'à venir',
            'dans la semaine', 'cette semaine', 'attention particulière',
            'suivi nécessaire', 'à programmer', 'à planifier',
            'moyennement urgent', 'semi-urgent', 'plutôt urgent',
            'besoin rapide', 'rapidité souhaitée'
        ],
        score: 2
    },
    LOW: {
        patterns: [
            'quand possible', 'pas urgent', 'à l\'occasion',
            'peu pressé', 'sans empressement', 'tranquillement',
            'progressivement', 'doucement', 'calmement', 'à votre rythme',
            'sans stress', 'sans précipitation', 'en temps voulu',
            'plus tard', 'éventuellement', 'dans le futur',
            'pas de précipitation', 'prendre son temps',
            'sans contrainte', 'quand vous voulez',
            'selon vos disponibilités', 'pas pressé', 'peut attendre',
            'non prioritaire', 'secondaire'
        ],
        score: 1
    }
};

const detectTopicsWithSentiment = (text, entities, documentSentiment) => {
    const results = {};
    const lowercaseText = text.toLowerCase();


    Object.entries(TOPICS).forEach(([topicName, topicData]) => {
        const isTopicPresent = topicData.keywords.some(keyword =>
            lowercaseText.includes(keyword)
        );

        if (isTopicPresent) {
            const subtopics = {};
            let topicSentiment = 0;
            let mentionCount = 0;

            Object.entries(topicData.subtopics).forEach(([subtopicName, keywords]) => {
                const subtopicMentions = keywords.filter(keyword =>
                    lowercaseText.includes(keyword)
                );

                if (subtopicMentions.length > 0) {
                    const subtopicSentiment = Math.max(-1, Math.min(1,
                        calculateLocalSentiment(text, subtopicMentions)
                    ));

                    subtopics[subtopicName] = {
                        mentions: subtopicMentions.length,
                        sentiment: subtopicSentiment
                    };
                    topicSentiment += subtopicSentiment;
                    mentionCount += subtopicMentions.length;
                }
            });

            const normalizedSentiment = mentionCount > 0 ?
                Math.max(-1, Math.min(1, topicSentiment / mentionCount)) :
                documentSentiment;

            results[topicName] = {
                subtopics,
                overallSentiment: normalizedSentiment,
                mentionCount
            };
        }
    });

    return results;
};

const detectEmotions = (text) => {
    const lowercaseText = text.toLowerCase();
    const detectedEmotions = {};
    let dominantEmotion = null;
    let maxScore = 0;

    Object.entries(EMOTIONS).forEach(([emotion, data]) => {
        const matches = data.patterns.filter(pattern =>
            lowercaseText.includes(pattern)
        );

        const score = matches.length * data.weight;
        if (score !== 0) {
            detectedEmotions[emotion] = {
                score,
                matches: matches,
            };

            if (Math.abs(score) > Math.abs(maxScore)) {
                maxScore = score;
                dominantEmotion = emotion;
            }
        }
    });

    return {
        emotions: detectedEmotions,
        dominant: dominantEmotion
    };
};

const detectUrgency = (text) => {
    const lowercaseText = text.toLowerCase();
    let highestUrgency = null;
    let highestScore = 0;

    Object.entries(URGENCY_PATTERNS).forEach(([level, data]) => {
        const matches = data.patterns.filter(pattern =>
            lowercaseText.includes(pattern)
        );

        if (matches.length > 0 && data.score > highestScore) {
            highestScore = data.score;
            highestUrgency = level;
        }
    });

    return {
        level: highestUrgency || 'NORMAL',
        score: highestScore
    };
};

const extractKeyPhrases = (text, sentiment) => {
    const sentences = text.split(/[.!?]+/).filter(Boolean);
    return sentences
        .map(sentence => {
            const trimmedSentence = sentence.trim();
            const sentenceSentiment = calculateLocalSentiment(trimmedSentence);

            if (Math.abs(sentenceSentiment) > 0.3) {
                return {
                    text: trimmedSentence,
                    sentiment: sentenceSentiment,
                    isKey: Math.abs(sentenceSentiment) > 0.5
                };
            }
            return null;
        })
        .filter(Boolean);
};

const calculateLocalSentiment = (text, keywords = []) => {
    const positiveWords = [
        'excellent', 'parfait', 'génial', 'super', 'bien',
        'satisfait', 'content', 'heureux', 'efficace', 'rapide',
        'facile', 'pratique', 'utile', 'clair', 'agréable'
    ];
    const negativeWords = [
        'mauvais', 'problème', 'difficile', 'déçu', 'nul',
        'horrible', 'terrible', 'lent', 'compliqué', 'inutile',
        'confus', 'pénible', 'impossible', 'défaillant', 'inadapté'
    ];

    let score = 0;
    const words = text.toLowerCase().split(/\s+/);

    let negationActive = false;
    let intensifierActive = false;

    words.forEach((word, index) => {
        if (['ne', 'pas', 'plus', 'jamais', 'aucun'].includes(word)) {
            negationActive = true;
            return;
        }

        if (['très', 'vraiment', 'totalement', 'complètement', 'absolument'].includes(word)) {
            intensifierActive = true;
            return;
        }

        let wordScore = 0;
        if (positiveWords.includes(word)) wordScore = 0.2;
        if (negativeWords.includes(word)) wordScore = -0.2;

        if (negationActive) wordScore *= -1;
        if (intensifierActive) wordScore *= 1.5;

        score += wordScore;

        if (index % 3 === 0) {
            negationActive = false;
            intensifierActive = false;
        }
    });

    if (keywords.length > 0) {
        keywords.forEach(keyword => {
            if (text.includes(keyword)) {
                const keywordIndex = text.indexOf(keyword);
                words.forEach((_, index) => {
                    const distance = Math.abs(index - keywordIndex);
                    if (distance < 3) score *= 1.2;
                });
            }
        });
    }

    return Math.max(-1, Math.min(1, score / Math.sqrt(words.length)));
};

export const analyzeFeedback = async (text) => {
    try {
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

        const googleSentiment = sentimentData.documentSentiment.score;
        const localSentimentScore = calculateLocalSentiment(text);

        const calculateSentimentStrength = (text, googleScore, localScore) => {
            const emotions = detectEmotions(text);
            let emotionModifier = 0;

            if (emotions.emotions) {
                Object.entries(emotions.emotions).forEach(([emotion, data]) => {
                    emotionModifier += (data.score || 0) * 0.2;
                });
            }

            const combinedScore = (
                googleScore * 0.4 +
                localScore * 0.4 +
                emotionModifier * 0.2
            );

            const percentage = Math.round(
                (Math.tanh(combinedScore * 1.5) + 1) * 50
            );

            return Math.max(0, Math.min(100, percentage));
        };

        const sentimentPercentage = calculateSentimentStrength(
            text,
            googleSentiment,
            localSentimentScore
        );

        const topicsAnalysis = detectTopicsWithSentiment(
            text,
            entityData.entities || [],
            googleSentiment
        );

        const emotionsAnalysis = detectEmotions(text);
        const urgencyAnalysis = detectUrgency(text);
        const keyPhrases = extractKeyPhrases(text, googleSentiment);

        return {
            overall: {
                sentiment: {
                    score: googleSentiment,
                    displayPercentage: sentimentPercentage,
                    rawScore: localSentimentScore
                },
                emotions: emotionsAnalysis,
                urgency: urgencyAnalysis
            },
            topics: topicsAnalysis,
            keyPhrases: keyPhrases,
            metadata: {
                timestamp: new Date().toISOString(),
                wordCount: text.split(/\s+/).length,
                language: entityData.language
            }
        };
    } catch (error) {
        console.error('Error in analyzeFeedback:', error);
        throw error;
    }
};