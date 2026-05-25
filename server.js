const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();
const PORT = 3000;
const SECRET_KEY = '1111112';

const users = [];

app.use(express.json());
app.use(express.static(path.join(__dirname, 'web')));



const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/snake_db')
    .then(() => console.log('Підключено до MongoDB'))
    .catch(err => console.error('Помилка підключення:', err));

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    highScore: { type: Number, default: 0 }
});

const User = mongoose.model('User', userSchema);

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'web/index.html'));
});

app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username })
        if (user) {
            return res.status(400).json({ message: 'Користувач вже існує!' });
        }

        const hashpass = await bcrypt.hash(password, 10);

        const newUser = new User({
            username: username,
            password: hashpass
        });
        await newUser.save();
        console.log("User created:", username);
        res.status(201).json({ message: "Користувач створений!" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Помилка сервера" });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username })

        if (user == null) {
            return res.status(400).json({ message: 'Користувача не знайдено' });
        }

        if (await bcrypt.compare(password, user.password)) { 
            const token = jwt.sign({ name: user.username }, SECRET_KEY);
            return res.json({ token: token, username: user.username, highScore: user.highScore });
        } else {
            return res.status(400).json({ message: 'Невірний пароль' });;
        }

    } catch {
        console.error(err);
        res.status(500).json({ message: "Помилка сервера" });
    }
});

app.delete('/api/delete-account', authenticateToken, async (req, res) => {
    try {
        const result = await User.deleteOne({ username: req.user.name });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Користувача не знайдено" });
        }

        console.log(`Користувача видалено: ${req.user.name}`);
        res.json({ message: "Акаунт успішно видалено" });
        
    } catch (err) {
        console.error("Помилка при видаленні акаунта:", err);
        res.status(500).json({ message: "Помилка сервера при видаленні" });
    }
});

app.post('/api/save-score', authenticateToken, async (req, res) => {
    try {
        const { score } = req.body;
        const user = await User.findOne({ username: req.user.name });

        if (score > user.highScore) {
            user.highScore = score;
            await user.save();
            return res.json({ message: "Новий рекорд!", highScore: user.highScore });
        }
    } catch (err) {
        res.status(500).json({ message: "Помилка сервера" });
    }
});
app.get('/api/user-data', authenticateToken, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.user.name }, 'username highScore');
        if (!user) return res.status(404).json({ message: "Користувача не знайдено" });

        res.json({
            username: user.username,
            highScore: user.highScore
        });
    } catch (err) {
        res.status(500).json({ message: "Помилка сервера" });
    }
});

app.get('/api/leaderboard', async (req, res) => {
    try {
        const top_players = await User.find()
            .sort({ highScore: -1 })
            .limit(10)
            .select('username highScore');

        res.json(top_players);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Помилка сервера" });
    }
});
app.listen(PORT, () => {
    console.log(`Сервер запущено на http://localhost:${PORT}`);
});