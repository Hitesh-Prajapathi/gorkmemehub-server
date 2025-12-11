const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const pool = require('./db');
const authRoutes = require('./routes/auth');
const memeRoutes = require('./routes/memes');

const app = express();
const PORT = process.env.PORT || 5000;

// Global DB availability flag
global.dbAvailable = false;

// Database connection retry logic
async function tryConnect(retries = 3, delayMs = 3000) {
    for (let i = 0; i < retries; i++) {
        try {
            await pool.query('SELECT 1');
            console.log('✅ Database connected successfully!');
            global.dbAvailable = true;
            return true;
        } catch (err) {
            console.error(`❌ DB connect attempt ${i + 1}/${retries} failed:`, err.message || err);
            if (i < retries - 1) {
                console.log(`⏳ Retrying in ${delayMs / 1000}s...`);
                await new Promise(r => setTimeout(r, delayMs));
            }
        }
    }
    console.error('💥 Could not connect to DB after retries - server will start but DB queries will fail');
    global.dbAvailable = false;
    return false;
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/memes', memeRoutes);

// Health check endpoint with DB status
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'GrokMemeHub API is running!',
        timestamp: new Date().toISOString(),
        dbAvailable: global.dbAvailable
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
    });
});

// Start server with DB retry logic
(async () => {
    await tryConnect(3, 3000);

    app.listen(PORT, () => {
        console.log(`🚀 GrokMemeHub server running on http://localhost:${PORT}`);
        console.log(`📝 API Health: http://localhost:${PORT}/api/health`);
        console.log(`📊 Database Status: ${global.dbAvailable ? '✅ Connected' : '❌ Not Connected'}`);
    });
})();

module.exports = app;
