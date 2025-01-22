import fetch from 'node-fetch';

// Constructive feedback suggestions in the insurance context
const feedbackSuggestions = [
    "Excellent service ! Peut-être ajouter des notifications par SMS pour le suivi des dossiers ?",
    "Très satisfait globalement. Une interface mobile native serait un plus.",
    "Service de qualité. Il serait bien d'avoir plus d'options de personnalisation des contrats.",
    "Excellent accompagnement. Une suggestion : proposer des webinaires de formation sur les nouveaux produits.",
    "Très professionnel. Une API pour l'intégration directe avec nos systèmes serait appréciable.",
    "Service remarquable ! Suggestion : ajouter un tableau de bord personnalisable.",
    "Très satisfait du service. Une application mobile serait un plus pour le suivi en temps réel.",
    "Qualité exceptionnelle. Peut-être ajouter plus de documentation sur les cas spécifiques ?",
    "Excellent support ! L'ajout d'une FAQ détaillée serait apprécié.",
    "Service très efficace. Suggestion : intégrer un système de notifications personnalisables."
];

// Helper function to get random integer between min and max (inclusive)
const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Helper function to get weighted random value
const getWeightedRandom = (options, weights) => {
    const totalWeight = weights.reduce((acc, weight) => acc + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < options.length; i++) {
        random -= weights[i];
        if (random <= 0) {
            return options[i];
        }
    }
    return options[options.length - 1];
};

// Function to generate a single survey response
const generateSurveyResponse = () => {
    // Recommendation score (question 1) - heavily weighted towards 8-10
    const recommendationScores = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const recommendationWeights = [1, 1, 1, 1, 2, 2, 3, 4, 5, 6, 7];
    const recommendation = getWeightedRandom(recommendationScores, recommendationWeights);

    // Satisfaction stars (question 2) - heavily weighted towards 4-5 stars
    const satisfactionScores = [1, 2, 3, 4, 5];
    const satisfactionWeights = [1, 1, 2, 5, 6];
    const satisfaction = getWeightedRandom(satisfactionScores, satisfactionWeights);

    // Response speed (question 3)
    const speedOptions = ["Excellent", "Bon", "Moyen", "Insuffisant"];
    const speed = getWeightedRandom(speedOptions, [6, 4, 2, 1]);

    // Solutions match (question 4)
    const matchOptions = ["Toujours", "Souvent", "Parfois", "Rarement"];
    const match = getWeightedRandom(matchOptions, [6, 4, 2, 1]);

    // Information clarity (question 5)
    const clarityOptions = ["Très clair", "Clair", "Peu clair", "Pas clair du tout"];
    const clarity = getWeightedRandom(clarityOptions, [6, 4, 2, 1]);

    // Process simplicity (question 6)
    const simplicityOptions = ["Oui, très simple", "Plutôt simple", "Plutôt compliqué", "Très compliqué"];
    const simplicity = getWeightedRandom(simplicityOptions, [6, 4, 2, 1]);

    // Deadlines respect (question 7)
    const deadlineOptions = ["Toujours", "Souvent", "Parfois", "Rarement"];
    const deadline = getWeightedRandom(deadlineOptions, [6, 4, 2, 1]);

    // Technical support (question 8)
    const supportOptions = ["Excellent", "Bon", "Moyen", "Insuffisant"];
    const support = getWeightedRandom(supportOptions, [6, 4, 2, 1]);

    // Pricing competitiveness (question 9)
    const pricingOptions = ["Très compétitive", "Assez compétitive", "Peu compétitive", "Pas du tout compétitive"];
    const pricing = getWeightedRandom(pricingOptions, [6, 4, 2, 1]);

    // Random feedback (question 10) with more positive tone
    const feedback = feedbackSuggestions[Math.floor(Math.random() * feedbackSuggestions.length)];

    return {
        1: recommendation,
        2: satisfaction,
        3: speed,
        4: match,
        5: clarity,
        6: simplicity,
        7: deadline,
        8: support,
        9: pricing,
        10: feedback
    };
};

// Main function to simulate multiple survey responses
const simulateSurveyResponses = async (count) => {
    console.log(`Starting simulation of ${count} survey responses...`);
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < count; i++) {
        try {
            // Start a new survey
            const surveyResponse = await fetch('http://localhost:5000/api/start-survey', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: `Simulation ${i + 1}`
                })
            });

            if (!surveyResponse.ok) {
                throw new Error(`Failed to start survey: ${surveyResponse.status}`);
            }

            const surveyData = await surveyResponse.json();
            const surveyId = surveyData.id;

            // Generate and submit responses
            const responses = generateSurveyResponse();
            const submitResponse = await fetch('http://localhost:5000/api/responses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    survey_id: surveyId,
                    responses: responses
                })
            });

            if (!submitResponse.ok) {
                throw new Error(`Failed to submit responses: ${submitResponse.status}`);
            }

            successCount++;
            console.log(`Successfully submitted survey ${i + 1}/${count}`);
            
            // Add a small delay between submissions to avoid overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 200));

        } catch (error) {
            errorCount++;
            console.error(`Error in survey ${i + 1}:`, error);
        }
    }

    console.log('\nSimulation completed!');
    console.log(`Successfully submitted: ${successCount} surveys`);
    console.log(`Failed submissions: ${errorCount} surveys`);
};

// Run the simulation
simulateSurveyResponses(50);