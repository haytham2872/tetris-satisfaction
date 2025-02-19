const API_URL = 'https://tetris-forms.azurewebsites.net';

if (!API_URL) {
    console.error('API_URL is not defined! Make sure REACT_APP_API_URL is set in your environment variables.');
}

export const startSurvey = async (formId) => {
    try {
        console.log('Attempting to start survey with URL:', API_URL, 'for form:', formId);

        const response = await fetch(`${API_URL}/api/start-survey`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ 
                name: 'Survey ' + new Date().toISOString(),
                form_id: formId
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

export const submitResponses = async (surveyId, responses, negativeScore, formId) => {
    try {
        if (!surveyId) {
            throw new Error('Survey ID is required');
        }

        if (!formId) {
            throw new Error('Form ID is required');
        }

        console.log('[submitResponses] Starting submission', {
            surveyId,
            formId,
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
            form_id: Number(formId),
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

export const getQuestions = async (formId) => {
    try {
        const response = await fetch(`${API_URL}/api/forms/${formId}/questions`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching questions:', error);
        return [];
    }
};

export const getForms = async () => {
    try {
        const response = await fetch(`${API_URL}/api/forms`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching forms:', error);
        return [];
    }
};

export const createForm = async (formData) => {
    try {
        const response = await fetch(`${API_URL}/api/forms`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData),
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error creating form:', error);
        throw error;
    }
};

export const updateForm = async (formId, formData) => {
    try {
        const response = await fetch(`${API_URL}/api/forms/${formId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData),
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error updating form:', error);
        throw error;
    }
};