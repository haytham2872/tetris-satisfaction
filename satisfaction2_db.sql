-- Create database
CREATE DATABASE IF NOT EXISTS satisfaction_db;
USE satisfaction_db;

-- Create forms table first (since it's referenced by other tables)
CREATE TABLE forms (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create questions table
CREATE TABLE questions (
    id INT NOT NULL AUTO_INCREMENT,
    question_text TEXT NOT NULL,
    question_type ENUM('rating','stars','choice','text') NOT NULL,
    max_value INT DEFAULT NULL,
    class VARCHAR(50) DEFAULT NULL,
    options JSON NULL,
    form_id INT NULL,
    PRIMARY KEY (id),
    CONSTRAINT FK_Questions_Forms FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create surveys table
CREATE TABLE surveys (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    score_negatif FLOAT DEFAULT NULL,
    form_id INT NULL,
    PRIMARY KEY (id),
    CONSTRAINT FK_Surveys_Forms FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create responses table
CREATE TABLE responses (
    id INT NOT NULL AUTO_INCREMENT,
    survey_id INT NOT NULL,
    question_id INT NOT NULL,
    answer TEXT NOT NULL,
    optional_answer TEXT DEFAULT NULL,
    nlp_analysis JSON DEFAULT NULL,
    responded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    form_id INT NULL,
    PRIMARY KEY (id),
    KEY survey_id (survey_id),
    KEY question_id (question_id),
    CONSTRAINT responses_ibfk_1 FOREIGN KEY (survey_id) REFERENCES surveys (id) ON DELETE CASCADE,
    CONSTRAINT responses_ibfk_2 FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE,
    CONSTRAINT FK_Responses_Forms FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create low_satisfaction_responses table
CREATE TABLE low_satisfaction_responses (
    id INT NOT NULL AUTO_INCREMENT,
    survey_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    commentaire TEXT NULL,
    form_id INT NULL,
    PRIMARY KEY (id),
    KEY survey_id (survey_id),
    CONSTRAINT low_satisfaction_responses_ibfk_1 FOREIGN KEY (survey_id) REFERENCES surveys (id) ON DELETE CASCADE,
    CONSTRAINT FK_LowSatisfaction_Forms FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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

-- Update question options
UPDATE questions SET options = JSON_ARRAY("Excellent", "Bon", "Moyen", "Insuffisant") WHERE id = 3;
UPDATE questions SET options = JSON_ARRAY("Toujours", "Souvent", "Parfois", "Rarement") WHERE id = 4;
UPDATE questions SET options = JSON_ARRAY("Très clair", "Clair", "Peu clair", "Pas clair du tout") WHERE id = 5;
UPDATE questions SET options = JSON_ARRAY("Oui, très simple", "Plutôt simple", "Plutôt compliqué", "Très compliqué") WHERE id = 6;
UPDATE questions SET options = JSON_ARRAY("Toujours", "Souvent", "Parfois", "Rarement") WHERE id = 7;
UPDATE questions SET options = JSON_ARRAY("Excellent", "Bon", "Moyen", "Insuffisant") WHERE id = 8;
UPDATE questions SET options = JSON_ARRAY("Très compétitive", "Assez compétitive", "Peu compétitive", "Pas du tout compétitive") WHERE id = 9;