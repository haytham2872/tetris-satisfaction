// src/constants/questions.js
export const questions = [
    { id: 1, text: "Recommanderiez-vous notre service à d'autres courtiers ?", type: "rating", max: 10 },
    { id: 2, text: "Quel est votre niveau de satisfaction globale concernant nos services ?", type: "stars", max: 5 },
    { id: 3, text: "Comment évaluez-vous la rapidité de nos réponses à vos demandes ?", type: "choice", options: ["Excellent", "Bon", "Moyen", "Insuffisant"] },
    { id: 4, text: "Les solutions d'assurance proposées correspondent-elles à vos besoins ?", type: "choice", options: ["Toujours", "Souvent", "Parfois", "Rarement"] },
    { id: 5, text: "Comment jugez-vous la clarté des informations fournies ?", type: "choice", options: ["Très clair", "Clair", "Peu clair", "Pas clair du tout"] },
    { id: 6, text: "Le processus de soumission des dossiers est-il simple à utiliser ?", type: "choice", options: ["Oui, très simple", "Plutôt simple", "Plutôt compliqué", "Très compliqué"] },
    { id: 7, text: "Les délais de traitement des dossiers sont-ils respectés ?", type: "choice", options: ["Toujours", "Souvent", "Parfois", "Rarement"] },
    { id: 8, text: "Comment évaluez-vous le support technique fourni ?", type: "choice", options: ["Excellent", "Bon", "Moyen", "Insuffisant"] },
    { id: 9, text: "La tarification proposée est-elle compétitive ?", type: "choice", options: ["Très compétitive", "Assez compétitive", "Peu compétitive", "Pas du tout compétitive"] },
    { id: 10, text: "Avez-vous des suggestions d'amélioration ou des commentaires ?", type: "text" }
  ];