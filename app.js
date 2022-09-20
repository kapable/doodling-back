const express = require('express');
const dotenv = require('dotenv');
// const db = require('./models');
const postRouter = require('./routes/post');

dotenv.config();

const app = express();
// db.sequelize.sync()
//     .then(() => {
//         console.log('DB Connected...');
//     })
//     .catch(console.error);

app.get('/', (req, res) => {
    res.send('Welcome to Doodling API!');
});

app.use('/post', postRouter);

app.listen(3065, () => {
    console.log('Listening on http://localhost:3065');
});