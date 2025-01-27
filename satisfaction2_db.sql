-- Create database
CREATE DATABASE IF NOT EXISTS satisfaction_db;
USE satisfaction_db;

-- Create questions table
CREATE TABLE questions (
  id int NOT NULL AUTO_INCREMENT,
  question_text text NOT NULL,
  question_type enum('rating','stars','choice','text') NOT NULL,
  max_value int DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create surveys table
CREATE TABLE surveys (
  id int NOT NULL AUTO_INCREMENT,
  name varchar(255) NOT NULL,
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create responses table
CREATE TABLE responses (
  id int NOT NULL AUTO_INCREMENT,
  survey_id int NOT NULL,
  question_id int NOT NULL,
  answer text NOT NULL,
  user_id int DEFAULT NULL,
  responded_at datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY survey_id (survey_id),
  KEY question_id (question_id),
  CONSTRAINT responses_ibfk_1 FOREIGN KEY (survey_id) REFERENCES surveys (id) ON DELETE CASCADE,
  CONSTRAINT responses_ibfk_2 FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
INSERT INTO questions (id, question_text, question_type, max_value) VALUES
(1, "Recommanderiez-vous notre service à d'autres courtiers ?", 'rating', 10),
(2, "Quel est votre niveau de satisfaction globale concernant nos services ?", 'stars', 5),
(3, "Comment évaluez-vous la rapidité de nos réponses à vos demandes ?", 'choice', NULL),
(4, "Les solutions d'assurance proposées correspondent-elles à vos besoins ?", 'choice', NULL),
(5, "Comment jugez-vous la clarté des informations fournies ?", 'choice', NULL),
(6, "Le processus de soumission des dossiers est-il simple à utiliser ?", 'choice', NULL),
(7, "Les délais de traitement des dossiers sont-ils respectés ?", 'choice', NULL),
(8, "Comment évaluez-vous le support technique fourni ?", 'choice', NULL),
(9, "La tarification proposée est-elle compétitive ?", 'choice', NULL),
(10, "Avez-vous des suggestions d'amélioration ou des commentaires ?", 'text', NULL);

ALTER TABLE responses
ADD COLUMN optional_answer TEXT DEFAULT NULL;
