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
const passportConfig = require('./passport');
const passport = require('passport');
const { swaggerUi, specs }  = require('./swagger');
const { scheduler, realTimeJob, weeklyJob, monthlyJob } = require('./scheduler');

const postsRouter = require('./routes/posts');
const postRouter = require('./routes/post');
const commentRouter = require('./routes/comment');
const userRouter = require('./routes/user');
const categoryRouter = require('./routes/category');
const subCategoryRouter = require('./routes/subCategory');

passportConfig();
dotenv.config();

const app = express();
db.sequelize.sync({ alter: true })
    .then(() => {
        console.log('DB Connected...');
    })
    .catch(console.error);
app.use('/', express.static(path.join(__dirname, 'uploads')));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {explorer: true}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
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
            domain: '.doodling.kr'
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
    origin: [process.env.SERVICE_FRONT_URL, process.env.SERVICE_FRONT_URL2, process.env.DEV_FRONT_URL, process.env.API_DOCS_URL],
    credentials: true,
}));

app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
    res.send('Welcome to Doodling API!');
});

app.use('/post', postRouter);
app.use('/posts', postsRouter);
app.use('/comment', commentRouter);
app.use('/user', userRouter);
app.use('/category', categoryRouter);
app.use('/subCategory', subCategoryRouter);

// scheduler.addSimpleIntervalJob(realTimeJob);
// scheduler.addSimpleIntervalJob(weeklyJob);
// scheduler.addSimpleIntervalJob(monthlyJob);

app.listen(3065, () => {
    console.log('-- Doodling API is listening on http://localhost:3065 --');
});