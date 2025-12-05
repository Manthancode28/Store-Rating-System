// File: server/index.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const SECRET_KEY = 'supersecretkey';

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).send("Token required");
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).send("Invalid Token");
    }
};


app.post('/auth/signup', async (req, res) => {
    const { name, email, password, address } = req.body;
    if (name.length < 20 || name.length > 60) return res.status(400).json({ message: "Name must be 20-60 chars" });
    if (address.length > 400) return res.status(400).json({ message: "Address max 400 chars" });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.execute('INSERT INTO users (name, email, password, address, role) VALUES (?, ?, ?, ?, ?)', 
        [name, email, hashedPassword, address, 'user']);
        res.status(201).send("User registered");
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Login
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(404).send("User not found");
    
    const user = users[0];
    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(401).send("Invalid password");

    const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY);
    res.json({ token, role: user.role });
});

// Admin Stats
app.get('/dashboard/stats', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).send("Access denied");
    const [uCount] = await db.execute('SELECT COUNT(*) as count FROM users');
    const [sCount] = await db.execute('SELECT COUNT(*) as count FROM stores');
    const [rCount] = await db.execute('SELECT COUNT(*) as count FROM ratings');
    res.json({ users: uCount[0].count, stores: sCount[0].count, ratings: rCount[0].count });
});

// Get Stores
app.get('/stores', verifyToken, async (req, res) => {
    const [stores] = await db.execute(`
        SELECT s.*, AVG(r.rating) as avg_rating 
        FROM stores s 
        LEFT JOIN ratings r ON s.id = r.store_id 
        GROUP BY s.id
    `);
    res.json(stores);
});

// Add Store (Admin Only)
app.post('/stores', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).send("Access denied");
    const { name, email, address } = req.body;
    await db.execute('INSERT INTO stores (name, email, address) VALUES (?, ?, ?)', [name, email, address]);
    res.status(201).send("Store added");
});

// Submit Rating
app.post('/ratings', verifyToken, async (req, res) => {
    const { storeId, rating } = req.body;
    try {
        await db.execute(`
            INSERT INTO ratings (user_id, store_id, rating) VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE rating = ?`, 
            [req.user.id, storeId, rating, rating]);
        res.send("Rating submitted");
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.listen(5000, () => console.log('Server running on port 5000'));