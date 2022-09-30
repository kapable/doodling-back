const { ToadScheduler, SimpleIntervalJob, AsyncTask, Task } = require('toad-scheduler');
const { Post, PostView, TopPost, Comment, PostLike } = require('./models');
const { Op } = require('sequelize');

const scheduler = new ToadScheduler();

const realTimeTask = new Task(
    'SELECT REALTIME TOP POSTS',
    async () => {
        // 조회수 / 댓글수 / 좋아요수 세가지 조건에 따라 각 점수(개수)를 취합
        const totalScores = {};
        const aDayAgo = new Date(new Date().setDate(new Date().getDate() - 10));
        const viewScore = await PostView.findAll({
            where: { 
                createdAt: {
                    [Op.gte]: aDayAgo,
                    [Op.lte]: new Date()
                }
            },
            attributes: ['PostId'],
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

        await TopPost.create({})
        
        return console.log(totalScores);
    },
    (error) => { return console.error(error) }
);

const realTimeJob = new SimpleIntervalJob({ seconds: 1, }, realTimeTask);

module.exports = {
    scheduler,
    realTimeJob
};