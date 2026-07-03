require('dotenv').config();

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 5500;
const SESSION_DAYS = 7;

app.use(cors());
app.use(express.json());

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64);
    return `${salt}:${hash.toString('hex')}`;
}

function verifyPassword(password, stored) {
    if (!stored || !stored.includes(':')) return false;
    const [salt, hash] = stored.split(':');
    if (!salt || !hash) return false;

    const hashBuffer = Buffer.from(hash, 'hex');
    const hashVerify = crypto.scryptSync(password, salt, 64);

    if (hashBuffer.length !== hashVerify.length) return false;
    return crypto.timingSafeEqual(hashBuffer, hashVerify);
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function createSessionToken(userId) {
    return new Promise((resolve, reject) => {
        const token = crypto.randomBytes(32).toString('hex');
        const sql = `INSERT INTO sessions (token, user_id, expires_at)
                     VALUES (?, ?, datetime('now', '+${SESSION_DAYS} days'))`;

        db.run(sql, [token, userId], (err) => {
            if (err) reject(err);
            else resolve(token);
        });
    });
}

function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required.' });
    }

    const token = authHeader.slice(7);
    const sql = `SELECT u.id, u.name, u.email
                 FROM sessions s
                 JOIN users u ON s.user_id = u.id
                 WHERE s.token = ? AND s.expires_at > datetime('now')`;

    db.get(sql, [token], (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!user) return res.status(401).json({ error: 'Invalid or expired session.' });

        req.user = user;
        req.token = token;
        next();
    });
}

const db = new sqlite3.Database('./websites.db', (err) => {
    if (err) console.error(err.message);
    else console.log('Connected to the SQLite database.');
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        expires_at DATETIME NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS websites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prompt TEXT,
        code TEXT,
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    db.run(`ALTER TABLE websites ADD COLUMN user_id INTEGER`, () => {});
    db.run(`ALTER TABLE websites ADD COLUMN created_at DATETIME`, (err) => {
        if (!err) {
            db.run(`UPDATE websites SET created_at = datetime('now') WHERE created_at IS NULL`);
        }
    });

    app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
});

const openRouterApiKey = process.env.OPENROUTER_API_KEY;
if (!openRouterApiKey) {
    console.warn('Warning: OPENROUTER_API_KEY is not set. AI generation will fail.');
}

async function sendAuthResponse(res, user, statusCode = 200) {
    try {
        const token = await createSessionToken(user.id);
        res.status(statusCode).json({
            id: user.id,
            name: user.name,
            email: user.email,
            token
        });
    } catch {
        res.status(500).json({ error: 'Could not create session.' });
    }
}

app.post('/api/register', (req, res) => {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (!isValidEmail(email.trim())) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const hashedPassword = hashPassword(password);
    const sql = `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`;

    db.run(sql, [name.trim(), email.trim().toLowerCase(), hashedPassword], function (err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.status(409).json({ error: 'An account with this email already exists.' });
            }
            return res.status(500).json({ error: 'Database error' });
        }

        sendAuthResponse(res, {
            id: this.lastID,
            name: name.trim(),
            email: email.trim().toLowerCase()
        }, 201);
    });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    const sql = `SELECT id, name, email, password FROM users WHERE email = ?`;

    db.get(sql, [email.trim().toLowerCase()], (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!user || !verifyPassword(password, user.password)) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        sendAuthResponse(res, { id: user.id, name: user.name, email: user.email });
    });
});

app.post('/api/logout', requireAuth, (req, res) => {
    db.run(`DELETE FROM sessions WHERE token = ?`, [req.token], (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ message: 'Logged out.' });
    });
});

app.get('/api/me', requireAuth, (req, res) => {
    res.json(req.user);
});

