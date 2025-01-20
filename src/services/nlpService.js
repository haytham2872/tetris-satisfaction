// src/services/nlpService.js

const API_KEY = process.env.REACT_APP_GOOGLE_CLOUD_API_KEY;
const API_ENDPOINT = 'https://language.googleapis.com/v1/documents:analyzeSentiment';
const ENTITY_ENDPOINT = 'https://language.googleapis.com/v1/documents:analyzeEntities';

const categorizeSentiment = (score) => {
  if (score >= 0.25) return 'POSITIVE';
  if (score <= -0.25) return 'NEGATIVE';
  return 'NEUTRAL';
};

const processEntities = (entities = []) => {
  return entities.map(entity => ({
    name: entity.name || '',
    type: entity.type || 'UNKNOWN',
    salience: entity.salience || 0,
    sentiment: entity.sentiment || { score: 0, magnitude: 0 }
  }));
};

const extractMainTopics = (entities = []) => {
  return entities
    .filter(entity => (entity.salience || 0) > 0.1)
    .sort((a, b) => (b.salience || 0) - (a.salience || 0))
    .slice(0, 3)
    .map(entity => entity.name || '');
};

export const analyzeFeedback = async (text) => {
  try {
    // Sentiment Analysis
    const sentimentResponse = await fetch(`${API_ENDPOINT}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        document: {
          content: text,
          type: 'PLAIN_TEXT',
          language: 'fr'
        },
        encodingType: 'UTF8'
      })
    });

    const sentimentData = await sentimentResponse.json();

    // Check if we have an error in the response
    if (sentimentData.error) {
      throw new Error(sentimentData.error.message);
    }

    // Entity Analysis
    const entityResponse = await fetch(`${ENTITY_ENDPOINT}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        document: {
          content: text,
          type: 'PLAIN_TEXT',
          language: 'fr'
        },
        encodingType: 'UTF8'
      })
    });

    const entityData = await entityResponse.json();

    // Check if we have an error in the response
    if (entityData.error) {
      throw new Error(entityData.error.message);
    }

    // Ensure we have the required properties before processing
    const sentiment = sentimentData.documentSentiment || { score: 0, magnitude: 0 };
    const entities = entityData.entities || [];

    // Process and categorize the results
    const analysis = {
      sentiment: {
        score: sentiment.score || 0,
        magnitude: sentiment.magnitude || 0,
        category: categorizeSentiment(sentiment.score || 0)
      },
      topics: processEntities(entities),
      mainTopics: extractMainTopics(entities),
    };

    return analysis;
  } catch (error) {
    console.error('Error in analyzeFeedback:', error);
    // Return a default analysis structure instead of throwing
    return {
      sentiment: {
        score: 0,
        magnitude: 0,
        category: 'NEUTRAL'
      },
      topics: [],
      mainTopics: []
    };
  }
};

// Categories for feedback classification
export const FEEDBACK_CATEGORIES = {
  SUPPORT: 'Support technique',
  INTERFACE: 'Interface utilisateur',
  PERFORMANCE: 'Performance',
  FEATURES: 'Fonctionnalités',
  PRICING: 'Tarification',
  OTHER: 'Autre'
};