const express = require('express');
const path = require('path'); 
const app = express();
const PORT = 3000;

app.use(express.json());




app.use(express.static(path.join(__dirname, 'web')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'web/index.html'));
});


app.listen(PORT, () => {
    console.log(`Сервер запущено на http://localhost:${PORT}`);
});