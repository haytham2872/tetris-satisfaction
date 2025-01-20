// src/seedDatabase.js
import { collection, addDoc } from 'firebase/firestore';
import { db } from './config/firebase';

const weightedRandom = (options, weights) => {
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

const generateRandomResponse = () => {
  const suggestions = [
    "Très satisfait du service, vraiment excellent !",
    "Équipe très professionnelle et réactive",
    "Service de grande qualité, je recommande",
    "Très bon accompagnement, merci !",
    "Excellent service client",
    "Le support technique est remarquable",
    "Processus efficace et bien pensé",
    "Documentation claire et complète",
    "Très satisfait dans l'ensemble",
    "Service qui répond parfaitement à nos besoins",
    // Some constructive feedback for realism
    "Bon service mais quelques améliorations possibles",
    "Service satisfaisant, petits ajustements nécessaires",
    "Globalement très bien, interface à moderniser"
  ];

  // Weighted random for recommendation score (0-10)
  const recommendationWeights = [1, 1, 1, 2, 2, 3, 5, 15, 30, 25, 15]; // Skewed towards 7-9
  const recommendationScore = recommendationWeights.indexOf(
    weightedRandom(recommendationWeights, recommendationWeights)
  );

  // Define options and their weights for different metrics
  const standardOptions = {
    satisfaction: {
      options: [5, 4, 3, 2, 1],
      weights: [50, 30, 15, 3, 2]
    },
    responseSpeed: {
      options: ['Excellent', 'Bon', 'Moyen', 'Insuffisant'],
      weights: [45, 35, 15, 5]
    },
    solutions: {
      options: ['Toujours', 'Souvent', 'Parfois', 'Rarement'],
      weights: [40, 40, 15, 5]
    },
    clarity: {
      options: ['Très clair', 'Clair', 'Peu clair', 'Pas clair du tout'],
      weights: [45, 35, 15, 5]
    },
    submissionProcess: {
      options: ['Oui, très simple', 'Plutôt simple', 'Plutôt compliqué', 'Très compliqué'],
      weights: [40, 40, 15, 5]
    },
    deadlines: {
      options: ['Toujours', 'Souvent', 'Parfois', 'Rarement'],
      weights: [45, 35, 15, 5]
    },
    support: {
      options: ['Excellent', 'Bon', 'Moyen', 'Insuffisant'],
      weights: [45, 35, 15, 5]
    },
    pricing: {
      options: ['Très compétitive', 'Assez compétitive', 'Peu compétitive', 'Pas du tout compétitive'],
      weights: [40, 40, 15, 5]
    }
  };

  const responses = {
    recommendation: recommendationScore,
    satisfaction: weightedRandom(standardOptions.satisfaction.options, standardOptions.satisfaction.weights),
    responseSpeed: weightedRandom(standardOptions.responseSpeed.options, standardOptions.responseSpeed.weights),
    solutions: weightedRandom(standardOptions.solutions.options, standardOptions.solutions.weights),
    clarity: weightedRandom(standardOptions.clarity.options, standardOptions.clarity.weights),
    submissionProcess: weightedRandom(standardOptions.submissionProcess.options, standardOptions.submissionProcess.weights),
    deadlines: weightedRandom(standardOptions.deadlines.options, standardOptions.deadlines.weights),
    support: weightedRandom(standardOptions.support.options, standardOptions.support.weights),
    pricing: weightedRandom(standardOptions.pricing.options, standardOptions.pricing.weights),
    suggestions: suggestions[Math.floor(Math.random() * suggestions.length)]
  };

  return responses;
};

export const seedDatabase = async (numberOfEntries = 50) => {
  try {
    for (let i = 0; i < numberOfEntries; i++) {
      const surveyData = {
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)), // Random date within last 30 days
        answers: generateRandomResponse()
      };

      await addDoc(collection(db, 'surveys'), surveyData);
      console.log(`Added entry ${i + 1}`);
    }
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};