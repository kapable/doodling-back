const express = require('express');

const app = express();

app.get('/', (req, res) => {
    res.send('Welcome to Doodling API!');
});

app.listen(3065, () => {
    console.log('Listening on port 3065');
});