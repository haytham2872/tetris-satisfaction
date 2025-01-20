# Tetris Satisfaction Survey Platform

Une plateforme complète pour collecter et visualiser les retours clients de Tetris Assurance. Cette application React moderne permet de gérer les enquêtes de satisfaction et de visualiser les données à travers des tableaux de bord interactifs.

## 🚀 Fonctionnalités

### Enquête de Satisfaction
- Questionnaire progressif en 10 étapes
- Différents types de questions (notation, étoiles, choix multiples, texte)
- Interface utilisateur intuitive et responsive
- Animations fluides et retours visuels
- Sauvegarde automatique dans Firebase

### Visualisation des Données
- **Statistiques Principales**
  - Score de recommandation (NPS)
  - Niveau de satisfaction globale
  - Rapidité des réponses
  - Adéquation des solutions
  - Compteur total des réponses

- **Statistiques Complémentaires**
  - Clarté des informations
  - Simplicité du processus
  - Respect des délais
  - Support technique
  - Tarification

### Caractéristiques Techniques
- Visualisations interactives avec Recharts
- Stockage des données dans Firebase
- Interface responsive avec Tailwind CSS
- Animations personnalisées
- Mode développement avec données de test

## 🛠 Technologies Utilisées

- React 19
- Firebase Firestore
- Tailwind CSS
- Recharts
- Lucide React Icons
- Shadcn/UI Components

## ⚙️ Installation

1. Clonez le repository :
```bash
git clone https://github.com/your-username/tetris-satisfaction-survey.git
cd tetris-satisfaction-survey
```

2. Installez les dépendances :
```bash
npm install
```

3. Créez un fichier `.env` à la racine du projet et ajoutez vos configurations Firebase :
```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

4. Lancez l'application en mode développement :
```bash
npm start
```

## 📊 Données de Test

En mode développement, vous pouvez utiliser la fonction de seed pour générer des données de test :

1. Un bouton "Remplir DB (DEV)" est disponible en haut à droite
2. Les données générées sont pondérées pour refléter une satisfaction client réaliste :
   - ~80% de retours positifs
   - ~15% de retours neutres
   - ~5% de retours négatifs

## 📱 Structure des Composants

```
src/
├── components/
│   ├── SatisfactionAnalytics.js    # Tableaux de bord principaux
│   ├── AdditionalAnalytics.js      # Statistiques complémentaires
│   └── FloatingButton.js           # Bouton de navigation
├── config/
│   └── firebase.js                 # Configuration Firebase
├── assets/
│   └── logo.png                    # Assets graphiques
└── App.js                          # Composant principal
```

## 🔄 Flux de Navigation

1. Page d'enquête principale
2. Écran de remerciement après soumission
3. Tableaux de bord statistiques
   - Vue principale des statistiques
   - Vue détaillée des statistiques complémentaires

## 🛡 Sécurité

- Les données sont stockées de manière sécurisée dans Firebase Firestore
- Pas de données personnelles collectées
- Mode développement clairement séparé du mode production

## 📈 Évolutions Futures Possibles

- Export des données au format CSV/Excel
- Filtres par période
- Analyses comparatives
- Mode sombre
- Internationalisation
- Tableau de bord administrateur

## 📝 License

Ce projet est la propriété de Tetris Assurance. Tous droits réservés.

## 👥 Contribution

Pour contribuer au projet :
1. Fork le projet
2. Créez votre branche (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push sur la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request
