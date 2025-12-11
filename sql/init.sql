-- GrokMemeHub Database Initialization Script
-- Drop existing database if exists and create fresh
DROP DATABASE IF EXISTS grokmemehub_db;
CREATE DATABASE grokmemehub_db;
USE grokmemehub_db;
-- Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    location_lat DECIMAL(10, 8) NULL,
    location_long DECIMAL(11, 8) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
);
-- Memes Table
CREATE TABLE memes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    caption VARCHAR(500) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    category ENUM('AI', 'Grok', 'xAI', 'Futuristic') DEFAULT 'AI',
    uploader_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_title (title),
    INDEX idx_category (category),
    INDEX idx_created_at (created_at)
);
-- Reactions Table
CREATE TABLE reactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    meme_id INT NOT NULL,
    user_id INT NOT NULL,
    reaction_type ENUM('laugh', 'robot', 'think') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meme_id) REFERENCES memes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_meme_reaction (meme_id, user_id),
    INDEX idx_meme_id (meme_id),
    INDEX idx_user_id (user_id)
);
-- Seed Users (password is 'password123' hashed with bcrypt)
INSERT INTO users (
        username,
        email,
        password,
        location_lat,
        location_long
    )
VALUES (
        'grok_master',
        'grok@christ.edu',
        '$2b$10$rXK5ZqJZGqZqJZGqZqJZGeyH.VvWVwVWvVWvVWvVWvVWvVWvVWvVW',
        12.9352,
        77.6245
    ),
    (
        'ai_enthusiast',
        'ai@christ.edu',
        '$2b$10$rXK5ZqJZGqZqJZGqZqJZGeyH.VvWVwVWvVWvVWvVWvVWvVWvVWvVW',
        12.9345,
        77.6250
    ),
    (
        'meme_lord',
        'memes@christ.edu',
        '$2b$10$rXK5ZqJZGqZqJZGqZqJZGeyH.VvWVwVWvVWvVWvVWvVWvVWvVWvVW',
        12.9360,
        77.6240
    );
-- Seed Memes (8+ AI/Grok themed memes with brainstormed captions)
INSERT INTO memes (title, caption, image_url, category, uploader_id)
VALUES (
        'Grok Solves World Hunger',
        'Grok: "Just add more puns to the food supply chain!" 🤖🍕',
        'https://via.placeholder.com/400x300/6366f1/ffffff?text=Grok+World+Hunger',
        'Grok',
        1
    ),
    (
        'AI Learning Curve',
        'Me learning AI: Tutorial says "it\'s simple" - Reality: 404 Brain Not Found 🧠❌',
        'https://via.placeholder.com/400x300/8b5cf6/ffffff?text=AI+Learning',
        'AI',
        2
    ),
    (
        'Grok vs ChatGPT Debate',
        'Grok: "I have humor!" ChatGPT: "I have accuracy!" Users: "I have trust issues now" 😅',
        'https://via.placeholder.com/400x300/ec4899/ffffff?text=Grok+vs+ChatGPT',
        'Grok',
        3
    ),
    (
        'xAI Recruitment Drive',
        'xAI Job Requirements: PhD in AI, 10 years exp, must laugh at Elon\'s jokes 🚀😂',
        'https://via.placeholder.com/400x300/f59e0b/ffffff?text=xAI+Jobs',
        'xAI',
        1
    ),
    (
        'Futuristic Dating',
        'In 2050: "Sorry, my AI assistant says we\'re not compatible" 💔🤖',
        'https://via.placeholder.com/400x300/10b981/ffffff?text=AI+Dating',
        'Futuristic',
        2
    ),
    (
        'Debugging with Grok',
        'Programmer: "Grok, find my bug!" Grok: "Found it! It\'s between chair and keyboard" 🪑💻',
        'https://via.placeholder.com/400x300/ef4444/ffffff?text=Debug+Grok',
        'Grok',
        3
    ),
    (
        'AI Singularity Mood',
        'Humans: Worried about AI taking over. AI: Still can\'t fold fitted sheets 🛏️🤷',
        'https://via.placeholder.com/400x300/3b82f6/ffffff?text=AI+Singularity',
        'AI',
        1
    ),
    (
        'Grok at 3 AM',
        'Grok answering questions at 3 AM: "Why are we here? To suffer through your queries" 🌙😴',
        'https://via.placeholder.com/400x300/a855f7/ffffff?text=Grok+3AM',
        'Grok',
        2
    ),
    (
        'Neural Networks Explained',
        'Professor: "Neural networks mimic the brain!" My neural network: *crashes on Hello World* 🧠💥',
        'https://via.placeholder.com/400x300/06b6d4/ffffff?text=Neural+Networks',
        'AI',
        3
    ),
    (
        'Futuristic Classrooms',
        'Teacher in 2040: "Please turn off your brain chips during exams!" 🧠📵',
        'https://via.placeholder.com/400x300/14b8a6/ffffff?text=Future+Class',
        'Futuristic',
        1
    );
-- Seed Reactions
INSERT INTO reactions (meme_id, user_id, reaction_type)
VALUES (1, 2, 'laugh'),
    (1, 3, 'robot'),
    (2, 1, 'think'),
    (2, 3, 'laugh'),
    (3, 1, 'laugh'),
    (3, 2, 'robot'),
    (4, 2, 'laugh'),
    (4, 3, 'think'),
    (5, 1, 'robot'),
    (6, 2, 'laugh'),
    (7, 3, 'think'),
    (8, 1, 'laugh');