const express = require('express');
const db = require('../db');
const authenticateToken = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Helper function to calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};

// Get all memes with search, filter, and sort options
router.get('/', async (req, res) => {
    // Check if database is available
    if (!global.dbAvailable) {
        return res.status(503).json({ error: 'Database unavailable - please try again later' });
    }

    try {
        const { search, category, sort, limit = 50 } = req.query;

        let query = `
      SELECT 
        m.*, 
        u.username as uploader_username,
        COUNT(DISTINCT r.id) as reaction_count
      FROM memes m
      LEFT JOIN users u ON m.uploader_id = u.id
      LEFT JOIN reactions r ON m.id = r.meme_id
    `;

        const conditions = [];
        const params = [];

        // Search filter
        if (search) {
            conditions.push('(m.title LIKE ? OR m.caption LIKE ?)');
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }

        // Category filter
        if (category) {
            conditions.push('m.category = ?');
            params.push(category);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' GROUP BY m.id';

        // Sort options
        if (sort === 'trending') {
            query += ' ORDER BY reaction_count DESC, m.created_at DESC';
        } else {
            query += ' ORDER BY m.created_at DESC';
        }

        query += ' LIMIT ?';
        params.push(parseInt(limit));

        const [memes] = await db.query(query, params);
        res.json({ memes, count: memes.length });
    } catch (error) {
        console.error('Get memes error:', error);
        res.status(500).json({ error: 'Failed to fetch memes' });
    }
});

// Get trending memes (most reactions)
router.get('/trending', async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const [memes] = await db.query(`
      SELECT 
        m.*, 
        u.username as uploader_username,
        COUNT(DISTINCT r.id) as reaction_count
      FROM memes m
      LEFT JOIN users u ON m.uploader_id = u.id
      LEFT JOIN reactions r ON m.id = r.meme_id
      GROUP BY m.id
      ORDER BY reaction_count DESC, m.created_at DESC
      LIMIT ?
    `, [parseInt(limit)]);

        res.json({ memes, count: memes.length });
    } catch (error) {
        console.error('Get trending memes error:', error);
        res.status(500).json({ error: 'Failed to fetch trending memes' });
    }
});

// Get nearby memes based on user location
router.get('/nearby', authenticateToken, async (req, res) => {
    try {
        const { radius = 10 } = req.query; // Default 10km radius

        // Get current user's location
        const [currentUser] = await db.query(
            'SELECT location_lat, location_long FROM users WHERE id = ?',
            [req.user.id]
        );

        if (!currentUser[0] || !currentUser[0].location_lat || !currentUser[0].location_long) {
            return res.status(400).json({ error: 'User location not set' });
        }

        const userLat = currentUser[0].location_lat;
        const userLong = currentUser[0].location_long;

        // Get all memes with uploader locations
        const [memes] = await db.query(`
      SELECT 
        m.*, 
        u.username as uploader_username,
        u.location_lat,
        u.location_long,
        COUNT(DISTINCT r.id) as reaction_count
      FROM memes m
      LEFT JOIN users u ON m.uploader_id = u.id
      LEFT JOIN reactions r ON m.id = r.meme_id
      WHERE u.location_lat IS NOT NULL AND u.location_long IS NOT NULL
      GROUP BY m.id
    `);

        // Filter by distance
        const nearbyMemes = memes.filter(meme => {
            const distance = calculateDistance(
                userLat,
                userLong,
                meme.location_lat,
                meme.location_long
            );
            return distance <= parseFloat(radius);
        });

        res.json({ memes: nearbyMemes, count: nearbyMemes.length });
    } catch (error) {
        console.error('Get nearby memes error:', error);
        res.status(500).json({ error: 'Failed to fetch nearby memes' });
    }
});

// Get user's own memes
router.get('/my-memes', authenticateToken, async (req, res) => {
    try {
        const [memes] = await db.query(`
      SELECT 
        m.*, 
        COUNT(DISTINCT r.id) as reaction_count
      FROM memes m
      LEFT JOIN reactions r ON m.id = r.meme_id
      WHERE m.uploader_id = ?
      GROUP BY m.id
      ORDER BY m.created_at DESC
    `, [req.user.id]);

        res.json({ memes, count: memes.length });
    } catch (error) {
        console.error('Get my memes error:', error);
        res.status(500).json({ error: 'Failed to fetch your memes' });
    }
});

// Upload new meme (protected, with file upload)
router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        const { title, caption, category } = req.body;

        // Validation
        if (!title || !caption) {
            return res.status(400).json({ error: 'Title and caption are required' });
        }

        if (caption.length > 140) {
            return res.status(400).json({ error: 'Caption must be 140 characters or less' });
        }

        if (!['AI', 'Grok', 'xAI', 'Futuristic'].includes(category)) {
            return res.status(400).json({ error: 'Invalid category' });
        }

        // Check if file was uploaded
        let imageUrl;
        if (req.file) {
            imageUrl = `/uploads/${req.file.filename}`;
        } else if (req.body.image_url) {
            imageUrl = req.body.image_url; // Allow external URLs
        } else {
            return res.status(400).json({ error: 'Image is required' });
        }

        // Insert meme
        const [result] = await db.query(
            'INSERT INTO memes (title, caption, image_url, category, uploader_id) VALUES (?, ?, ?, ?, ?)',
            [title.trim(), caption.trim(), imageUrl, category, req.user.id]
        );

        res.status(201).json({
            message: 'Meme uploaded successfully',
            meme: {
                id: result.insertId,
                title,
                caption,
                image_url: imageUrl,
                category,
                uploader_id: req.user.id
            }
        });
    } catch (error) {
        console.error('Upload meme error:', error);
        res.status(500).json({ error: 'Failed to upload meme' });
    }
});

