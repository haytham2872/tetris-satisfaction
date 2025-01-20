const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Configuration de la base de données
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', // Remplacez par votre utilisateur MySQL
  password: '123', // Remplacez par votre mot de passe MySQL
  database: 'satisfaction_db', // Nom de votre base de données
});

// Connexion à la base de données
db.connect(err => {
  if (err) {
    console.error('Erreur de connexion à la base de données:', err);
    return;
  }
  console.log('Connecté à la base de données MySQL.');
});

//Route pour commencer le formulaire
app.post('/api/start-survey', (req, res) => {
  const { name } = req.body; // Nom ou description du survey, optionnel
  const sql = 'INSERT INTO surveys (name) VALUES (?)';

  db.query(sql, [name || 'Nouveau survey'], (err, result) => {
    if (err) {
      console.error('Erreur lors de la création du survey:', err);
      res.status(500).send('Erreur serveur');
      return;
    }
    res.status(201).send({ id: result.insertId }); // Retourne l'ID généré
  });
});

// Route pour stocker les réponses
app.post('/api/responses', (req, res) => {
  const { survey_id, responses } = req.body;

  if (!survey_id || !responses || Object.keys(responses).length === 0) {
    return res.status(400).send('Données invalides. Assurez-vous d\'inclure survey_id et responses.');
  }

  // Construire la requête SQL
  const sql = 'INSERT INTO responses (survey_id, question_id, answer, responded_at) VALUES ?';
  const currentDateTime = new Date(); // Date/heure actuelle pour responded_at
  const values = Object.entries(responses).map(([questionId, answer]) => [
    survey_id, // ID du survey
    questionId, // ID de la question
    answer, // Réponse donnée
    currentDateTime // Date de la réponse
  ]);

  // Insérer les réponses dans la base de données
  db.query(sql, [values], (err, result) => {
    if (err) {
      console.error('Erreur lors de l\'insertion des réponses:', err);
      res.status(500).send('Erreur serveur');
      return;
    }
    res.status(200).send('Réponses enregistrées avec succès.');
  });
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
