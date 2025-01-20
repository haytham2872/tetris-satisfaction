-- MySQL dump 10.13  Distrib 8.0.39, for Win64 (x86_64)
--
-- Host: localhost    Database: satisfaction_db
-- ------------------------------------------------------
-- Server version	8.0.39

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `questions`
--

DROP TABLE IF EXISTS `questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `questions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `question_text` text NOT NULL,
  `question_type` enum('rating','stars','choice','text') NOT NULL,
  `max_value` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `questions`
--

LOCK TABLES `questions` WRITE;
/*!40000 ALTER TABLE `questions` DISABLE KEYS */;
INSERT INTO `questions` VALUES (1,'Recommanderiez-vous notre service à d\'autres courtiers ?','rating',10),(2,'Quel est votre niveau de satisfaction globale concernant nos services ?','stars',5),(3,'Comment évaluez-vous la rapidité de nos réponses à vos demandes ?','choice',NULL),(4,'Les solutions d\'assurance proposées correspondent-elles à vos besoins ?','choice',NULL),(5,'Comment jugez-vous la clarté des informations fournies ?','choice',NULL),(6,'Le processus de soumission des dossiers est-il simple à utiliser ?','choice',NULL),(7,'Les délais de traitement des dossiers sont-ils respectés ?','choice',NULL),(8,'Comment évaluez-vous le support technique fourni ?','choice',NULL),(9,'La tarification proposée est-elle compétitive ?','choice',NULL),(10,'Avez-vous des suggestions d\'amélioration ou des commentaires ?','text',NULL);
/*!40000 ALTER TABLE `questions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `responses`
--

DROP TABLE IF EXISTS `responses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `responses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `survey_id` int NOT NULL,
  `question_id` int NOT NULL,
  `answer` text NOT NULL,
  `user_id` int DEFAULT NULL,
  `responded_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `survey_id` (`survey_id`),
  KEY `question_id` (`question_id`),
  CONSTRAINT `responses_ibfk_1` FOREIGN KEY (`survey_id`) REFERENCES `surveys` (`id`) ON DELETE CASCADE,
  CONSTRAINT `responses_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `responses`
--

LOCK TABLES `responses` WRITE;
/*!40000 ALTER TABLE `responses` DISABLE KEYS */;
INSERT INTO `responses` VALUES (51,10,1,'8',NULL,'2025-01-20 13:35:56'),(52,10,2,'4',NULL,'2025-01-20 13:35:56'),(53,10,3,'Excellent',NULL,'2025-01-20 13:35:56'),(54,10,4,'Toujours',NULL,'2025-01-20 13:35:56'),(55,10,5,'Très clair',NULL,'2025-01-20 13:35:56'),(56,10,6,'Oui, très simple',NULL,'2025-01-20 13:35:56'),(57,10,7,'Toujours',NULL,'2025-01-20 13:35:56'),(58,10,8,'Excellent',NULL,'2025-01-20 13:35:56'),(59,10,9,'Très compétitive',NULL,'2025-01-20 13:35:56'),(60,10,10,'13.35',NULL,'2025-01-20 13:35:56');
/*!40000 ALTER TABLE `responses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `surveys`
--

DROP TABLE IF EXISTS `surveys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `surveys` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `surveys`
--

LOCK TABLES `surveys` WRITE;
/*!40000 ALTER TABLE `surveys` DISABLE KEYS */;
INSERT INTO `surveys` VALUES (1,'Survey 2025-01-20T10:43:06.485Z','2025-01-20 11:43:06'),(2,'Survey 2025-01-20T10:43:06.478Z','2025-01-20 11:43:06'),(3,'Survey 2025-01-20T10:54:54.027Z','2025-01-20 11:54:54'),(4,'Survey 2025-01-20T10:54:54.029Z','2025-01-20 11:54:54'),(5,'Survey 2025-01-20T11:00:25.170Z','2025-01-20 12:00:25'),(6,'Survey 2025-01-20T11:00:25.166Z','2025-01-20 12:00:25'),(7,'Survey 2025-01-20T12:31:37.211Z','2025-01-20 13:31:37'),(8,'Survey 2025-01-20T12:31:37.205Z','2025-01-20 13:31:37'),(9,'Survey 2025-01-20T12:34:22.971Z','2025-01-20 13:34:23'),(10,'Survey 2025-01-20T12:34:22.968Z','2025-01-20 13:34:23');
/*!40000 ALTER TABLE `surveys` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-01-20 13:39:42
