// API.js
const API_URL = 'https://tetris-forms.azurewebsites.net';

if (!API_URL) {
    console.error('API_URL is not defined! Make sure REACT_APP_API_URL is set in your environment variables.');
}

export const startSurvey = async () => {
    try {
        console.log('Attempting to start survey with URL:', API_URL);

        const response = await fetch(`${API_URL}/api/start-survey`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ 
                name: 'Survey ' + new Date().toISOString()
            }),
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        const data = await response.json();
        return {
            id: Number(data.id) 
        };
    } catch (error) {
        console.error('Error starting survey:', error);
        console.error('API URL used:', API_URL);
        return null;
    }
};

const formatAnswer = (answer) => {
    if (answer === null || answer === undefined) {
        return '';
    }
    
    // Handle different types of answers
    if (typeof answer === 'number') {
        return answer.toString();
    }
    
    if (typeof answer === 'boolean') {
        return answer.toString();
    }
    
    if (Array.isArray(answer)) {
        return answer.join(',');
    }
    
    // Ensure the answer is a string
    return String(answer).trim();
};

export const submitResponses = async (surveyId, responses, negativeScore) => {
    try {
        if (!surveyId) {
            throw new Error('Survey ID is required');
        }

        console.log('[submitResponses] Starting submission', {
            surveyId,
            negativeScore,
            responseCount: Object.keys(responses).length
        });

        // Format and validate responses
        const formattedResponses = Object.entries(responses).map(([questionId, data]) => {
            const formattedAnswer = formatAnswer(data.answer);
            const formattedOptionalAnswer = data.optionalAnswer ? formatAnswer(data.optionalAnswer) : null;

            // Log the formatted data for debugging
            console.log(`Formatting response for question ${questionId}:`, {
                original: data.answer,
                formatted: formattedAnswer
            });

            return {
                question_id: Number(questionId),
                answer: formattedAnswer,
                optional_answer: formattedOptionalAnswer,
            };
        });

        const payload = {
            survey_id: Number(surveyId),
            responses: formattedResponses,
            negativeScore: typeof negativeScore === 'number' ? Number(negativeScore.toFixed(2)) : null
        };

        console.log('Sending payload:', JSON.stringify(payload, null, 2));

        const response = await fetch(`${API_URL}/api/responses`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload),
        });

        const responseData = await response.json();

        if (!response.ok) {
            console.error('[submitResponses] HTTP error:', responseData);
            throw new Error(responseData.error || 'Failed to submit responses');
        }

        console.log('[submitResponses] Submission successful:', responseData);
        return {
            success: true,
            shouldShowContact: responseData.shouldShowContact
        };
    } catch (error) {
        console.error('[submitResponses] Error:', error);
        throw error;
    }
};