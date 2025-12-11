-- Railway Database Setup (no DROP/CREATE DATABASE needed)
-- Users Table
CREATE TABLE IF NOT EXISTS users (
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
CREATE TABLE IF NOT EXISTS memes (
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
CREATE TABLE IF NOT EXISTS reactions (
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
-- Seed Users
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
-- Seed Memes with Unsplash images
INSERT INTO memes (title, caption, image_url, category, uploader_id)
VALUES (
        'Grok Solves World Hunger',
        'Grok: "Just add more puns to the food supply chain!" 🤖🍕',
        'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=450&fit=crop',
        'Grok',
        1
    ),
    (
        'AI Learning Curve',
        'Me learning AI: Tutorial says "it is simple" - Reality: 404 Brain Not Found 🧠❌',
        'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&h=450&fit=crop',
        'AI',
        2
    ),
    (
        'Grok vs ChatGPT Debate',
        'Grok: "I have humor!" ChatGPT: "I have accuracy!" Users: "I have trust issues now" 😅',
        'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=600&h=450&fit=crop',
        'Grok',
        3
    ),
    (
        'xAI Recruitment Drive',
        'xAI Job Requirements: PhD in AI, 10 years exp, must laugh at Elon jokes 🚀😂',
        'https://images.unsplash.com/photo-1535378620166-273708d44e4c?w=600&h=450&fit=crop',
        'xAI',
        1
    ),
    (
        'Futuristic Dating',
        'In 2050: "Sorry, my AI assistant says we are not compatible" 💔🤖',
        'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&h=450&fit=crop',
        'Futuristic',
        2
    ),
    (
        'Debugging with Grok',
        'Programmer: "Grok, find my bug!" Grok: "Found it! It is between chair and keyboard" 🪑💻',
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&h=450&fit=crop',
        'Grok',
        3
    ),
    (
        'AI Singularity Mood',
        'Humans: Worried about AI taking over. AI: Still cannot fold fitted sheets 🛏️🤷',
        'https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=600&h=450&fit=crop',
        'AI',
        1
    ),
    (
        'Grok at 3 AM',
        'Grok answering questions at 3 AM: "Why are we here? To suffer through your queries" 🌙😴',
        'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&h=450&fit=crop',
        'Grok',
        2
    ),
    (
        'Neural Networks Explained',
        'Professor: "Neural networks mimic the brain!" My neural network: crashes on Hello World 🧠💥',
        'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&h=450&fit=crop',
        'AI',
        3
    ),
    (
        'Futuristic Classrooms',
        'Teacher in 2040: "Please turn off your brain chips during exams!" 🧠📵',
        'https://images.unsplash.com/photo-1555255707-c07966088b7b?w=600&h=450&fit=crop',
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