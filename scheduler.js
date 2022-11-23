const { ToadScheduler, SimpleIntervalJob, AsyncTask, Task } = require('toad-scheduler');
const { Post, PostView, TopPost, Comment, PostLike, Category, SubCategory } = require('./models');
const { Op } = require('sequelize');

const MINUTES = 5;

const scheduler = new ToadScheduler();
// Total
// 실시간 Top POSTS
const realTimeTask = new Task(
    'SELECT REALTIME TOP POSTS',
    async () => {
        // 조회수 / 댓글수 / 좋아요수 세가지 조건에 따라 각 점수(개수)를 취합
        const totalScores = {};
        const minutesAgo = new Date(new Date - MINUTES * 600000000);
        const viewScore = await PostView.findAll({
            where: { 
                createdAt: {
                    [Op.gte]: minutesAgo,
                    [Op.lte]: new Date()
                }
            },
            attributes: ['PostId'],
            limit: 100,
            raw: true,
        });
        viewScore.map(v => v.PostId).forEach((x) => totalScores[x] = (totalScores[x] || 0) + 1);

        const commentScore = await Comment.findAll({
            where: {
                PostId: {
                    [Op.in]:Object.keys(totalScores)
                }
            },
            attributes: ['PostId'],
            raw: true
        });
        commentScore.map(v => v.PostId).forEach((x) => totalScores[x] = (totalScores[x] || 0) + 1);

        const likeScore = await PostLike.findAll({
            where: {
                PostId: {
                    [Op.in]:Object.keys(totalScores)
                }
            },
            attributes: ['PostId'],
            raw: true
        });
        likeScore.map(v => v.PostId).forEach((x) => totalScores[x] = (totalScores[x] || 0) + 1);

        const totalScoresArray = Object.entries(totalScores).sort((a, b) => b[1] - a[1]);

        await TopPost.destroy({
            where: {
                [Op.and]: [
                    {[Op.or]: [
                            { realTimeRank: { [Op.not]: null } },
                            { PostId: { [Op.is]: null } }
                    ],},
                    { CategoryId: { [Op.is]: null } },
                    { SubCategoryId: { [Op.is]: null } }
                ]
            }
        });

        totalScoresArray.forEach(async (v, i) => await TopPost.upsert({
            PostId: parseInt(v[0], 10),
            realTimeRank: i+1,
        }));
        return console.log('REAL TIME JOB SUCCESS');
    },
    (error) => { return console.error(error) }
);

const realTimeJob = new SimpleIntervalJob({ seconds: 30, }, realTimeTask);

// 주간 Top POSTS
const weeklyTask = new Task(
    'SELECT WEEKLY TOP POSTS',
    async () => {
        // 조회수 / 댓글수 / 좋아요수 세가지 조건에 따라 각 점수(개수)를 취합
        const totalScores = {};
        const aWeekAgo = new Date(new Date().setDate(new Date().getDate() - 7));
        const viewScore = await PostView.findAll({
            where: { 
                createdAt: {
                    [Op.gte]: aWeekAgo,
                    [Op.lte]: new Date()
                }
            },
            attributes: ['PostId'],
            limit: 100,
            raw: true,
        });
        viewScore.map(v => v.PostId).forEach((x) => totalScores[x] = (totalScores[x] || 0) + 1);

        const commentScore = await Comment.findAll({
            where: {
                PostId: {
                    [Op.in]:Object.keys(totalScores)
                }
            },
            attributes: ['PostId'],
            raw: true
        });
        commentScore.map(v => v.PostId).forEach((x) => totalScores[x] = (totalScores[x] || 0) + 1);

        const likeScore = await PostLike.findAll({
            where: {
                PostId: {
                    [Op.in]:Object.keys(totalScores)
                }
            },
            attributes: ['PostId'],
            raw: true
        });
        likeScore.map(v => v.PostId).forEach((x) => totalScores[x] = (totalScores[x] || 0) + 1);

        const totalScoresArray = Object.entries(totalScores).sort((a, b) => b[1] - a[1]);

        await TopPost.destroy({
            where: {
                [Op.and]: [
                    {[Op.or]: [
                            { weeklyRank: { [Op.not]: null } },
                            { PostId: { [Op.is]: null } }
                    ],},
                    { CategoryId: { [Op.is]: null } },
                    { SubCategoryId: { [Op.is]: null } }
                ]
            }
        });

        totalScoresArray.forEach(async (v, i) => await TopPost.upsert({
            PostId: parseInt(v[0], 10),
            weeklyRank: i+1,
        }));
        return console.log('WEEKLY JOB SUCCESS');
    },
    (error) => { return console.error(error) }
);

