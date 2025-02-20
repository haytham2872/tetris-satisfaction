-- Create database
CREATE DATABASE IF NOT EXISTS satisfaction_db;
USE satisfaction_db;

-- Create questions table
CREATE TABLE questions (
    id int NOT NULL AUTO_INCREMENT,
    question_text text NOT NULL,
    question_type enum('rating','stars','choice','text') NOT NULL,
    max_value int DEFAULT NULL,
    class VARCHAR(50) DEFAULT NULL,
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
    optional_answer TEXT DEFAULT NULL,
    nlp_analysis JSON DEFAULT NULL,
    responded_at datetime DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY survey_id (survey_id),
    KEY question_id (question_id),
    CONSTRAINT responses_ibfk_1 FOREIGN KEY (survey_id) REFERENCES surveys (id) ON DELETE CASCADE,
    CONSTRAINT responses_ibfk_2 FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create low_satisfaction_responses table
CREATE TABLE low_satisfaction_responses (
    id int NOT NULL AUTO_INCREMENT,
    survey_id int NOT NULL,
    name varchar(255) NOT NULL,
    phone varchar(20) NOT NULL,
    email varchar(255) NOT NULL,
    created_at datetime DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY survey_id (survey_id),
    CONSTRAINT low_satisfaction_responses_ibfk_1 FOREIGN KEY (survey_id) REFERENCES surveys (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


ALTER TABLE questions ADD COLUMN options JSON NULL;

DROP TABLE IF EXISTS question_options;

-- Insert questions
INSERT INTO questions (id, question_text, question_type, max_value, class) VALUES
(1, "Recommanderiez-vous notre service à d'autres courtiers ?", 'rating', 10, 'satisfaction'),
(2, "Quel est votre niveau de satisfaction globale concernant nos services ?", 'stars', 5, 'satisfaction'),
(3, "Comment évaluez-vous la rapidité de nos réponses à vos demandes ?", 'choice', NULL, 'performance'),
(4, "Les solutions d'assurance proposées correspondent-elles à vos besoins ?", 'choice', NULL, 'adequacy'),
(5, "Comment jugez-vous la clarté des informations fournies ?", 'choice', NULL, 'clarity'),
(6, "Le processus de soumission des dossiers est-il simple à utiliser ?", 'choice', NULL, 'usability'),
(7, "Les délais de traitement des dossiers sont-ils respectés ?", 'choice', NULL, 'performance'),
(8, "Comment évaluez-vous le support technique fourni ?", 'choice', NULL, 'support'),
(9, "La tarification proposée est-elle compétitive ?", 'choice', NULL, 'pricing'),
(10, "Avez-vous des suggestions d'amélioration ou des commentaires ?", 'text', NULL, 'feedback');

-- Update question 3
UPDATE questions 
SET options = JSON_ARRAY("Excellent", "Bon", "Moyen", "Insuffisant")
WHERE id = 3;

-- Update question 4
UPDATE questions 
SET options = JSON_ARRAY("Toujours", "Souvent", "Parfois", "Rarement")
WHERE id = 4;

-- Update question 5
UPDATE questions 
SET options = JSON_ARRAY("Très clair", "Clair", "Peu clair", "Pas clair du tout")
WHERE id = 5;

-- Update question 6
UPDATE questions 
SET options = JSON_ARRAY("Oui, très simple", "Plutôt simple", "Plutôt compliqué", "Très compliqué")
WHERE id = 6;

-- Update question 7
UPDATE questions 
SET options = JSON_ARRAY("Toujours", "Souvent", "Parfois", "Rarement")
WHERE id = 7;

-- Update question 8
UPDATE questions 
SET options = JSON_ARRAY("Excellent", "Bon", "Moyen", "Insuffisant")
WHERE id = 8;

-- Update question 9
UPDATE questions 
SET options = JSON_ARRAY("Très compétitive", "Assez compétitive", "Peu compétitive", "Pas du tout compétitive")
WHERE id = 9;

ALTER TABLE surveys
ADD COLUMN score_negatif FLOAT DEFAULT NULL;


CREATE TABLE forms (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    is_active BIT DEFAULT 1
);


ALTER TABLE low_satisfaction_responses
ADD commentaire nvarchar NULL;

-- Ajouter form_id à la table questions
ALTER TABLE questions
ADD form_id INT NULL;

-- Ajouter form_id à la table responses
ALTER TABLE responses
ADD form_id INT NULL;

ALTER TABLE surveys
ADD form_id INT NULL;

-- Ajouter form_id à la table low_satisfaction_responses
ALTER TABLE low_satisfaction_responses
ADD form_id INT NULL;

-- Si vous voulez ajouter une contrainte de clé étrangère
ALTER TABLE questions
ADD CONSTRAINT FK_Questions_Forms 
FOREIGN KEY (form_id) REFERENCES forms(id);

ALTER TABLE responses
ADD CONSTRAINT FK_Responses_Forms 
FOREIGN KEY (form_id) REFERENCES forms(id);

ALTER TABLE low_satisfaction_responses
ADD CONSTRAINT FK_LowSatisfaction_Forms 
FOREIGN KEY (form_id) REFERENCES forms(id);

ALTER TABLE surveys
ADD CONSTRAINT FK_surveys_Forms 
FOREIGN KEY (form_id) REFERENCES forms(id);