// Update meme (only own memes)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, caption, category } = req.body;

        // Check if meme exists and belongs to user
        const [memes] = await db.query(
            'SELECT * FROM memes WHERE id = ? AND uploader_id = ?',
            [id, req.user.id]
        );

        if (memes.length === 0) {
            return res.status(404).json({ error: 'Meme not found or unauthorized' });
        }

        // Validation
        if (caption && caption.length > 140) {
            return res.status(400).json({ error: 'Caption must be 140 characters or less' });
        }

        if (category && !['AI', 'Grok', 'xAI', 'Futuristic'].includes(category)) {
            return res.status(400).json({ error: 'Invalid category' });
        }

        // Update meme
        const updates = [];
        const params = [];

        if (title) {
            updates.push('title = ?');
            params.push(title.trim());
        }
        if (caption) {
            updates.push('caption = ?');
            params.push(caption.trim());
        }
        if (category) {
            updates.push('category = ?');
            params.push(category);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        params.push(id, req.user.id);

        await db.query(
            `UPDATE memes SET ${updates.join(', ')} WHERE id = ? AND uploader_id = ?`,
            params
        );

        res.json({ message: 'Meme updated successfully' });
    } catch (error) {
        console.error('Update meme error:', error);
        res.status(500).json({ error: 'Failed to update meme' });
    }
});

// Delete meme (only own memes)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if meme exists and belongs to user
        const [memes] = await db.query(
            'SELECT * FROM memes WHERE id = ? AND uploader_id = ?',
            [id, req.user.id]
        );

        if (memes.length === 0) {
            return res.status(404).json({ error: 'Meme not found or unauthorized' });
        }

        // Delete meme (reactions will be deleted automatically due to CASCADE)
        await db.query('DELETE FROM memes WHERE id = ?', [id]);

        res.json({ message: 'Meme deleted successfully' });
    } catch (error) {
        console.error('Delete meme error:', error);
        res.status(500).json({ error: 'Failed to delete meme' });
    }
});

// Add reaction to meme
router.post('/:id/reactions', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { reaction_type } = req.body;

        // Validation
        if (!['laugh', 'robot', 'think'].includes(reaction_type)) {
            return res.status(400).json({ error: 'Invalid reaction type' });
        }

        // Check if meme exists
        const [memes] = await db.query('SELECT id FROM memes WHERE id = ?', [id]);
        if (memes.length === 0) {
            return res.status(404).json({ error: 'Meme not found' });
        }

        // Check if user already reacted
        const [existing] = await db.query(
            'SELECT id, reaction_type FROM reactions WHERE meme_id = ? AND user_id = ?',
            [id, req.user.id]
        );

        if (existing.length > 0) {
            // Update existing reaction
            await db.query(
                'UPDATE reactions SET reaction_type = ? WHERE id = ?',
                [reaction_type, existing[0].id]
            );
            return res.json({ message: 'Reaction updated successfully' });
        }

        // Add new reaction
        const [result] = await db.query(
            'INSERT INTO reactions (meme_id, user_id, reaction_type) VALUES (?, ?, ?)',
            [id, req.user.id, reaction_type]
        );

        res.status(201).json({
            message: 'Reaction added successfully',
            reaction: {
                id: result.insertId,
                meme_id: id,
                user_id: req.user.id,
                reaction_type
            }
        });
    } catch (error) {
        console.error('Add reaction error:', error);
        res.status(500).json({ error: 'Failed to add reaction' });
    }
});

// Update reaction type
router.put('/reactions/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { reaction_type } = req.body;

        // Validation
        if (!['laugh', 'robot', 'think'].includes(reaction_type)) {
            return res.status(400).json({ error: 'Invalid reaction type' });
        }

        // Check if reaction exists and belongs to user
        const [reactions] = await db.query(
            'SELECT * FROM reactions WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );

        if (reactions.length === 0) {
            return res.status(404).json({ error: 'Reaction not found or unauthorized' });
        }

        // Update reaction
        await db.query(
            'UPDATE reactions SET reaction_type = ? WHERE id = ?',
            [reaction_type, id]
        );

        res.json({ message: 'Reaction updated successfully' });
    } catch (error) {
        console.error('Update reaction error:', error);
        res.status(500).json({ error: 'Failed to update reaction' });
    }
});

// Delete reaction
router.delete('/reactions/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if reaction exists and belongs to user
        const [reactions] = await db.query(
            'SELECT * FROM reactions WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );

        if (reactions.length === 0) {
            return res.status(404).json({ error: 'Reaction not found or unauthorized' });
        }

        // Delete reaction
        await db.query('DELETE FROM reactions WHERE id = ?', [id]);

        res.json({ message: 'Reaction deleted successfully' });
    } catch (error) {
        console.error('Delete reaction error:', error);
        res.status(500).json({ error: 'Failed to delete reaction' });
    }
});

// Get reactions for a specific meme
router.get('/:id/reactions', async (req, res) => {
    try {
        const { id } = req.params;

        const [reactions] = await db.query(`
      SELECT 
        r.*,
        u.username
      FROM reactions r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.meme_id = ?
      ORDER BY r.created_at DESC
    `, [id]);

        // Count by type
        const counts = {
            laugh: reactions.filter(r => r.reaction_type === 'laugh').length,
            robot: reactions.filter(r => r.reaction_type === 'robot').length,
            think: reactions.filter(r => r.reaction_type === 'think').length,
            total: reactions.length
        };

        res.json({ reactions, counts });
    } catch (error) {
        console.error('Get reactions error:', error);
        res.status(500).json({ error: 'Failed to fetch reactions' });
    }
});

module.exports = router;