const weeklyJob = new SimpleIntervalJob({ days: 1, }, weeklyTask);

// 월간 Top POSTS
const monthlyTask = new Task(
    'SELECT MONTHLY TOP POSTS',
    async () => {
        // 조회수 / 댓글수 / 좋아요수 세가지 조건에 따라 각 점수(개수)를 취합
        const totalScores = {};
        const aMonthAgo = new Date(new Date().setDate(new Date().getDate() - 30));
        const viewScore = await PostView.findAll({
            where: { 
                createdAt: {
                    [Op.gte]: aMonthAgo,
                    [Op.lte]: new Date()
                }
            },
            attributes: ['PostId'],
            limit: 100,
            raw: true,
        });
        viewScore.map(v => v.PostId).forEach((x) => totalScores[x] = (totalScores[x] || 0) + 1);

        const commentScore = await Comment.findAll({
            where: {
                PostId: {
                    [Op.in]:Object.keys(totalScores)
                }
            },
            attributes: ['PostId'],
            raw: true
        });
        commentScore.map(v => v.PostId).forEach((x) => totalScores[x] = (totalScores[x] || 0) + 1);

        const likeScore = await PostLike.findAll({
            where: {
                PostId: {
                    [Op.in]:Object.keys(totalScores)
                }
            },
            attributes: ['PostId'],
            raw: true
        });
        likeScore.map(v => v.PostId).forEach((x) => totalScores[x] = (totalScores[x] || 0) + 1);

        const totalScoresArray = Object.entries(totalScores).sort((a, b) => b[1] - a[1]);

        await TopPost.destroy({
            where: {
                [Op.and]: [
                    {[Op.or]: [
                            { monthlyRank: { [Op.not]: null } },
                            { PostId: { [Op.is]: null } }
                    ],},
                    { CategoryId: { [Op.is]: null } },
                    { SubCategoryId: { [Op.is]: null } }
                ]
            }
        });

        totalScoresArray.forEach(async (v, i) => await TopPost.upsert({
            PostId: parseInt(v[0], 10),
            monthlyRank: i+1,
        }));
        return console.log('MONTHLY JOB SUCCESS');
    },
    (error) => { return console.error(error) }
);

const monthlyJob = new SimpleIntervalJob({ days: 7, }, monthlyTask);

