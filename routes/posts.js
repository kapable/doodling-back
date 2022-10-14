const express = require('express');
const { Op, fn, col, where } = require("sequelize");
const { Post, TopPost, SubCategory, Category, User, PostLike, PostView  } = require('../models');
const router = express.Router();

// GET REALTIME TOP 100 // GET /posts/top100RealTime
router.get('/top100RealTime', async (req, res, next) => {
    try {
        const realTimeTopPosts = await TopPost.findAll({
            where: {
                [Op.and]: [
                    { realTimeRank: { [Op.not]: null } },
                    { CategoryId: { [Op.is]: null } },
                    { SubCategoryId: { [Op.is]: null } },
                ]
            },
            attributes: ['PostId', 'realTimeRank'],
            include: [{
                model: Post,
            }]
        });
        res.status(200).json(realTimeTopPosts);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// GET REALTIME TOP 10 // GET /posts/top10RealTime
router.get('/top10RealTime', async (req, res, next) => {
    try {
        const realTimeTopPosts = await TopPost.findAll({
            where: {
                [Op.and]: [
                    { realTimeRank: { [Op.not]: null } },
                    { CategoryId: { [Op.is]: null } },
                    { SubCategoryId: { [Op.is]: null } },
                ]
            },
            attributes: ['PostId', 'realTimeRank'],
            include: [{
                model: Post,
            }],
            limit: 10
        });
        res.status(200).json(realTimeTopPosts);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// GET WEEKLY TOP 100 // GET /posts/top100Weekly
router.get('/top100Weekly', async (req, res, next) => {
    try {
        const weeklyTopPosts = await TopPost.findAll({
            where: {
                [Op.and]: [
                    { weeklyRank: { [Op.not]: null } },
                    { CategoryId: { [Op.is]: null } },
                    { SubCategoryId: { [Op.is]: null } },
                ]
            },
            attributes: ['PostId', 'weeklyRank'],
            include: [{
                model: Post,
            }]
        });
        res.status(200).json(weeklyTopPosts);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// GET MONTHLY TOP 100 // GET /posts/top100Monthly
router.get('/top100Monthly', async (req, res, next) => {
    try {
        const monthlyTopPosts = await TopPost.findAll({
            where: {
                [Op.and]: [
                    { monthlyRank: { [Op.not]: null } },
                    { CategoryId: { [Op.is]: null } },
                    { SubCategoryId: { [Op.is]: null } },
                ]
            },
            attributes: ['PostId', 'monthlyRank'],
            include: [{
                model: Post,
            }]
        });
        res.status(200).json(monthlyTopPosts);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// GET CATEGORY REALTIME TOP 5 // GET /posts/:categoryId/top5CategoryRealTime
router.get('/:categoryId/top5CategoryRealTime', async (req, res, next) => {
    try {
        const categoryRealTimeTopPosts = await TopPost.findAll({
            where: {
                [Op.and]: [
                    { realTimeRank: { [Op.not]: null } },
                    { CategoryId: parseInt(req.params.categoryId ,10) },
                    { SubCategoryId: { [Op.is]: null } },
                ]
            },
            attributes: ['PostId', 'realTimeRank'],
            include: [{
                model: Post,
            }]
        });
        res.status(200).json(categoryRealTimeTopPosts);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// GET SUBCATEGORY REALTIME TOP 5 // GET /posts/:subCategoryId/top5SubCategoryRealTime
router.get('/:subCategoryId/top5SubCategoryRealTime', async (req, res, next) => {
    try {
        const subCategoryRealTimeTopPosts = await TopPost.findAll({
            where: {
                [Op.and]: [
                    { realTimeRank: { [Op.not]: null } },
                    { CategoryId: { [Op.is]: null } },
                    { SubCategoryId: parseInt(req.params.subCategoryId ,10) },
                ]
            },
            attributes: ['PostId', 'realTimeRank'],
            include: [{
                model: Post,
            }]
        });
        res.status(200).json(subCategoryRealTimeTopPosts);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// [each category main page] GET CATEGORY NEW 15 POSTS // GET /posts/:categoryId/new15Category
router.get('/:categoryDomain/new15Category', async (req, res, next) => {
    try {
        let subCategories = await SubCategory.findAll({
            // where: { CategoryId: parseInt(req.params.categoryId , 10) },
            attributes: ['id'],
            include: [{
                model: Category,
                attributes: ['id', 'domain'],
                where: { domain: req.params.categoryDomain }
            }],
            raw: true
        });
        subCategories = subCategories.map(v => v.id)
        const categoryNewPosts = await Post.findAll({
            where: { SubCategoryId: { [Op.in]: subCategories } },
            limit: 15,
            order: [["createdAt", 'DESC']],
            attributes: ['id', 'title', 'createdAt', 'views', 'likes'],
            include: [{
                model: User,
                attributes: ['id', 'nickname', 'mbti']
            }, {
                model: SubCategory,
                attributes: ['id', 'domain'],
                include: [{
                    model: Category,
                    attributes: ['id', 'domain'],
                }]
            }],
        });
        res.status(200).json(categoryNewPosts);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// GET CATEGORY NEW 5 POSTS // GET /posts/:categoryId/new5Category
router.get('/:categoryId/new5Category', async (req, res, next) => {
    try {
        let subCategories = await SubCategory.findAll({
            where: { CategoryId: parseInt(req.params.categoryId , 10) },
            attributes: ['id'],
            raw: true
        });
        subCategories = subCategories.map(v => v.id)
        const categoryNewPosts = await Post.findAll({
            where: { SubCategoryId: { [Op.in]: subCategories } },
            limit: 15,
            order: [["createdAt", 'DESC']],
            attributes: ['id', 'title', 'createdAt', 'views', 'likes'],
            include: [{
                model: User,
                attributes: ['id', 'nickname', 'mbti']
            },],
        });
        res.status(200).json(categoryNewPosts);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// [main home page] GET CATEGORY NEW 5 POSTS // GET /posts/new5Categories
router.get('/new5Categories', async (req, res, next) => {
    try {
        const categories = await Category.findAll({
            where: { [Op.and]: [
                { domain: { [Op.not]: '' } },
                { domain: { [Op.not]: 'top100' } },
            ]},
            attributes: ['id', 'label', 'domain'],
            raw: true,
        });
        let newContents = []; 
        await Promise.all(categories.map(async (cat) => {
            let new5Contents = await Post.findAll({
                where: { CategoryId: cat.id },
                order: [['createdAt', 'DESC']],
                limit: 5,
                attributes: ['id', 'title', 'createdAt'],
                include: [{
                    model: User,
                    attributes: ['id', 'nickname', 'mbti']
                }, {
                    model: SubCategory,
                    attributes: ['id', 'domain']
                }],
                raw: true,
            });
            return newContents.push({ id: cat.id, label: cat.label, domain: cat.domain, posts: new5Contents });
        }));
        res.status(200).json(newContents);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

// [each subCategory page] GET SUBCATEGORY NEW 15 POSTS // GET /posts/:subCategoryId/new15SubCategory
router.get('/:subCategoryId/new15SubCategory', async (req, res, next) => {
    try {
        const subCategoryNewPosts = await Post.findAll({
            where: { SubCategoryId: parseInt(req.params.subCategoryId ,10) },
            limit: 15,
            order: [["createdAt", 'DESC']],
            attributes: ['id', 'title', 'createdAt', 'views', 'likes'],
            include: [{
                model: User,
                attributes: ['id', 'nickname', 'mbti']
            },],
        });
        res.status(200).json(subCategoryNewPosts);
    } catch (error) {
        console.error(error);
        next(error);
    };
});

module.exports = router;