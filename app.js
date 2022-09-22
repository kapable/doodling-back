const express = require('express');
const dotenv = require('dotenv');
const db = require('./models');
const morgan = require('morgan');
const session = require('express-session');
const helmet = require('helmet');
const hpp = require('hpp');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const postRouter = require('./routes/post');

dotenv.config();

const app = express();
db.sequelize.sync()
    .then(() => {
        console.log('DB Connected...');
    })
    .catch(console.error);
app.use('/', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));

if (process.env.NODE_ENV === 'production') {
    app.enable('trust proxy');
    app.use(morgan('combined'));
    app.use(helmet());
    app.use(hpp());

    app.use(session({
        saveUninitialized: false,
        resave: false,
        secret: process.env.COOKIE_SECRET,
        proxy: true,
        cookie: {
            httpOnly: true,
            secure: true,
            domain: '.niair.xyz'
        }
    }));
} else {
    app.use(morgan('dev'));

    app.use(session({
        saveUninitialized: false,
        resave: false,
        secret: process.env.COOKIE_SECRET,
    }));
}

app.use(cors({
    origin: [process.env.SERVICE_FRONT_URL, process.env.SERVICE_FRONT_URL2, process.env.DEV_FRONT_URL],
    credentials: true,
}));

app.get('/', (req, res) => {
    res.send('Welcome to Doodling API!');
});

app.use('/post', postRouter);

app.listen(3065, () => {
    console.log('-- Doodling API is listening on http://localhost:3065 --');
});