// Category Top
// RealTime for a Category
const categoryRealTimeTask = new Task(
    'SELECT CATEGORY REALTIME TOP POSTS',
    async () => {
        // get All Categories
        let categories = await Category.findAll({
            attributes: ['id'],
            raw: true
        });
        categories = categories.map(v => v.id);

        categories.map(async (cat) => {
            // 조회수 / 댓글수 / 좋아요수 세가지 조건에 따라 각 점수(개수)를 취합
            const totalScores = {};
            const minutesAgo = new Date(new Date - MINUTES * 60000);
            const viewScore = await PostView.findAll({
                where: {
                    CategoryId: cat, // for loop
                    createdAt: {
                        [Op.gte]: minutesAgo,
                        [Op.lte]: new Date()
                    }
                },
                attributes: ['PostId'],
                limit: 5,
                raw: true,
            });
            viewScore.map(v => v.PostId).forEach((x) => totalScores[x] = (totalScores[x] || 0) + 1);

            const commentScore = await Comment.findAll({
                where: {
                    PostId: {
                        [Op.in]:Object.keys(totalScores)
                    }
                },
                attributes: ['PostId'],
                raw: true
            });
            commentScore.map(v => v.PostId).forEach((x) => totalScores[x] = (totalScores[x] || 0) + 1);

            const likeScore = await PostLike.findAll({
                where: {
                    PostId: {
                        [Op.in]:Object.keys(totalScores)
                    }
                },
                attributes: ['PostId'],
                raw: true
            });
            likeScore.map(v => v.PostId).forEach((x) => totalScores[x] = (totalScores[x] || 0) + 1);

            const totalScoresArray = Object.entries(totalScores).sort((a, b) => b[1] - a[1]);

            await TopPost.destroy({
                where: {
                    CategoryId: cat,// for loop
                    realTimeRank: { [Op.not]: null },
                }
            });
            totalScoresArray.forEach(async (v, i) => await TopPost.upsert({
                PostId: parseInt(v[0], 10),
                realTimeRank: i+1,
                CategoryId: cat // for loop
            }));
            return console.log('CATEGORY REAL TIME JOB SUCCESS');
        })
        
    },
    (error) => { return console.error(error) }
);

const categoryRealTimJob = new SimpleIntervalJob({ minutes: MINUTES, }, categoryRealTimeTask);

// SubCategory Top
// RealTime for a SubCategory
const subCategoryRealTimeTask = new Task(
    'SELECT SUBCATEGORY REALTIME TOP POSTS',
    async () => {
        // get All SubCategories
        let subCategories = await SubCategory.findAll({
            attributes: ['id'],
            raw: true
        });
        subCategories = subCategories.map(v => v.id);

        subCategories.map(async (cat) => {
            // 조회수 / 댓글수 / 좋아요수 세가지 조건에 따라 각 점수(개수)를 취합
            const totalScores = {};
            const minutesAgo = new Date(new Date - MINUTES * 60000);
            const viewScore = await PostView.findAll({
                where: {
                    SubCategoryId: cat, // for loop
                    createdAt: {
                        [Op.gte]: minutesAgo,
                        [Op.lte]: new Date()
                    }
                },
                attributes: ['PostId'],
                limit: 5,
                raw: true,
            });
            viewScore.map(v => v.PostId).forEach((x) => totalScores[x] = (totalScores[x] || 0) + 1);

            const commentScore = await Comment.findAll({
                where: {
                    PostId: {
                        [Op.in]:Object.keys(totalScores)
                    }
                },
                attributes: ['PostId'],
                raw: true
            });
            commentScore.map(v => v.PostId).forEach((x) => totalScores[x] = (totalScores[x] || 0) + 1);

            const likeScore = await PostLike.findAll({
                where: {
                    PostId: {
                        [Op.in]:Object.keys(totalScores)
                    }
                },
                attributes: ['PostId'],
                raw: true
            });
            likeScore.map(v => v.PostId).forEach((x) => totalScores[x] = (totalScores[x] || 0) + 1);

            const totalScoresArray = Object.entries(totalScores).sort((a, b) => b[1] - a[1]);

            await TopPost.destroy({
                where: {
                    SubCategoryId: cat, // for loop
                    realTimeRank: { [Op.not]: null },
                }
            });
            totalScoresArray.forEach(async (v, i) => await TopPost.upsert({
                PostId: parseInt(v[0], 10),
                realTimeRank: i+1,
                SubCategoryId: cat // for loop
            }));
            return console.log('SUBCATEGORY REAL TIME JOB SUCCESS');
        })
        
    },
    (error) => { return console.error(error) }
);

const subCategoryRealTimJob = new SimpleIntervalJob({ minutes: MINUTES, }, subCategoryRealTimeTask);


module.exports = {
    scheduler,
    realTimeJob,
    weeklyJob,
    monthlyJob,
    categoryRealTimJob,
    subCategoryRealTimJob
};