app.get('/api/projects', requireAuth, (req, res) => {
    const sql = `SELECT id, prompt, created_at FROM websites WHERE user_id = ? ORDER BY created_at DESC`;

    db.all(sql, [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

app.get('/api/projects/:id', requireAuth, (req, res) => {
    const sql = `SELECT id, prompt, code, created_at FROM websites WHERE id = ? AND user_id = ?`;

    db.get(sql, [req.params.id, req.user.id], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!row) return res.status(404).json({ error: 'Project not found.' });
        res.json(row);
    });
});

app.post('/api/generate', requireAuth, async (req, res) => {
    const { prompt } = req.body;

    console.log('Generate request received:', prompt?.substring(0, 50) + '...');

    if (!prompt?.trim()) {
        return res.status(400).json({ error: 'A prompt is required.' });
    }

    if (!openRouterApiKey) {
        return res.status(500).json({ error: 'AI service is not configured. Set OPENROUTER_API_KEY in .env' });
    }

    try {
        console.log('Calling OpenRouter API...');
        const systemPrompt = `You are an elite front-end developer and expert UI/UX designer. Create a complete, modern, and visually stunning website for this request: "${prompt.trim()}".

CRITICAL REQUIREMENTS:
1. Return ONLY a single, valid HTML file starting immediately with <!DOCTYPE html>. No markdown code blocks, no explanations, no conversational text.
2. Use Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script> for styling.
3. Import Google Fonts (Inter or Poppins) for typography.
4. Design principles: ample whitespace, elegant typography, harmonious colors, subtle shadows, smooth hover animations.
5. Include custom CSS in <style> block for animations/glassmorphism.
6. Include INTERACTIVE JavaScript in <script> block - add working buttons, forms, sliders, tabs, modals, or other interactive elements relevant to the website type.
7. Use placeholder images from https://picsum.photos/seed/{random}/800/600 or https://placehold.co.
8. Ensure mobile and desktop responsive layouts.
9. All CSS and JS must be inline - no external file references.
10. Avoid using external APIs that require keys.
11. Make it INTERACTIVE - add event listeners, form validation, dynamic content updates, animations on scroll, etc.`;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openRouterApiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:5500',
                'X-Title': 'AI Website Builder'
            },
            body: JSON.stringify({
                model: 'openai/gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt }
                ],
                temperature: 0.7,
                max_tokens: 8192
            })
        });

        console.log('API response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error:', errorData);
            throw new Error(errorData.error?.message || 'OpenRouter API request failed');
        }

        const data = await response.json();
        console.log('API response received, choices:', data.choices?.length);
        let generatedCode = data.choices[0]?.message?.content || '';

        console.log('Generated code length:', generatedCode.length);

        // Clean up markdown code blocks more thoroughly
        generatedCode = generatedCode
            .replace(/```html\n?/gi, '')
            .replace(/```\n?/g, '')
            .replace(/^[^{]*<!DOCTYPE html>/i, '<!DOCTYPE html>')
            .trim();

        // Validate that we got HTML
        if (!generatedCode.toLowerCase().startsWith('<!doctype html') && !generatedCode.toLowerCase().startsWith('<html')) {
            console.error('Invalid HTML generated:', generatedCode.substring(0, 100));
            throw new Error('Generated content is not valid HTML');
        }

        console.log('Saving to database...');
        const sql = `INSERT INTO websites (prompt, code, user_id) VALUES (?, ?, ?)`;
        db.run(sql, [prompt.trim(), generatedCode, req.user.id], function (err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            console.log('Website saved successfully, ID:', this.lastID);
            res.json({ id: this.lastID, code: generatedCode });
        });
    } catch (error) {
        console.error('AI Generation Error:', error);
        if (error.message.includes('quota') || error.message.includes('limit') || error.message.includes('credits')) {
            return res.status(429).json({ error: 'API quota exceeded. Please try again later.' });
        }
        if (error.message.includes('invalid') || error.message.includes('API key') || error.message.includes('authentication')) {
            return res.status(500).json({ error: 'Invalid API configuration. Contact administrator.' });
        }
        res.status(500).json({ error: 'AI Generation failed: ' + error.message });
    }
});

const BLOCKED_PATHS = [
    '/server.js',
    '/package.json',
    '/package-lock.json',
    '/websites.db',
    '/.env'
];

app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) return next();

    const lowerPath = req.path.toLowerCase();
    if (lowerPath.includes('node_modules') || lowerPath.endsWith('.db') || lowerPath.includes('.env')) {
        return res.status(404).send('Not found');
    }

    if (BLOCKED_PATHS.some((blocked) => lowerPath === blocked.toLowerCase())) {
        return res.status(404).send('Not found');
    }

    next();
});

app.use(express.static(path.join(__dirname), {
    index: false,
    dotfiles: 'deny'
}));
