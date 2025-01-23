// src/services/nlpService.js

const API_KEY = 'AIzaSyAfZZHB8spNmDWi9F-rXlCfkD0WLbWJk44';
const SENTIMENT_ENDPOINT = 'https://language.googleapis.com/v1/documents:analyzeSentiment';
const ENTITY_ENDPOINT = 'https://language.googleapis.com/v1/documents:analyzeEntities';

export const analyzeFeedback = async (text) => {
  try {
    console.log('Starting analysis with text:', text); // Debug log

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

    console.log('Making API requests...'); // Debug log

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

    // Check for HTTP errors
    if (!sentimentResponse.ok) {
      const errorText = await sentimentResponse.text();
      console.error('Sentiment API Error:', errorText); // Debug log
      throw new Error(`Sentiment API error: ${sentimentResponse.status} ${errorText}`);
    }

    if (!entityResponse.ok) {
      const errorText = await entityResponse.text();
      console.error('Entity API Error:', errorText); // Debug log
      throw new Error(`Entity API error: ${entityResponse.status} ${errorText}`);
    }

    console.log('Successfully received API responses'); // Debug log

    const [sentimentData, entityData] = await Promise.all([
      sentimentResponse.json(),
      entityResponse.json()
    ]);

    // Process sentences
    const sentences = sentimentData.sentences?.map(sentence => ({
      text: sentence.text?.content || '',
      beginOffset: sentence.text?.beginOffset || 0,
      sentiment: {
        score: sentence.sentiment?.score || 0,
        magnitude: sentence.sentiment?.magnitude || 0
      }
    })) || [];

    // Process entities
    const processedEntities = (entityData.entities || [])
      .filter(entity => entity.salience > 0.01)
      .map(entity => {
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

    const analysisResult = {
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

    console.log('Analysis complete:', analysisResult); // Debug log
    return analysisResult;

  } catch (error) {
    console.error('Error in analyzeFeedback:', error);
    throw error;
  }
};