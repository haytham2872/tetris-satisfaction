// src/services/nlpService.js

const API_KEY = process.env.REACT_APP_GOOGLE_CLOUD_API_KEY;
const SENTIMENT_ENDPOINT = 'https://language.googleapis.com/v1/documents:analyzeSentiment';
const ENTITY_ENDPOINT = 'https://language.googleapis.com/v1/documents:analyzeEntities';

export const analyzeFeedback = async (text) => {
  try {
    const [sentimentResponse, entityResponse] = await Promise.all([
      fetch(`${SENTIMENT_ENDPOINT}?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: { content: text, type: 'PLAIN_TEXT', language: 'fr' },
          encodingType: 'UTF8'
        })
      }),
      fetch(`${ENTITY_ENDPOINT}?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: { content: text, type: 'PLAIN_TEXT', language: 'fr' },
          encodingType: 'UTF8'
        })
      })
    ]);

    const [sentimentData, entityData] = await Promise.all([
      sentimentResponse.json(),
      entityResponse.json()
    ]);

    if (sentimentData.error) throw new Error(sentimentData.error.message);
    if (entityData.error) throw new Error(entityData.error.message);

    // Process sentences with detailed sentiment analysis
    const sentences = sentimentData.sentences?.map(sentence => ({
      text: sentence.text?.content || '',
      beginOffset: sentence.text?.beginOffset || 0,
      sentiment: {
        score: sentence.sentiment?.score || 0,
        magnitude: sentence.sentiment?.magnitude || 0
      }
    })) || [];

    // Process entities with contextual sentiment
    const processedEntities = (entityData.entities || [])
      .filter(entity => entity.salience > 0.01)
      .map(entity => {
        // Find sentiment for this entity based on sentence context
        const entityMentions = entity.mentions || [];
        const entitySentiments = entityMentions.map(mention => {
          const sentencesWithEntity = sentences.filter(sentence => 
            sentence.beginOffset <= mention.text.beginOffset && 
            sentence.beginOffset + sentence.text.length >= mention.text.beginOffset + mention.text.content.length
          );
          return sentencesWithEntity.length > 0 
            ? sentencesWithEntity[0].sentiment 
            : null;
        }).filter(Boolean);

        const avgSentiment = entitySentiments.length > 0 
          ? entitySentiments.reduce((acc, s) => ({
              score: acc.score + s.score,
              magnitude: acc.magnitude + s.magnitude
            }), { score: 0, magnitude: 0 }) 
          : null;

        if (avgSentiment) {
          avgSentiment.score /= entitySentiments.length;
          avgSentiment.magnitude /= entitySentiments.length;
        }

        return {
          name: entity.name,
          type: entity.type,
          salience: entity.salience,
          mentions: entityMentions.length,
          sentiment: avgSentiment,
          metadata: entity.metadata
        };
      });

    return {
      sentiment: {
        score: sentimentData.documentSentiment?.score || 0,
        magnitude: sentimentData.documentSentiment?.magnitude || 0,
        sentences
      },
      entities: processedEntities,
      metadata: {
        language: entityData.language,
        processedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error in analyzeFeedback:', error);
    return {
      sentiment: { score: 0, magnitude: 0, sentences: [] },
      entities: [],
      metadata: { error: error.message, processedAt: new Date().toISOString() }
    };
  }
};