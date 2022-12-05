const express = require('express');
const { Op } = require('sequelize');
const { Post, User, PostReport, ReportLabel, SubCategory, Category } = require('../models');
const { isLoggedIn } = require('./middlewares');
const router = express.Router();

// [admin] ADD REPORT LABELS // POST /report/label
router.post(`/label`, isLoggedIn, async (req, res, next) => {
    try {
        const exLabel = await ReportLabel.findOne({
            where: { label: req.body.label }
        });
        if(exLabel) {
            return res.status(403).send('이미 존재하는 신고 레이블입니다.');
        };
        const newLabel = await ReportLabel.create({
            label: req.body.label,
        });
        res.status(200).json(newLabel);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// [article page] REPORT AN ARTICLE // POST /report/1
router.post(`/:postId`, isLoggedIn, async (req, res, next) => {
    try {
        const post = await Post.findOne({
            where: { id: parseInt(req.params.postId ,10) }
        });
        if(!post) {
            return res.status(403).send('존재하지 않는 게시글입니다.');
        };
        const selectedLabel = await ReportLabel.findOne({
            where: { label: req.body.label }
        });
        await PostReport.create({
            PostId: parseInt(req.params.postId, 10),
            UserId: parseInt(req.user.id, 10),
            ReportLabelId: parseInt(selectedLabel.id, 10),
        });
        res.status(200).json({ postId: req.params.postId, report: true });
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// [admin] GET ALL REPORTED ARTICLES // GET /report
router.get(`/`, isLoggedIn, async (req, res, next) => {
    try {
        let where = {};
        if(parseInt(req.query.lastId)) {
            where.id = { [Op.lt]: parseInt(req.query.lastId, 10) }
        };
        const posts = await PostReport.findAll({
            where: where,
            attributes: { exclude: ['RerportLabelId', 'PostId', 'UserId', 'updatedAt'] },
            include: [{
                model: User,
                attributes: ['id', 'nickname']
            }, {
                model: Post,
                where: { enabled: true },
                attributes: ['id', 'title'],
                include: [{
                    model: SubCategory,
                    attributes: ['id', 'domain', 'label'],
                    include: [{
                        model: Category,
                        attributes: ['id', 'domain', 'label']
                    }]
                }]
            }, {
                model: ReportLabel,
                attributes: ['id', 'label']
            }],
            limit: 15,
            order: [['createdAt', 'DESC']],
        });
        res.status(201).json(posts);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// [article & admin] GET ALL REPORT LABELS // GET /report/labels
router.get(`/labels`, async (req, res, next) => {
    try {
        const reportLabels = await ReportLabel.findAll({
            attributes: { exclude: ['createdAt', 'updatedAt'] }
        });
        res.status(201).json(reportLabels);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// [admin page] REMOVE A POST // DELETE /report/1/remove
router.delete('/:postId/remove', async (req, res, next) => {
    try {
        const post = await Post.findOne({
            where: { id: parseInt(req.params.postId, 10) }
        });
        if(!post) {
            return res.status(403).send('해당 포스트는 존재하지 않습니다.');
        };
        await post.update({ enabled: false });
        await PostReport.destroy({
            where: { PostId: parseInt(post.id, 10) }
        });
        res.status(200).json(post);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// [admin page] CLEARING A NOT ABUSING POST // DELETE /report/1/clear
router.delete(`/:postId/clear`, async (req, res, next) => {
    try {
        const post = await Post.findOne({
            where: { id: parseInt(req.params.postId ,10) }
        });
        if(!post) {
            return res.status(403).send("헤당 포스트는 존재하지 않습니다.");
        };
        await PostReport.destroy({
            where: { PostId: parseInt(post.id, 10)}
        });
        res.status(200).json(post);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

module.exports = router;