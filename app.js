const express = require('express');
const postRouter = require('./routes/post');

const app = express();

app.get('/', (req, res) => {
    res.send('Welcome to Doodling API!');
});

app.use('/post', postRouter);

app.listen(3065, () => {
    console.log('Listening on http://localhost:3065');
});