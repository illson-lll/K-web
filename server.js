const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();
const PORT = 3000;

const users = [];

app.use(express.json());

app.use(express.static(path.join(__dirname, 'web')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'web/index.html'));
});

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
        await newUser.save(); // пуш в дб

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
            return res.status(400).json({ message: 'Користувача не знайдено' });; // Перевірка існування
        }

        if (await bcrypt.compare(password, user.password)) { // Перевірка пароля
            const token = jwt.sign({ name: user.username }, 'SECRET_KEY_123');
            return res.json({ token: token, username: user.username });
        } else {
            return res.status(400).json({ message: 'Невірний пароль' });;
        }

    } catch {
        console.error(err);
        res.status(500).json({ message: "Помилка сервера" });
    }
});


app.listen(PORT, () => {
    console.log(`Сервер запущено на http://localhost:${PORT}`);
});